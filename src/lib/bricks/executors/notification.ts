/**
 * Notification Brick Executors
 *
 * Executors for notification and communication bricks.
 * Bricks: send_notification, schedule_task, request_meeting, send_external
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// SEND NOTIFICATION (Brick #21)
// ============================================================================

const sendNotification: BrickExecutor = async (inputs, context) => {
  const { recipient, message, channel, urgency, action_url, metadata } = inputs;

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
      channel: channel || 'in_app',
      urgency: urgency || 'medium',
      delivered_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// SCHEDULE TASK (Brick #22)
// ============================================================================

const scheduleTask: BrickExecutor = async (inputs, context) => {
  const { assignee, due_date, description, priority, calendar_type, reminders } = inputs;

  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    status: 'completed',
    outputs: {
      task_id: taskId,
      assignee: assignee,
      due_date: due_date,
      description: description,
      priority: priority || 'medium',
      calendar_type: calendar_type || 'task',
      scheduled_at: new Date().toISOString(),
      reminders_set: reminders || [],
    },
  };
};

// ============================================================================
// REQUEST MEETING (Brick #23)
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
// SEND EXTERNAL (Brick #24)
// ============================================================================

const sendExternal: BrickExecutor = async (inputs, context) => {
  const {
    recipient_email,
    recipient_name,
    subject,
    message,
    template,
    attachments,
    cc,
    bcc,
  } = inputs;

  const emailId = `email_${Date.now()}`;

  // In a real implementation, this would send an actual email
  return {
    status: 'completed',
    outputs: {
      email_id: emailId,
      email_sent: true,
      recipient: recipient_email,
      subject: subject,
      sent_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// BROADCAST (Brick #74)
// ============================================================================

const broadcast: BrickExecutor = async (inputs, context) => {
  const { recipient_group, message, channels, urgency } = inputs;

  const broadcastId = `broadcast_${Date.now()}`;

  return {
    status: 'completed',
    outputs: {
      broadcast_id: broadcastId,
      broadcast_sent: true,
      recipient_group: recipient_group,
      channels_used: channels || ['in_app'],
      sent_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const notificationExecutors: BrickRegistry = {
  send_notification: sendNotification,
  schedule_task: scheduleTask,
  request_meeting: requestMeeting,
  send_external: sendExternal,
  broadcast: broadcast,
};
