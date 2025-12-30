import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Need {
  id: string;
  workstream_id: string;
  need_type: 'approval' | 'document' | 'information' | 'review' | 'action';
  description: string;
  satisfier_role: string | null;
  satisfier_type: 'role' | 'user' | 'system' | 'external';
  status: 'open' | 'expressed' | 'committed' | 'satisfied';
  required_before: string | null;
  due_at: string | null;
  satisfied_at: string | null;
  satisfied_by: string | null;
  satisfaction_reference_type: string | null;
  satisfaction_reference_id: string | null;
  source_type: 'workstream_type' | 'approval_template' | 'manual' | 'system';
  source_id: string | null;
  source_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNeedsResult {
  success: boolean;
  workstream_id?: string;
  needs_created?: number;
  needs?: Need[];
  breakdown?: {
    from_default_needs: number;
    from_required_documents: number;
    from_approval_routes: number;
  };
  message?: string;
  error?: string;
}

export function useNeeds() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create needs from workstream type configuration.
   * Called when a workstream is created.
   */
  const createNeedsFromTemplate = useCallback(async (
    workstreamId: string
  ): Promise<CreateNeedsResult> => {
    setIsCreating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-needs-from-template",
        {
          body: { workstream_id: workstreamId },
        }
      );

      if (fnError) {
        const errorMessage = fnError.message || "Failed to create needs";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return data as CreateNeedsResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Get all needs for a workstream
   */
  const getWorkstreamNeeds = useCallback(async (workstreamId: string): Promise<Need[]> => {
    const { data, error } = await supabase
      .from("needs")
      .select("*")
      .eq("workstream_id", workstreamId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching workstream needs:", error);
      return [];
    }

    return (data || []) as Need[];
  }, []);

  /**
   * Get open needs for a specific role
   */
  const getNeedsForRole = useCallback(async (role: string): Promise<Need[]> => {
    const { data, error } = await supabase
      .from("needs")
      .select("*")
      .eq("satisfier_role", role)
      .in("status", ["open", "expressed", "committed"])
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching needs for role:", error);
      return [];
    }

    return (data || []) as Need[];
  }, []);

  /**
   * Get open needs count by role (for dashboard widgets)
   */
  const getNeedsCountByRole = useCallback(async (): Promise<Record<string, number>> => {
    const { data, error } = await supabase
      .from("needs")
      .select("satisfier_role")
      .in("status", ["open", "expressed"]);

    if (error) {
      console.error("Error fetching needs counts:", error);
      return {};
    }

    const counts: Record<string, number> = {};
    for (const need of data || []) {
      const role = need.satisfier_role || 'unassigned';
      counts[role] = (counts[role] || 0) + 1;
    }
    return counts;
  }, []);

  /**
   * Satisfy a need (mark as complete)
   */
  const satisfyNeed = useCallback(async (
    needId: string,
    satisfiedBy: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("needs")
      .update({
        status: "satisfied",
        satisfied_at: new Date().toISOString(),
        satisfied_by: satisfiedBy,
        satisfaction_reference_type: referenceType || null,
        satisfaction_reference_id: referenceId || null,
      })
      .eq("id", needId);

    if (error) {
      console.error("Error satisfying need:", error);
      return false;
    }

    return true;
  }, []);

  /**
   * Update need status (e.g., open -> expressed -> committed)
   */
  const updateNeedStatus = useCallback(async (
    needId: string,
    status: Need['status']
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("needs")
      .update({ status })
      .eq("id", needId);

    if (error) {
      console.error("Error updating need status:", error);
      return false;
    }

    return true;
  }, []);

  /**
   * Add a manual need to a workstream
   */
  const addManualNeed = useCallback(async (
    workstreamId: string,
    needData: {
      need_type: Need['need_type'];
      description: string;
      satisfier_role?: string;
      required_before?: string;
      reason?: string;
    }
  ): Promise<Need | null> => {
    const { data, error } = await supabase
      .from("needs")
      .insert({
        workstream_id: workstreamId,
        need_type: needData.need_type,
        description: needData.description,
        satisfier_role: needData.satisfier_role || null,
        satisfier_type: 'role',
        status: 'open',
        required_before: needData.required_before || null,
        source_type: 'manual',
        source_reason: needData.reason || 'Manually added',
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding manual need:", error);
      return null;
    }

    return data as Need;
  }, []);

  /**
   * Check if workstream has any unsatisfied needs
   */
  const hasOpenNeeds = useCallback(async (workstreamId: string): Promise<boolean> => {
    const { count, error } = await supabase
      .from("needs")
      .select("*", { count: "exact", head: true })
      .eq("workstream_id", workstreamId)
      .neq("status", "satisfied");

    if (error) {
      console.error("Error checking open needs:", error);
      return false;
    }

    return (count || 0) > 0;
  }, []);

  return {
    createNeedsFromTemplate,
    getWorkstreamNeeds,
    getNeedsForRole,
    getNeedsCountByRole,
    satisfyNeed,
    updateNeedStatus,
    addManualNeed,
    hasOpenNeeds,
    isCreating,
    error,
  };
}
