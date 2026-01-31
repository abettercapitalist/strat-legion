import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkflowStep {
  step_id: string;
  position: number;
  step_type: string;
  requirement_type: string;
  required_before: string | null;
  trigger_timing: string | null;
  trigger_step_id: string | null;
  config: {
    gate_type?: string;
    approvers?: string;
    approver_roles?: string[];
    approver_teams?: string[]; // New: team UUIDs
    sla_hours?: string | number;
    sla_value?: number;
    sla_unit?: string;
    approval_mode?: string;
    approval_threshold?: string;
    custom_name?: string;
    auto_approval_config?: {
      enabled: boolean;
      conditions?: Array<{
        id: string;
        field: string;
        operator: string;
        value: string;
      }>;
    };
  };
  icon?: string;
  documents?: Array<{
    id: string;
    document_type: string;
    template_id?: string;
    template_name?: string;
    is_mandatory?: boolean;
  }>;
}

interface DefaultWorkflow {
  steps?: WorkflowStep[];
}

interface WorkstreamData {
  id: string;
  name: string;
  annual_value?: number;
  tier?: string;
  stage?: string;
  business_objective?: string;
  counterparty_id?: string;
  workstream_type_id?: string;
  owner_id?: string;
  expected_close_date?: string;
  counterparty?: {
    counterparty_type?: string;
    relationship_status?: string;
    entity_type?: string;
  };
}

interface WorkstreamTypeData {
  id: string;
  name: string;
  display_name?: string;
  default_workflow?: DefaultWorkflow | string;
  approval_template_id?: string;
  auto_approval_config?: unknown;
}

// Calculate due date based on SLA
function calculateDueDate(
  startDate: Date,
  slaValue: number,
  slaUnit: string = "hours"
): Date {
  const dueDate = new Date(startDate);
  
  if (slaUnit === "business_days") {
    let daysAdded = 0;
    while (daysAdded < slaValue) {
      dueDate.setDate(dueDate.getDate() + 1);
      const dayOfWeek = dueDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
  } else if (slaUnit === "days") {
    dueDate.setDate(dueDate.getDate() + slaValue);
  } else {
    dueDate.setHours(dueDate.getHours() + slaValue);
  }
  
  return dueDate;
}

// Get SLA hours from step config
function getSlaHours(config: WorkflowStep["config"]): number {
  if (config.sla_hours) {
    return typeof config.sla_hours === "string" 
      ? parseInt(config.sla_hours, 10) || 24 
      : config.sla_hours;
  }
  if (config.sla_value) {
    const unit = config.sla_unit || "hours";
    if (unit === "days" || unit === "business_days") {
      return config.sla_value * 8;
    }
    return config.sla_value;
  }
  return 24; // Default 24 hours
}

// Humanize gate type to display name
function humanizeGateType(gateType: string): string {
  const gateTypeMap: Record<string, string> = {
    pre_deal: "Pre-Deal Review",
    proposal: "Proposal Review",
    closing: "Closing Review",
    legal: "Legal Review",
    finance: "Finance Review",
    executive: "Executive Review",
    compliance: "Compliance Review",
    security: "Security Review",
    custom: "Custom Review",
  };
  return gateTypeMap[gateType] || gateType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Map legacy approver shorthand to actual role names
function mapApproverToRole(approver: string): string[] {
  const roleMapping: Record<string, string[]> = {
    // Shorthand mappings
    "finance": ["finance_reviewer"],
    "legal": ["general_counsel", "contract_counsel", "legal_ops"],
    "sales": ["sales_manager", "account_executive"],
    "executive": ["general_counsel"],
    "compliance": ["legal_ops"],
    // Direct role names (pass through)
    "general_counsel": ["general_counsel"],
    "legal_ops": ["legal_ops"],
    "contract_counsel": ["contract_counsel"],
    "account_executive": ["account_executive"],
    "sales_manager": ["sales_manager"],
    "finance_reviewer": ["finance_reviewer"],
  };
  
  return roleMapping[approver.toLowerCase()] || [approver];
}

// Get approver config - supports both team-based (new) and role-based (legacy)
interface ApproverConfig {
  type: 'teams' | 'roles';
  values: string[];
}

function getApproverConfig(config: WorkflowStep["config"]): ApproverConfig {
  // New format: team UUIDs (preferred)
  if (config.approver_teams && Array.isArray(config.approver_teams) && config.approver_teams.length > 0) {
    return { type: 'teams', values: config.approver_teams };
  }
  
  // Legacy format: approver_roles array
  if (config.approver_roles && Array.isArray(config.approver_roles)) {
    const mappedRoles = config.approver_roles.flatMap(role => mapApproverToRole(role));
    return { type: 'roles', values: [...new Set(mappedRoles)] };
  }
  
  // Legacy format: single approvers string
  if (config.approvers && typeof config.approvers === "string") {
    const mappedRoles = mapApproverToRole(config.approvers);
    return { type: 'roles', values: mappedRoles };
  }
  
  return { type: 'roles', values: [] };
}

// Resolve team UUIDs to member user IDs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTeamMemberUserIds(
  supabase: any,
  teamIds: string[],
  excludeUserId?: string
): Promise<string[]> {
  if (teamIds.length === 0) return [];
  
  const { data: members, error } = await supabase
    .from("team_members")
    .select("user_id")
    .in("team_id", teamIds);
  
  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
  
  const userIds = ((members || []) as Array<{ user_id: string }>)
    .map(m => m.user_id)
    .filter(id => id !== excludeUserId);
  
  // Remove duplicates
  return [...new Set(userIds)];
}

// Legacy: Get approver roles from step config (for backward compatibility)
function getApproverRoles(config: WorkflowStep["config"]): string[] {
  const approverConfig = getApproverConfig(config);
  return approverConfig.type === 'roles' ? approverConfig.values : [];
}

// Evaluate auto-approval conditions
function evaluateAutoApprovalConditions(
  conditions: Array<{ field: string; operator: string; value: string }>,
  workstream: WorkstreamData
): boolean {
  if (!conditions || conditions.length === 0) return false;
  
  return conditions.every(condition => {
    const { field, operator, value } = condition;
    let actualValue: unknown;
    
    switch (field) {
      case "annual_value":
      case "deal_value":
        actualValue = workstream.annual_value;
        break;
      case "tier":
        actualValue = workstream.tier;
        break;
      case "stage":
        actualValue = workstream.stage;
        break;
      default:
        return false;
    }
    
    if (actualValue === undefined || actualValue === null) return false;
    
    const numActual = typeof actualValue === "number" ? actualValue : parseFloat(String(actualValue));
    const numValue = parseFloat(value);
    
    switch (operator) {
      case "=":
        return actualValue == value;
      case "!=":
        return actualValue != value;
      case ">":
        return !isNaN(numActual) && !isNaN(numValue) && numActual > numValue;
      case "<":
        return !isNaN(numActual) && !isNaN(numValue) && numActual < numValue;
      case ">=":
        return !isNaN(numActual) && !isNaN(numValue) && numActual >= numValue;
      case "<=":
        return !isNaN(numActual) && !isNaN(numValue) && numActual <= numValue;
      default:
        return false;
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { workstream_id } = await req.json();
    
    if (!workstream_id) {
      return new Response(
        JSON.stringify({ error: "workstream_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access (owner or team member)
    const { data: wsCheck, error: accessError } = await supabaseAdmin
      .from("workstreams")
      .select("id")
      .eq("id", workstream_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (accessError || !wsCheck) {
      console.error("Access denied to workstream:", accessError);
      return new Response(
        JSON.stringify({ error: "Forbidden: No access to this workstream" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating approvals for workstream: ${workstream_id}`);

    // Fetch workstream with counterparty
    const { data: workstream, error: wsError } = await supabaseAdmin
      .from("workstreams")
      .select(`*, counterparty:counterparties(*)`)
      .eq("id", workstream_id)
      .maybeSingle();

    if (wsError || !workstream) {
      console.error("Error fetching workstream:", wsError);
      return new Response(
        JSON.stringify({ error: "Workstream not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!workstream.workstream_type_id) {
      console.log("No workstream_type_id, skipping approval creation");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No workstream type configured",
          approvals_created: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch workstream type
    const { data: workstreamType, error: wtError } = await supabaseAdmin
      .from("workstream_types")
      .select("*")
      .eq("id", workstream.workstream_type_id)
      .maybeSingle();

    if (wtError || !workstreamType) {
      console.error("Error fetching workstream type:", wtError);
      return new Response(
        JSON.stringify({ error: "Workstream type not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse default_workflow to get steps
    let workflowSteps: WorkflowStep[] = [];
    
    if (workstreamType.default_workflow) {
      let parsedWorkflow: DefaultWorkflow | null = null;
      
      if (typeof workstreamType.default_workflow === "object") {
        // Already an object (JSONB column)
        parsedWorkflow = workstreamType.default_workflow as DefaultWorkflow;
      } else if (typeof workstreamType.default_workflow === "string") {
        // String that might be JSON
        try {
          const parsed = JSON.parse(workstreamType.default_workflow);
          if (typeof parsed === "object" && parsed !== null && "steps" in parsed) {
            parsedWorkflow = parsed as DefaultWorkflow;
            console.log("Successfully parsed JSON workflow from string");
          } else {
            console.log("Legacy string workflow format (not JSON object with steps)");
          }
        } catch {
          // Not valid JSON - legacy string format like "professional_services"
          console.log("Legacy string workflow format:", workstreamType.default_workflow);
        }
      }
      
      if (parsedWorkflow && parsedWorkflow.steps) {
        workflowSteps = parsedWorkflow.steps;
        console.log(`Parsed ${workflowSteps.length} total steps from workflow`);
      }
    }

    // Filter to only approval/approval_gate steps
    const approvalSteps = workflowSteps.filter(
      step => step.step_type === "approval" || step.step_type === "approval_gate"
    );

    console.log(`Found ${approvalSteps.length} approval steps in workflow configuration`);

    const now = new Date();
    const approvalsCreated: unknown[] = [];
    const autoApprovalLogs: unknown[] = [];
    const skippedSteps: unknown[] = [];

    // User to exclude from approvers (self-approval prevention)
    const excludeUserId = workstream.owner_id || user.id;

    // Process each approval step
    for (const step of approvalSteps.sort((a, b) => a.position - b.position)) {
      console.log(`Processing approval step ${step.position}: ${step.step_type}`);

      const approverConfig = getApproverConfig(step.config);
      
      if (approverConfig.values.length === 0) {
        console.log(`Step ${step.step_id} has no approvers configured, skipping`);
        skippedSteps.push({
          step_id: step.step_id,
          position: step.position,
          reason: "No approvers configured"
        });
        continue;
      }

      // Check auto-approval conditions
      const autoApprovalConfig = step.config.auto_approval_config;
      if (autoApprovalConfig?.enabled && autoApprovalConfig.conditions) {
        const meetsAutoApproval = evaluateAutoApprovalConditions(
          autoApprovalConfig.conditions,
          workstream as WorkstreamData
        );
        
        if (meetsAutoApproval) {
          console.log(`Step ${step.step_id} auto-approved based on conditions`);
          autoApprovalLogs.push({
            step_id: step.step_id,
            position: step.position,
            reason: "Auto-approval conditions met"
          });
          continue;
        }
      }

      // Resolve approvers based on config type
      let resolvedApproverIds: string[];
      let primaryRole: string;

      if (approverConfig.type === 'teams') {
        // New: Resolve from team_members table
        console.log(`Resolving approvers from ${approverConfig.values.length} team(s)`);
        resolvedApproverIds = await getTeamMemberUserIds(
          supabaseAdmin,
          approverConfig.values,
          excludeUserId
        );
        primaryRole = 'team_member'; // Generic role for team-based approvals
      } else {
        // Resolve from roles system
        const { data: customRoleUsers } = await supabaseAdmin
          .from("user_roles")
          .select(`
            user_id,
            roles!inner (
              name
            )
          `)
          .in("roles.name", approverConfig.values);

        resolvedApproverIds = (customRoleUsers || [])
          .map((u: any) => u.user_id)
          .filter((id: string) => id !== excludeUserId);

        primaryRole = approverConfig.values[0] || 'approver';
      }
      
      // If no approvers remain after excluding self, auto-approve
      if (resolvedApproverIds.length === 0) {
        console.log(`Step ${step.step_id} auto-approved: creator has authority (no other approvers)`);
        autoApprovalLogs.push({
          step_id: step.step_id,
          position: step.position,
          reason: "Self-approval: creator has required role, no other approvers needed"
        });
        continue;
      }

      // Calculate SLA
      const slaHours = getSlaHours(step.config);
      const dueAt = calculateDueDate(now, slaHours, step.config.sla_unit || "hours");

      // Get display name for this approval
      const gateType = step.config.gate_type || "custom";
      const approvalName = step.config.custom_name || humanizeGateType(gateType);

      // Create workstream_approval record
      const { data: approval, error: approvalError } = await supabaseAdmin
        .from("workstream_approvals")
        .insert({
          workstream_id,
          approval_template_id: null, // We're using workflow steps, not templates
          status: "pending",
          current_gate: step.position,
          submitted_at: now.toISOString(),
          approves_step_ids: [step.step_id],
        })
        .select()
        .single();

      if (approvalError) {
        console.error("Error creating approval record:", approvalError);
        continue;
      }

      // Create corresponding need - use custom_role type for team-based approvals
      const needDescription = `${approvalName} required`;
      const isUuidRole = approverConfig.type === 'teams';

      const { error: needError } = await supabaseAdmin
        .from("needs")
        .insert({
          workstream_id,
          need_type: "approval",
          description: needDescription,
          satisfier_role: isUuidRole ? approverConfig.values[0] : primaryRole,
          satisfier_type: isUuidRole ? "custom_role" : "role",
          status: "open",
          due_at: dueAt.toISOString(),
          source_type: "workflow_step",
          source_id: approval.id,
          source_reason: `Required by ${workstreamType.display_name || workstreamType.name} workflow`,
        });

      if (needError) {
        console.error("Error creating need record:", needError);
      }

      // Also create workstream_step record to track completion
      const { error: stepError } = await supabaseAdmin
        .from("workstream_steps")
        .insert({
          workstream_id,
          step_id: step.step_id,
          step_type: step.step_type,
          position: step.position,
          requirement_type: step.requirement_type,
          required_before: step.required_before,
          trigger_timing: step.trigger_timing,
          status: "pending",
          config: step.config,
        });

      if (stepError) {
        console.error("Error creating workstream_step record:", stepError);
      }

      approvalsCreated.push({
        id: approval.id,
        step_id: step.step_id,
        position: step.position,
        gate_type: gateType,
        approval_name: approvalName,
        approver_config: approverConfig,
        due_at: dueAt.toISOString(),
        resolved_approver_count: resolvedApproverIds.length,
      });

      console.log(`Created approval ${approval.id} for step ${step.step_id}`);
    }

    console.log(`Created ${approvalsCreated.length} approvals, auto-approved ${autoApprovalLogs.length}, skipped ${skippedSteps.length}`);

    // Insert non-approval workflow steps into workstream_steps
    const nonApprovalSteps = workflowSteps.filter(
      step => step.step_type !== "approval" && step.step_type !== "approval_gate"
    );

    if (nonApprovalSteps.length > 0) {
      console.log(`Creating ${nonApprovalSteps.length} non-approval workflow steps`);
      for (const step of nonApprovalSteps.sort((a, b) => a.position - b.position)) {
        // Merge documents into config so the UI has full context
        const fullConfig = {
          ...step.config,
          ...(step.documents && step.documents.length > 0 ? { documents: step.documents } : {}),
          ...(step.icon ? { icon: step.icon } : {}),
        };

        // Auto-complete steps that fire at creation time (e.g. send_notification)
        const isAutoComplete = step.trigger_timing === "workflow_creation" && step.step_type === "send_notification";

        const { error: stepError } = await supabaseAdmin
          .from("workstream_steps")
          .insert({
            workstream_id,
            step_id: step.step_id,
            step_type: step.step_type,
            position: step.position,
            requirement_type: step.requirement_type,
            required_before: step.required_before,
            trigger_timing: step.trigger_timing,
            status: isAutoComplete ? "complete" : "pending",
            completed_at: isAutoComplete ? new Date().toISOString() : null,
            config: fullConfig,
          });

        if (stepError) {
          console.error(`Error creating workstream_step for ${step.step_id}:`, stepError);
        } else if (isAutoComplete) {
          console.log(`Auto-completed ${step.step_type} step ${step.step_id}`);
        }
      }
      console.log(`Created ${nonApprovalSteps.length} non-approval steps`);
    }

    // Update workstream stage to pending_approval when approvals are created
    if (approvalsCreated.length > 0) {
      const { error: stageError } = await supabaseAdmin
        .from("workstreams")
        .update({ 
          stage: "pending_approval", 
          updated_at: now.toISOString() 
        })
        .eq("id", workstream_id);
      
      if (stageError) {
        console.error("Error updating workstream stage:", stageError);
      } else {
        console.log("Workstream stage updated to pending_approval");
      }
    } else if (autoApprovalLogs.length > 0 && approvalsCreated.length === 0) {
      // All gates auto-approved - mark as approved
      const { error: stageError } = await supabaseAdmin
        .from("workstreams")
        .update({ 
          stage: "approved", 
          updated_at: now.toISOString() 
        })
        .eq("id", workstream_id);
      
      if (stageError) {
        console.error("Error updating workstream stage:", stageError);
      } else {
        console.log("Workstream stage updated to approved (all gates auto-approved)");
      }
    }

    // Log activity
    if (approvalsCreated.length > 0 || autoApprovalLogs.length > 0) {
      const activityDescription = approvalsCreated.length > 0
        ? `Approval workflow initiated: ${approvalsCreated.length} approval${approvalsCreated.length > 1 ? 's' : ''} pending${autoApprovalLogs.length > 0 ? `, ${autoApprovalLogs.length} auto-approved` : ''}`
        : `Approval workflow completed: ${autoApprovalLogs.length} step${autoApprovalLogs.length > 1 ? 's' : ''} auto-approved`;

      await supabaseAdmin
        .from("workstream_activity")
        .insert({
          workstream_id,
          activity_type: approvalsCreated.length > 0 ? "stage_changed" : "approval_submitted",
          description: activityDescription,
          actor_id: user.id,
          metadata: {
            workstream_type_id: workstreamType.id,
            workstream_type_name: workstreamType.name,
            approvals_created: approvalsCreated.length,
            auto_approved: autoApprovalLogs.length,
            skipped: skippedSteps.length,
            new_stage: approvalsCreated.length > 0 ? "pending_approval" : "approved",
            triggered_by: "approval_workflow_start",
          },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        workstream_id,
        workstream_type_id: workstreamType.id,
        approvals_created: approvalsCreated.length,
        auto_approved: autoApprovalLogs.length,
        skipped: skippedSteps.length,
        approvals: approvalsCreated,
        auto_approval_logs: autoApprovalLogs,
        skipped_steps: skippedSteps,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-approvals-from-template:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
