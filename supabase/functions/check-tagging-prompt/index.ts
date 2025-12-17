import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckTaggingPromptRequest {
  decision_id?: string;
  get_acceptance_rate?: boolean;
}

interface PromptDecisionResult {
  shouldPrompt: boolean;
  context?: {
    prompt_reason: string;
    similar_decisions_count: number;
    novel_feature?: string;
  };
  acceptance_rate?: number;
}

const SIMILAR_THRESHOLD = 5; // Novel if < 5 similar decisions
const HIGH_VALUE_THRESHOLD = 500000; // $500K
const HIGH_VALUE_PROMPT_CHANCE = 0.3; // 30% chance for high-value deals

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

    const body: CheckTaggingPromptRequest = await req.json();

    // If just requesting acceptance rate
    if (body.get_acceptance_rate) {
      const { data: stats } = await supabaseAdmin
        .from("approval_decisions")
        .select("decision_factors")
        .eq("decided_by", user.id)
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

      const rate = prompted > 0 ? accepted / prompted : null;

      return new Response(
        JSON.stringify({ acceptance_rate: rate }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { decision_id } = body;

    if (!decision_id) {
      return new Response(
        JSON.stringify({ shouldPrompt: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the decision and related workstream
    const { data: decision, error: decisionError } = await supabaseAdmin
      .from("approval_decisions")
      .select(`
        *,
        workstream_approvals!inner(
          workstream_id,
          workstreams(
            annual_value,
            tier,
            notes,
            business_objective,
            counterparty_id,
            counterparties(counterparty_type, name)
          )
        )
      `)
      .eq("id", decision_id)
      .maybeSingle();

    if (decisionError || !decision) {
      console.error("Error fetching decision:", decisionError);
      return new Response(
        JSON.stringify({ shouldPrompt: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tags associated with this decision
    const { data: decisionTags } = await supabaseAdmin
      .from("content_tags")
      .select("tags(tag_name, tag_category)")
      .eq("content_id", decision_id)
      .eq("content_type", "approval_decision");

    const tagNames: string[] = [];
    if (decisionTags) {
      for (const t of decisionTags) {
        const tags = t.tags as { tag_name: string } | { tag_name: string }[] | null;
        if (tags) {
          if (Array.isArray(tags)) {
            tags.forEach((tag) => tag.tag_name && tagNames.push(tag.tag_name));
          } else if (tags.tag_name) {
            tagNames.push(tags.tag_name);
          }
        }
      }
    }

    // Count similar past decisions (same tags)
    let similarCount = 0;
    let novelFeature: string | undefined;

    if (tagNames.length > 0) {
      // Find decisions with overlapping tags
      const { data: similarDecisions } = await supabaseAdmin
        .from("content_tags")
        .select("content_id, tags!inner(tag_name)")
        .eq("content_type", "approval_decision")
        .neq("content_id", decision_id)
        .in("tags.tag_name", tagNames);

      // Count unique decisions
      const uniqueDecisionIds = new Set(similarDecisions?.map((d: { content_id: string }) => d.content_id));
      similarCount = uniqueDecisionIds.size;

      // Find the most novel tag (least common)
      const tagCounts: Record<string, number> = {};
      similarDecisions?.forEach((d: { tags: { tag_name: string } | { tag_name: string }[] | null }) => {
        const tags = d.tags;
        if (tags) {
          if (Array.isArray(tags)) {
            tags.forEach((tag) => {
              if (tag.tag_name) {
                tagCounts[tag.tag_name] = (tagCounts[tag.tag_name] || 0) + 1;
              }
            });
          } else if (tags.tag_name) {
            tagCounts[tags.tag_name] = (tagCounts[tags.tag_name] || 0) + 1;
          }
        }
      });

      // Find tag with lowest count
      let minCount = Infinity;
      tagNames.forEach((tag) => {
        const count = tagCounts[tag] || 0;
        if (count < minCount) {
          minCount = count;
          novelFeature = tag.replace(/_/g, " ");
        }
      });
    }

    // Decision logic
    const result: PromptDecisionResult = { shouldPrompt: false };

    const workstreamApprovals = decision.workstream_approvals as { workstreams: Record<string, unknown> } | null;
    const workstream = workstreamApprovals?.workstreams;
    const annualValue = Number(workstream?.annual_value) || 0;
    const isHighValue = annualValue > HIGH_VALUE_THRESHOLD;

    // Check conditions
    // 1. Novel situation (< 5 similar past decisions)
    if (similarCount < SIMILAR_THRESHOLD) {
      result.shouldPrompt = true;
      result.context = {
        prompt_reason: `This is only the ${similarCount + 1}${getOrdinalSuffix(similarCount + 1)} time you've made a decision with`,
        similar_decisions_count: similarCount,
        novel_feature: novelFeature || "these characteristics",
      };
    }
    // 2. High-value deals (occasionally)
    else if (isHighValue && Math.random() < HIGH_VALUE_PROMPT_CHANCE) {
      result.shouldPrompt = true;
      result.context = {
        prompt_reason: `This is a high-value deal ($${(annualValue / 1000).toFixed(0)}K). Your insights help improve future approvals.`,
        similar_decisions_count: similarCount,
      };
    }
    // 3. Decision pattern check (compare to predicted)
    // For now, we'll use a simple heuristic: if decision differs from majority
    else if (similarCount >= SIMILAR_THRESHOLD) {
      const { data: similarDecisionDetails } = await supabaseAdmin
        .from("content_tags")
        .select("content_id")
        .eq("content_type", "approval_decision")
        .in("tags.tag_name", tagNames);

      if (similarDecisionDetails && similarDecisionDetails.length > 0) {
        const decisionIds = [...new Set(similarDecisionDetails.map((d: { content_id: string }) => d.content_id))];
        
        const { data: pastDecisions } = await supabaseAdmin
          .from("approval_decisions")
          .select("decision")
          .in("id", decisionIds.slice(0, 20)); // Sample last 20

        if (pastDecisions && pastDecisions.length >= 5) {
          const approvedCount = pastDecisions.filter((d: { decision: string }) => d.decision === "approved").length;
          const approvalRate = approvedCount / pastDecisions.length;

          // If current decision differs from >70% of similar decisions
          const currentIsApproval = decision.decision === "approved";
          const expectedApproval = approvalRate > 0.5;

          if (currentIsApproval !== expectedApproval && Math.abs(approvalRate - 0.5) > 0.2) {
            result.shouldPrompt = true;
            result.context = {
              prompt_reason: `This decision differs from the typical pattern (${Math.round(approvalRate * 100)}% approval rate for similar deals).`,
              similar_decisions_count: similarCount,
              novel_feature: "pattern deviation",
            };
          }
        }
      }
    }

    // Mark that we're considering showing a prompt (for tracking)
    if (result.shouldPrompt) {
      await supabaseAdmin
        .from("approval_decisions")
        .update({
          decision_factors: {
            ...(decision.decision_factors as Record<string, unknown> || {}),
            prompt_shown: true,
            prompt_shown_at: new Date().toISOString(),
          },
        })
        .eq("id", decision_id);
    }

    console.log(`Prompt decision for ${decision_id}:`, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking tagging prompt:", error);
    return new Response(
      JSON.stringify({ shouldPrompt: false, error: String(error) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
