import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ActivityType =
  | "created"
  | "stage_changed"
  | "approval_submitted"
  | "approval_approved"
  | "approval_rejected"
  | "approval_changes_requested"
  | "document_uploaded"
  | "document_removed"
  | "needs_created"
  | "need_satisfied"
  | "comment_added"
  | "assigned"
  | "updated";

export interface LogActivityParams {
  workstream_id: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Json;
}

/**
 * Hook for logging activity to workstream_activity table
 * Use this for tracking user actions and workflow events
 */
export function useActivityLogger() {
  const logActivity = async ({
    workstream_id,
    activity_type,
    description,
    metadata = {},
  }: LogActivityParams): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("workstream_activity").insert([{
        workstream_id,
        activity_type,
        description,
        actor_id: user?.id || null,
        metadata: metadata ?? {},
      }]);

      if (error) {
        console.error("Failed to log activity:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Activity logging error:", message);
      return { success: false, error: message };
    }
  };

  return { logActivity };
}

/**
 * Standalone function for logging activity (use in callbacks or effects)
 */
export async function logWorkstreamActivity(
  params: LogActivityParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("workstream_activity").insert([{
      workstream_id: params.workstream_id,
      activity_type: params.activity_type,
      description: params.description,
      actor_id: user?.id || null,
      metadata: params.metadata ?? {},
    }]);

    if (error) {
      console.error("Failed to log activity:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Activity logging error:", message);
    return { success: false, error: message };
  }
}
