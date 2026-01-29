/**
 * Brick Registry
 *
 * Central registry that maps brick names to their executor functions.
 * Supports the consolidated architecture with 5 brick types.
 */

import type { BrickExecutor, BrickRegistry } from './types';

// Import executors (5 brick types)
import { collectionExecutor } from './executors/collection';
import { reviewExecutor } from './executors/review';
import { approvalExecutor } from './executors/approval';
import { documentationExecutor } from './executors/documentation';
import { commitmentExecutor } from './executors/commitment';

// ============================================================================
// REGISTRY BUILDER
// ============================================================================

/**
 * Combines all executor modules into a single registry.
 * Total: 5 brick types
 *
 * collection — form fields, validation, data gathering
 * review     — checklist/scored/qualitative assessment
 * approval   — authorize/reject with auto-approve, escalation, delegation
 * documentation — template merge, storage, distribution
 * commitment — e-signature workflow
 */
function buildRegistry(): BrickRegistry {
  return {
    collection: collectionExecutor,
    review: reviewExecutor,
    approval: approvalExecutor,
    documentation: documentationExecutor,
    commitment: commitmentExecutor,
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
