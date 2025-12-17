import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ApprovalWorkflowResult {
  success: boolean;
  workstream_id?: string;
  template_id?: string;
  approvals_created?: number;
  auto_approved?: number;
  skipped?: number;
  approvals?: Array<{
    id: string;
    workstream_id: string;
    status: string;
    current_gate: number;
    route_metadata: {
      route_id: string;
      route_position: number;
      route_type: string;
      approval_mode: string;
      approval_threshold: string;
      approvers: Array<{
        role: string;
        sla_hours: number;
        is_required: boolean;
      }>;
    };
    due_at: string;
  }>;
  auto_approval_logs?: Array<{
    route_id: string;
    route_position: number;
    reason: string;
  }>;
  skipped_routes?: Array<{
    route_id: string;
    route_position: number;
    reason: string;
  }>;
  message?: string;
  error?: string;
}

export function useApprovalWorkflow() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create approval workflow records from a template when a workstream is created.
   * This evaluates all routes in the template and creates appropriate approval records.
   * 
   * @param workstreamId - The ID of the workstream to create approvals for
   * @returns Result with created approvals and any auto-approved/skipped routes
   */
  const createApprovalsFromTemplate = async (
    workstreamId: string
  ): Promise<ApprovalWorkflowResult> => {
    setIsCreating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-approvals-from-template",
        {
          body: { workstream_id: workstreamId },
        }
      );

      if (fnError) {
        const errorMessage = fnError.message || "Failed to create approvals";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return data as ApprovalWorkflowResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Get pending approvals for a specific workstream
   */
  const getWorkstreamApprovals = async (workstreamId: string) => {
    const { data, error } = await supabase
      .from("workstream_approvals")
      .select(`
        *,
        approval_template:approval_templates(name, description)
      `)
      .eq("workstream_id", workstreamId)
      .order("current_gate", { ascending: true });

    if (error) {
      console.error("Error fetching workstream approvals:", error);
      return [];
    }

    return data || [];
  };

  /**
   * Check if a workstream has any pending approvals
   */
  const hasPendingApprovals = async (workstreamId: string): Promise<boolean> => {
    const { count, error } = await supabase
      .from("workstream_approvals")
      .select("*", { count: "exact", head: true })
      .eq("workstream_id", workstreamId)
      .eq("status", "pending");

    if (error) {
      console.error("Error checking pending approvals:", error);
      return false;
    }

    return (count || 0) > 0;
  };

  /**
   * Advance to the next approval route after an approval is completed.
   * Used in serial approval mode.
   */
  const advanceToNextRoute = async (
    workstreamId: string,
    currentGate: number
  ): Promise<ApprovalWorkflowResult> => {
    // This would create the next approval in the sequence
    // For now, we'll re-trigger the template processing
    // In production, you'd want more sophisticated logic here
    return createApprovalsFromTemplate(workstreamId);
  };

  return {
    createApprovalsFromTemplate,
    getWorkstreamApprovals,
    hasPendingApprovals,
    advanceToNextRoute,
    isCreating,
    error,
  };
}
