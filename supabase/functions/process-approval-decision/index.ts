import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalDecisionRequest {
  approval_id: string;
  decision: "approved" | "rejected" | "request_changes";
  reasoning?: string;
  decision_factors?: Record<string, unknown>;
}

interface TagRule {
  tag_name: string;
  tag_category: string;
  description: string;
}

// Tag inference rules based on structured data
function inferTags(
  workstream: Record<string, unknown>,
  counterparty: Record<string, unknown> | null,
  approvalStartTime: string | null,
  approvalEndTime: Date
): TagRule[] {
  const tags: TagRule[] = [];

  // High value deal: annual_value > 100000
  const annualValue = Number(workstream.annual_value) || 0;
  if (annualValue > 100000) {
    tags.push({
      tag_name: "high_value_deal",
      tag_category: "deal_value",
      description: "Deals with annual contract value over $100,000",
    });
  }

  // Enterprise customer
  if (counterparty?.counterparty_type === "enterprise") {
    tags.push({
      tag_name: "enterprise_customer",
      tag_category: "customer_type",
      description: "Enterprise-level customer accounts",
    });
  }

  // Check for payment term modifications (via notes or business_objective)
  const notes = String(workstream.notes || "").toLowerCase();
  const objective = String(workstream.business_objective || "").toLowerCase();
  if (
    notes.includes("payment") ||
    objective.includes("payment") ||
    notes.includes("net 30") ||
    notes.includes("net 60")
  ) {
    tags.push({
      tag_name: "payment_terms_modified",
      tag_category: "contract_changes",
      description: "Deals with modified payment terms",
    });
  }

  // Check for custom clauses indicator
  if (
    notes.includes("custom clause") ||
    notes.includes("non-standard") ||
    objective.includes("custom")
  ) {
    tags.push({
      tag_name: "custom_clauses",
      tag_category: "contract_changes",
      description: "Deals containing custom or non-standard clauses",
    });
  }

  // Approval timing tags
  if (approvalStartTime) {
    const startTime = new Date(approvalStartTime);
    const hoursDiff = (approvalEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 4) {
      tags.push({
        tag_name: "fast_approval",
        tag_category: "approval_timing",
        description: "Approvals completed in under 4 hours",
      });
    } else if (hoursDiff > 48) {
      tags.push({
        tag_name: "complex_review",
        tag_category: "approval_timing",
        description: "Approvals requiring more than 48 hours of review",
      });
    }
  }

  // Tier-based tags
  if (workstream.tier === "strategic") {
    tags.push({
      tag_name: "strategic_deal",
      tag_category: "deal_priority",
      description: "Strategic priority deals",
    });
  }

  return tags;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to get user id
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing approval decision for user: ${user.id}`);

    // Parse request body
    const body: ApprovalDecisionRequest = await req.json();
    const { approval_id, decision, reasoning, decision_factors } = body;

    if (!approval_id || !decision) {
      console.error("Missing required fields:", { approval_id, decision });
      return new Response(
        JSON.stringify({ error: "approval_id and decision are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing decision: ${decision} for approval: ${approval_id}`);

    // Fetch the workstream_approval to get workstream context
    const { data: approval, error: approvalError } = await supabaseAdmin
      .from("workstream_approvals")
      .select("*, workstream_id, submitted_at")
      .eq("id", approval_id)
      .maybeSingle();

    if (approvalError) {
      console.error("Error fetching approval:", approvalError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch approval" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!approval) {
      console.error("Approval not found:", approval_id);
      return new Response(
        JSON.stringify({ error: "Approval not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch workstream data for tag inference
    let workstream: Record<string, unknown> | null = null;
    let counterparty: Record<string, unknown> | null = null;

    if (approval.workstream_id) {
      const { data: wsData, error: wsError } = await supabaseAdmin
        .from("workstreams")
        .select("*, counterparty_id")
        .eq("id", approval.workstream_id)
        .maybeSingle();

      if (wsError) {
        console.error("Error fetching workstream:", wsError);
      } else {
        workstream = wsData;

        // Fetch counterparty if exists
        if (wsData?.counterparty_id) {
          const { data: cpData, error: cpError } = await supabaseAdmin
            .from("counterparties")
            .select("*")
            .eq("id", wsData.counterparty_id)
            .maybeSingle();

          if (!cpError && cpData) {
            counterparty = cpData;
          }
        }
      }
    }

    console.log("Workstream data:", workstream ? "found" : "not found");
    console.log("Counterparty data:", counterparty ? "found" : "not found");

    // Create approval decision record
    const now = new Date();
    const { data: decisionRecord, error: decisionError } = await supabaseAdmin
      .from("approval_decisions")
      .insert({
        approval_id,
        decision,
        reasoning: reasoning || null,
        decision_factors: decision_factors || {},
        decided_by: user.id,
        created_at: now.toISOString(),
      })
      .select()
      .single();

    if (decisionError) {
      console.error("Error creating decision:", decisionError);
      return new Response(
        JSON.stringify({ error: "Failed to create decision record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created decision record: ${decisionRecord.id}`);

    // Update workstream_approval status
    const newStatus = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "changes_requested";
    await supabaseAdmin
      .from("workstream_approvals")
      .update({
        status: newStatus,
        completed_at: decision === "approved" || decision === "rejected" ? now.toISOString() : null,
        updated_at: now.toISOString(),
      })
      .eq("id", approval_id);

    // Infer tags from workstream data
    const inferredTags = workstream
      ? inferTags(workstream, counterparty, approval.submitted_at, now)
      : [];

    console.log(`Inferred ${inferredTags.length} tags:`, inferredTags.map(t => t.tag_name));

    const appliedTags: string[] = [];

    // Process each inferred tag
    for (const tagRule of inferredTags) {
      // Check if tag exists
      const { data: existingTag, error: tagQueryError } = await supabaseAdmin
        .from("tags")
        .select("id, usage_count")
        .eq("tag_name", tagRule.tag_name)
        .maybeSingle();

      if (tagQueryError) {
        console.error(`Error querying tag ${tagRule.tag_name}:`, tagQueryError);
        continue;
      }

      let tagId: string;

      if (existingTag) {
        // Tag exists - increment usage count
        tagId = existingTag.id;
        await supabaseAdmin
          .from("tags")
          .update({ usage_count: (existingTag.usage_count || 0) + 1 })
          .eq("id", tagId);
        console.log(`Updated existing tag: ${tagRule.tag_name}`);
      } else {
        // Create new tag
        const { data: newTag, error: createTagError } = await supabaseAdmin
          .from("tags")
          .insert({
            tag_name: tagRule.tag_name,
            tag_category: tagRule.tag_category,
            description: tagRule.description,
            usage_count: 1,
            created_by: null, // System-created
          })
          .select()
          .single();

        if (createTagError || !newTag) {
          console.error(`Error creating tag ${tagRule.tag_name}:`, createTagError);
          continue;
        }
        tagId = newTag.id;
        console.log(`Created new tag: ${tagRule.tag_name}`);
      }

      // Create content_tag linking to approval_decision
      const { error: contentTagError } = await supabaseAdmin
        .from("content_tags")
        .insert({
          content_type: "approval_decision",
          content_id: decisionRecord.id,
          tag_id: tagId,
          tagged_by: null, // Auto-tagged (not user-tagged)
          confidence: 1.0, // High confidence for rule-based inference
        });

      if (contentTagError) {
        console.error(`Error creating content_tag for ${tagRule.tag_name}:`, contentTagError);
      } else {
        appliedTags.push(tagRule.tag_name);
      }
    }

    console.log(`Successfully applied ${appliedTags.length} tags`);

    return new Response(
      JSON.stringify({
        success: true,
        decision: {
          id: decisionRecord.id,
          decision: decisionRecord.decision,
          reasoning: decisionRecord.reasoning,
          created_at: decisionRecord.created_at,
        },
        auto_tags: appliedTags,
        message: `Decision recorded. Auto-tagged: ${appliedTags.length > 0 ? appliedTags.join(", ") : "none"}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
