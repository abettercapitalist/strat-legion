/**
 * usePlayExecution Hook
 *
 * React hook for executing plays via the brick engine.
 * Provides easy integration with the workflow UI.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  executePlay,
  resumePlayExecution,
  hasActivePlay,
  getPendingPlayAction,
  type Workstream,
  type CurrentUser,
  type PlayExecutionOutcome,
} from '@/lib/bricks/services/playExecutor';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayExecutionState {
  isExecuting: boolean;
  lastOutcome: PlayExecutionOutcome | null;
  error: string | null;
}

export interface PlayExecutionActions {
  /** Execute a play for a workstream */
  executePlay: (
    workstream: Workstream,
    playId: string,
    user: CurrentUser | null,
    additionalConfig?: Record<string, unknown>
  ) => Promise<PlayExecutionOutcome>;

  /** Resume a paused play with user input */
  resumePlay: (
    workstream: Workstream,
    playId: string,
    user: CurrentUser | null,
    userInput: Record<string, unknown>
  ) => Promise<PlayExecutionOutcome>;

  /** Check if a workstream has an active play */
  checkActivePlay: (workstreamId: string) => Promise<boolean>;

  /** Get pending action for a workstream's play */
  getPendingAction: (workstreamId: string) => ReturnType<typeof getPendingPlayAction>;

  /** Clear any error state */
  clearError: () => void;
}

export type UsePlayExecutionReturn = PlayExecutionState & PlayExecutionActions;

// ============================================================================
// HOOK
// ============================================================================

export function usePlayExecution(): UsePlayExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<PlayExecutionOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Invalidates relevant queries after play execution.
   */
  const invalidateQueries = useCallback(
    (workstreamId: string) => {
      queryClient.invalidateQueries({ queryKey: ['workstream-steps', workstreamId] });
      queryClient.invalidateQueries({ queryKey: ['workstream-activity', workstreamId] });
      queryClient.invalidateQueries({ queryKey: ['workstream', workstreamId] });
      queryClient.invalidateQueries({ queryKey: ['node-execution-state', workstreamId] });
    },
    [queryClient]
  );

  /**
   * Execute a play for a workstream.
   */
  const executePlayAction = useCallback(
    async (
      workstream: Workstream,
      playId: string,
      user: CurrentUser | null,
      additionalConfig?: Record<string, unknown>
    ): Promise<PlayExecutionOutcome> => {
      setIsExecuting(true);
      setError(null);

      try {
        const outcome = await executePlay(workstream, playId, user, {
          additionalConfig,
          updateDatabase: true,
          debug: process.env.NODE_ENV === 'development',
        });

        setLastOutcome(outcome);

        if (outcome.success) {
          toast({
            title: 'Play completed',
            description: 'The play has been executed successfully.',
          });
          invalidateQueries(workstream.id);
        } else if (outcome.requiresUserAction) {
          toast({
            title: 'Action required',
            description: `This play requires ${outcome.pendingActionType || 'your input'}.`,
          });
          invalidateQueries(workstream.id);
        } else if (outcome.error) {
          setError(outcome.error);
          toast({
            title: 'Play execution failed',
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
   * Resume a paused play with user input.
   */
  const resumePlayAction = useCallback(
    async (
      workstream: Workstream,
      playId: string,
      user: CurrentUser | null,
      userInput: Record<string, unknown>
    ): Promise<PlayExecutionOutcome> => {
      setIsExecuting(true);
      setError(null);

      try {
        const outcome = await resumePlayExecution(workstream, playId, user, userInput, {
          updateDatabase: true,
          debug: process.env.NODE_ENV === 'development',
        });

        setLastOutcome(outcome);

        if (outcome.success) {
          toast({
            title: 'Play completed',
            description: 'The play has been completed with your input.',
          });
          invalidateQueries(workstream.id);
        } else if (outcome.requiresUserAction) {
          toast({
            title: 'Additional action required',
            description: `This play still requires ${outcome.pendingActionType || 'more input'}.`,
          });
          invalidateQueries(workstream.id);
        } else if (outcome.error) {
          setError(outcome.error);
          toast({
            title: 'Play execution failed',
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
   * Check if a workstream has an active play.
   */
  const checkActivePlay = useCallback(async (workstreamId: string): Promise<boolean> => {
    try {
      return await hasActivePlay(workstreamId);
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
    executePlay: executePlayAction,
    resumePlay: resumePlayAction,
    checkActivePlay,
    getPendingAction: getPendingPlayAction,
    clearError,
  };
}
