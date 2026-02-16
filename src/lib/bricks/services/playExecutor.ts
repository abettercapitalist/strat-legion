/**
 * Play Executor Service
 *
 * Integrates the brick engine with the workstreams table for play-based execution.
 * Handles DAG-based execution of plays using workflow nodes and edges.
 */

import { supabase } from '@/integrations/supabase/client';
import { createBrickEngine } from '../engine';
import { getBrickRegistry } from '../registry';
import type {
  ExecutionContext,
  WorkstreamContext,
  PlayExecutionResult,
  BrickStatus,
  PlaybookPlay,
  DAG,
} from '../types';
import {
  loadPlayById,
  loadPatternById,
  loadPlaybookById,
  buildPlayDAG,
  loadNodeExecutionStates,
  saveNodeExecutionState,
} from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Workstream {
  id: string;
  name: string;
  workstream_type_id: string | null;
  owner_id: string | null;
  counterparty_id: string | null;
  annual_value: number | null;
  tier: string | null;
  stage: string | null;
  play_id: string | null;
  playbook_id: string | null;
  current_node_ids: string[];
  [key: string]: unknown;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: string | null;
}

export interface PlayExecutionOptions {
  additionalConfig?: Record<string, unknown>;
  updateDatabase?: boolean;
  debug?: boolean;
}

export interface PlayExecutionOutcome {
  success: boolean;
  status: BrickStatus;
  result: PlayExecutionResult | null;
  error?: string;
  requiresUserAction?: boolean;
  pendingActionType?: string;
  currentNodeIds?: string[];
}

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

/**
 * Builds the execution context for a play.
 */
function buildExecutionContext(
  workstream: Workstream,
  play: PlaybookPlay,
  pattern: { id: string },
  user: CurrentUser | null,
  nodeId: string,
  config: Record<string, unknown>
): ExecutionContext {
  const workstreamContext: WorkstreamContext = {
    id: workstream.id,
    name: workstream.name,
    workstream_type_id: workstream.workstream_type_id,
    owner_id: workstream.owner_id,
    counterparty_id: workstream.counterparty_id,
    annual_value: workstream.annual_value,
    tier: workstream.tier,
    stage: workstream.stage,
    play_id: workstream.play_id,
    playbook_id: workstream.playbook_id,
    current_node_ids: workstream.current_node_ids || [],
  };

  // Copy additional workstream fields
  for (const [key, value] of Object.entries(workstream)) {
    if (!(key in workstreamContext)) {
      workstreamContext[key] = value;
    }
  }

  return {
    workstream: workstreamContext,
    play_config: config,
    previous_outputs: {},
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      : null,
    execution: {
      play_id: play.id,
      pattern_id: pattern.id,
      playbook_id: workstream.playbook_id,
      node_id: nodeId,
      started_at: new Date().toISOString(),
    },
  };
}

// ============================================================================
// PLAY EXECUTION
// ============================================================================

/**
 * Executes a play for a workstream using the brick engine with DAG traversal.
 *
 * This function:
 * 1. Loads the play and builds its DAG
 * 2. Determines which nodes are ready to execute
 * 3. Executes ready nodes (potentially in parallel)
 * 4. Tracks execution state in node_execution_state table
 * 5. Updates workstream's current_node_ids
 */
export async function executePlay(
  workstream: Workstream,
  playId: string,
  user: CurrentUser | null,
  options: PlayExecutionOptions = {}
): Promise<PlayExecutionOutcome> {
  const { additionalConfig, updateDatabase = true, debug = false } = options;

  try {
    // Load play
    const play = await loadPlayById(playId);
    if (!play) {
      return {
        success: false,
        status: 'failed',
        result: null,
        error: `Play not found: ${playId}`,
      };
    }

    // Load pattern for context (optional — plays created via workflow designer have no pattern)
    const pattern = play.pattern_id
      ? await loadPatternById(play.pattern_id)
      : null;
    const patternContext = pattern || { id: 'none' };

    // Build DAG
    const dag = await buildPlayDAG(play);

    if (!dag.startNode) {
      return {
        success: false,
        status: 'failed',
        result: null,
        error: 'Play has no start node',
      };
    }

    // Load existing execution states
    const existingStates = await loadNodeExecutionStates(workstream.id, playId);
    const stateMap = new Map(existingStates.map(s => [s.node_id, s]));

    // Build config from play config and additional config
    const config = {
      ...play.config,
      ...additionalConfig,
    };

    // Create engine
    const registry = getBrickRegistry();
    const engine = createBrickEngine(registry, { debug });

    // Execute the play using the engine's DAG execution
    const initialContext = buildExecutionContext(
      workstream,
      play,
      patternContext,
      user,
      dag.startNode.id,
      config
    );

    const result = await engine.executePlay(dag, initialContext, stateMap);

    if (debug) {
      console.log('[PlayExecutor] Execution result:', {
        status: result.status,
        nodeResults: result.node_results.length,
        requiresUserAction: result.requires_user_action,
      });
    }

    // Update database if requested
    if (updateDatabase) {
      // Save node execution states
      for (const nodeResult of result.node_results) {
        const isWaiting = nodeResult.status === 'waiting_for_input' || nodeResult.status === 'waiting_for_event';

        // Build metadata — persist pending_action details for page-reload resilience
        const metadata: Record<string, unknown> = {};
        if (isWaiting && result.pending_action && result.pending_action.node_id === nodeResult.node_id) {
          metadata.pending_action_type = result.pending_action.type;
          metadata.brick_id = result.pending_action.brick_id;
          metadata.description = result.pending_action.description;
          metadata.config = result.pending_action.config;
        }

        await saveNodeExecutionState({
          workstream_id: workstream.id,
          play_id: playId,
          node_id: nodeResult.node_id,
          status: isWaiting
            ? 'waiting'
            : nodeResult.status === 'completed'
            ? 'completed'
            : nodeResult.status === 'failed'
            ? 'failed'
            : nodeResult.status === 'skipped'
            ? 'skipped'
            : 'pending',
          inputs: {},
          outputs: nodeResult.outputs,
          error: nodeResult.error || null,
          started_at: nodeResult.started_at,
          completed_at: nodeResult.completed_at || null,
          executed_by: user?.id || null,
          retry_count: 0,
          metadata,
        });
      }

      // Update workstream's current node IDs
      if (result.current_node_ids) {
        await updateWorkstreamCurrentNodes(workstream.id, result.current_node_ids);
      }

      // Log activity if completed
      if (result.status === 'completed') {
        await logPlayActivity(workstream.id, playId, result, user);
      }
    }

    return {
      success: result.status === 'completed',
      status: result.status,
      result,
      requiresUserAction: result.requires_user_action,
      pendingActionType: result.pending_action?.type,
      currentNodeIds: result.current_node_ids,
    };
  } catch (error) {
    console.error('[PlayExecutor] Error executing play:', error);
    return {
      success: false,
      status: 'failed',
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Resumes a paused play execution with user-provided input.
 */
export async function resumePlayExecution(
  workstream: Workstream,
  playId: string,
  user: CurrentUser | null,
  userInput: Record<string, unknown>,
  options: PlayExecutionOptions = {}
): Promise<PlayExecutionOutcome> {
  // Merge user input with additional config and re-execute
  return executePlay(workstream, playId, user, {
    ...options,
    additionalConfig: {
      ...options.additionalConfig,
      ...userInput,
      user_input: userInput,
    },
  });
}

// ============================================================================
// DATABASE UPDATES
// ============================================================================

/**
 * Updates the workstream's current node IDs.
 */
async function updateWorkstreamCurrentNodes(
  workstreamId: string,
  currentNodeIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from('workstreams')
    .update({
      current_node_ids: currentNodeIds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workstreamId);

  if (error) {
    console.error('[PlayExecutor] Error updating workstream current nodes:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Logs play completion activity.
 */
async function logPlayActivity(
  workstreamId: string,
  playId: string,
  result: PlayExecutionResult,
  user: CurrentUser | null
): Promise<void> {
  const { error } = await supabase.from('workstream_activity').insert({
    workstream_id: workstreamId,
    activity_type: 'play_completed',
    description: 'Completed play via brick engine',
    actor_id: user?.id || null,
    metadata: {
      play_id: playId,
      execution_status: result.status,
      node_count: result.node_results.length,
    },
  });

  if (error) {
    console.error('[PlayExecutor] Error logging activity:', error);
    // Don't throw - activity logging is not critical
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a workstream has an active play.
 */
export async function hasActivePlay(workstreamId: string): Promise<boolean> {
  const { data } = await supabase
    .from('workstreams')
    .select('play_id')
    .eq('id', workstreamId)
    .single();

  return !!data?.play_id;
}

/**
 * Gets the pending action for a workstream's current play (if any).
 */
export async function getPendingPlayAction(
  workstreamId: string
): Promise<{
  type: string;
  brick_id: string;
  node_id: string;
  description: string;
  config: Record<string, unknown>;
} | null> {
  // Get workstream with play info
  const { data: workstream } = await supabase
    .from('workstreams')
    .select('play_id, current_node_ids')
    .eq('id', workstreamId)
    .single();

  if (!workstream?.play_id) return null;

  // Get execution states for current nodes
  const currentNodeIds = (workstream.current_node_ids as string[]) || [];
  if (currentNodeIds.length === 0) return null;

  const { data: states } = await supabase
    .from('node_execution_state')
    .select('*')
    .eq('workstream_id', workstreamId)
    .eq('play_id', workstream.play_id)
    .in('node_id', currentNodeIds)
    .eq('status', 'waiting');

  if (!states || states.length === 0) return null;

  // Return the first pending action
  const state = states[0];
  const metadata = (state.metadata as Record<string, unknown>) || {};

  return {
    type: (metadata.pending_action_type as string) || 'input',
    brick_id: (metadata.brick_id as string) || '',
    node_id: state.node_id,
    description: (metadata.description as string) || 'Action required',
    config: (metadata.config as Record<string, unknown>) || {},
  };
}

/**
 * Assigns a play to a workstream.
 */
export async function assignPlayToWorkstream(
  workstreamId: string,
  playId: string,
  playbookId?: string
): Promise<void> {
  const { error } = await supabase
    .from('workstreams')
    .update({
      play_id: playId,
      playbook_id: playbookId || null,
      current_node_ids: [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', workstreamId);

  if (error) {
    console.error('[PlayExecutor] Error assigning play to workstream:', error);
    throw new Error(`Failed to assign play: ${error.message}`);
  }
}
