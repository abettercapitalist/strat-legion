/**
 * Brick Engine - DAG-Based Workflow Execution
 *
 * The core execution engine that processes plays as directed acyclic graphs (DAGs).
 * Supports sequential, parallel, and conditional execution of bricks via workflow nodes.
 */

import type {
  BrickRegistry,
  ExecutionContext,
  BrickExecutorResult,
  BrickExecutionResult,
  PlayExecutionResult,
  BrickStatus,
  DAG,
  DAGNode,
  NodeExecutionState,
  EngineConfig,
  BrickInputConfig,
  InputSource,
  BrickOutputMapping,
  BrickExecutionCondition,
  WorkflowEdge,
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

    case 'play_config':
      if (!source.field) return source.default;
      return getNestedValue(context.play_config, source.field) ?? source.default;

    case 'previous_output':
      if (!source.field) return source.default;
      return getNestedValue(context.previous_outputs, source.field) ?? source.default;

    case 'workstream':
      if (!source.field) return source.default;
      return getNestedValue(context.workstream, source.field) ?? source.default;

    case 'context':
      if (!source.field) return source.default;
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
 */
function interpolateTemplate(template: string, context: ExecutionContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const trimmedPath = path.trim();
    let value: unknown;

    if (trimmedPath.startsWith('play_config.')) {
      value = getNestedValue(context.play_config, trimmedPath.slice(12));
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
 * Applies a transform to a value.
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
 * Applies a mapping to a value.
 */
function applyMapping(value: unknown, mapping: Record<string, unknown>): unknown {
  const key = String(value);
  return key in mapping ? mapping[key] : value;
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
    ['play_config', 'previous_output', 'workstream', 'context', 'template', 'literal'].includes(obj.source)
  );
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

      if (config.mapping && value !== undefined) {
        value = applyMapping(value, config.mapping);
      }

      if (config.transform && value !== undefined) {
        value = applyTransform(value, config.transform);
      }

      resolved[fieldName] = value;
    } else {
      resolved[fieldName] = config;
    }
  }

  return resolved;
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

  // OR condition
  if (expression.includes(' OR ')) {
    const parts = expression.split(' OR ');
    return parts.some((part) => evaluateCondition({ when: part.trim() }, context));
  }

  // AND condition
  if (expression.includes(' AND ')) {
    const parts = expression.split(' AND ');
    return parts.every((part) => evaluateCondition({ when: part.trim() }, context));
  }

  console.warn(`[BrickEngine] Could not parse condition: ${expression}`);
  return true;
}

/**
 * Resolves a path value from the context for condition evaluation.
 */
function resolvePathValue(path: string, context: ExecutionContext): unknown {
  if (path.startsWith('play_config.')) {
    return getNestedValue(context.play_config, path.slice(12));
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
// CONDITIONAL EDGE EVALUATION
// ============================================================================

/**
 * Checks whether an edge's condition is satisfied based on source node outputs.
 *
 * - `default` edges or edges with no condition always fire.
 * - `conditional` edges compare `condition.field` / `condition.value` against
 *   the source node's outputs.
 * - Also supports the `condition.when` format via `evaluateCondition()` for
 *   backward compatibility.
 */
function isEdgeSatisfied(
  edge: WorkflowEdge,
  nodeOutputs: Map<string, Record<string, unknown>>
): boolean {
  // Default edges or edges with no condition always fire
  if (edge.edge_type === 'default' || !edge.condition) return true;

  const condition = edge.condition;

  // Support `{ when: "..." }` format via evaluateCondition
  if (typeof condition.when === 'string') {
    const sourceOutputs = nodeOutputs.get(edge.source_node_id) || {};
    const pseudoContext: ExecutionContext = {
      workstream: { id: '', name: '', workstream_type_id: null, owner_id: null, counterparty_id: null, annual_value: null, tier: null, stage: null, play_id: null, playbook_id: null, current_node_ids: [] },
      play_config: {},
      previous_outputs: sourceOutputs,
      user: null,
      execution: { play_id: '', pattern_id: '', playbook_id: null, node_id: '', started_at: '' },
    };
    return evaluateCondition({ when: condition.when as string }, pseudoContext);
  }

  // Support `{ field, value }` format used by the workflow designer
  if (typeof condition.field === 'string' && 'value' in condition) {
    const sourceOutputs = nodeOutputs.get(edge.source_node_id) || {};
    const actualValue = sourceOutputs[condition.field as string];
    return actualValue === condition.value;
  }

  // Unknown condition format — default to allowing the edge
  return true;
}

// ============================================================================
// BRICK ENGINE INTERFACE
// ============================================================================

export interface BrickEngine {
  executePlay(
    dag: DAG,
    context: ExecutionContext,
    existingStates: Map<string, NodeExecutionState>
  ): Promise<PlayExecutionResult>;

  executeBrick(
    brickName: string,
    inputs: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<BrickExecutorResult>;

  getConfig(): EngineConfig;
}

// ============================================================================
// BRICK ENGINE IMPLEMENTATION
// ============================================================================

class BrickEngineImpl implements BrickEngine {
  private registry: BrickRegistry;
  private config: EngineConfig;

  constructor(registry: BrickRegistry, config: Partial<EngineConfig> = {}) {
    this.registry = registry;
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }

  async executeBrick(
    brickName: string,
    inputs: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<BrickExecutorResult> {
    const executor = this.registry[brickName];

    if (!executor) {
      return {
        status: 'failed',
        outputs: {},
        error: `No executor found for brick: ${brickName}`,
      };
    }

    try {
      const result = await Promise.race([
        executor(inputs, context),
        new Promise<BrickExecutorResult>((_, reject) =>
          setTimeout(() => reject(new Error(`Brick ${brickName} timed out`)), this.config.brickTimeoutMs)
        ),
      ]);

      return result;
    } catch (error) {
      return {
        status: 'failed',
        outputs: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executePlay(
    dag: DAG,
    context: ExecutionContext,
    existingStates: Map<string, NodeExecutionState>
  ): Promise<PlayExecutionResult> {
    const startTime = Date.now();
    const nodeResults: BrickExecutionResult[] = [];
    const outputs: Record<string, unknown> = {};
    let currentNodeIds: string[] = [];
    let pendingAction: PlayExecutionResult['pending_action'];
    let executionStatus: BrickStatus = 'running';

    if (this.config.debug) {
      console.log('[BrickEngine] Starting play execution:', dag.play.id);
    }

    if (!dag.startNode) {
      return {
        play_id: dag.play.id,
        status: 'completed',
        node_results: [],
        final_outputs: {},
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
      };
    }

    const executedNodes = new Set<string>();
    const nodeOutputs = new Map<string, Record<string, unknown>>();

    for (const [nodeId, state] of existingStates) {
      if (state.status === 'completed') {
        executedNodes.add(nodeId);
        nodeOutputs.set(nodeId, state.outputs);
      }
    }

    const findReadyNodes = (): DAGNode[] => {
      const ready: DAGNode[] = [];

      for (const dagNode of dag.nodes.values()) {
        if (executedNodes.has(dagNode.id)) continue;

        const allInputsSatisfied = dagNode.incomingEdges.every(edge => {
          const sourceNode = dag.nodes.get(edge.source_node_id);
          if (!sourceNode) return false;
          if (sourceNode.node.node_type === 'start') return true;
          if (!executedNodes.has(sourceNode.id)) return false;
          return isEdgeSatisfied(edge, nodeOutputs);
        });

        if (dagNode.node.node_type === 'start' && !executedNodes.has(dagNode.id)) {
          ready.push(dagNode);
        } else if (allInputsSatisfied && dagNode.node.node_type !== 'start') {
          ready.push(dagNode);
        }
      }

      return ready;
    };

    let iterations = 0;
    const maxIterations = dag.nodes.size * 2;

    while (iterations < maxIterations) {
      iterations++;

      if (Date.now() - startTime > this.config.totalTimeoutMs) {
        executionStatus = 'failed';
        break;
      }

      const readyNodes = findReadyNodes();

      if (this.config.debug) {
        console.log(`[BrickEngine] Iteration ${iterations}: ${readyNodes.length} ready nodes`);
      }

      if (readyNodes.length === 0) {
        const allEndNodesComplete = dag.endNodes.every(endNode => executedNodes.has(endNode.id));

        if (allEndNodesComplete || dag.endNodes.length === 0) {
          executionStatus = 'completed';
        } else {
          executionStatus = pendingAction ? 'waiting_for_input' : 'completed';
        }
        break;
      }

      const nodesToExecute = readyNodes.slice(0, this.config.maxParallelNodes);

      const results = await Promise.all(
        nodesToExecute.map(dagNode => this.executeNode(dagNode, context, nodeOutputs))
      );

      for (let i = 0; i < results.length; i++) {
        const dagNode = nodesToExecute[i];
        const result = results[i];

        nodeResults.push(result);
        executedNodes.add(dagNode.id);
        nodeOutputs.set(dagNode.id, result.outputs);
        Object.assign(outputs, result.outputs);

        if (result.status === 'waiting_for_input' || result.status === 'waiting_for_event') {
          executionStatus = result.status;
          currentNodeIds.push(dagNode.id);

          const fullResult = await this.executeBrick(
            dagNode.brick?.name || '',
            this.resolveNodeInputs(dagNode, context, nodeOutputs),
            { ...context, execution: { ...context.execution, node_id: dagNode.id } }
          );
          if (fullResult.pending_action) {
            pendingAction = fullResult.pending_action;
          }
        }

        if (result.status === 'failed' && !this.config.continueOnError) {
          executionStatus = 'failed';
          break;
        }
      }

      if (executionStatus === 'waiting_for_input' || executionStatus === 'waiting_for_event' || executionStatus === 'failed') {
        break;
      }
    }

    if (currentNodeIds.length === 0 && (executionStatus === 'waiting_for_input' || executionStatus === 'waiting_for_event')) {
      currentNodeIds = findReadyNodes().map(n => n.id);
    }

    return {
      play_id: dag.play.id,
      status: executionStatus,
      node_results: nodeResults,
      final_outputs: outputs,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      requires_user_action: executionStatus === 'waiting_for_input' || executionStatus === 'waiting_for_event',
      pending_action: pendingAction,
      current_node_ids: currentNodeIds,
    };
  }

  private async executeNode(
    dagNode: DAGNode,
    context: ExecutionContext,
    nodeOutputs: Map<string, Record<string, unknown>>
  ): Promise<BrickExecutionResult> {
    const startTime = new Date();
    const nodeType = dagNode.node.node_type;

    if (this.config.debug) {
      console.log(`[BrickEngine] Executing node: ${dagNode.id} (${nodeType})`);
    }

    // Handle control nodes
    if (['start', 'end', 'fork', 'decision', 'join'].includes(nodeType)) {
      const mergedOutputs: Record<string, unknown> = {};
      if (nodeType === 'join' as string) {
        for (const edge of dagNode.incomingEdges) {
          const sourceOutputs = nodeOutputs.get(edge.source_node_id);
          if (sourceOutputs) Object.assign(mergedOutputs, sourceOutputs);
        }
      }

      return {
        brick_id: nodeType,
        brick_name: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        node_id: dagNode.id,
        status: 'completed',
        outputs: mergedOutputs,
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime.getTime(),
      };
    }

    if ((nodeType as string) === 'join') {
      const mergedOutputs: Record<string, unknown> = {};
      for (const edge of dagNode.incomingEdges) {
        const sourceOutputs = nodeOutputs.get(edge.source_node_id);
        if (sourceOutputs) Object.assign(mergedOutputs, sourceOutputs);
      }
      return {
        brick_id: 'join',
        brick_name: 'Join',
        node_id: dagNode.id,
        status: 'completed',
        outputs: mergedOutputs,
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime.getTime(),
      };
    }

    if (!dagNode.brick) {
      return {
        brick_id: 'unknown',
        brick_name: 'Unknown',
        node_id: dagNode.id,
        status: 'failed',
        outputs: {},
        error: 'Node has no associated brick',
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime.getTime(),
      };
    }

    const inputs = this.resolveNodeInputs(dagNode, context, nodeOutputs);

    const nodeContext: ExecutionContext = {
      ...context,
      previous_outputs: this.flattenOutputs(nodeOutputs),
      execution: {
        ...context.execution,
        node_id: dagNode.id,
      },
    };

    const result = await this.executeBrick(dagNode.brick.name, inputs, nodeContext);

    return {
      brick_id: dagNode.brick.id,
      brick_name: dagNode.brick.name,
      node_id: dagNode.id,
      status: result.status,
      outputs: result.outputs,
      error: result.error,
      started_at: startTime.toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime.getTime(),
    };
  }

  private resolveNodeInputs(
    dagNode: DAGNode,
    context: ExecutionContext,
    nodeOutputs: Map<string, Record<string, unknown>>
  ): Record<string, unknown> {
    const nodeConfig = dagNode.node.config || {};
    const inputs: Record<string, unknown> = { ...nodeConfig };

    const playConfig = context.play_config || {};
    for (const [key, value] of Object.entries(playConfig)) {
      if (!(key in inputs)) {
        inputs[key] = value;
      }
    }

    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string' && value.startsWith('$previous.')) {
        const fieldName = value.slice('$previous.'.length);
        inputs[key] = this.flattenOutputs(nodeOutputs)[fieldName];
      } else if (typeof value === 'string' && value.startsWith('$workstream.')) {
        const fieldName = value.slice('$workstream.'.length);
        inputs[key] = context.workstream[fieldName];
      }
    }

    return inputs;
  }

  private flattenOutputs(nodeOutputs: Map<string, Record<string, unknown>>): Record<string, unknown> {
    const flat: Record<string, unknown> = {};
    for (const outputs of nodeOutputs.values()) {
      Object.assign(flat, outputs);
    }
    return flat;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates a new brick engine instance.
 */
export function createBrickEngine(
  registry: BrickRegistry,
  config?: Partial<EngineConfig>
): BrickEngine {
  return new BrickEngineImpl(registry, config);
}
