import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DefaultNeed {
  need_type: string;
  description: string;
  satisfier_role?: string;
  satisfier_type?: string;
  required_before?: string;
  reason?: string;
  due_offset_hours?: number;
}

interface ApprovalRoute {
  id: string;
  position: number;
  route_type: string;
  custom_route_name?: string;
  approvers?: Array<{
    role: string;
    sla_hours?: number;
    sla_value?: number;
    sla_unit?: string;
    is_required?: boolean;
  }>;
}

interface WorkstreamData {
  id: string;
  name: string;
  annual_value?: number;
  tier?: string;
  stage?: string;
  workstream_type_id?: string;
  expected_close_date?: string;
}

interface WorkstreamTypeData {
  id: string;
  name: string;
  default_needs?: DefaultNeed[];
  approval_template_id?: string;
  required_documents?: string[];
}

/**
 * Create needs from workstream type configuration.
 * This populates the needs table based on:
 * 1. workstream_types.default_needs (configured in Play)
 * 2. approval_templates.approval_sequence (each route = a need)
 * 3. required_documents from workstream_type
 */
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

    // Validate user identity
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

    console.log(`Creating needs for workstream: ${workstream_id}`);

    // 1. Fetch workstream
    const { data: workstream, error: wsError } = await supabaseAdmin
      .from("workstreams")
      .select("*")
      .eq("id", workstream_id)
      .maybeSingle();

    if (wsError || !workstream) {
      console.error("Error fetching workstream:", wsError);
      return new Response(
        JSON.stringify({ error: "Workstream not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get workstream_type
    if (!workstream.workstream_type_id) {
      console.log("No workstream_type_id, skipping needs creation");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No workstream type configured, no needs created",
          needs_created: 0 
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

    const needsToCreate: any[] = [];
    const baseDate = workstream.expected_close_date 
      ? new Date(workstream.expected_close_date) 
      : new Date();

    // 3. Create needs from default_needs configuration
    const defaultNeeds = (workstreamType.default_needs as DefaultNeed[]) || [];
    console.log(`Processing ${defaultNeeds.length} default needs from workstream type`);

    for (const defaultNeed of defaultNeeds) {
      let dueAt: string | null = null;
      
      if (defaultNeed.due_offset_hours) {
        const dueDate = new Date(baseDate);
        dueDate.setHours(dueDate.getHours() - defaultNeed.due_offset_hours);
        dueAt = dueDate.toISOString();
      }

      needsToCreate.push({
        workstream_id,
        need_type: defaultNeed.need_type,
        description: defaultNeed.description,
        satisfier_role: defaultNeed.satisfier_role || null,
        satisfier_type: defaultNeed.satisfier_type || (defaultNeed.satisfier_role?.match(/^[0-9a-f-]{36}$/) ? 'custom_role' : 'role'),
        status: 'open',
        required_before: defaultNeed.required_before || null,
        due_at: dueAt,
        source_type: 'workstream_type',
        source_id: workstreamType.id,
        source_reason: defaultNeed.reason || `Required by ${workstreamType.display_name || workstreamType.name}`,
      });
    }

    // 4. Create needs from required_documents
    const requiredDocs = workstreamType.required_documents || [];
    console.log(`Processing ${requiredDocs.length} required documents`);

    for (const docName of requiredDocs) {
      needsToCreate.push({
        workstream_id,
        need_type: 'document',
        description: `Collect: ${docName}`,
        satisfier_role: null,
        satisfier_type: 'system',
        status: 'open',
        required_before: 'closing_approval',
        source_type: 'workstream_type',
        source_id: workstreamType.id,
        source_reason: `Required document for ${workstreamType.display_name || workstreamType.name}`,
      });
    }

    // 5. Create needs from approval template routes
    if (workstreamType.approval_template_id) {
      const { data: template, error: templateError } = await supabaseAdmin
        .from("approval_templates")
        .select("*")
        .eq("id", workstreamType.approval_template_id)
        .maybeSingle();

      if (template && !templateError && template.status === 'active') {
        const routes = (template.approval_sequence as unknown as ApprovalRoute[]) || [];
        console.log(`Processing ${routes.length} approval routes`);

        for (const route of routes) {
          // Determine the primary approver role
          const primaryApprover = route.approvers?.[0];
          const routeName = route.custom_route_name || route.route_type;

          needsToCreate.push({
            workstream_id,
            need_type: 'approval',
            description: `${routeName} approval`,
            satisfier_role: primaryApprover?.role || null,
            satisfier_type: 'role',
            status: 'open',
            required_before: 'signature',
            source_type: 'approval_template',
            source_id: template.id,
            source_reason: `Required approval from ${template.name}`,
          });
        }
      }
    }

    // 6. Insert all needs
    console.log(`Creating ${needsToCreate.length} needs`);

    if (needsToCreate.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No needs configured for this workstream type",
          needs_created: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: createdNeeds, error: insertError } = await supabaseAdmin
      .from("needs")
      .insert(needsToCreate)
      .select();

    if (insertError) {
      console.error("Error inserting needs:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create needs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully created ${createdNeeds?.length || 0} needs`);

    // 7. Log activity
    await supabaseAdmin
      .from("workstream_activity")
      .insert({
        workstream_id,
        activity_type: "needs_created",
        description: `${createdNeeds?.length || 0} needs automatically created from play configuration`,
        metadata: {
          needs_count: createdNeeds?.length || 0,
          source_workstream_type: workstreamType.name,
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        workstream_id,
        workstream_type_id: workstreamType.id,
        needs_created: createdNeeds?.length || 0,
        needs: createdNeeds,
        breakdown: {
          from_default_needs: defaultNeeds.length,
          from_required_documents: requiredDocs.length,
          from_approval_routes: needsToCreate.length - defaultNeeds.length - requiredDocs.length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-needs-from-template:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
