import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProcessApprovalDecisionParams {
  approval_id: string;
  decision: "approved" | "rejected" | "request_changes";
  reasoning?: string;
  decision_factors?: Record<string, unknown>;
}

export interface ProcessApprovalDecisionResult {
  success: boolean;
  decision?: {
    id: string;
    decision: string;
    reasoning: string | null;
    created_at: string;
  };
  auto_tags?: string[];
  message?: string;
  error?: string;
}

export function useApprovalDecision() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processDecision = async (
    params: ProcessApprovalDecisionParams
  ): Promise<ProcessApprovalDecisionResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "process-approval-decision",
        {
          body: params,
        }
      );

      if (fnError) {
        const errorMessage = fnError.message || "Failed to process decision";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return data as ProcessApprovalDecisionResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDecision,
    isProcessing,
    error,
  };
}
