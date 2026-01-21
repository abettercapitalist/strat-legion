/**
 * Brick Architecture - Type Definitions
 *
 * Core types for the brick-based workflow execution engine.
 */

// ============================================================================
// DATABASE TYPES (match Supabase schema)
// ============================================================================

export interface BrickCategory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  display_order: number;
  icon: string | null;
  created_at: string;
}

export interface Brick {
  id: string;
  name: string;
  display_name: string;
  purpose: string;
  category_id: string;
  brick_number: number;
  input_schema: BrickInputSchema;
  output_schema: BrickOutputSchema;
  dependencies: string[];
  dependency_level: 'none' | 'light' | 'moderate' | 'complex';
  is_container: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StepDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_template: boolean;
  is_system: boolean;
  legacy_step_type: string | null;
  created_by: string | null;
  workstream_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StepDefinitionBrick {
  id: string;
  step_definition_id: string;
  brick_id: string;
  position: number;
  input_config: BrickInputConfig;
  output_mapping: BrickOutputMapping;
  execution_condition: BrickExecutionCondition | null;
  created_at: string;
}

// ============================================================================
// SCHEMA TYPES
// ============================================================================

export interface BrickInputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'timestamp' | 'any' | 'enum';
  required: boolean;
  description: string;
  default?: unknown;
  options?: string[]; // For enum types
  schema?: Record<string, unknown>; // For nested object types
}

export interface BrickInputSchema {
  fields: BrickInputField[];
}

export interface BrickOutputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'timestamp' | 'enum';
  description: string;
  options?: string[]; // For enum types
  schema?: Record<string, unknown>; // For nested object types
}

export interface BrickOutputSchema {
  fields: BrickOutputField[];
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface InputSource {
  source: 'step_config' | 'previous_output' | 'workstream' | 'context' | 'template' | 'literal';
  field?: string;
  default?: unknown;
  transform?: string;
  mapping?: Record<string, unknown>;
  template?: string;
}

export type BrickInputConfig = Record<string, InputSource | unknown>;

export type BrickOutputMapping = Record<string, string>;

export interface BrickExecutionCondition {
  when: string; // Expression to evaluate
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

export interface WorkstreamContext {
  id: string;
  name: string;
  workstream_type_id: string | null;
  owner_id: string | null;
  counterparty_id: string | null;
  annual_value: number | null;
  tier: string | null;
  stage: string | null;
  [key: string]: unknown; // Additional workstream fields
}

export interface ExecutionContext {
  // Workstream data
  workstream: WorkstreamContext;

  // Step configuration (from workstream_steps.config)
  step_config: Record<string, unknown>;

  // Accumulated outputs from previous bricks in this step
  previous_outputs: Record<string, unknown>;

  // Current user information
  user: {
    id: string;
    email: string;
    role: string | null;
  } | null;

  // Execution metadata
  execution: {
    step_id: string;
    step_definition_id: string;
    started_at: string;
    brick_index: number;
  };
}

// ============================================================================
// EXECUTION RESULT TYPES
// ============================================================================

export type BrickStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'waiting_for_input'
  | 'waiting_for_event';

export interface BrickExecutionResult {
  brick_id: string;
  brick_name: string;
  status: BrickStatus;
  outputs: Record<string, unknown>;
  error?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface StepExecutionResult {
  step_definition_id: string;
  status: BrickStatus;
  brick_results: BrickExecutionResult[];
  final_outputs: Record<string, unknown>;
  error?: string;
  started_at: string;
  completed_at?: string;
  requires_user_action?: boolean;
  pending_action?: PendingAction;
}

export interface PendingAction {
  type: 'approval' | 'input' | 'document' | 'signature' | 'event';
  brick_id: string;
  brick_name: string;
  description: string;
  config: Record<string, unknown>;
}

// ============================================================================
// BRICK EXECUTOR TYPES
// ============================================================================

export type BrickExecutor = (
  inputs: Record<string, unknown>,
  context: ExecutionContext
) => Promise<BrickExecutorResult>;

export interface BrickExecutorResult {
  status: BrickStatus;
  outputs: Record<string, unknown>;
  error?: string;
  pending_action?: PendingAction;
}

export interface BrickRegistry {
  [brickName: string]: BrickExecutor;
}

// ============================================================================
// ENGINE CONFIGURATION
// ============================================================================

export interface EngineConfig {
  // Whether to continue execution on non-fatal errors
  continueOnError: boolean;

  // Maximum execution time per brick (ms)
  brickTimeoutMs: number;

  // Maximum total execution time (ms)
  totalTimeoutMs: number;

  // Whether to log execution details
  debug: boolean;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  continueOnError: false,
  brickTimeoutMs: 30000,
  totalTimeoutMs: 300000,
  debug: false,
};
