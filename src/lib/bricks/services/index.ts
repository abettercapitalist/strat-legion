/**
 * Brick Services - Main Export
 *
 * Exports all service functions for the refined brick architecture.
 */

// Supabase data layer
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
  loadPlaysByPlaybookId,
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
} from './supabase';

// Play executor
export {
  executePlay,
  resumePlayExecution,
  hasActivePlay,
  getPendingPlayAction,
  assignPlayToWorkstream,
  type Workstream,
  type CurrentUser,
  type PlayExecutionOptions,
  type PlayExecutionOutcome,
} from './playExecutor';
