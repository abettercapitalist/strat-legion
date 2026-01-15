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

// Get approver roles from step config
function getApproverRoles(config: WorkflowStep["config"]): string[] {
  // New format: approver_roles array
  if (config.approver_roles && Array.isArray(config.approver_roles)) {
    return config.approver_roles;
  }
  // Legacy format: single approvers string
  if (config.approvers && typeof config.approvers === "string") {
    return [config.approvers];
  }
  return [];
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

    // Verify user has access
    const { data: hasAccess, error: accessError } = await supabaseAdmin.rpc(
      "has_workstream_access",
      { ws_id: workstream_id, _user_id: user.id }
    );

    if (accessError || !hasAccess) {
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
      if (typeof workstreamType.default_workflow === "object") {
        const workflow = workstreamType.default_workflow as DefaultWorkflow;
        workflowSteps = workflow.steps || [];
      } else if (typeof workstreamType.default_workflow === "string") {
        // Legacy string format - no steps to process
        console.log("Legacy workflow format, checking for approval_template_id");
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

      const approverRoles = getApproverRoles(step.config);
      
      if (approverRoles.length === 0) {
        console.log(`Step ${step.step_id} has no approver roles configured, skipping`);
        skippedSteps.push({
          step_id: step.step_id,
          position: step.position,
          reason: "No approver roles configured"
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

      // Resolve roles to user IDs, excluding workstream owner
      const { data: roleUsers } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("role", approverRoles);
      
      const resolvedApproverIds = (roleUsers || [])
        .map(u => u.user_id)
        .filter(id => id !== excludeUserId);
      
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

      // Create corresponding need
      const needDescription = `${approvalName} required`;
      const primaryRole = approverRoles[0];

      const { error: needError } = await supabaseAdmin
        .from("needs")
        .insert({
          workstream_id,
          need_type: "approval",
          description: needDescription,
          satisfier_role: primaryRole,
          satisfier_type: "role",
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
        approver_roles: approverRoles,
        due_at: dueAt.toISOString(),
        resolved_approver_count: resolvedApproverIds.length,
      });

      console.log(`Created approval ${approval.id} for step ${step.step_id}`);
    }

    console.log(`Created ${approvalsCreated.length} approvals, auto-approved ${autoApprovalLogs.length}, skipped ${skippedSteps.length}`);

    // Log activity
    if (approvalsCreated.length > 0 || autoApprovalLogs.length > 0) {
      const activityDescription = approvalsCreated.length > 0
        ? `Approval workflow initiated: ${approvalsCreated.length} approval${approvalsCreated.length > 1 ? 's' : ''} pending${autoApprovalLogs.length > 0 ? `, ${autoApprovalLogs.length} auto-approved` : ''}`
        : `Approval workflow completed: ${autoApprovalLogs.length} step${autoApprovalLogs.length > 1 ? 's' : ''} auto-approved`;

      await supabaseAdmin
        .from("workstream_activity")
        .insert({
          workstream_id,
          activity_type: "approval_submitted",
          description: activityDescription,
          metadata: {
            workstream_type_id: workstreamType.id,
            workstream_type_name: workstreamType.name,
            approvals_created: approvalsCreated.length,
            auto_approved: autoApprovalLogs.length,
            skipped: skippedSteps.length,
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
