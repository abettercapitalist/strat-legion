import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitManualTagsRequest {
  decision_id: string;
  free_text?: string;
  selected_factors?: string[];
  skipped?: boolean;
}

// Map checkbox factors to tag names
const FACTOR_TO_TAG: Record<string, { tag_name: string; tag_category: string; description: string }> = {
  customer_low_risk: {
    tag_name: "low_risk_customer",
    tag_category: "customer_characteristics",
    description: "Customer assessed as low risk",
  },
  legal_reviewed: {
    tag_name: "legal_reviewed",
    tag_category: "process",
    description: "Legal team reviewed the clauses",
  },
  similar_to_previous: {
    tag_name: "similar_to_previous",
    tag_category: "pattern",
    description: "Similar to previously approved deal",
  },
  small_financial_impact: {
    tag_name: "small_financial_impact",
    tag_category: "business_factors",
    description: "Deal has small financial impact",
  },
  standard_terms: {
    tag_name: "standard_terms",
    tag_category: "contract_changes",
    description: "Standard terms were used",
  },
  time_sensitive: {
    tag_name: "time_sensitive",
    tag_category: "business_factors",
    description: "Time-sensitive deal requiring quick decision",
  },
  strategic_relationship: {
    tag_name: "strategic_relationship",
    tag_category: "customer_characteristics",
    description: "Strategic customer relationship",
  },
  compliance_verified: {
    tag_name: "compliance_verified",
    tag_category: "process",
    description: "Compliance requirements verified",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SubmitManualTagsRequest = await req.json();
    const { decision_id, free_text, selected_factors, skipped } = body;

    if (!decision_id) {
      return new Response(
        JSON.stringify({ error: "decision_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current decision to update factors
    const { data: decision, error: decisionError } = await supabaseAdmin
      .from("approval_decisions")
      .select("decision_factors")
      .eq("id", decision_id)
      .maybeSingle();

    if (decisionError || !decision) {
      return new Response(
        JSON.stringify({ error: "Decision not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existingFactors = (decision.decision_factors as Record<string, unknown>) || {};

    // Handle skip
    if (skipped) {
      await supabaseAdmin
        .from("approval_decisions")
        .update({
          decision_factors: {
            ...existingFactors,
            prompt_skipped: true,
            prompt_skipped_at: new Date().toISOString(),
          },
        })
        .eq("id", decision_id);

      // Calculate acceptance rate
      const rate = await calculateAcceptanceRate(supabaseAdmin, user.id);

      return new Response(
        JSON.stringify({ success: true, skipped: true, acceptance_rate: rate }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appliedTags: string[] = [];

    // Process selected checkbox factors -> direct tags
    if (selected_factors && selected_factors.length > 0) {
      for (const factor of selected_factors) {
        const tagDef = FACTOR_TO_TAG[factor];
        if (!tagDef) continue;

        const tagId = await getOrCreateTag(supabaseAdmin, tagDef);
        if (tagId) {
          await createContentTag(supabaseAdmin, decision_id, tagId, user.id, 1.0);
          appliedTags.push(tagDef.tag_name);
        }
      }
    }

    // Process free text -> AI tag inference
    let aiSuggestedTags: string[] = [];
    if (free_text && free_text.trim()) {
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

      if (anthropicKey) {
        try {
          const aiTags = await inferTagsFromText(anthropicKey, free_text);
          aiSuggestedTags = aiTags;

          for (const tagName of aiTags) {
            const tagId = await getOrCreateTag(supabaseAdmin, {
              tag_name: tagName,
              tag_category: inferTagCategory(tagName),
              description: `AI-inferred tag from user feedback`,
            });

            if (tagId) {
              await createContentTag(supabaseAdmin, decision_id, tagId, null, 0.8);
              appliedTags.push(tagName);
            }
          }
        } catch (err) {
          console.error("AI tag inference failed:", err);
        }
      }

      // Store the free text in decision_factors
      await supabaseAdmin
        .from("approval_decisions")
        .update({
          decision_factors: {
            ...existingFactors,
            prompt_submitted: true,
            prompt_submitted_at: new Date().toISOString(),
            user_feedback_text: free_text,
            ai_suggested_tags: aiSuggestedTags,
          },
        })
        .eq("id", decision_id);
    } else {
      // Just update that prompt was submitted (checkboxes only)
      await supabaseAdmin
        .from("approval_decisions")
        .update({
          decision_factors: {
            ...existingFactors,
            prompt_submitted: true,
            prompt_submitted_at: new Date().toISOString(),
            selected_factors: selected_factors,
          },
        })
        .eq("id", decision_id);
    }

    // Calculate acceptance rate
    const rate = await calculateAcceptanceRate(supabaseAdmin, user.id);

    console.log(`Manual tags submitted for ${decision_id}:`, appliedTags);

    return new Response(
      JSON.stringify({
        success: true,
        applied_tags: appliedTags,
        ai_suggested_tags: aiSuggestedTags,
        acceptance_rate: rate,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error submitting manual tags:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function inferTagsFromText(apiKey: string, text: string): Promise<string[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Analyze this approval decision feedback and suggest relevant tags (return only tag names, comma-separated, no explanations):

"${text}"

Available tag categories:
- customer_characteristics: established_customer, new_customer, high_risk, low_risk, strategic_account
- concerns: liability_concerns, payment_concerns, data_residency, compliance_requirements
- modifications: standard_terms, minor_changes, significant_deviation
- business_factors: time_sensitive, competitive_pressure, relationship_building
- process: legal_reviewed, compliance_verified, executive_approved

Suggest 2-5 most relevant tags:`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";

  // Parse comma-separated tags
  const tags = content
    .split(",")
    .map((t: string) => t.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter((t: string) => t.length > 0 && t.length < 50);

  return tags.slice(0, 5);
}

function inferTagCategory(tagName: string): string {
  const categoryMap: Record<string, string[]> = {
    customer_characteristics: ["customer", "established", "new", "high_risk", "low_risk", "strategic"],
    concerns: ["liability", "payment", "data", "compliance", "concerns"],
    modifications: ["terms", "changes", "deviation", "standard"],
    business_factors: ["time", "competitive", "relationship", "financial"],
    process: ["reviewed", "verified", "approved"],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => tagName.includes(kw))) {
      return category;
    }
  }

  return "general";
}

async function getOrCreateTag(
  supabase: AnySupabaseClient,
  tagDef: { tag_name: string; tag_category: string; description: string }
): Promise<string | null> {
  // Check if exists
  const { data: existing } = await supabase
    .from("tags")
    .select("id, usage_count")
    .eq("tag_name", tagDef.tag_name)
    .maybeSingle();

  if (existing) {
    // Increment usage
    await supabase
      .from("tags")
      .update({ usage_count: (existing.usage_count || 0) + 1 })
      .eq("id", existing.id);
    return existing.id;
  }

  // Create new
  const { data: newTag, error } = await supabase
    .from("tags")
    .insert({
      tag_name: tagDef.tag_name,
      tag_category: tagDef.tag_category,
      description: tagDef.description,
      usage_count: 1,
      created_by: null,
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating tag ${tagDef.tag_name}:`, error);
    return null;
  }

  return newTag.id;
}

async function createContentTag(
  supabase: AnySupabaseClient,
  contentId: string,
  tagId: string,
  taggedBy: string | null,
  confidence: number
): Promise<void> {
  // Check if already exists
  const { data: existing } = await supabase
    .from("content_tags")
    .select("id")
    .eq("content_id", contentId)
    .eq("tag_id", tagId)
    .maybeSingle();

  if (existing) {
    return; // Already tagged
  }

  await supabase.from("content_tags").insert({
    content_type: "approval_decision",
    content_id: contentId,
    tag_id: tagId,
    tagged_by: taggedBy,
    confidence,
  });
}

async function calculateAcceptanceRate(
  supabase: AnySupabaseClient,
  userId: string
): Promise<number | null> {
  const { data: stats } = await supabase
    .from("approval_decisions")
    .select("decision_factors")
    .eq("decided_by", userId)
    .not("decision_factors", "is", null);

  let prompted = 0;
  let accepted = 0;

  stats?.forEach((d: { decision_factors: Record<string, unknown> | null }) => {
    const factors = d.decision_factors;
    if (factors?.prompt_shown) {
      prompted++;
      if (factors?.prompt_submitted) {
        accepted++;
      }
    }
  });

  return prompted > 0 ? accepted / prompted : null;
}
