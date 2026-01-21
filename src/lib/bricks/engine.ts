/**
 * Brick Execution Engine
 *
 * Core engine that orchestrates the execution of bricks within a step.
 * Handles input resolution, condition evaluation, and output mapping.
 */

import type {
  Brick,
  StepDefinition,
  StepDefinitionBrick,
  ExecutionContext,
  BrickExecutionResult,
  StepExecutionResult,
  BrickStatus,
  BrickExecutorResult,
  BrickInputConfig,
  InputSource,
  BrickOutputMapping,
  BrickExecutionCondition,
  EngineConfig,
  BrickRegistry,
} from './types';

import { DEFAULT_ENGINE_CONFIG } from './types';

// ============================================================================
// INPUT RESOLUTION
// ============================================================================

/**
 * Resolves an input value from its source based on the InputSource configuration.
 */
function resolveInputSource(
  source: InputSource,
  context: ExecutionContext
): unknown {
  switch (source.source) {
    case 'literal':
      return source.default;

    case 'step_config':
      if (!source.field) return source.default;
      return getNestedValue(context.step_config, source.field) ?? source.default;

    case 'previous_output':
      if (!source.field) return source.default;
      return getNestedValue(context.previous_outputs, source.field) ?? source.default;

    case 'workstream':
      if (!source.field) return source.default;
      return getNestedValue(context.workstream, source.field) ?? source.default;

    case 'context':
      if (!source.field) return source.default;
      // Allow access to user, execution metadata
      if (source.field.startsWith('user.')) {
        return getNestedValue(context.user, source.field.slice(5)) ?? source.default;
      }
      if (source.field.startsWith('execution.')) {
        return getNestedValue(context.execution, source.field.slice(10)) ?? source.default;
      }
      return source.default;

    case 'template':
      if (!source.template) return source.default;
      return interpolateTemplate(source.template, context);

    default:
      return source.default;
  }
}

/**
 * Gets a nested value from an object using dot notation.
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Interpolates a template string with values from the execution context.
 * Supports {{step_config.field}}, {{workstream.field}}, {{previous_output.field}} syntax.
 */
function interpolateTemplate(template: string, context: ExecutionContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const trimmedPath = path.trim();
    let value: unknown;

    if (trimmedPath.startsWith('step_config.')) {
      value = getNestedValue(context.step_config, trimmedPath.slice(12));
    } else if (trimmedPath.startsWith('workstream.')) {
      value = getNestedValue(context.workstream, trimmedPath.slice(11));
    } else if (trimmedPath.startsWith('previous_output.')) {
      value = getNestedValue(context.previous_outputs, trimmedPath.slice(16));
    } else if (trimmedPath.startsWith('user.')) {
      value = getNestedValue(context.user, trimmedPath.slice(5));
    } else {
      value = getNestedValue(context, trimmedPath);
    }

    return value !== undefined ? String(value) : '';
  });
}

/**
 * Applies a transform to a value (e.g., days_from_now).
 */
function applyTransform(value: unknown, transform: string): unknown {
  switch (transform) {
    case 'days_from_now':
      const days = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(days)) return null;
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString();

    case 'to_uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;

    case 'to_lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;

    case 'to_number':
      return typeof value === 'number' ? value : parseFloat(String(value));

    case 'to_boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return Boolean(value);

    case 'to_array':
      if (Array.isArray(value)) return value;
      return value ? [value] : [];

    case 'json_parse':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;

    case 'json_stringify':
      return JSON.stringify(value);

    default:
      return value;
  }
}

/**
 * Applies a mapping to a value (for enum-like transforms).
 */
function applyMapping(
  value: unknown,
  mapping: Record<string, unknown>
): unknown {
  const key = String(value);
  return key in mapping ? mapping[key] : value;
}

/**
 * Resolves all inputs for a brick based on its input configuration.
 */
export function resolveInputs(
  inputConfig: BrickInputConfig,
  context: ExecutionContext
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [fieldName, config] of Object.entries(inputConfig)) {
    if (isInputSource(config)) {
      let value = resolveInputSource(config, context);

      // Apply mapping if specified
      if (config.mapping && value !== undefined) {
        value = applyMapping(value, config.mapping);
      }

      // Apply transform if specified
      if (config.transform && value !== undefined) {
        value = applyTransform(value, config.transform);
      }

      resolved[fieldName] = value;
    } else {
      // Literal value
      resolved[fieldName] = config;
    }
  }

  return resolved;
}

/**
 * Type guard to check if a value is an InputSource configuration.
 */
function isInputSource(value: unknown): value is InputSource {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    'source' in obj &&
    typeof obj.source === 'string' &&
    ['step_config', 'previous_output', 'workstream', 'context', 'template', 'literal'].includes(
      obj.source
    )
  );
}

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

/**
 * Evaluates whether a brick should execute based on its execution condition.
 */
export function evaluateCondition(
  condition: BrickExecutionCondition | null,
  context: ExecutionContext
): boolean {
  if (!condition || !condition.when) return true;

  const expression = condition.when;

  // Simple expression parser for common patterns
  // Supports: field IS NULL, field IS NOT NULL, field = value, field != value

  // IS NOT NULL check
  const isNotNullMatch = expression.match(/^(.+?)\s+IS\s+NOT\s+NULL$/i);
  if (isNotNullMatch) {
    const path = isNotNullMatch[1].trim();
    const value = resolvePathValue(path, context);
    return value !== null && value !== undefined;
  }

  // IS NULL check
  const isNullMatch = expression.match(/^(.+?)\s+IS\s+NULL$/i);
  if (isNullMatch) {
    const path = isNullMatch[1].trim();
    const value = resolvePathValue(path, context);
    return value === null || value === undefined;
  }

  // Equality check
  const equalMatch = expression.match(/^(.+?)\s*=\s*(.+)$/);
  if (equalMatch) {
    const path = equalMatch[1].trim();
    let compareValue: unknown = equalMatch[2].trim();

    // Parse the compare value
    if (compareValue === 'true') compareValue = true;
    else if (compareValue === 'false') compareValue = false;
    else if (compareValue === 'null') compareValue = null;
    else if (/^-?\d+(\.\d+)?$/.test(String(compareValue))) {
      compareValue = parseFloat(String(compareValue));
    } else if (
      (String(compareValue).startsWith('"') && String(compareValue).endsWith('"')) ||
      (String(compareValue).startsWith("'") && String(compareValue).endsWith("'"))
    ) {
      compareValue = String(compareValue).slice(1, -1);
    }

    const value = resolvePathValue(path, context);
    return value === compareValue;
  }

  // Inequality check
  const notEqualMatch = expression.match(/^(.+?)\s*!=\s*(.+)$/);
  if (notEqualMatch) {
    const path = notEqualMatch[1].trim();
    let compareValue: unknown = notEqualMatch[2].trim();

    if (compareValue === 'true') compareValue = true;
    else if (compareValue === 'false') compareValue = false;
    else if (compareValue === 'null') compareValue = null;
    else if (/^-?\d+(\.\d+)?$/.test(String(compareValue))) {
      compareValue = parseFloat(String(compareValue));
    }

    const value = resolvePathValue(path, context);
    return value !== compareValue;
  }

  // OR condition
  if (expression.includes(' OR ')) {
    const parts = expression.split(' OR ');
    return parts.some((part) =>
      evaluateCondition({ when: part.trim() }, context)
    );
  }

  // AND condition
  if (expression.includes(' AND ')) {
    const parts = expression.split(' AND ');
    return parts.every((part) =>
      evaluateCondition({ when: part.trim() }, context)
    );
  }

  // Default to true if we can't parse the expression
  console.warn(`[BrickEngine] Could not parse condition: ${expression}`);
  return true;
}

/**
 * Resolves a path value from the context for condition evaluation.
 */
function resolvePathValue(path: string, context: ExecutionContext): unknown {
  if (path.startsWith('step_config.')) {
    return getNestedValue(context.step_config, path.slice(12));
  }
  if (path.startsWith('previous_output.')) {
    return getNestedValue(context.previous_outputs, path.slice(16));
  }
  if (path.startsWith('workstream.')) {
    return getNestedValue(context.workstream, path.slice(11));
  }
  if (path.startsWith('user.')) {
    return getNestedValue(context.user, path.slice(5));
  }
  return getNestedValue(context, path);
}

// ============================================================================
// OUTPUT MAPPING
// ============================================================================

/**
 * Maps brick outputs to the accumulated previous_outputs based on output mapping.
 */
export function mapOutputs(
  outputs: Record<string, unknown>,
  outputMapping: BrickOutputMapping
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const [outputField, targetField] of Object.entries(outputMapping)) {
    if (outputField in outputs) {
      mapped[targetField] = outputs[outputField];
    }
  }

  return mapped;
}

// ============================================================================
// BRICK EXECUTION ENGINE
// ============================================================================

export class BrickEngine {
  private registry: BrickRegistry;
  private config: EngineConfig;

  constructor(registry: BrickRegistry, config: Partial<EngineConfig> = {}) {
    this.registry = registry;
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
  }

  /**
   * Executes a single brick with the given inputs and context.
   */
  async executeBrick(
    brick: Brick,
    stepBrick: StepDefinitionBrick,
    context: ExecutionContext
  ): Promise<BrickExecutionResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    // Check execution condition
    if (!evaluateCondition(stepBrick.execution_condition, context)) {
      return {
        brick_id: brick.id,
        brick_name: brick.name,
        status: 'skipped',
        outputs: {},
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }

    // Get the executor for this brick
    const executor = this.registry[brick.name];
    if (!executor) {
      return {
        brick_id: brick.id,
        brick_name: brick.name,
        status: 'failed',
        outputs: {},
        error: `No executor registered for brick: ${brick.name}`,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }

    // Resolve inputs
    const inputs = resolveInputs(stepBrick.input_config, context);

    if (this.config.debug) {
      console.log(`[BrickEngine] Executing brick: ${brick.name}`);
      console.log(`[BrickEngine] Inputs:`, inputs);
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(
        executor(inputs, context),
        this.config.brickTimeoutMs
      );

      const completedAt = new Date().toISOString();

      return {
        brick_id: brick.id,
        brick_name: brick.name,
        status: result.status,
        outputs: result.outputs,
        error: result.error,
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      const completedAt = new Date().toISOString();
      return {
        brick_id: brick.id,
        brick_name: brick.name,
        status: 'failed',
        outputs: {},
        error: error instanceof Error ? error.message : String(error),
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Executes a promise with a timeout.
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Brick execution timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Executes all bricks in a step definition sequentially.
   */
  async executeStep(
    stepDefinition: StepDefinition,
    stepBricks: StepDefinitionBrick[],
    bricks: Map<string, Brick>,
    initialContext: ExecutionContext
  ): Promise<StepExecutionResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    // Sort bricks by position
    const sortedBricks = [...stepBricks].sort((a, b) => a.position - b.position);

    const brickResults: BrickExecutionResult[] = [];
    const context: ExecutionContext = {
      ...initialContext,
      previous_outputs: { ...initialContext.previous_outputs },
    };

    let finalStatus: BrickStatus = 'completed';
    let stepError: string | undefined;

    for (let i = 0; i < sortedBricks.length; i++) {
      const stepBrick = sortedBricks[i];
      const brick = bricks.get(stepBrick.brick_id);

      if (!brick) {
        const result: BrickExecutionResult = {
          brick_id: stepBrick.brick_id,
          brick_name: 'unknown',
          status: 'failed',
          outputs: {},
          error: `Brick not found: ${stepBrick.brick_id}`,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 0,
        };
        brickResults.push(result);

        if (!this.config.continueOnError) {
          finalStatus = 'failed';
          stepError = result.error;
          break;
        }
        continue;
      }

      // Update context with current brick index
      context.execution = {
        ...context.execution,
        brick_index: i,
      };

      const result = await this.executeBrick(brick, stepBrick, context);
      brickResults.push(result);

      // Handle different statuses
      if (result.status === 'failed') {
        if (!this.config.continueOnError) {
          finalStatus = 'failed';
          stepError = result.error;
          break;
        }
      } else if (
        result.status === 'waiting_for_input' ||
        result.status === 'waiting_for_event'
      ) {
        // Step is paused, waiting for external action
        finalStatus = result.status;
        break;
      } else if (result.status === 'completed') {
        // Map outputs to previous_outputs for next brick
        const mappedOutputs = mapOutputs(result.outputs, stepBrick.output_mapping);
        context.previous_outputs = {
          ...context.previous_outputs,
          ...mappedOutputs,
        };
      }
    }

    const completedAt = new Date().toISOString();

    // Check if step requires user action
    const lastResult = brickResults[brickResults.length - 1];
    const requiresUserAction =
      lastResult?.status === 'waiting_for_input' ||
      lastResult?.status === 'waiting_for_event';

    return {
      step_definition_id: stepDefinition.id,
      status: finalStatus,
      brick_results: brickResults,
      final_outputs: context.previous_outputs,
      error: stepError,
      started_at: startedAt,
      completed_at: completedAt,
      requires_user_action: requiresUserAction,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates a new BrickEngine instance with the given registry and configuration.
 */
export function createBrickEngine(
  registry: BrickRegistry,
  config?: Partial<EngineConfig>
): BrickEngine {
  return new BrickEngine(registry, config);
}
