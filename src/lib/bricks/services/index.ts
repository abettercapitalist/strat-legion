/**
 * Brick Services - Main Export
 */

// Supabase data layer
export {
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
} from './supabase';

// Step executor
export {
  executeWorkstreamStep,
  resumeStepExecution,
  hasBrickDefinition,
  getPendingAction,
  type WorkstreamStep,
  type Workstream,
  type CurrentUser,
  type StepExecutionOptions,
  type StepExecutionOutcome,
} from './stepExecutor';
