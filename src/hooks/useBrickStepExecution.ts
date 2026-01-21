/**
 * useBrickStepExecution Hook
 *
 * React hook for executing workstream steps via the brick engine.
 * Provides easy integration with the existing step completion UI.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  executeWorkstreamStep,
  resumeStepExecution,
  hasBrickDefinition,
  getPendingAction,
  type WorkstreamStep,
  type Workstream,
  type CurrentUser,
  type StepExecutionOutcome,
} from '@/lib/bricks/services/stepExecutor';

// ============================================================================
// TYPES
// ============================================================================

export interface BrickStepExecutionState {
  isExecuting: boolean;
  lastOutcome: StepExecutionOutcome | null;
  error: string | null;
}

export interface BrickStepExecutionActions {
  /** Execute a step using the brick engine */
  executeStep: (
    step: WorkstreamStep,
    workstream: Workstream,
    user: CurrentUser | null,
    additionalConfig?: Record<string, unknown>
  ) => Promise<StepExecutionOutcome>;

  /** Resume a paused step with user input */
  resumeStep: (
    step: WorkstreamStep,
    workstream: Workstream,
    user: CurrentUser | null,
    userInput: Record<string, unknown>
  ) => Promise<StepExecutionOutcome>;

  /** Check if a step type has brick support */
  checkBrickSupport: (stepType: string) => Promise<boolean>;

  /** Get pending action for a step */
  getPendingAction: (step: WorkstreamStep) => ReturnType<typeof getPendingAction>;

  /** Clear any error state */
  clearError: () => void;
}

export type UseBrickStepExecutionReturn = BrickStepExecutionState & BrickStepExecutionActions;

// ============================================================================
// HOOK
// ============================================================================

export function useBrickStepExecution(): UseBrickStepExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<StepExecutionOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Invalidates relevant queries after step execution.
   */
  const invalidateQueries = useCallback(
    (workstreamId: string) => {
      queryClient.invalidateQueries({ queryKey: ['workstream-steps', workstreamId] });
      queryClient.invalidateQueries({ queryKey: ['workstream-activity', workstreamId] });
      queryClient.invalidateQueries({ queryKey: ['workstream', workstreamId] });
    },
    [queryClient]
  );

  /**
   * Execute a step using the brick engine.
   */
  const executeStep = useCallback(
    async (
      step: WorkstreamStep,
      workstream: Workstream,
      user: CurrentUser | null,
      additionalConfig?: Record<string, unknown>
    ): Promise<StepExecutionOutcome> => {
      setIsExecuting(true);
      setError(null);

      try {
        const outcome = await executeWorkstreamStep(step, workstream, user, {
          additionalConfig,
          updateDatabase: true,
          debug: process.env.NODE_ENV === 'development',
        });

        setLastOutcome(outcome);

        if (outcome.success) {
          toast({
            title: 'Step completed',
            description: 'The step has been executed successfully.',
          });
          invalidateQueries(workstream.id);
        } else if (outcome.requiresUserAction) {
          // Step is paused waiting for user input
          toast({
            title: 'Action required',
            description: `This step requires ${outcome.pendingActionType || 'your input'}.`,
          });
          invalidateQueries(workstream.id);
        } else if (outcome.error) {
          setError(outcome.error);
          toast({
            title: 'Step execution failed',
            description: outcome.error,
            variant: 'destructive',
          });
        }

        return outcome;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setLastOutcome({
          success: false,
          status: 'failed',
          result: null,
          error: errorMessage,
        });
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return {
          success: false,
          status: 'failed',
          result: null,
          error: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [toast, invalidateQueries]
  );

  /**
   * Resume a paused step with user input.
   */
  const resumeStep = useCallback(
    async (
      step: WorkstreamStep,
      workstream: Workstream,
      user: CurrentUser | null,
      userInput: Record<string, unknown>
    ): Promise<StepExecutionOutcome> => {
      setIsExecuting(true);
      setError(null);

      try {
        const outcome = await resumeStepExecution(step, workstream, user, userInput, {
          updateDatabase: true,
          debug: process.env.NODE_ENV === 'development',
        });

        setLastOutcome(outcome);

        if (outcome.success) {
          toast({
            title: 'Step completed',
            description: 'The step has been completed with your input.',
          });
          invalidateQueries(workstream.id);
        } else if (outcome.requiresUserAction) {
          toast({
            title: 'Additional action required',
            description: `This step still requires ${outcome.pendingActionType || 'more input'}.`,
          });
          invalidateQueries(workstream.id);
        } else if (outcome.error) {
          setError(outcome.error);
          toast({
            title: 'Step execution failed',
            description: outcome.error,
            variant: 'destructive',
          });
        }

        return outcome;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return {
          success: false,
          status: 'failed',
          result: null,
          error: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [toast, invalidateQueries]
  );

  /**
   * Check if a step type has brick-based support.
   */
  const checkBrickSupport = useCallback(async (stepType: string): Promise<boolean> => {
    try {
      return await hasBrickDefinition(stepType);
    } catch {
      return false;
    }
  }, []);

  /**
   * Clear error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isExecuting,
    lastOutcome,
    error,
    executeStep,
    resumeStep,
    checkBrickSupport,
    getPendingAction,
    clearError,
  };
}
