/**
 * Brick Architecture - Type Definitions
 *
 * Core types for the brick-based workflow execution engine.
 * Supports 5 brick types: collection, review, approval, documentation, commitment.
 */

// ============================================================================
// BRICK CATEGORIES (5 types)
// ============================================================================

export type BrickCategory = 'collection' | 'review' | 'approval' | 'documentation' | 'commitment';

/**
 * Well-known UUIDs for brick_categories rows.
 * These match the seed data in the consolidate_5_brick_types migration.
 */
export const BRICK_CATEGORY_IDS: Record<BrickCategory, string> = {
  collection:    'a0000000-0000-0000-0000-000000000001',
  review:        'a0000000-0000-0000-0000-000000000002',
  approval:      'a0000000-0000-0000-0000-000000000003',
  documentation: 'a0000000-0000-0000-0000-000000000004',
  commitment:    'a0000000-0000-0000-0000-000000000005',
} as const;

/** Reverse map: UUID → BrickCategory name */
export const BRICK_CATEGORY_NAMES: Record<string, BrickCategory> = Object.fromEntries(
  Object.entries(BRICK_CATEGORY_IDS).map(([name, id]) => [id, name as BrickCategory])
) as Record<string, BrickCategory>;

// ============================================================================
// SHARED BRICK CONFIG TYPES
// ============================================================================

export interface OwnerAssignment {
  type: 'role' | 'user' | 'workstream_owner';
  role_id?: string;
  user_id?: string;
}

export interface SLAConfig {
  deadline_hours?: number;
  warning_hours?: number;
  escalation?: {
    escalate_to_role?: string;
    escalate_after_hours?: number;
  };
}

export interface NotificationConfig {
  on_assigned?: boolean;
  on_sla_warning?: boolean;
  on_completed?: boolean;
  channels?: ('in_app' | 'email')[];
}

export type CollectionFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'file'
  | 'meeting_request'
  | 'decision'
  | 'assignment';

export interface CollectionField {
  name: string;
  label: string;
  field_type: CollectionFieldType;
  required?: boolean;
  description?: string;
  default_value?: unknown;
  options?: string[];
  validation?: {
    type?: string;
    pattern?: string;
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    error_message?: string;
  };
}

export interface ReviewCriterion {
  id: string;
  label: string;
  description?: string;
  weight?: number;
  required?: boolean;
}

export interface AutoApprovalRule {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: unknown;
}

export interface EscalationConfig {
  escalate_after_hours?: number;
  escalate_to_role?: string;
  escalation_reason?: string;
}

export interface DelegationConfig {
  allow_delegation?: boolean;
  delegate_to_roles?: string[];
}

export interface StorageConfig {
  repository?: string;
  folder?: string;
  access_permissions?: Record<string, unknown>;
}

export interface DistributionConfig {
  recipients?: string[];
  delivery_method?: 'email' | 'link';
  message?: string;
}

export interface SignerConfig {
  name?: string;
  email?: string;
  role?: string;
  order?: number;
}

export interface SignaturePlacement {
  page?: number;
  x?: number;
  y?: number;
  signer_index?: number;
}

export interface ReminderConfig {
  frequency_hours?: number;
  max_reminders?: number;
  final_warning_hours?: number;
}

// ============================================================================
// BRICK-SPECIFIC CONFIG INTERFACES
// ============================================================================

export interface CollectionSource {
  type: 'form' | 'integration';
  integration_id?: string;
  mapping?: Record<string, string>;
}

export interface CollectionBrickConfig {
  source?: CollectionSource;
  owner_assignment?: OwnerAssignment;
  fields: CollectionField[];
  instructions?: string;
  validation_rules?: Record<string, unknown>;
  sla?: SLAConfig;
  notifications?: NotificationConfig;
}

export interface ReviewBrickConfig {
  review_type: 'checklist' | 'scored' | 'qualitative';
  criteria: ReviewCriterion[];
  document_id?: string;
  outcome_routing?: {
    on_pass?: 'continue' | 'route';
    on_fail?: 'stop' | 'send_back' | 'alternate_path';
    pass_target_node_id?: string;
    fail_target_node_id?: string;
  };
  reviewer_assignment?: OwnerAssignment;
  sla?: SLAConfig;
}

export interface ApprovalBrickConfig {
  approver: OwnerAssignment;
  document_id?: string;
  conditional_logic?: AutoApprovalRule[];
  condition_logic?: 'AND' | 'OR';
  decision_options?: string[];
  escalation?: EscalationConfig;
  delegation?: DelegationConfig;
  sla?: SLAConfig;
}

export interface DocumentationBrickConfig {
  template_id?: string;
  field_mapping?: Record<string, string>;
  output_format?: 'pdf' | 'docx' | 'html';
  output_name?: string;
  storage?: StorageConfig;
  distribution?: DistributionConfig;
  validation_rules?: Record<string, unknown>;
}

export interface CommitmentBrickConfig {
  provider?: 'docusign' | 'manual';
  signers: SignerConfig[];
  document_source: 'previous_brick' | 'template' | 'upload';
  document_id?: string;
  signature_placement?: SignaturePlacement[];
  reminders?: ReminderConfig;
}

export type BrickConfig =
  | CollectionBrickConfig
  | ReviewBrickConfig
  | ApprovalBrickConfig
  | DocumentationBrickConfig
  | CommitmentBrickConfig;

// ============================================================================
// LIBRARY SYSTEM TYPES
// ============================================================================

export interface Library {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  library_type: 'system' | 'organization' | 'user';
  owner_id: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LibraryArtifact {
  id: string;
  library_id: string;
  name: string;
  display_name: string;
  artifact_type: 'document' | 'template' | 'clause' | 'checklist' | 'reference';
  content: Record<string, unknown>;
  file_url: string | null;
  version: number;
  is_active: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryTemplate {
  id: string;
  library_id: string;
  name: string;
  display_name: string;
  description: string | null;
  template_type: 'playbook' | 'pattern' | 'play' | 'checklist';
  content: Record<string, unknown>;
  parameters: Record<string, unknown>;
  version: number;
  is_active: boolean;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryPackage {
  id: string;
  library_id: string;
  name: string;
  display_name: string;
  description: string | null;
  package_contents: Array<{ type: string; id: string }>;
  version: number;
  is_active: boolean;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PLAYBOOK SYSTEM TYPES
// ============================================================================

export interface Playbook {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  workstream_type_id: string | null;
  version: number;
  is_active: boolean;
  is_template: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brick {
  id: string;
  name: string;
  display_name: string;
  purpose: string;
  category_id: string;
  category: BrickCategory;
  brick_number: number;
  dependency_level: string;
  dependencies: string[] | null;
  is_container: boolean;
  input_schema: BrickInputSchema;
  output_schema: BrickOutputSchema;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaybookPattern {
  id: string;
  playbook_id: string;
  name: string;
  display_name: string;
  description: string | null;
  pattern_type: 'sequential' | 'parallel' | 'conditional' | 'loop';
  trigger_conditions: Record<string, unknown>;
  is_active: boolean;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlaybookPlay {
  id: string;
  pattern_id: string | null;
  playbook_id?: string | null;
  name: string;
  display_name: string;
  description: string | null;
  brick_id: string | null;
  config: Record<string, unknown>;
  input_mapping: Record<string, unknown>;
  output_mapping: Record<string, unknown>;
  execution_conditions: Record<string, unknown>;
  is_active: boolean;
  position: number;
  estimated_duration_minutes: number | null;
  sla_hours: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WORKFLOW DAG TYPES
// ============================================================================

export type WorkflowNodeType = 'start' | 'brick' | 'fork' | 'join' | 'end' | 'decision';

export interface WorkflowNode {
  id: string;
  play_id: string;
  node_type: WorkflowNodeType;
  brick_id: string | null;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type WorkflowEdgeType = 'default' | 'conditional' | 'error';

export interface WorkflowEdge {
  id: string;
  play_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: WorkflowEdgeType;
  condition: Record<string, unknown> | null;
  label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// EXECUTION SYSTEM TYPES
// ============================================================================

export type HandoffType = 'spawn' | 'transfer' | 'parallel' | 'merge';
export type HandoffStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface WorkstreamHandoff {
  id: string;
  source_workstream_id: string;
  target_workstream_id: string | null;
  handoff_type: HandoffType;
  status: HandoffStatus;
  handoff_data: Record<string, unknown>;
  initiated_by: string | null;
  accepted_by: string | null;
  initiated_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting' | 'cancelled';

export interface NodeExecutionState {
  id: string;
  workstream_id: string;
  play_id: string;
  node_id: string;
  status: NodeExecutionStatus;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  executed_by: string | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  context: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface BrickLibraryReference {
  id: string;
  play_id: string;
  artifact_id: string;
  reference_type: 'template' | 'document' | 'clause' | 'reference';
  config: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// SCHEMA TYPES
// ============================================================================

export interface BrickInputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'timestamp' | 'any';
  required?: boolean;
  description?: string;
  default?: unknown;
  options?: string[];
}

export interface BrickInputSchema {
  fields: BrickInputField[];
}

export interface BrickOutputField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'timestamp' | 'any';
  description?: string;
}

export interface BrickOutputSchema {
  fields: BrickOutputField[];
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface InputSource {
  source: 'play_config' | 'previous_output' | 'workstream' | 'context' | 'template' | 'literal';
  field?: string;
  default?: unknown;
  transform?: string;
  mapping?: Record<string, unknown>;
  template?: string;
}

export type BrickInputConfig = Record<string, InputSource | unknown>;

export type BrickOutputMapping = Record<string, string>;

export interface BrickExecutionCondition {
  when: string;
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
  play_id: string | null;
  playbook_id: string | null;
  current_node_ids: string[];
  [key: string]: unknown;
}

export interface ExecutionContext {
  workstream: WorkstreamContext;
  play_config: Record<string, unknown>;
  previous_outputs: Record<string, unknown>;
  user: {
    id: string;
    email: string;
    role: string | null;
  } | null;
  execution: {
    play_id: string;
    pattern_id: string;
    playbook_id: string | null;
    node_id: string;
    started_at: string;
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
  node_id: string;
  status: BrickStatus;
  outputs: Record<string, unknown>;
  error?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface PlayExecutionResult {
  play_id: string;
  status: BrickStatus;
  node_results: BrickExecutionResult[];
  final_outputs: Record<string, unknown>;
  error?: string;
  started_at: string;
  completed_at?: string;
  requires_user_action?: boolean;
  pending_action?: PendingAction;
  current_node_ids?: string[];
}

export interface PendingAction {
  type: 'approval' | 'input' | 'document' | 'signature' | 'review' | 'collection' | 'commitment' | 'documentation';
  brick_id: string;
  brick_name: string;
  node_id: string;
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
  continueOnError: boolean;
  brickTimeoutMs: number;
  totalTimeoutMs: number;
  maxParallelNodes: number;
  debug: boolean;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  continueOnError: false,
  brickTimeoutMs: 30000,
  totalTimeoutMs: 300000,
  maxParallelNodes: 10,
  debug: false,
};

// ============================================================================
// DAG TRAVERSAL TYPES
// ============================================================================

export interface DAGNode {
  id: string;
  node: WorkflowNode;
  brick: Brick | null;
  incomingEdges: WorkflowEdge[];
  outgoingEdges: WorkflowEdge[];
}

export interface DAG {
  nodes: Map<string, DAGNode>;
  startNode: DAGNode | null;
  endNodes: DAGNode[];
  play: PlaybookPlay;
}
