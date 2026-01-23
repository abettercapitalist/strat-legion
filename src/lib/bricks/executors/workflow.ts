/**
 * Workflow Brick Executors
 *
 * Executors for workflow control and orchestration bricks.
 * Bricks: handoff_workstream, wait_for_event, wait_for_duration,
 *         send_notification, schedule_task
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// HANDOFF WORKSTREAM
// ============================================================================

const handoffWorkstream: BrickExecutor = async (inputs, context) => {
  const { handoff_type, target_workstream_type, handoff_data, wait_for_completion } = inputs;

  const handoffId = `handoff_${Date.now()}`;

  // In a real implementation, this would create the handoff record and
  // potentially spawn a new workstream
  if (wait_for_completion) {
    return {
      status: 'waiting_for_event',
      outputs: {
        handoff_id: handoffId,
        initiated_at: new Date().toISOString(),
      },
      pending_action: {
        type: 'event',
        brick_id: 'handoff_workstream',
        brick_name: 'Handoff Workstream',
        node_id: context.execution.node_id,
        description: `Waiting for ${handoff_type} handoff to complete`,
        config: {
          handoff_type,
          target_workstream_type,
          handoff_data,
          source_workstream_id: context.workstream.id,
        },
      },
    };
  }

  return {
    status: 'completed',
    outputs: {
      handoff_id: handoffId,
      handoff_type: handoff_type,
      target_workstream_type: target_workstream_type,
      handoff_status: 'initiated',
      initiated_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// WAIT FOR EVENT
// ============================================================================

const waitForEvent: BrickExecutor = async (inputs, context) => {
  const { event_type, event_source, timeout_hours, timeout_action } = inputs;

  // Check if event has been received
  const eventReceived = context.play_config.event_received;

  if (eventReceived) {
    return {
      status: 'completed',
      outputs: {
        event_received: true,
        event_data: context.play_config.event_data || {},
        received_at: context.play_config.event_received_at ?? new Date().toISOString(),
      },
    };
  }

  return {
    status: 'waiting_for_event',
    outputs: {
      waiting_since: new Date().toISOString(),
    },
    pending_action: {
      type: 'event',
      brick_id: 'wait_for_event',
      brick_name: 'Wait for Event',
      node_id: context.execution.node_id,
      description: `Waiting for: ${event_type}`,
      config: {
        event_type,
        event_source,
        timeout_hours,
        timeout_action,
        workstream_id: context.workstream.id,
      },
    },
  };
};

// ============================================================================
// WAIT FOR DURATION
// ============================================================================

const waitForDuration: BrickExecutor = async (inputs, context) => {
  const { duration_minutes, duration_until, reason } = inputs;

  // Check if wait has completed
  const waitCompleted = context.play_config.wait_completed;

  if (waitCompleted) {
    return {
      status: 'completed',
      outputs: {
        waited: true,
        resume_at: context.play_config.resume_at,
        actual_duration_minutes: context.play_config.actual_duration_minutes,
      },
    };
  }

  let resumeAt: string;

  if (duration_until) {
    resumeAt = String(duration_until);
  } else if (typeof duration_minutes === 'number') {
    const resumeDate = new Date();
    resumeDate.setMinutes(resumeDate.getMinutes() + duration_minutes);
    resumeAt = resumeDate.toISOString();
  } else {
    // Default to immediate (no delay)
    return {
      status: 'completed',
      outputs: {
        waited: false,
        reason: 'No delay specified',
      },
    };
  }

  return {
    status: 'waiting_for_event',
    outputs: {
      resume_at: resumeAt,
      wait_started: new Date().toISOString(),
    },
    pending_action: {
      type: 'event',
      brick_id: 'wait_for_duration',
      brick_name: 'Wait for Duration',
      node_id: context.execution.node_id,
      description: reason || `Waiting until ${resumeAt}`,
      config: {
        resume_at: resumeAt,
        reason,
        workstream_id: context.workstream.id,
      },
    },
  };
};

// ============================================================================
// SEND NOTIFICATION
// ============================================================================

const sendNotification: BrickExecutor = async (inputs, context) => {
  const { recipient, message, channel, urgency } = inputs;

  // In a real implementation, this would call the notification service
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Determine recipient(s)
  let recipients: string[] = [];
  if (Array.isArray(recipient)) {
    recipients = recipient.map(String);
  } else if (typeof recipient === 'string') {
    recipients = [recipient];
  }

  return {
    status: 'completed',
    outputs: {
      notification_id: notificationId,
      notification_sent: true,
      recipients: recipients,
      message: message,
      channel: channel || 'in_app',
      urgency: urgency || 'medium',
      delivered_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// SCHEDULE TASK
// ============================================================================

const scheduleTask: BrickExecutor = async (inputs, context) => {
  const { assignee, due_date, description, priority, reminders } = inputs;

  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    status: 'completed',
    outputs: {
      task_id: taskId,
      assignee: assignee,
      due_date: due_date,
      description: description,
      priority: priority || 'medium',
      scheduled_at: new Date().toISOString(),
      reminders_set: reminders || [],
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const workflowExecutors: BrickRegistry = {
  handoff_workstream: handoffWorkstream,
  wait_for_event: waitForEvent,
  wait_for_duration: waitForDuration,
  send_notification: sendNotification,
  schedule_task: scheduleTask,
};
