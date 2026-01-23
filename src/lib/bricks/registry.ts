/**
 * Brick Registry
 *
 * Central registry that maps brick names to their executor functions.
 * Supports the refined architecture with 26 bricks across 6 categories.
 */

import type { BrickExecutor, BrickRegistry } from './types';

// Import executors by category (6 categories, 26 bricks)
import { dataExecutors } from './executors/data';           // 7 bricks
import { approvalExecutors } from './executors/approval';   // 4 bricks
import { documentExecutors } from './executors/document';   // 6 bricks
import { workflowExecutors } from './executors/workflow';   // 5 bricks
import { communicationExecutors } from './executors/communication'; // 3 bricks
import { qualityExecutors } from './executors/quality';     // 1 brick

// ============================================================================
// REGISTRY BUILDER
// ============================================================================

/**
 * Combines all executor modules into a single registry.
 * Total: 26 bricks
 *
 * data (7): collect_data, validate_data, calculate_value, store_data,
 *           retrieve_data, transform_data, delete_data
 *
 * approval (4): require_approval, auto_approve, escalate_approval, delegate_approval
 *
 * document (6): generate_document, collect_document, validate_document,
 *               store_document, send_document, collect_signature
 *
 * workflow (5): handoff_workstream, wait_for_event, wait_for_duration,
 *               send_notification, schedule_task
 *
 * communication (3): request_meeting, record_decision, assign_ownership
 *
 * quality (1): require_peer_review
 */
function buildRegistry(): BrickRegistry {
  return {
    ...dataExecutors,
    ...approvalExecutors,
    ...documentExecutors,
    ...workflowExecutors,
    ...communicationExecutors,
    ...qualityExecutors,
  };
}

// ============================================================================
// SINGLETON REGISTRY
// ============================================================================

let registry: BrickRegistry | null = null;

/**
 * Gets the global brick registry, creating it if necessary.
 */
export function getBrickRegistry(): BrickRegistry {
  if (!registry) {
    registry = buildRegistry();
  }
  return registry;
}

/**
 * Registers a custom executor for a brick.
 * Useful for extending the system with custom bricks.
 */
export function registerBrickExecutor(
  brickName: string,
  executor: BrickExecutor
): void {
  const reg = getBrickRegistry();
  reg[brickName] = executor;
}

/**
 * Checks if an executor is registered for a brick.
 */
export function hasExecutor(brickName: string): boolean {
  const reg = getBrickRegistry();
  return brickName in reg;
}

/**
 * Gets the executor for a brick, or undefined if not registered.
 */
export function getExecutor(brickName: string): BrickExecutor | undefined {
  const reg = getBrickRegistry();
  return reg[brickName];
}

/**
 * Lists all registered brick names.
 */
export function listRegisteredBricks(): string[] {
  const reg = getBrickRegistry();
  return Object.keys(reg);
}

/**
 * Clears the registry (useful for testing).
 */
export function clearRegistry(): void {
  registry = null;
}
