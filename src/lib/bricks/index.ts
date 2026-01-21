/**
 * Brick Architecture - Main Entry Point
 *
 * Exports all types, engine, and registry for the brick-based workflow system.
 */

// Types
export type {
  // Database types
  BrickCategory,
  Brick,
  StepDefinition,
  StepDefinitionBrick,
  // Schema types
  BrickInputField,
  BrickInputSchema,
  BrickOutputField,
  BrickOutputSchema,
  // Configuration types
  InputSource,
  BrickInputConfig,
  BrickOutputMapping,
  BrickExecutionCondition,
  // Context types
  WorkstreamContext,
  ExecutionContext,
  // Result types
  BrickStatus,
  BrickExecutionResult,
  StepExecutionResult,
  PendingAction,
  // Executor types
  BrickExecutor,
  BrickExecutorResult,
  BrickRegistry,
  // Configuration
  EngineConfig,
} from './types';

export { DEFAULT_ENGINE_CONFIG } from './types';

// Engine
export {
  BrickEngine,
  createBrickEngine,
  resolveInputs,
  evaluateCondition,
  mapOutputs,
} from './engine';

// Registry
export {
  getBrickRegistry,
  registerBrickExecutor,
  hasExecutor,
  getExecutor,
  listRegisteredBricks,
} from './registry';

// Services
export {
  // Supabase data layer
  loadAllBricks,
  loadBrickById,
  loadBricksByIds,
  loadBrickCategories,
  loadStepDefinitionById,
  loadStepDefinitionByLegacyType,
  loadTemplateStepDefinitions,
  loadStepDefinitionBricks,
  loadStepDefinitionWithBricks,
  loadLegacyStepWithBricks,
  normalizeLegacyStepType,
  getBricks,
  getBrickByName,
  getCategories,
  clearBrickCache,
  // Step executor
  executeWorkstreamStep,
  resumeStepExecution,
  hasBrickDefinition,
  getPendingAction,
} from './services';

export type {
  WorkstreamStep,
  Workstream,
  CurrentUser,
  StepExecutionOptions,
  StepExecutionOutcome,
} from './services';
