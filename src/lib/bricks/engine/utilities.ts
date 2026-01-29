/**
 * Engine Utilities
 *
 * Internal utility functions for cross-cutting concerns that were previously
 * modeled as bricks but are actually engine-level behaviors.
 *
 * These are NOT registered as bricks. They are callable from:
 * - SLA/notification configuration on any brick
 * - Edge conditions (wait behaviors)
 * - Input/output transforms
 */

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================

/**
 * Sends a notification. Called internally by the engine when a brick's
 * notification config triggers (on_assigned, on_sla_warning, on_completed).
 */
export async function sendNotification(params: {
  recipient: string | string[];
  message: string;
  channel?: 'in_app' | 'email';
  urgency?: 'low' | 'medium' | 'high';
  workstream_id?: string;
}): Promise<{ notification_id: string; sent_at: string }> {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // In a real implementation, this would call the notification service
  console.log('[EngineUtilities] Notification sent:', {
    id: notificationId,
    ...params,
  });

  return {
    notification_id: notificationId,
    sent_at: new Date().toISOString(),
  };
}

// ============================================================================
// WAIT / TIMER UTILITIES
// ============================================================================

/**
 * Checks whether a wait-for-event condition has been satisfied.
 * Used as an edge condition in the DAG.
 */
export function checkEventReceived(
  eventType: string,
  context: { play_config: Record<string, unknown> }
): boolean {
  return Boolean(context.play_config[`event_${eventType}_received`]);
}

/**
 * Checks whether a duration-based wait has elapsed.
 * Used as an edge condition in the DAG.
 */
export function checkDurationElapsed(
  resumeAt: string
): boolean {
  return new Date() >= new Date(resumeAt);
}

// ============================================================================
// TRANSFORM UTILITIES
// ============================================================================

/**
 * Calculates a value from a formula with field references.
 * Used as a computed field in collection configs.
 */
export function calculateValue(
  formula: string,
  values: Record<string, unknown>
): unknown {
  let expr = formula;

  for (const [key, val] of Object.entries(values)) {
    expr = expr.replace(new RegExp(`\\$${key}`, 'g'), String(val ?? 0));
  }

  // Only evaluate simple math expressions
  if (/^[\d\s+\-*/%().]+$/.test(expr)) {
    try {
      return Function(`"use strict"; return (${expr})`)();
    } catch {
      return expr;
    }
  }

  return expr;
}

/**
 * Transforms a value using a named transformation.
 */
export function transformValue(
  value: unknown,
  transformType: string
): unknown {
  switch (transformType) {
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'to_number':
      return Number(value);
    case 'to_string':
      return String(value);
    case 'to_boolean':
      return Boolean(value);
    case 'json_parse':
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return value; }
      }
      return value;
    case 'json_stringify':
      return JSON.stringify(value);
    default:
      return value;
  }
}
