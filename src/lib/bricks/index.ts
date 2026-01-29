/**
 * Brick Architecture - Main Entry Point
 *
 * Exports all types, engine, and registry for the brick-based workflow system.
 * Supports 5 brick types: collection, review, approval, documentation, commitment.
 */

// Types - Brick Config (5 brick types)
export type {
  BrickConfig,
  CollectionBrickConfig,
  ReviewBrickConfig,
  ApprovalBrickConfig,
  DocumentationBrickConfig,
  CommitmentBrickConfig,
} from './types';

// Types - Shared Config
export type {
  OwnerAssignment,
  SLAConfig,
  NotificationConfig,
  CollectionField,
  CollectionFieldType,
  ReviewCriterion,
  AutoApprovalRule,
  EscalationConfig,
  DelegationConfig,
  StorageConfig,
  DistributionConfig,
  SignerConfig,
  SignaturePlacement,
  ReminderConfig,
} from './types';

// Types - Library System
export type {
  Library,
  LibraryArtifact,
  LibraryTemplate,
  LibraryPackage,
} from './types';

// Types - Playbook System
export type {
  BrickCategory,
  Brick,
  Playbook,
  PlaybookPattern,
  PlaybookPlay,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
  WorkflowEdgeType,
} from './types';

// Types - Execution System
export type {
  WorkstreamHandoff,
  HandoffType,
  HandoffStatus,
  NodeExecutionState,
  NodeExecutionStatus,
  AuditLogEntry,
  BrickLibraryReference,
} from './types';

// Types - Schema
export type {
  BrickInputField,
  BrickInputSchema,
  BrickOutputField,
  BrickOutputSchema,
} from './types';

// Types - Configuration
export type {
  InputSource,
  BrickInputConfig,
  BrickOutputMapping,
  BrickExecutionCondition,
} from './types';

// Types - Context
export type {
  WorkstreamContext,
  ExecutionContext,
} from './types';

// Types - Results
export type {
  BrickStatus,
  BrickExecutionResult,
  PlayExecutionResult,
  PendingAction,
} from './types';

// Types - Executor
export type {
  BrickExecutor,
  BrickExecutorResult,
  BrickRegistry,
} from './types';

// Types - Engine
export type {
  EngineConfig,
  DAG,
  DAGNode,
} from './types';

export { DEFAULT_ENGINE_CONFIG } from './types';

// Engine
export {
  createBrickEngine,
  resolveInputs,
  evaluateCondition,
  mapOutputs,
} from './engine';

export type { BrickEngine } from './engine';

// Registry
export {
  getBrickRegistry,
  registerBrickExecutor,
  hasExecutor,
  getExecutor,
  listRegisteredBricks,
  clearRegistry,
} from './registry';

// Services - Data Layer
export {
  // Brick loading
  loadAllBricks,
  loadBrickById,
  loadBrickByName,
  loadBricksByIds,
  loadBricksByCategory,
  getBricks,
  getBrickByName,
  getBrickCategories,
  clearBrickCache,
  // Playbook loading
  loadPlaybooks,
  loadPlaybookById,
  loadPlaybookTemplates,
  loadPlaybookByWorkstreamType,
  // Pattern loading
  loadPlaybookPatterns,
  loadPatternById,
  // Play loading
  loadPlaybookPlays,
  loadPlayById,
  // Workflow DAG
  loadWorkflowNodes,
  loadWorkflowEdges,
  buildPlayDAG,
  // Node execution state
  loadNodeExecutionStates,
  saveNodeExecutionState,
  updateNodeExecutionStatus,
  // Library loading
  loadLibraries,
  loadLibraryArtifacts,
  loadLibraryTemplates,
} from './services';

// Services - Play Executor
export {
  executePlay,
  resumePlayExecution,
  hasActivePlay,
  getPendingPlayAction,
  assignPlayToWorkstream,
} from './services';

export type {
  Workstream,
  CurrentUser,
  PlayExecutionOptions,
  PlayExecutionOutcome,
} from './services';

// Engine Utilities
export {
  sendNotification,
  checkEventReceived,
  checkDurationElapsed,
  calculateValue,
  transformValue,
} from './engine/utilities';
