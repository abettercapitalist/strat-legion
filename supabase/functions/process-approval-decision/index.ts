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

interface ApprovalRoute {
  id: string;
  position: number;
  route_type: string;
  approval_mode: "serial" | "parallel";
  approval_threshold: "unanimous" | "minimum" | "percentage" | "any_one";
  minimum_approvals?: number;
  percentage_required?: number;
  approvers?: Array<{
    role: string;
    sla_hours?: number;
    is_required?: boolean;
  }>;
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
    notes.includes("net 60") ||
    notes.includes("net 90")
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

// Check if a route is complete based on threshold logic
function checkRouteComplete(
  route: ApprovalRoute,
  approvedCount: number,
  rejectedCount: number,
  totalApprovers: number
): "complete" | "failed" | "pending" {
  const remaining = totalApprovers - approvedCount - rejectedCount;

  switch (route.approval_threshold) {
    case "unanimous":
      if (approvedCount === totalApprovers) return "complete";
      if (rejectedCount > 0) return "failed";
      return "pending";

    case "minimum":
      const minRequired = route.minimum_approvals || 1;
      if (approvedCount >= minRequired) return "complete";
      if (approvedCount + remaining < minRequired) return "failed";
      return "pending";

    case "percentage":
      const percentage = route.percentage_required || 67;
      const required = Math.ceil(totalApprovers * percentage / 100);
      if (approvedCount >= required) return "complete";
      if (approvedCount + remaining < required) return "failed";
      return "pending";

    case "any_one":
      if (approvedCount > 0) return "complete";
      if (rejectedCount === totalApprovers) return "failed";
      return "pending";

    default:
      // Default to unanimous if not specified
      if (approvedCount === totalApprovers) return "complete";
      if (rejectedCount > 0) return "failed";
      return "pending";
  }
}

// Run AI tag inference on reasoning text
async function runAITagInference(reasoning: string, lovableApiKey: string): Promise<TagRule[]> {
  const systemPrompt = `You are a tag extraction assistant. Given approval decision reasoning text, extract relevant tags that categorize this decision.

Available tag categories:
- customer_characteristics: established_customer, new_customer, high_risk, low_risk, strategic_account
- concerns: liability_concerns, payment_concerns, data_residency, compliance_requirements
- modifications: standard_terms, minor_changes, significant_deviation
- business_factors: time_sensitive, competitive_pressure, relationship_building

Return a JSON array of tag objects with: tag_name, tag_category, description (brief).
Only return tags that are clearly supported by the text. Maximum 5 tags.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract tags from this approval reasoning:\n\n"${reasoning}"` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_tags",
            description: "Extract semantic tags from approval reasoning",
            parameters: {
              type: "object",
              properties: {
                tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tag_name: { type: "string" },
                      tag_category: { type: "string" },
                      description: { type: "string" }
                    },
                    required: ["tag_name", "tag_category", "description"]
                  }
                }
              },
              required: ["tags"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_tags" } }
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return (parsed.tags || []).slice(0, 5);
    }

    return [];
  } catch (error) {
    console.error("Error in AI tag inference:", error);
    return [];
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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

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

    // Fetch the workstream_approval with template
    const { data: approval, error: approvalError } = await supabaseAdmin
      .from("workstream_approvals")
      .select(`
        *,
        workstream_id,
        submitted_at,
        current_gate,
        approval_template:approval_templates(id, name, approval_sequence)
      `)
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

    // Fetch user profile for activity logging
    let actorName = "User";
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.full_name) {
      actorName = profile.full_name;
    }

    // Get the current route from template
    const routes = (approval.approval_template?.approval_sequence as ApprovalRoute[]) || [];
    const currentGate = approval.current_gate || 1;
    const currentRoute = routes.find(r => r.position === currentGate);

    // For now, treat each approval as having 1 approver per gate
    // In production, you'd track multiple approvers per route
    const totalApprovers = currentRoute?.approvers?.length || 1;
    const approvedCount = decision === "approved" ? 1 : 0;
    const rejectedCount = decision === "rejected" ? 1 : 0;

    let routeStatus: "complete" | "failed" | "pending" = "pending";
    let nextRouteCreated = false;
    let workstreamCompleted = false;

    if (currentRoute) {
      routeStatus = checkRouteComplete(currentRoute, approvedCount, rejectedCount, totalApprovers);
      console.log(`Route ${currentGate} status: ${routeStatus}`);
    } else {
      // No route info, use simple logic
      routeStatus = decision === "approved" ? "complete" : decision === "rejected" ? "failed" : "pending";
    }

    // Determine new approval status
    let newStatus: string;
    let newNeedId: string | null = null;
    
    if (routeStatus === "complete") {
      // Mark the current need as satisfied
      if (approval.workstream_id) {
        await supabaseAdmin
          .from("needs")
          .update({
            status: "satisfied",
            satisfied_at: now.toISOString(),
            satisfied_by: user.id,
            satisfaction_reference_type: "approval_decision",
            satisfaction_reference_id: decisionRecord.id,
          })
          .eq("source_id", approval_id)
          .eq("source_type", "approval");
        console.log("Marked current need as satisfied");
      }

      // Check if there's a next route
      const nextRoute = routes.find(r => r.position === currentGate + 1);
      
      if (nextRoute) {
        // Create next approval record
        const { data: nextApproval, error: nextApprovalError } = await supabaseAdmin
          .from("workstream_approvals")
          .insert({
            workstream_id: approval.workstream_id,
            approval_template_id: approval.approval_template?.id,
            status: "pending",
            current_gate: nextRoute.position,
            submitted_at: now.toISOString(),
          })
          .select()
          .single();

        if (!nextApprovalError && nextApproval) {
          nextRouteCreated = true;
          console.log(`Created next approval for route ${nextRoute.position}`);
          
          // Create corresponding need for the next gate
          const nextApprovers = nextRoute.approvers || [];
          const nextRole = nextApprovers[0]?.role || "general_counsel";
          const nextDescription = `${nextRoute.route_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Approval'} required (Gate ${nextRoute.position})`;
          
          const { data: newNeed, error: needError } = await supabaseAdmin
            .from("needs")
            .insert({
              workstream_id: approval.workstream_id,
              need_type: "approval",
              description: nextDescription,
              satisfier_role: nextRole,
              satisfier_type: "role",
              status: "open",
              source_type: "approval",
              source_id: nextApproval.id,
              source_reason: `Next gate in approval workflow`,
            })
            .select()
            .single();

          if (needError) {
            console.error("Error creating next need:", needError);
          } else {
            newNeedId = newNeed.id;
            console.log(`Created need for next gate: ${newNeed.id}`);
          }
        }
        
        newStatus = "approved"; // This gate approved, workflow continues
      } else {
        // All routes complete - mark workstream as approved
        newStatus = "approved";
        workstreamCompleted = true;
        
        if (approval.workstream_id) {
          await supabaseAdmin
            .from("workstreams")
            .update({ 
              stage: "approved",
              updated_at: now.toISOString()
            })
            .eq("id", approval.workstream_id);
          console.log("Workstream marked as approved");
        }
      }
    } else if (routeStatus === "failed") {
      newStatus = "rejected";
      
      // Mark the current need as satisfied (rejection is still a resolution)
      if (approval.workstream_id) {
        await supabaseAdmin
          .from("needs")
          .update({
            status: "satisfied",
            satisfied_at: now.toISOString(),
            satisfied_by: user.id,
            satisfaction_reference_type: "approval_decision",
            satisfaction_reference_id: decisionRecord.id,
          })
          .eq("source_id", approval_id)
          .eq("source_type", "approval");
      }
      
      // Update workstream stage to rejected
      if (approval.workstream_id) {
        await supabaseAdmin
          .from("workstreams")
          .update({ 
            stage: "rejected",
            updated_at: now.toISOString()
          })
          .eq("id", approval.workstream_id);
        console.log("Workstream marked as rejected");
      }
    } else {
      newStatus = decision === "request_changes" ? "changes_requested" : "pending";
    }

    // Update workstream_approval status
    await supabaseAdmin
      .from("workstream_approvals")
      .update({
        status: newStatus,
        completed_at: routeStatus !== "pending" ? now.toISOString() : null,
        updated_at: now.toISOString(),
      })
      .eq("id", approval_id);

    // Log activity for the approval decision
    if (approval.workstream_id) {
      const activityTypeMap: Record<string, string> = {
        approved: "approval_approved",
        rejected: "approval_rejected",
        request_changes: "approval_changes_requested",
      };
      
      const activityDescriptionMap: Record<string, string> = {
        approved: `${actorName} approved gate ${currentGate}${currentRoute?.route_type ? ` (${currentRoute.route_type.replace(/_/g, ' ')})` : ''}`,
        rejected: `${actorName} rejected gate ${currentGate}${currentRoute?.route_type ? ` (${currentRoute.route_type.replace(/_/g, ' ')})` : ''}`,
        request_changes: `${actorName} requested changes on gate ${currentGate}${currentRoute?.route_type ? ` (${currentRoute.route_type.replace(/_/g, ' ')})` : ''}`,
      };

      await supabaseAdmin
        .from("workstream_activity")
        .insert({
          workstream_id: approval.workstream_id,
          activity_type: activityTypeMap[decision] || "updated",
          description: activityDescriptionMap[decision] || `Approval decision: ${decision}`,
          actor_id: user.id,
          metadata: {
            approval_id,
            decision,
            gate: currentGate,
            route_type: currentRoute?.route_type || null,
            route_status: routeStatus,
            reasoning_provided: !!(reasoning && reasoning.trim()),
            next_route_created: nextRouteCreated,
            workstream_completed: workstreamCompleted,
          },
        });
      console.log(`Logged activity: ${activityTypeMap[decision]}`);

      // Also log stage change if workstream was completed or rejected
      if (workstreamCompleted) {
        await supabaseAdmin
          .from("workstream_activity")
          .insert({
            workstream_id: approval.workstream_id,
            activity_type: "stage_changed",
            description: `Workstream approved - all approval gates complete`,
            actor_id: user.id,
            metadata: { new_stage: "approved", triggered_by: "approval_workflow" },
          });
      } else if (routeStatus === "failed") {
        await supabaseAdmin
          .from("workstream_activity")
          .insert({
            workstream_id: approval.workstream_id,
            activity_type: "stage_changed",
            description: `Workstream rejected at gate ${currentGate}`,
            actor_id: user.id,
            metadata: { new_stage: "rejected", triggered_by: "approval_workflow", gate: currentGate },
          });
      }
    }

    // Infer tags from workstream data (auto-tagging)
    const inferredTags = workstream
      ? inferTags(workstream, counterparty, approval.submitted_at, now)
      : [];

    console.log(`Inferred ${inferredTags.length} auto-tags:`, inferredTags.map(t => t.tag_name));

    // Run AI tag inference if reasoning provided
    let aiTags: TagRule[] = [];
    if (reasoning && reasoning.trim().length > 10 && lovableApiKey) {
      console.log("Running AI tag inference on reasoning...");
      aiTags = await runAITagInference(reasoning, lovableApiKey);
      console.log(`AI inferred ${aiTags.length} tags:`, aiTags.map(t => t.tag_name));
    }

    const allTags = [...inferredTags, ...aiTags];
    const appliedTags: string[] = [];
    const aiAppliedTags: string[] = [];

    // Process each tag
    for (const tagRule of allTags) {
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
        tagId = existingTag.id;
        await supabaseAdmin
          .from("tags")
          .update({ usage_count: (existingTag.usage_count || 0) + 1 })
          .eq("id", tagId);
      } else {
        const { data: newTag, error: createTagError } = await supabaseAdmin
          .from("tags")
          .insert({
            tag_name: tagRule.tag_name,
            tag_category: tagRule.tag_category,
            description: tagRule.description,
            usage_count: 1,
            created_by: null,
          })
          .select()
          .single();

        if (createTagError || !newTag) {
          console.error(`Error creating tag ${tagRule.tag_name}:`, createTagError);
          continue;
        }
        tagId = newTag.id;
      }

      // Determine confidence (1.0 for auto, 0.8 for AI)
      const isAiTag = aiTags.some(t => t.tag_name === tagRule.tag_name);
      const confidence = isAiTag ? 0.8 : 1.0;

      // Create content_tag
      const { error: contentTagError } = await supabaseAdmin
        .from("content_tags")
        .insert({
          content_type: "approval_decision",
          content_id: decisionRecord.id,
          tag_id: tagId,
          tagged_by: null,
          confidence,
        });

      if (contentTagError) {
        console.error(`Error creating content_tag for ${tagRule.tag_name}:`, contentTagError);
      } else {
        if (isAiTag) {
          aiAppliedTags.push(tagRule.tag_name);
        } else {
          appliedTags.push(tagRule.tag_name);
        }
      }
    }

    console.log(`Applied ${appliedTags.length} auto-tags, ${aiAppliedTags.length} AI tags`);

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
        ai_tags: aiAppliedTags,
        route_status: routeStatus,
        next_route_created: nextRouteCreated,
        workstream_completed: workstreamCompleted,
        message: `Decision recorded. Route status: ${routeStatus}. ${
          appliedTags.length + aiAppliedTags.length > 0 
            ? `Tags: ${[...appliedTags, ...aiAppliedTags].join(", ")}`
            : "No tags applied."
        }`,
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
