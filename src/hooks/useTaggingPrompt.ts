import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TaggingPromptContext, TaggingResponse } from "@/components/approvals/TaggingPromptBanner";

const ACTION_TRACKING_KEY = "tagging_prompt_actions";
const PROMPT_SHOWN_KEY = "tagging_prompt_shown_count";
const MAX_ACTIONS_PER_DAY = 5;
const ACTIONS_BETWEEN_PROMPTS = 5;

interface ActionRecord {
  timestamp: number;
  type: string;
}

interface PromptDecisionResult {
  shouldPrompt: boolean;
  context?: TaggingPromptContext;
}

interface UseTaggingPromptReturn {
  promptContext: TaggingPromptContext | null;
  isChecking: boolean;
  isSubmitting: boolean;
  promptAcceptanceRate: number | null;
  checkIfShouldPrompt: (
    decisionId: string,
    dealName: string,
    decisionType: "approved" | "rejected" | "request_changes"
  ) => Promise<void>;
  submitResponse: (response: TaggingResponse) => Promise<boolean>;
  skipPrompt: () => void;
  clearPrompt: () => void;
}

export function useTaggingPrompt(): UseTaggingPromptReturn {
  const [promptContext, setPromptContext] = useState<TaggingPromptContext | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promptAcceptanceRate, setPromptAcceptanceRate] = useState<number | null>(null);
  const actionCountRef = useRef(0);

  // Track user actions to avoid prompting busy users
  const recordAction = useCallback(() => {
    try {
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      
      const stored = localStorage.getItem(ACTION_TRACKING_KEY);
      const actions: ActionRecord[] = stored ? JSON.parse(stored) : [];
      
      // Filter to last 24 hours and add new action
      const recentActions = actions.filter((a) => a.timestamp > dayAgo);
      recentActions.push({ timestamp: now, type: "approval" });
      
      localStorage.setItem(ACTION_TRACKING_KEY, JSON.stringify(recentActions));
      actionCountRef.current = recentActions.length;
      
      return recentActions.length;
    } catch {
      return 0;
    }
  }, []);

  // Get count of recent actions
  const getRecentActionCount = useCallback((): number => {
    try {
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      
      const stored = localStorage.getItem(ACTION_TRACKING_KEY);
      const actions: ActionRecord[] = stored ? JSON.parse(stored) : [];
      
      return actions.filter((a) => a.timestamp > dayAgo).length;
    } catch {
      return 0;
    }
  }, []);

  // Get prompts shown since last submission
  const getPromptsShownCount = useCallback((): number => {
    try {
      const stored = localStorage.getItem(PROMPT_SHOWN_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }, []);

  // Increment prompts shown counter
  const incrementPromptsShown = useCallback(() => {
    try {
      const current = getPromptsShownCount();
      localStorage.setItem(PROMPT_SHOWN_KEY, String(current + 1));
    } catch {
      // Ignore storage errors
    }
  }, [getPromptsShownCount]);

  // Reset prompts shown counter
  const resetPromptsShown = useCallback(() => {
    try {
      localStorage.setItem(PROMPT_SHOWN_KEY, "0");
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Check if we should show prompt based on local rules
  const shouldShowPromptLocally = useCallback((): boolean => {
    const recentActions = getRecentActionCount();
    const promptsShown = getPromptsShownCount();

    // Never if user is busy (>5 actions in last day)
    if (recentActions > MAX_ACTIONS_PER_DAY) {
      console.log("Skipping prompt: user too busy", { recentActions });
      return false;
    }

    // Max once per 5 actions
    if (promptsShown > 0 && actionCountRef.current % ACTIONS_BETWEEN_PROMPTS !== 0) {
      console.log("Skipping prompt: too recent", { promptsShown, actionCount: actionCountRef.current });
      return false;
    }

    return true;
  }, [getRecentActionCount, getPromptsShownCount]);

  // Main function to check if prompt should be shown
  const checkIfShouldPrompt = useCallback(
    async (
      decisionId: string,
      dealName: string,
      decisionType: "approved" | "rejected" | "request_changes"
    ) => {
      // Record this action
      recordAction();

      // Check local rules first
      if (!shouldShowPromptLocally()) {
        return;
      }

      setIsChecking(true);

      try {
        // Call edge function to check server-side rules
        const { data, error } = await supabase.functions.invoke("check-tagging-prompt", {
          body: { decision_id: decisionId },
        });

        if (error) {
          console.error("Error checking tagging prompt:", error);
          return;
        }

        const result = data as PromptDecisionResult;

        if (result.shouldPrompt && result.context) {
          setPromptContext({
            ...result.context,
            decision_id: decisionId,
            deal_name: dealName,
            decision_type: decisionType,
          });
          incrementPromptsShown();
        }
      } catch (err) {
        console.error("Failed to check tagging prompt:", err);
      } finally {
        setIsChecking(false);
      }
    },
    [recordAction, shouldShowPromptLocally, incrementPromptsShown]
  );

  // Submit user response
  const submitResponse = useCallback(
    async (response: TaggingResponse): Promise<boolean> => {
      setIsSubmitting(true);

      try {
        const { data, error } = await supabase.functions.invoke("submit-manual-tags", {
          body: response,
        });

        if (error) {
          console.error("Error submitting tags:", error);
          return false;
        }

        // Reset prompts shown counter on successful submission
        resetPromptsShown();
        setPromptContext(null);

        // Update acceptance rate if returned
        if (data?.acceptance_rate !== undefined) {
          setPromptAcceptanceRate(data.acceptance_rate);
        }

        return true;
      } catch (err) {
        console.error("Failed to submit tags:", err);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [resetPromptsShown]
  );

  // Skip prompt
  const skipPrompt = useCallback(() => {
    setPromptContext(null);
    // Track skip for acceptance rate (will be handled server-side)
    supabase.functions.invoke("submit-manual-tags", {
      body: {
        decision_id: promptContext?.decision_id,
        skipped: true,
      },
    }).catch(console.error);
  }, [promptContext]);

  // Clear prompt without tracking
  const clearPrompt = useCallback(() => {
    setPromptContext(null);
  }, []);

  // Load acceptance rate on mount
  useEffect(() => {
    const loadAcceptanceRate = async () => {
      try {
        const { data } = await supabase.functions.invoke("check-tagging-prompt", {
          body: { get_acceptance_rate: true },
        });
        if (data?.acceptance_rate !== undefined) {
          setPromptAcceptanceRate(data.acceptance_rate);
        }
      } catch {
        // Ignore errors loading acceptance rate
      }
    };
    loadAcceptanceRate();
  }, []);

  return {
    promptContext,
    isChecking,
    isSubmitting,
    promptAcceptanceRate,
    checkIfShouldPrompt,
    submitResponse,
    skipPrompt,
    clearPrompt,
  };
}
