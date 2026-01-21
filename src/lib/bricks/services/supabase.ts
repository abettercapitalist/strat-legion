/**
 * Brick Services - Supabase Data Layer
 *
 * Functions to load bricks, step definitions, and related data from Supabase.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Brick,
  BrickCategory,
  StepDefinition,
  StepDefinitionBrick,
  BrickInputSchema,
  BrickOutputSchema,
} from '../types';

// ============================================================================
// TYPE CONVERTERS
// ============================================================================

/**
 * Converts database row to Brick type with proper JSON parsing.
 */
function toBrick(row: Record<string, unknown>): Brick {
  return {
    id: String(row.id),
    name: String(row.name),
    display_name: String(row.display_name),
    purpose: String(row.purpose),
    category_id: String(row.category_id),
    brick_number: Number(row.brick_number),
    input_schema: (row.input_schema as BrickInputSchema) || { fields: [] },
    output_schema: (row.output_schema as BrickOutputSchema) || { fields: [] },
    dependencies: (row.dependencies as string[]) || [],
    dependency_level: (row.dependency_level as Brick['dependency_level']) || 'none',
    is_container: Boolean(row.is_container),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Converts database row to StepDefinition type.
 */
function toStepDefinition(row: Record<string, unknown>): StepDefinition {
  return {
    id: String(row.id),
    name: String(row.name),
    display_name: String(row.display_name),
    description: row.description ? String(row.description) : null,
    icon: row.icon ? String(row.icon) : null,
    is_template: Boolean(row.is_template),
    is_system: Boolean(row.is_system),
    legacy_step_type: row.legacy_step_type ? String(row.legacy_step_type) : null,
    created_by: row.created_by ? String(row.created_by) : null,
    workstream_type_id: row.workstream_type_id ? String(row.workstream_type_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Converts database row to StepDefinitionBrick type.
 */
function toStepDefinitionBrick(row: Record<string, unknown>): StepDefinitionBrick {
  return {
    id: String(row.id),
    step_definition_id: String(row.step_definition_id),
    brick_id: String(row.brick_id),
    position: Number(row.position),
    input_config: (row.input_config as StepDefinitionBrick['input_config']) || {},
    output_mapping: (row.output_mapping as StepDefinitionBrick['output_mapping']) || {},
    execution_condition: row.execution_condition as StepDefinitionBrick['execution_condition'] | null,
    created_at: String(row.created_at),
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
    .order('brick_number');

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
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[BrickService] Error loading brick:', error);
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
 * Loads all brick categories.
 */
export async function loadBrickCategories(): Promise<BrickCategory[]> {
  const { data, error } = await supabase
    .from('brick_categories')
    .select('*')
    .order('display_order');

  if (error) {
    console.error('[BrickService] Error loading categories:', error);
    throw new Error(`Failed to load brick categories: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    display_name: String(row.display_name),
    description: row.description ? String(row.description) : null,
    display_order: Number(row.display_order),
    icon: row.icon ? String(row.icon) : null,
    created_at: String(row.created_at),
  }));
}

// ============================================================================
// STEP DEFINITION LOADING
// ============================================================================

/**
 * Loads a step definition by ID.
 */
export async function loadStepDefinitionById(
  stepDefinitionId: string
): Promise<StepDefinition | null> {
  const { data, error } = await supabase
    .from('step_definitions')
    .select('*')
    .eq('id', stepDefinitionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading step definition:', error);
    throw new Error(`Failed to load step definition: ${error.message}`);
  }

  return data ? toStepDefinition(data) : null;
}

/**
 * Loads a step definition by legacy step type.
 * Used to map old hardcoded step types to brick-based definitions.
 */
export async function loadStepDefinitionByLegacyType(
  legacyStepType: string
): Promise<StepDefinition | null> {
  const { data, error } = await supabase
    .from('step_definitions')
    .select('*')
    .eq('legacy_step_type', legacyStepType)
    .eq('is_system', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[BrickService] Error loading step definition by legacy type:', error);
    throw new Error(`Failed to load step definition: ${error.message}`);
  }

  return data ? toStepDefinition(data) : null;
}

/**
 * Loads all template step definitions (available for users to use).
 */
export async function loadTemplateStepDefinitions(): Promise<StepDefinition[]> {
  const { data, error } = await supabase
    .from('step_definitions')
    .select('*')
    .eq('is_template', true)
    .order('display_name');

  if (error) {
    console.error('[BrickService] Error loading template step definitions:', error);
    throw new Error(`Failed to load template step definitions: ${error.message}`);
  }

  return (data || []).map(toStepDefinition);
}

// ============================================================================
// STEP DEFINITION BRICK LOADING
// ============================================================================

/**
 * Loads all bricks for a step definition, ordered by position.
 */
export async function loadStepDefinitionBricks(
  stepDefinitionId: string
): Promise<StepDefinitionBrick[]> {
  const { data, error } = await supabase
    .from('step_definition_bricks')
    .select('*')
    .eq('step_definition_id', stepDefinitionId)
    .order('position');

  if (error) {
    console.error('[BrickService] Error loading step definition bricks:', error);
    throw new Error(`Failed to load step definition bricks: ${error.message}`);
  }

  return (data || []).map(toStepDefinitionBrick);
}

/**
 * Loads a complete step definition with its bricks and brick details.
 */
export async function loadStepDefinitionWithBricks(stepDefinitionId: string): Promise<{
  stepDefinition: StepDefinition;
  stepBricks: StepDefinitionBrick[];
  bricks: Map<string, Brick>;
} | null> {
  const stepDefinition = await loadStepDefinitionById(stepDefinitionId);
  if (!stepDefinition) return null;

  const stepBricks = await loadStepDefinitionBricks(stepDefinitionId);
  const brickIds = stepBricks.map((sb) => sb.brick_id);
  const bricks = await loadBricksByIds(brickIds);

  return { stepDefinition, stepBricks, bricks };
}

/**
 * Loads a step definition by legacy type with its bricks and brick details.
 */
export async function loadLegacyStepWithBricks(legacyStepType: string): Promise<{
  stepDefinition: StepDefinition;
  stepBricks: StepDefinitionBrick[];
  bricks: Map<string, Brick>;
} | null> {
  const stepDefinition = await loadStepDefinitionByLegacyType(legacyStepType);
  if (!stepDefinition) return null;

  const stepBricks = await loadStepDefinitionBricks(stepDefinition.id);
  const brickIds = stepBricks.map((sb) => sb.brick_id);
  const bricks = await loadBricksByIds(brickIds);

  return { stepDefinition, stepBricks, bricks };
}

// ============================================================================
// WORKSTREAM STEP HELPERS
// ============================================================================

/**
 * Maps legacy step_type values to the standardized legacy_step_type values
 * used in step_definitions.
 */
export function normalizeLegacyStepType(stepType: string): string {
  const mappings: Record<string, string> = {
    // UI step types → database legacy_step_type
    'request_information': 'request_information',
    'request-information': 'request_information',
    'approval': 'approval',
    'approval_gate': 'approval',
    'approval-gate': 'approval',
    'generate_document': 'generate_document',
    'generate-document': 'generate_document',
    'send_notification': 'send_notification',
    'send-notification': 'send_notification',
    'assign_task': 'assign_task',
    'assign-task': 'assign_task',
    'task_assignment': 'assign_task',
    'task-assignment': 'assign_task',
    'send_reminder': 'send_reminder',
    'send-reminder': 'send_reminder',
  };

  return mappings[stepType.toLowerCase()] || stepType;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

let brickCache: Map<string, Brick> | null = null;
let categoryCache: BrickCategory[] | null = null;

/**
 * Gets all bricks, using cache if available.
 */
export async function getBricks(): Promise<Map<string, Brick>> {
  if (!brickCache) {
    const bricks = await loadAllBricks();
    brickCache = new Map(bricks.map((b) => [b.id, b]));
  }
  return brickCache;
}

/**
 * Gets brick by name from cache.
 */
export async function getBrickByName(name: string): Promise<Brick | undefined> {
  const bricks = await getBricks();
  for (const brick of bricks.values()) {
    if (brick.name === name) return brick;
  }
  return undefined;
}

/**
 * Gets all categories, using cache if available.
 */
export async function getCategories(): Promise<BrickCategory[]> {
  if (!categoryCache) {
    categoryCache = await loadBrickCategories();
  }
  return categoryCache;
}

/**
 * Clears the brick cache (useful after updates).
 */
export function clearBrickCache(): void {
  brickCache = null;
  categoryCache = null;
}
