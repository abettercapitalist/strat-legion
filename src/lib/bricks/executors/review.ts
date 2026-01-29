/**
 * Review Brick Executor
 *
 * Evaluates information against defined criteria using checklist, scored,
 * or qualitative review methods with pass/fail routing.
 * Absorbs: require_peer_review, validate_document
 */

import type { BrickExecutor, ReviewBrickConfig } from '../types';

/**
 * Review executor: handles checklist, scored, and qualitative reviews
 * with configurable pass/fail outcome routing.
 */
export const reviewExecutor: BrickExecutor = async (inputs, context) => {
  const config = (inputs._brick_config || inputs) as Partial<ReviewBrickConfig>;
  const reviewType = config.review_type || 'checklist';
  const criteria = config.criteria || [];

  // Check if review has already been completed (user submitted results)
  const reviewOutcome = context.play_config.review_outcome ??
                        context.previous_outputs.review_outcome;

  if (reviewOutcome) {
    const criteriaResults = context.play_config.criteria_results ??
                            context.previous_outputs.criteria_results ?? [];
    const score = context.play_config.review_score ??
                  context.previous_outputs.review_score;

    return {
      status: 'completed',
      outputs: {
        review_outcome: reviewOutcome,
        criteria_results: criteriaResults,
        score: score,
        reviewer_comments: context.play_config.reviewer_comments ?? '',
        reviewed_by: context.play_config.reviewed_by ?? context.user?.id,
        reviewed_at: context.play_config.reviewed_at ?? new Date().toISOString(),
        review_type: reviewType,
      },
    };
  }

  // Pause for reviewer input
  const reviewRequestId = `review_${Date.now()}`;

  return {
    status: 'waiting_for_input',
    outputs: {
      review_request_id: reviewRequestId,
      requested_at: new Date().toISOString(),
    },
    pending_action: {
      type: 'review',
      brick_id: 'review',
      brick_name: 'Review',
      node_id: context.execution.node_id,
      description: config.reviewer_assignment?.role_id
        ? `Review required from ${config.reviewer_assignment.role_id}`
        : 'Review required',
      config: {
        review_type: reviewType,
        criteria,
        outcome_routing: config.outcome_routing,
        reviewer_assignment: config.reviewer_assignment,
        sla: config.sla,
        workstream_id: context.workstream.id,
        play_id: context.execution.play_id,
      },
    },
  };
};
