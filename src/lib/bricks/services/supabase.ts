/**
 * Brick Services - Supabase Data Layer
 *
 * Functions to load bricks, playbooks, plays, patterns, and related data from Supabase.
 * Supports the refined architecture with 26 bricks, patterns/plays model, and Library system.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Brick,
  BrickCategory,
  Playbook,
  PlaybookPattern,
  PlaybookPlay,
  WorkflowNode,
  WorkflowEdge,
  NodeExecutionState,
  Library,
  LibraryArtifact,
  LibraryTemplate,
  BrickInputSchema,
  BrickOutputSchema,
  DAG,
  DAGNode,
} from '../types';
import { BRICK_CATEGORY_IDS, BRICK_CATEGORY_NAMES } from '../types';

// ============================================================================
// TYPE CONVERTERS
// ============================================================================

/**
 * Converts database row to Brick type with proper JSON parsing.
 */
function toBrick(row: Record<string, unknown>): Brick {
  const categoryId = String(row.category_id);
  return {
    id: String(row.id),
    name: String(row.name),
    display_name: String(row.display_name),
    purpose: String(row.purpose),
    category_id: categoryId,
    category: BRICK_CATEGORY_NAMES[categoryId] ?? ('collection' as BrickCategory),
    brick_number: Number(row.brick_number) || 0,
    dependency_level: String(row.dependency_level ?? 'none'),
    dependencies: (row.dependencies as string[] | null) ?? null,
    is_container: Boolean(row.is_container),
    input_schema: (row.input_schema as BrickInputSchema) || { fields: [] },
    output_schema: (row.output_schema as BrickOutputSchema) || { fields: [] },
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Converts database row to Playbook type.
 */
function toPlaybook(row: Record<string, unknown>): Playbook {
  return {
    id: String(row.id),
    name: String(row.name),
    display_name: String(row.display_name),
    description: row.description ? String(row.description) : null,
    workstream_type_id: row.workstream_type_id ? String(row.workstream_type_id) : null,
    version: Number(row.version),
    is_active: Boolean(row.is_active),
    is_template: Boolean(row.is_template),
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_by: row.created_by ? String(row.created_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Converts database row to PlaybookPattern type.
 */
function toPlaybookPattern(row: Record<string, unknown>): PlaybookPattern {
  return {
    id: String(row.id),
    playbook_id: String(row.playbook_id),
    name: String(row.name),
    display_name: String(row.display_name),
    description: row.description ? String(row.description) : null,
    pattern_type: String(row.pattern_type) as PlaybookPattern['pattern_type'],
    trigger_conditions: (row.trigger_conditions as Record<string, unknown>) || {},
    is_active: Boolean(row.is_active),
    position: Number(row.position),
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Converts database row to PlaybookPlay type.
 */
function toPlaybookPlay(row: Record<string, unknown>): PlaybookPlay {
  return {
    id: String(row.id),
    pattern_id: row.pattern_id ? String(row.pattern_id) : null,
    playbook_id: row.playbook_id ? String(row.playbook_id) : null,
    name: String(row.name),
    display_name: String(row.display_name),
    description: row.description ? String(row.description) : null,
    brick_id: row.brick_id ? String(row.brick_id) : null,
    config: (row.config as Record<string, unknown>) || {},
    input_mapping: (row.input_mapping as Record<string, unknown>) || {},
    output_mapping: (row.output_mapping as Record<string, unknown>) || {},
    execution_conditions: (row.execution_conditions as Record<string, unknown>) || {},
    is_active: Boolean(row.is_active),
    position: Number(row.position),
    estimated_duration_minutes: row.estimated_duration_minutes ? Number(row.estimated_duration_minutes) : null,
    sla_hours: row.sla_hours ? Number(row.sla_hours) : null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Converts database row to WorkflowNode type.
 */
function toWorkflowNode(row: Record<string, unknown>): WorkflowNode {
  return {
    id: String(row.id),
    play_id: String(row.play_id),
    node_type: String(row.node_type) as WorkflowNode['node_type'],
    brick_id: row.brick_id ? String(row.brick_id) : null,
    config: (row.config as Record<string, unknown>) || {},
    position_x: Number(row.position_x) || 0,
    position_y: Number(row.position_y) || 0,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: String(row.created_at),
  };
}

/**
 * Converts database row to WorkflowEdge type.
 */
function toWorkflowEdge(row: Record<string, unknown>): WorkflowEdge {
  return {
    id: String(row.id),
    play_id: String(row.play_id),
    source_node_id: String(row.source_node_id),
    target_node_id: String(row.target_node_id),
    edge_type: String(row.edge_type) as WorkflowEdge['edge_type'],
    condition: row.condition as Record<string, unknown> | null,
    label: row.label ? String(row.label) : null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: String(row.created_at),
  };
}

/**
 * Converts database row to NodeExecutionState type.
 */
function toNodeExecutionState(row: Record<string, unknown>): NodeExecutionState {
  return {
    id: String(row.id),
    workstream_id: String(row.workstream_id),
    play_id: String(row.play_id),
    node_id: String(row.node_id),
    status: String(row.status) as NodeExecutionState['status'],
    inputs: (row.inputs as Record<string, unknown>) || {},
    outputs: (row.outputs as Record<string, unknown>) || {},
    error: row.error ? String(row.error) : null,
    started_at: row.started_at ? String(row.started_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    executed_by: row.executed_by ? String(row.executed_by) : null,
    retry_count: Number(row.retry_count) || 0,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

// ============================================================================
// BRICK LOADING
// ============================================================================

/**
 * Loads all active bricks from the database.
 */
export async function loadAllBricks(): Promise<Brick[]> {
  const { data, error } = await supabase
    .from('bricks')
    .select('*')
    .eq('is_active', true)
    .order('brick_number')
    .order('name');

  if (error) {
    console.error('[BrickService] Error loading bricks:', error);
    throw new Error(`Failed to load bricks: ${error.message}`);
  }

  return (data || []).map(toBrick);
}

/**
 * Loads a single brick by ID.
 */
export async function loadBrickById(brickId: string): Promise<Brick | null> {
  const { data, error } = await supabase
    .from('bricks')
    .select('*')
    .eq('id', brickId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading brick:', error);
    throw new Error(`Failed to load brick: ${error.message}`);
  }

  return data ? toBrick(data) : null;
}

/**
 * Loads a single brick by name.
 */
export async function loadBrickByName(brickName: string): Promise<Brick | null> {
  const { data, error } = await supabase
    .from('bricks')
    .select('*')
    .eq('name', brickName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading brick by name:', error);
    throw new Error(`Failed to load brick: ${error.message}`);
  }

  return data ? toBrick(data) : null;
}

/**
 * Loads bricks by their IDs.
 */
export async function loadBricksByIds(brickIds: string[]): Promise<Map<string, Brick>> {
  if (brickIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('bricks')
    .select('*')
    .in('id', brickIds);

  if (error) {
    console.error('[BrickService] Error loading bricks:', error);
    throw new Error(`Failed to load bricks: ${error.message}`);
  }

  const brickMap = new Map<string, Brick>();
  for (const row of data || []) {
    const brick = toBrick(row);
    brickMap.set(brick.id, brick);
  }

  return brickMap;
}

/**
 * Loads bricks by category.
 */
export async function loadBricksByCategory(category: BrickCategory): Promise<Brick[]> {
  const uuid = BRICK_CATEGORY_IDS[category];
  const { data, error } = await supabase
    .from('bricks')
    .select('*')
    .eq('category_id', uuid)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[BrickService] Error loading bricks by category:', error);
    throw new Error(`Failed to load bricks: ${error.message}`);
  }

  return (data || []).map(toBrick);
}

// ============================================================================
// PLAYBOOK LOADING
// ============================================================================

/**
 * Loads all active playbooks.
 */
export async function loadPlaybooks(): Promise<Playbook[]> {
  const { data, error } = await supabase
    .from('playbooks')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    console.error('[BrickService] Error loading playbooks:', error);
    throw new Error(`Failed to load playbooks: ${error.message}`);
  }

  return (data || []).map(toPlaybook);
}

/**
 * Loads a playbook by ID.
 */
export async function loadPlaybookById(playbookId: string): Promise<Playbook | null> {
  const { data, error } = await supabase
    .from('playbooks')
    .select('*')
    .eq('id', playbookId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading playbook:', error);
    throw new Error(`Failed to load playbook: ${error.message}`);
  }

  return data ? toPlaybook(data) : null;
}

/**
 * Loads playbook templates.
 */
export async function loadPlaybookTemplates(): Promise<Playbook[]> {
  const { data, error } = await supabase
    .from('playbooks')
    .select('*')
    .eq('is_template', true)
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    console.error('[BrickService] Error loading playbook templates:', error);
    throw new Error(`Failed to load playbook templates: ${error.message}`);
  }

  return (data || []).map(toPlaybook);
}

/**
 * Loads playbook by workstream type.
 */
export async function loadPlaybookByWorkstreamType(workstreamTypeId: string): Promise<Playbook | null> {
  const { data, error } = await supabase
    .from('playbooks')
    .select('*')
    .eq('workstream_type_id', workstreamTypeId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading playbook by workstream type:', error);
    throw new Error(`Failed to load playbook: ${error.message}`);
  }

  return data ? toPlaybook(data) : null;
}

// ============================================================================
// PATTERN LOADING
// ============================================================================

/**
 * Loads patterns for a playbook.
 */
export async function loadPlaybookPatterns(playbookId: string): Promise<PlaybookPattern[]> {
  const { data, error } = await supabase
    .from('playbook_patterns')
    .select('*')
    .eq('playbook_id', playbookId)
    .eq('is_active', true)
    .order('position');

  if (error) {
    console.error('[BrickService] Error loading playbook patterns:', error);
    throw new Error(`Failed to load playbook patterns: ${error.message}`);
  }

  return (data || []).map(toPlaybookPattern);
}

/**
 * Loads a pattern by ID.
 */
export async function loadPatternById(patternId: string): Promise<PlaybookPattern | null> {
  const { data, error } = await supabase
    .from('playbook_patterns')
    .select('*')
    .eq('id', patternId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading pattern:', error);
    throw new Error(`Failed to load pattern: ${error.message}`);
  }

  return data ? toPlaybookPattern(data) : null;
}

// ============================================================================
// PLAY LOADING
// ============================================================================

/**
 * Loads plays for a pattern.
 */
export async function loadPlaybookPlays(patternId: string): Promise<PlaybookPlay[]> {
  const { data, error } = await supabase
    .from('playbook_plays')
    .select('*')
    .eq('pattern_id', patternId)
    .eq('is_active', true)
    .order('position');

  if (error) {
    console.error('[BrickService] Error loading playbook plays:', error);
    throw new Error(`Failed to load playbook plays: ${error.message}`);
  }

  return (data || []).map(toPlaybookPlay);
}

/**
 * Loads plays directly linked to a playbook (bypassing patterns).
 */
export async function loadPlaysByPlaybookId(playbookId: string): Promise<PlaybookPlay[]> {
  const { data, error } = await supabase
    .from('playbook_plays')
    .select('*')
    .eq('playbook_id', playbookId)
    .eq('is_active', true)
    .order('position');

  if (error) {
    console.error('[BrickService] Error loading plays by playbook:', error);
    throw new Error(`Failed to load plays: ${error.message}`);
  }

  return (data || []).map(toPlaybookPlay);
}

/**
 * Loads a play by ID.
 */
export async function loadPlayById(playId: string): Promise<PlaybookPlay | null> {
  const { data, error } = await supabase
    .from('playbook_plays')
    .select('*')
    .eq('id', playId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading play:', error);
    throw new Error(`Failed to load play: ${error.message}`);
  }

  return data ? toPlaybookPlay(data) : null;
}

// ============================================================================
// WORKFLOW NODE/EDGE LOADING
// ============================================================================

/**
 * Loads workflow nodes for a play.
 */
export async function loadWorkflowNodes(playId: string): Promise<WorkflowNode[]> {
  const { data, error } = await supabase
    .from('workflow_nodes')
    .select('*')
    .eq('play_id', playId);

  if (error) {
    console.error('[BrickService] Error loading workflow nodes:', error);
    throw new Error(`Failed to load workflow nodes: ${error.message}`);
  }

  return (data || []).map(toWorkflowNode);
}

/**
 * Loads workflow edges for a play.
 */
export async function loadWorkflowEdges(playId: string): Promise<WorkflowEdge[]> {
  const { data, error } = await supabase
    .from('workflow_edges')
    .select('*')
    .eq('play_id', playId);

  if (error) {
    console.error('[BrickService] Error loading workflow edges:', error);
    throw new Error(`Failed to load workflow edges: ${error.message}`);
  }

  return (data || []).map(toWorkflowEdge);
}

/**
 * Builds a DAG from play nodes and edges.
 */
export async function buildPlayDAG(play: PlaybookPlay): Promise<DAG> {
  const [nodes, edges] = await Promise.all([
    loadWorkflowNodes(play.id),
    loadWorkflowEdges(play.id),
  ]);

  // Resolve bricks locally using category UUIDs.
  // workflow_nodes.brick_id stores category UUIDs (a0000000-...001 through 005),
  // not bricks.id. Build synthetic Brick objects keyed by category UUID.
  const bricks = new Map<string, Brick>();
  for (const node of nodes) {
    if (node.brick_id && !bricks.has(node.brick_id)) {
      const category = BRICK_CATEGORY_NAMES[node.brick_id];
      if (category) {
        bricks.set(node.brick_id, {
          id: node.brick_id,
          name: category,
          display_name: category.charAt(0).toUpperCase() + category.slice(1),
          purpose: `${category} brick`,
          category_id: node.brick_id,
          category,
          brick_number: 0,
          dependency_level: 'none',
          dependencies: null,
          is_container: false,
          input_schema: { fields: [] },
          output_schema: { fields: [] },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  // Build DAG structure
  const dagNodes = new Map<string, DAGNode>();
  let startNode: DAGNode | null = null;
  const endNodes: DAGNode[] = [];

  for (const node of nodes) {
    const incomingEdges = edges.filter(e => e.target_node_id === node.id);
    const outgoingEdges = edges.filter(e => e.source_node_id === node.id);

    const dagNode: DAGNode = {
      id: node.id,
      node,
      brick: node.brick_id ? bricks.get(node.brick_id) || null : null,
      incomingEdges,
      outgoingEdges,
    };

    dagNodes.set(node.id, dagNode);

    // Derive start/end from topology: nodes with no incoming edges are start nodes,
    // nodes with no outgoing edges are end nodes. Falls back to node_type for legacy data.
    if (node.node_type === 'start' || incomingEdges.length === 0) {
      if (!startNode) startNode = dagNode;
    }
    if (node.node_type === 'end' || outgoingEdges.length === 0) {
      endNodes.push(dagNode);
    }
  }

  return {
    nodes: dagNodes,
    startNode,
    endNodes,
    play,
  };
}

// ============================================================================
// NODE EXECUTION STATE
// ============================================================================

/**
 * Loads execution state for a workstream's play.
 */
export async function loadNodeExecutionStates(
  workstreamId: string,
  playId: string
): Promise<NodeExecutionState[]> {
  const { data, error } = await supabase
    .from('node_execution_state')
    .select('*')
    .eq('workstream_id', workstreamId)
    .eq('play_id', playId);

  if (error) {
    console.error('[BrickService] Error loading node execution states:', error);
    throw new Error(`Failed to load node execution states: ${error.message}`);
  }

  return (data || []).map(toNodeExecutionState);
}

/**
 * Saves or updates node execution state.
 */
export async function saveNodeExecutionState(
  state: Omit<NodeExecutionState, 'id' | 'created_at' | 'updated_at'>
): Promise<NodeExecutionState> {
  const { data, error } = await supabase
    .from('node_execution_state')
    .upsert(
      {
        workstream_id: state.workstream_id,
        play_id: state.play_id,
        node_id: state.node_id,
        status: state.status,
        inputs: state.inputs,
        outputs: state.outputs,
        error: state.error,
        started_at: state.started_at,
        completed_at: state.completed_at,
        executed_by: state.executed_by,
        retry_count: state.retry_count,
        metadata: state.metadata,
      },
      { onConflict: 'workstream_id,play_id,node_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[BrickService] Error saving node execution state:', error);
    throw new Error(`Failed to save node execution state: ${error.message}`);
  }

  return toNodeExecutionState(data);
}

/**
 * Updates node execution status.
 */
export async function updateNodeExecutionStatus(
  workstreamId: string,
  playId: string,
  nodeId: string,
  status: NodeExecutionState['status'],
  outputs?: Record<string, unknown>,
  error?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (outputs) {
    updateData.outputs = outputs;
  }

  if (error !== undefined) {
    updateData.error = error;
  }

  if (status === 'running') {
    updateData.started_at = new Date().toISOString();
  }

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('node_execution_state')
    .update(updateData)
    .eq('workstream_id', workstreamId)
    .eq('play_id', playId)
    .eq('node_id', nodeId);

  if (updateError) {
    console.error('[BrickService] Error updating node execution status:', updateError);
    throw new Error(`Failed to update node execution status: ${updateError.message}`);
  }
}

// ============================================================================
// LIBRARY LOADING
// ============================================================================

/**
 * Loads all active libraries.
 */
export async function loadLibraries(): Promise<Library[]> {
  const { data, error } = await supabase
    .from('libraries')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    console.error('[BrickService] Error loading libraries:', error);
    throw new Error(`Failed to load libraries: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    display_name: String(row.display_name),
    description: row.description ? String(row.description) : null,
    library_type: String(row.library_type) as Library['library_type'],
    owner_id: row.owner_id ? String(row.owner_id) : null,
    is_active: Boolean(row.is_active),
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

/**
 * Loads artifacts from a library.
 */
export async function loadLibraryArtifacts(libraryId: string): Promise<LibraryArtifact[]> {
  const { data, error } = await supabase
    .from('library_artifacts')
    .select('*')
    .eq('library_id', libraryId)
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    console.error('[BrickService] Error loading library artifacts:', error);
    throw new Error(`Failed to load library artifacts: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    library_id: String(row.library_id),
    name: String(row.name),
    display_name: String(row.display_name),
    artifact_type: String(row.artifact_type) as LibraryArtifact['artifact_type'],
    content: (row.content as Record<string, unknown>) || {},
    file_url: row.file_url ? String(row.file_url) : null,
    version: Number(row.version),
    is_active: Boolean(row.is_active),
    tags: (row.tags as string[]) || [],
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_by: row.created_by ? String(row.created_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

/**
 * Loads templates from a library.
 */
export async function loadLibraryTemplates(libraryId: string): Promise<LibraryTemplate[]> {
  const { data, error } = await supabase
    .from('library_templates')
    .select('*')
    .eq('library_id', libraryId)
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    console.error('[BrickService] Error loading library templates:', error);
    throw new Error(`Failed to load library templates: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    library_id: String(row.library_id),
    name: String(row.name),
    display_name: String(row.display_name),
    description: row.description ? String(row.description) : null,
    template_type: String(row.template_type) as LibraryTemplate['template_type'],
    content: (row.content as Record<string, unknown>) || {},
    parameters: (row.parameters as Record<string, unknown>) || {},
    version: Number(row.version),
    is_active: Boolean(row.is_active),
    tags: (row.tags as string[]) || [],
    created_by: row.created_by ? String(row.created_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

let brickCache: Map<string, Brick> | null = null;
let brickByNameCache: Map<string, Brick> | null = null;

/**
 * Gets all bricks, using cache if available.
 */
export async function getBricks(): Promise<Map<string, Brick>> {
  if (!brickCache) {
    const bricks = await loadAllBricks();
    brickCache = new Map(bricks.map((b) => [b.id, b]));
    brickByNameCache = new Map(bricks.map((b) => [b.name, b]));
  }
  return brickCache;
}

/**
 * Gets brick by name from cache.
 */
export async function getBrickByName(name: string): Promise<Brick | undefined> {
  if (!brickByNameCache) {
    await getBricks();
  }
  return brickByNameCache?.get(name);
}

/**
 * Gets all unique brick categories.
 */
export function getBrickCategories(): BrickCategory[] {
  return ['collection', 'review', 'approval', 'documentation', 'commitment'];
}

/**
 * Clears the brick cache (useful after updates).
 */
export function clearBrickCache(): void {
  brickCache = null;
  brickByNameCache = null;
}
