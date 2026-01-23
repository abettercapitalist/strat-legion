/**
 * Communication Brick Executors
 *
 * Executors for communication and coordination bricks.
 * Bricks: request_meeting, record_decision, assign_ownership
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// REQUEST MEETING
// ============================================================================

const requestMeeting: BrickExecutor = async (inputs, context) => {
  const {
    attendees,
    subject,
    duration_minutes,
    preferred_times,
    meeting_type,
    agenda,
  } = inputs;

  const meetingRequestId = `mtg_req_${Date.now()}`;

  // This brick pauses waiting for meeting to be scheduled
  return {
    status: 'waiting_for_event',
    outputs: {
      meeting_request_id: meetingRequestId,
      requested_at: new Date().toISOString(),
    },
    pending_action: {
      type: 'event',
      brick_id: 'request_meeting',
      brick_name: 'Request Meeting',
      node_id: context.execution.node_id,
      description: `Meeting request: ${subject || 'Meeting'}`,
      config: {
        attendees: attendees || [],
        subject,
        duration_minutes: duration_minutes || 30,
        preferred_times,
        meeting_type: meeting_type || 'virtual',
        agenda,
        workstream_id: context.workstream.id,
      },
    },
  };
};

// ============================================================================
// RECORD DECISION
// ============================================================================

const recordDecision: BrickExecutor = async (inputs, context) => {
  const { decision_type, decision_value, rationale, evidence } = inputs;

  const decisionId = `decision_${Date.now()}`;

  return {
    status: 'completed',
    outputs: {
      decision_recorded: true,
      decision_id: decisionId,
      decision_type: decision_type,
      decision_value: decision_value,
      rationale: rationale,
      evidence: evidence,
      recorded_by: context.user?.id,
      recorded_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// ASSIGN OWNERSHIP
// ============================================================================

const assignOwnership: BrickExecutor = async (inputs, context) => {
  const { assignee, scope, authority_level, duration } = inputs;

  const assignmentId = `assign_${Date.now()}`;

  return {
    status: 'completed',
    outputs: {
      assignment_id: assignmentId,
      assignee: assignee,
      scope: scope,
      authority_level: authority_level || 'contributor',
      duration: duration,
      assigned_at: new Date().toISOString(),
      assigned_by: context.user?.id,
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const communicationExecutors: BrickRegistry = {
  request_meeting: requestMeeting,
  record_decision: recordDecision,
  assign_ownership: assignOwnership,
};
