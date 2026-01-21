/**
 * Brick Registry
 *
 * Central registry that maps brick names to their executor functions.
 * Executors are lazily loaded and organized by category.
 */

import type { BrickExecutor, BrickRegistry } from './types';

// Import executors by category
import { dataExecutors } from './executors/data';
import { approvalExecutors } from './executors/approval';
import { documentExecutors } from './executors/document';
import { workflowExecutors } from './executors/workflow';
import { notificationExecutors } from './executors/notification';
import { logicExecutors } from './executors/logic';

// ============================================================================
// REGISTRY BUILDER
// ============================================================================

/**
 * Combines all executor modules into a single registry.
 */
function buildRegistry(): BrickRegistry {
  return {
    ...dataExecutors,
    ...approvalExecutors,
    ...documentExecutors,
    ...workflowExecutors,
    ...notificationExecutors,
    ...logicExecutors,
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
