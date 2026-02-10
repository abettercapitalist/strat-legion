import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Check if a team_category value (JSON array, UUID, or legacy name) contains a given value */
function teamCategoryIncludes(raw: string | null | undefined, needle: string): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.includes(needle);
  } catch { /* not JSON */ }
  return raw === needle;
}

export interface Deal {
  id: string;
  title: string;
  customer: string;
  customerType: "new" | "renewal";
  arr: string;
  arrValue: number;
  stage: "Draft" | "Negotiation" | "Approval" | "Signature";
  expectedClose: string;
  nextAction: string;
  statusDetail: string;
  priority: "high" | "medium" | "low";
  daysInStage: number;
  keyTerms?: string;
  businessObjective?: string;
}

export interface PipelineStage {
  name: string;
  count: number;
  value: number;
}

export interface PendingApproval {
  id: string;
  dealName: string;
  customer: string;
  type: string;
  dueDate: string;
  urgency: "high" | "medium" | "low";
}

function mapStageToDealStage(stage: string | null): Deal["stage"] {
  const stageMap: Record<string, Deal["stage"]> = {
    draft: "Draft",
    negotiation: "Negotiation",
    approval: "Approval",
    signature: "Signature",
  };
  return stageMap[stage?.toLowerCase() || "draft"] || "Draft";
}

function mapTierToPriority(tier: string | null): Deal["priority"] {
  const tierMap: Record<string, Deal["priority"]> = {
    strategic: "high",
    standard: "medium",
    basic: "low",
  };
  return tierMap[tier?.toLowerCase() || "standard"] || "medium";
}

function formatCurrency(value: number | null): string {
  if (!value) return "$0";
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${value}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysInStage(updatedAt: string): number {
  const updated = new Date(updatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
}

export function useDeals() {
  return useQuery({
    queryKey: ["sales-deals"],
    queryFn: async () => {
      // Fetch workstreams with sales-related workstream types
      const { data: workstreams, error } = await supabase
        .from("workstreams")
        .select(`
          *,
          counterparty:counterparties(*),
          workstream_type:workstream_types(*)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Filter to only sales workstreams
      const salesWorkstreams = (workstreams || []).filter(
        (w) => teamCategoryIncludes(w.workstream_type?.team_category, "sales")
      );

      // Map to Deal interface
      const deals: Deal[] = salesWorkstreams.map((w) => ({
        id: w.id,
        title: w.name,
        customer: w.counterparty?.name || "Unknown Customer",
        customerType: w.counterparty?.relationship_status === "prospect" ? "new" : "renewal",
        arr: formatCurrency(w.annual_value),
        arrValue: w.annual_value || 0,
        stage: mapStageToDealStage(w.stage),
        expectedClose: formatDate(w.expected_close_date),
        nextAction: getNextAction(w.stage),
        statusDetail: getStatusDetail(w.stage, w.updated_at),
        priority: mapTierToPriority(w.tier),
        daysInStage: getDaysInStage(w.updated_at),
        keyTerms: w.notes || undefined,
        businessObjective: w.business_objective || undefined,
      }));

      // Calculate pipeline stages
      const stageOrder = ["Draft", "Negotiation", "Approval", "Signature"];
      const pipelineStages: PipelineStage[] = stageOrder.map((stageName) => {
        const stageDeals = deals.filter((d) => d.stage === stageName);
        return {
          name: stageName,
          count: stageDeals.length,
          value: Math.round(stageDeals.reduce((acc, d) => acc + d.arrValue, 0) / 1000),
        };
      });

      return { deals, pipelineStages };
    },
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["sales-pending-approvals"],
    queryFn: async () => {
      const { data: approvals, error } = await supabase
        .from("workstream_approvals")
        .select(`
          *,
          workstream:workstreams(
            name,
            counterparty:counterparties(name),
            workstream_type:workstream_types(team_category)
          ),
          template:approval_templates(name)
        `)
        .eq("status", "pending")
        .order("submitted_at", { ascending: true });

      if (error) throw error;

      // Filter to only sales workstreams
      const salesApprovals = (approvals || []).filter(
        (a) => teamCategoryIncludes(a.workstream?.workstream_type?.team_category, "sales")
      );

      const pendingApprovals: PendingApproval[] = salesApprovals.map((a) => {
        const daysWaiting = a.submitted_at
          ? Math.floor((Date.now() - new Date(a.submitted_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          id: a.id,
          dealName: a.workstream?.counterparty?.name || "Unknown",
          customer: a.workstream?.name || "Unknown Deal",
          type: a.template?.name || "Approval Required",
          dueDate: getDueDateLabel(daysWaiting),
          urgency: getUrgencyFromDays(daysWaiting),
        };
      });

      return pendingApprovals;
    },
  });
}

function getNextAction(stage: string | null): string {
  const actions: Record<string, string> = {
    draft: "Complete deal setup",
    negotiation: "Continue negotiations",
    approval: "Awaiting approval",
    signature: "Awaiting signature",
  };
  return actions[stage?.toLowerCase() || "draft"] || "Review deal";
}

function getStatusDetail(stage: string | null, updatedAt: string): string {
  const days = getDaysInStage(updatedAt);
  const details: Record<string, string> = {
    draft: `In draft for ${days} day${days !== 1 ? "s" : ""}. Complete required fields to proceed.`,
    negotiation: `In negotiation for ${days} day${days !== 1 ? "s" : ""}. Active discussions in progress.`,
    approval: `Submitted for approval ${days} day${days !== 1 ? "s" : ""} ago. Awaiting decision.`,
    signature: `Pending signature for ${days} day${days !== 1 ? "s" : ""}. Contract sent to customer.`,
  };
  return details[stage?.toLowerCase() || "draft"] || "Review deal status.";
}

function getDueDateLabel(daysWaiting: number): string {
  if (daysWaiting === 0) return "Today";
  if (daysWaiting === 1) return "Yesterday";
  if (daysWaiting < 7) return `${daysWaiting} days ago`;
  return "Overdue";
}

function getUrgencyFromDays(daysWaiting: number): "high" | "medium" | "low" {
  if (daysWaiting >= 3) return "high";
  if (daysWaiting >= 1) return "medium";
  return "low";
}
