/**
 * Approval Brick Executors
 *
 * Executors for approval workflow bricks.
 * Bricks: require_approval, auto_approve, escalate_approval, delegate_approval
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// REQUIRE APPROVAL
// ============================================================================

const requireApproval: BrickExecutor = async (inputs, context) => {
  const {
    approver_role,
    decision_options,
    sla_hours,
    escalation_rules,
    approval_context,
  } = inputs;

  // Check if approval has already been provided
  const existingDecision = context.play_config.approval_decision ??
                          context.previous_outputs.approval_decision;

  if (existingDecision) {
    return {
      status: 'completed',
      outputs: {
        decision: existingDecision,
        reasoning: context.play_config.approval_reasoning,
        decided_by: context.play_config.approved_by ?? context.user?.id,
        decided_at: context.play_config.approved_at ?? new Date().toISOString(),
      },
    };
  }

  // This brick pauses execution waiting for approval
  return {
    status: 'waiting_for_input',
    outputs: {},
    pending_action: {
      type: 'approval',
      brick_id: 'require_approval',
      brick_name: 'Require Approval',
      node_id: context.execution.node_id,
      description: `Approval required from ${approver_role}`,
      config: {
        approver_role,
        decision_options: decision_options || ['approve', 'reject', 'request_more_info'],
        sla_hours,
        escalation_rules,
        approval_context,
        workstream_id: context.workstream.id,
        play_id: context.execution.play_id,
      },
    },
  };
};

// ============================================================================
// AUTO APPROVE
// ============================================================================

const autoApprove: BrickExecutor = async (inputs, context) => {
  const {
    conditions,
    condition_logic,
    fallback_to_manual,
    fallback_approver_role,
  } = inputs;

  const conditionArray = Array.isArray(conditions) ? conditions : [];
  const results: boolean[] = [];

  // Evaluate each condition
  for (const condition of conditionArray) {
    const { field, operator, value } = condition as {
      field: string;
      operator: string;
      value: unknown;
    };

    const actualValue = context.previous_outputs[field] ??
                       context.workstream[field] ??
                       context.play_config[field];

    let met = false;

    switch (operator) {
      case '=':
      case '==':
        met = actualValue === value;
        break;
      case '!=':
        met = actualValue !== value;
        break;
      case '>':
        met = Number(actualValue) > Number(value);
        break;
      case '>=':
        met = Number(actualValue) >= Number(value);
        break;
      case '<':
        met = Number(actualValue) < Number(value);
        break;
      case '<=':
        met = Number(actualValue) <= Number(value);
        break;
      case 'in':
        met = Array.isArray(value) && value.includes(actualValue);
        break;
      case 'not_in':
        met = Array.isArray(value) && !value.includes(actualValue);
        break;
      case 'exists':
        met = actualValue !== undefined && actualValue !== null;
        break;
      case 'not_exists':
        met = actualValue === undefined || actualValue === null;
        break;
      default:
        met = actualValue === value;
    }

    results.push(met);
  }

  const logic = condition_logic === 'OR' ? 'OR' : 'AND';
  const conditionsMet = conditionArray.length === 0 ? true :
    logic === 'OR' ? results.some(Boolean) : results.every(Boolean);

  // If conditions are met, auto-approve
  if (conditionsMet) {
    return {
      status: 'completed',
      outputs: {
        auto_approved: true,
        conditions_met: results,
        fallback_triggered: false,
        decision: 'approve',
        decided_by: 'system',
        decided_at: new Date().toISOString(),
        reasoning: 'Automatically approved - all conditions met',
      },
    };
  }

  // Conditions not met
  if (fallback_to_manual) {
    return {
      status: 'completed',
      outputs: {
        auto_approved: false,
        conditions_met: results,
        fallback_triggered: true,
        needs_manual_approval: true,
        fallback_approver: fallback_approver_role,
      },
    };
  }

  // No fallback, just report conditions not met
  return {
    status: 'completed',
    outputs: {
      auto_approved: false,
      conditions_met: results,
      fallback_triggered: false,
      reasoning: 'Auto-approval conditions not met',
    },
  };
};

// ============================================================================
// ESCALATE APPROVAL
// ============================================================================

const escalateApproval: BrickExecutor = async (inputs, context) => {
  const { escalate_to_role, escalation_reason, urgency } = inputs;

  const escalationId = `escalation_${Date.now()}`;

  return {
    status: 'completed',
    outputs: {
      escalation_status: true,
      escalation_id: escalationId,
      escalated_to_role: escalate_to_role,
      escalation_reason: escalation_reason,
      urgency: urgency || 'medium',
      escalated_at: new Date().toISOString(),
      escalated_by: context.user?.id,
    },
  };
};

// ============================================================================
// DELEGATE APPROVAL
// ============================================================================

const delegateApproval: BrickExecutor = async (inputs, context) => {
  const { delegate_to, delegation_reason, retain_visibility } = inputs;

  const delegationId = `delegation_${Date.now()}`;

  return {
    status: 'completed',
    outputs: {
      delegation_status: true,
      delegation_id: delegationId,
      delegated_to: delegate_to,
      delegation_reason: delegation_reason,
      retain_visibility: retain_visibility !== false,
      delegated_at: new Date().toISOString(),
      delegated_by: context.user?.id,
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const approvalExecutors: BrickRegistry = {
  require_approval: requireApproval,
  auto_approve: autoApprove,
  escalate_approval: escalateApproval,
  delegate_approval: delegateApproval,
};
