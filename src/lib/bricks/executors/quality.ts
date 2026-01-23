/**
 * Quality Brick Executors
 *
 * Executors for quality assurance bricks.
 * Bricks: require_peer_review
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// REQUIRE PEER REVIEW
// ============================================================================

const requirePeerReview: BrickExecutor = async (inputs, context) => {
  const {
    reviewer_role,
    reviewer_id,
    review_type,
    review_criteria,
    sla_hours,
  } = inputs;

  const reviewRequestId = `review_${Date.now()}`;

  // This brick pauses waiting for peer review
  return {
    status: 'waiting_for_input',
    outputs: {
      review_request_id: reviewRequestId,
      requested_at: new Date().toISOString(),
    },
    pending_action: {
      type: 'review',
      brick_id: 'require_peer_review',
      brick_name: 'Require Peer Review',
      node_id: context.execution.node_id,
      description: reviewer_role
        ? `Peer review required from ${reviewer_role}`
        : 'Peer review required',
      config: {
        reviewer_role,
        reviewer_id,
        review_type: review_type || 'approval',
        review_criteria,
        sla_hours,
        workstream_id: context.workstream.id,
        play_id: context.execution.play_id,
      },
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const qualityExecutors: BrickRegistry = {
  require_peer_review: requirePeerReview,
};
