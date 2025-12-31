import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RouteCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ApprovalRoute {
  id: string;
  position: number;
  route_type: string;
  custom_route_name?: string;
  is_conditional: boolean;
  conditions: RouteCondition[];
  condition_logic: "AND" | "OR";
  auto_approval_enabled: boolean;
  auto_approval_conditions: RouteCondition[];
  auto_approval_fallback_role?: string;
  notification_message?: string;
  approval_mode: "serial" | "parallel";
  approval_threshold: "unanimous" | "minimum" | "percentage" | "any_one";
  minimum_approvals?: number;
  percentage_required?: number;
  approvers_count?: number;
  approvers?: Array<{
    role: string;
    sla_hours?: number;
    sla_value?: number;
    sla_unit?: string;
    is_required?: boolean;
    condition?: RouteCondition;
  }>;
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
  counterparty?: {
    counterparty_type?: string;
    relationship_status?: string;
    entity_type?: string;
  };
}

// Evaluate a single condition against workstream data
function evaluateCondition(condition: RouteCondition, workstream: WorkstreamData): boolean {
  const { field, operator, value } = condition;
  
  // Get the actual value from workstream
  let actualValue: string | number | boolean | undefined;
  
  switch (field) {
    case "deal_value":
    case "annual_value":
      actualValue = workstream.annual_value;
      break;
    case "customer_type":
      actualValue = workstream.counterparty?.counterparty_type;
      break;
    case "tier":
      actualValue = workstream.tier;
      break;
    case "stage":
      actualValue = workstream.stage;
      break;
    case "has_custom_clauses":
      // Would need to check workstream_clauses table
      actualValue = false;
      break;
    case "contract_duration":
      // Would need template metadata
      actualValue = 12; // Default to 12 months
      break;
    case "region":
    case "industry":
      // These would come from counterparty or custom fields
      actualValue = undefined;
      break;
    default:
      actualValue = undefined;
  }
  
  if (actualValue === undefined) {
    console.log(`Field "${field}" not found in workstream data, defaulting to false`);
    return false;
  }
  
  // Parse comparison value
  const compValue = parseFloat(value) || value;
  const actValue = typeof actualValue === "number" ? actualValue : actualValue;
  
  console.log(`Evaluating: ${field} ${operator} ${value} (actual: ${actValue})`);
  
  switch (operator) {
    case "=":
      return actValue == compValue;
    case "!=":
      return actValue != compValue;
    case ">":
      return typeof actValue === "number" && typeof compValue === "number" && actValue > compValue;
    case "<":
      return typeof actValue === "number" && typeof compValue === "number" && actValue < compValue;
    case ">=":
      return typeof actValue === "number" && typeof compValue === "number" && actValue >= compValue;
    case "<=":
      return typeof actValue === "number" && typeof compValue === "number" && actValue <= compValue;
    case "contains":
      return String(actValue).toLowerCase().includes(String(compValue).toLowerCase());
    default:
      return false;
  }
}

// Evaluate multiple conditions with logic (AND/OR)
function evaluateConditions(
  conditions: RouteCondition[],
  logic: "AND" | "OR",
  workstream: WorkstreamData
): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions means always true
  }
  
  if (logic === "AND") {
    return conditions.every((c) => evaluateCondition(c, workstream));
  } else {
    return conditions.some((c) => evaluateCondition(c, workstream));
  }
}

// Calculate due date based on SLA (handles business days)
function calculateDueDate(
  startDate: Date,
  slaValue: number,
  slaUnit: string = "hours"
): Date {
  const dueDate = new Date(startDate);
  
  if (slaUnit === "business_days") {
    // Add business days (skip weekends)
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
    // Default to hours
    dueDate.setHours(dueDate.getHours() + slaValue);
  }
  
  return dueDate;
}

// Convert SLA to hours for storage
function convertToHours(value: number, unit: string = "hours"): number {
  switch (unit) {
    case "days":
    case "business_days":
      return value * 8; // 8 hour workday
    case "hours":
    default:
      return value;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
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

    console.log(`Creating approvals for workstream: ${workstream_id}`);

    // 1. Fetch workstream with counterparty data
    const { data: workstream, error: wsError } = await supabaseAdmin
      .from("workstreams")
      .select(`
        *,
        counterparty:counterparties(*)
      `)
      .eq("id", workstream_id)
      .maybeSingle();

    if (wsError || !workstream) {
      console.error("Error fetching workstream:", wsError);
      return new Response(
        JSON.stringify({ error: "Workstream not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get workstream_type to find approval_template_id
    if (!workstream.workstream_type_id) {
      console.log("No workstream_type_id, skipping approval creation");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No workstream type configured, no approvals needed",
          approvals_created: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    if (!workstreamType.approval_template_id) {
      console.log("No approval template configured for this workstream type");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No approval template configured",
          approvals_created: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch approval template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("approval_templates")
      .select("*")
      .eq("id", workstreamType.approval_template_id)
      .maybeSingle();

    if (templateError || !template) {
      console.error("Error fetching approval template:", templateError);
      return new Response(
        JSON.stringify({ error: "Approval template not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if template is active
    if (template.status !== "active") {
      console.log("Approval template is not active, skipping");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Approval template is not active",
          approvals_created: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Parse routes from approval_sequence
    const routes = (template.approval_sequence as unknown as ApprovalRoute[]) || [];
    console.log(`Found ${routes.length} routes in template`);

    const now = new Date();
    const approvalsCreated: any[] = [];
    const autoApprovalLogs: any[] = [];
    const skippedRoutes: any[] = [];

    // 5. Process each route
    for (const route of routes.sort((a, b) => a.position - b.position)) {
      console.log(`Processing route ${route.position}: ${route.route_type}`);

      // Check if route is conditional
      if (route.is_conditional && route.conditions && route.conditions.length > 0) {
        const shouldTrigger = evaluateConditions(
          route.conditions,
          route.condition_logic,
          workstream
        );
        
        if (!shouldTrigger) {
          console.log(`Route ${route.position} conditions not met, skipping`);
          skippedRoutes.push({
            route_id: route.id,
            route_position: route.position,
            reason: "Conditions not met"
          });
          continue;
        }
      }

      // Check auto-approval
      if (route.auto_approval_enabled && route.auto_approval_conditions && route.auto_approval_conditions.length > 0) {
        const meetsAutoApproval = evaluateConditions(
          route.auto_approval_conditions,
          "AND", // Auto-approval always uses AND logic
          workstream
        );
        
        if (meetsAutoApproval) {
          console.log(`Route ${route.position} auto-approved`);
          autoApprovalLogs.push({
            route_id: route.id,
            route_position: route.position,
            reason: "Auto-approval conditions met"
          });
          continue;
        }
      }

      // Get approvers for this route
      const approvers = route.approvers || [];
      
      // If no specific approvers, use fallback role
      if (approvers.length === 0 && route.auto_approval_fallback_role) {
        approvers.push({
          role: route.auto_approval_fallback_role,
          sla_hours: 24,
          is_required: true
        });
      }

      // Create approval record for this route
      const slaHours = approvers[0]?.sla_hours || 
        convertToHours(approvers[0]?.sla_value || 24, approvers[0]?.sla_unit || "hours");
      
      const dueAt = calculateDueDate(
        now, 
        approvers[0]?.sla_value || slaHours,
        approvers[0]?.sla_unit || "hours"
      );

      // Store route metadata in a structured way
      const routeMetadata = {
        route_id: route.id,
        route_position: route.position,
        route_type: route.route_type,
        approval_mode: route.approval_mode,
        approval_threshold: route.approval_threshold,
        minimum_approvals: route.minimum_approvals,
        percentage_required: route.percentage_required,
        approvers: approvers.map(a => ({
          role: a.role,
          sla_hours: a.sla_hours || convertToHours(a.sla_value || 24, a.sla_unit || "hours"),
          is_required: a.is_required !== false
        })),
        notification_message: route.notification_message
      };

      // Create the workstream_approval record
      const { data: approval, error: approvalError } = await supabaseAdmin
        .from("workstream_approvals")
        .insert({
          workstream_id,
          approval_template_id: template.id,
          status: "pending",
          current_gate: route.position,
          submitted_at: now.toISOString(),
        })
        .select()
        .single();

      if (approvalError) {
        console.error("Error creating approval record:", approvalError);
        continue;
      }

      // Create corresponding need in the needs table
      const needDescription = route.custom_route_name || 
        `${route.route_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} approval required`;
      
      const { error: needError } = await supabaseAdmin
        .from("needs")
        .insert({
          workstream_id,
          need_type: "approval",
          description: needDescription,
          satisfier_role: approvers[0]?.role || "general_counsel",
          satisfier_type: "role",
          status: "open",
          due_at: dueAt.toISOString(),
          source_type: "approval",
          source_id: approval.id,
          source_reason: `Created from approval template: ${template.name}`,
        });

      if (needError) {
        console.error("Error creating need record:", needError);
      } else {
        console.log(`Created need for approval ${approval.id}`);
      }

      approvalsCreated.push({
        ...approval,
        route_metadata: routeMetadata,
        due_at: dueAt.toISOString()
      });

      console.log(`Created approval record: ${approval.id} for route ${route.position}`);

      // For serial mode, we only create the first approval
      // Additional approvals are created when previous ones are approved
      if (route.approval_mode === "serial") {
        console.log("Serial mode: Only first approval created, others will be created on approval");
        break;
      }
    }

    console.log(`Created ${approvalsCreated.length} approval records`);
    console.log(`Auto-approved ${autoApprovalLogs.length} routes`);
    console.log(`Skipped ${skippedRoutes.length} routes`);

    return new Response(
      JSON.stringify({
        success: true,
        workstream_id,
        template_id: template.id,
        approvals_created: approvalsCreated.length,
        auto_approved: autoApprovalLogs.length,
        skipped: skippedRoutes.length,
        approvals: approvalsCreated,
        auto_approval_logs: autoApprovalLogs,
        skipped_routes: skippedRoutes
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
