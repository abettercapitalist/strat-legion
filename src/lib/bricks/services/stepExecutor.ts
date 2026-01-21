/**
 * Step Executor Service
 *
 * Integrates the brick engine with the workstream_steps table.
 * Handles execution of both legacy step types and new brick-based steps.
 */

import { supabase } from '@/integrations/supabase/client';
import { createBrickEngine } from '../engine';
import { getBrickRegistry } from '../registry';
import type {
  ExecutionContext,
  WorkstreamContext,
  StepExecutionResult,
  BrickStatus,
} from '../types';
import {
  loadStepDefinitionWithBricks,
  loadLegacyStepWithBricks,
  normalizeLegacyStepType,
} from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkstreamStep {
  id: string;
  workstream_id: string;
  step_id: string;
  position: number;
  step_type: string;
  requirement_type: string;
  required_before: string | null;
  trigger_timing: string | null;
  status: string;
  config: Record<string, unknown> | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  // New field for brick-based steps
  step_definition_id?: string | null;
}

export interface Workstream {
  id: string;
  name: string;
  workstream_type_id: string | null;
  owner_id: string | null;
  counterparty_id: string | null;
  annual_value: number | null;
  tier: string | null;
  stage: string | null;
  [key: string]: unknown;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: string | null;
}

export interface StepExecutionOptions {
  /** Additional data to merge into step config */
  additionalConfig?: Record<string, unknown>;
  /** Whether to update the step status in the database */
  updateDatabase?: boolean;
  /** Debug mode - logs execution details */
  debug?: boolean;
}

export interface StepExecutionOutcome {
  success: boolean;
  status: BrickStatus;
  result: StepExecutionResult | null;
  error?: string;
  requiresUserAction?: boolean;
  pendingActionType?: string;
}

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

/**
 * Builds the execution context for a step.
 */
function buildExecutionContext(
  workstream: Workstream,
  step: WorkstreamStep,
  user: CurrentUser | null,
  stepDefinitionId: string
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
  };

  // Copy additional workstream fields
  for (const [key, value] of Object.entries(workstream)) {
    if (!(key in workstreamContext)) {
      workstreamContext[key] = value;
    }
  }

  return {
    workstream: workstreamContext,
    step_config: step.config || {},
    previous_outputs: {},
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      : null,
    execution: {
      step_id: step.id,
      step_definition_id: stepDefinitionId,
      started_at: new Date().toISOString(),
      brick_index: 0,
    },
  };
}

// ============================================================================
// STEP EXECUTION
// ============================================================================

/**
 * Executes a workstream step using the brick engine.
 *
 * This function:
 * 1. Loads the step definition (by ID or legacy step type)
 * 2. Loads the associated bricks
 * 3. Builds the execution context
 * 4. Runs the brick engine
 * 5. Optionally updates the step status in the database
 */
export async function executeWorkstreamStep(
  step: WorkstreamStep,
  workstream: Workstream,
  user: CurrentUser | null,
  options: StepExecutionOptions = {}
): Promise<StepExecutionOutcome> {
  const { additionalConfig, updateDatabase = true, debug = false } = options;

  try {
    // Merge additional config if provided
    const stepWithConfig: WorkstreamStep = additionalConfig
      ? { ...step, config: { ...step.config, ...additionalConfig } }
      : step;

    // Load step definition and bricks
    let loadResult;

    if (stepWithConfig.step_definition_id) {
      // New brick-based step
      loadResult = await loadStepDefinitionWithBricks(stepWithConfig.step_definition_id);
    } else {
      // Legacy step - look up by step_type
      const normalizedType = normalizeLegacyStepType(stepWithConfig.step_type);
      loadResult = await loadLegacyStepWithBricks(normalizedType);
    }

    if (!loadResult) {
      // No brick definition found - this is a legacy step without mapping
      // Return a "not supported" outcome so caller can use legacy handling
      return {
        success: false,
        status: 'failed',
        result: null,
        error: `No brick definition found for step type: ${stepWithConfig.step_type}`,
      };
    }

    const { stepDefinition, stepBricks, bricks } = loadResult;

    if (debug) {
      console.log('[StepExecutor] Executing step:', {
        stepId: step.id,
        stepType: step.step_type,
        stepDefinition: stepDefinition.name,
        brickCount: stepBricks.length,
      });
    }

    // Build execution context
    const context = buildExecutionContext(
      workstream,
      stepWithConfig,
      user,
      stepDefinition.id
    );

    // Create and run the brick engine
    const registry = getBrickRegistry();
    const engine = createBrickEngine(registry, { debug });

    const result = await engine.executeStep(
      stepDefinition,
      stepBricks,
      bricks,
      context
    );

    if (debug) {
      console.log('[StepExecutor] Execution result:', {
        status: result.status,
        brickResults: result.brick_results.length,
        requiresUserAction: result.requires_user_action,
      });
    }

    // Update database if requested
    if (updateDatabase) {
      await updateStepStatus(step.id, result, user);
    }

    return {
      success: result.status === 'completed',
      status: result.status,
      result,
      requiresUserAction: result.requires_user_action,
      pendingActionType: result.pending_action?.type,
    };
  } catch (error) {
    console.error('[StepExecutor] Error executing step:', error);
    return {
      success: false,
      status: 'failed',
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// DATABASE UPDATES
// ============================================================================

/**
 * Updates the step status in the database based on execution result.
 */
async function updateStepStatus(
  stepId: string,
  result: StepExecutionResult,
  user: CurrentUser | null
): Promise<void> {
  const statusMapping: Record<BrickStatus, string> = {
    pending: 'pending',
    running: 'pending',
    completed: 'complete',
    failed: 'failed',
    skipped: 'skipped',
    waiting_for_input: 'pending',
    waiting_for_event: 'pending',
  };

  const newStatus = statusMapping[result.status] || 'pending';

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // If completed, set completion fields
  if (result.status === 'completed') {
    updateData.completed_at = result.completed_at || new Date().toISOString();
    updateData.completed_by = user?.id || null;
  }

  // Store execution results in config
  const { data: currentStep } = await supabase
    .from('workstream_steps')
    .select('config')
    .eq('id', stepId)
    .single();

  updateData.config = {
    ...(currentStep?.config as Record<string, unknown> || {}),
    brick_execution: {
      status: result.status,
      completed_at: result.completed_at,
      final_outputs: result.final_outputs,
      brick_results: result.brick_results.map((br) => ({
        brick_name: br.brick_name,
        status: br.status,
        duration_ms: br.duration_ms,
        error: br.error,
      })),
      pending_action: result.pending_action,
    },
  };

  const { error } = await supabase
    .from('workstream_steps')
    .update(updateData)
    .eq('id', stepId);

  if (error) {
    console.error('[StepExecutor] Error updating step status:', error);
    throw new Error(`Failed to update step status: ${error.message}`);
  }

  // Log activity if completed
  if (result.status === 'completed') {
    await logStepActivity(stepId, result, user);
  }
}

/**
 * Logs step completion activity.
 */
async function logStepActivity(
  stepId: string,
  result: StepExecutionResult,
  user: CurrentUser | null
): Promise<void> {
  // Get step details for activity log
  const { data: step } = await supabase
    .from('workstream_steps')
    .select('workstream_id, step_type, config')
    .eq('id', stepId)
    .single();

  if (!step) return;

  const { error } = await supabase.from('workstream_activity').insert({
    workstream_id: step.workstream_id,
    activity_type: 'step_completed',
    description: `Completed step via brick engine`,
    actor_id: user?.id || null,
    metadata: {
      step_id: stepId,
      step_type: step.step_type,
      execution_status: result.status,
      brick_count: result.brick_results.length,
    },
  });

  if (error) {
    console.error('[StepExecutor] Error logging activity:', error);
    // Don't throw - activity logging is not critical
  }
}

// ============================================================================
// RESUME EXECUTION
// ============================================================================

/**
 * Resumes a paused step execution with user-provided input.
 *
 * This is called when a step was waiting for user input/approval
 * and the user has now provided the required data.
 */
export async function resumeStepExecution(
  step: WorkstreamStep,
  workstream: Workstream,
  user: CurrentUser | null,
  userInput: Record<string, unknown>,
  options: StepExecutionOptions = {}
): Promise<StepExecutionOutcome> {
  // Get the previous execution state
  const previousExecution = (step.config as Record<string, unknown>)?.brick_execution as {
    final_outputs?: Record<string, unknown>;
    pending_action?: { brick_id: string; type: string };
  } | undefined;

  if (!previousExecution) {
    // No previous execution - just run from start
    return executeWorkstreamStep(step, workstream, user, {
      ...options,
      additionalConfig: userInput,
    });
  }

  // Merge user input with previous outputs
  const mergedConfig = {
    ...step.config,
    ...userInput,
    // Store user input under a known key
    user_input: userInput,
  };

  // Re-execute with the merged context
  // The brick conditions should detect that we have the required input
  // and skip the waiting brick
  return executeWorkstreamStep(
    { ...step, config: mergedConfig },
    workstream,
    user,
    options
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a step type has a brick-based definition.
 */
export async function hasBrickDefinition(stepType: string): Promise<boolean> {
  const normalizedType = normalizeLegacyStepType(stepType);
  const result = await loadLegacyStepWithBricks(normalizedType);
  return result !== null;
}

/**
 * Gets the pending action for a step (if any).
 */
export function getPendingAction(step: WorkstreamStep): {
  type: string;
  brick_id: string;
  description: string;
  config: Record<string, unknown>;
} | null {
  const execution = (step.config as Record<string, unknown>)?.brick_execution as {
    pending_action?: {
      type: string;
      brick_id: string;
      description: string;
      config: Record<string, unknown>;
    };
  } | undefined;

  return execution?.pending_action || null;
}
