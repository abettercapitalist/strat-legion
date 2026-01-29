/**
 * Approval Brick Executor
 *
 * Handles authorization decisions with support for auto-approval rules,
 * escalation, and delegation.
 * Absorbs: require_approval, auto_approve, escalate_approval, delegate_approval
 */

import type { BrickExecutor, ApprovalBrickConfig, AutoApprovalRule } from '../types';

/**
 * Evaluates auto-approval conditions against the execution context.
 */
function evaluateAutoApprovalRules(
  rules: AutoApprovalRule[],
  conditionLogic: 'AND' | 'OR',
  context: { previous_outputs: Record<string, unknown>; workstream: Record<string, unknown>; play_config: Record<string, unknown> }
): boolean {
  if (rules.length === 0) return false;

  const results = rules.map(rule => {
    const actualValue = context.previous_outputs[rule.field] ??
                        context.workstream[rule.field] ??
                        context.play_config[rule.field];

    switch (rule.operator) {
      case '=': return actualValue === rule.value;
      case '!=': return actualValue !== rule.value;
      case '>': return Number(actualValue) > Number(rule.value);
      case '>=': return Number(actualValue) >= Number(rule.value);
      case '<': return Number(actualValue) < Number(rule.value);
      case '<=': return Number(actualValue) <= Number(rule.value);
      case 'in': return Array.isArray(rule.value) && rule.value.includes(actualValue);
      case 'not_in': return Array.isArray(rule.value) && !rule.value.includes(actualValue);
      case 'exists': return actualValue !== undefined && actualValue !== null;
      case 'not_exists': return actualValue === undefined || actualValue === null;
      default: return actualValue === rule.value;
    }
  });

  return conditionLogic === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

/**
 * Approval executor: handles approve/reject decisions, auto-approval,
 * escalation, and delegation in a single configurable brick.
 */
export const approvalExecutor: BrickExecutor = async (inputs, context) => {
  const config = (inputs._brick_config || inputs) as Partial<ApprovalBrickConfig>;

  // Step 1: Check if auto-approval conditions are met
  if (config.conditional_logic && config.conditional_logic.length > 0) {
    const conditionLogic = config.condition_logic || 'AND';
    const autoApproved = evaluateAutoApprovalRules(
      config.conditional_logic,
      conditionLogic,
      context
    );

    if (autoApproved) {
      return {
        status: 'completed',
        outputs: {
          decision: 'approve',
          reasoning: 'Automatically approved — all conditions met',
          decided_by: 'system',
          decided_at: new Date().toISOString(),
          auto_approved: true,
          escalated: false,
          delegated: false,
        },
      };
    }
  }

  // Step 2: Check if a human decision has already been provided
  const existingDecision = context.play_config.approval_decision ??
                           context.previous_outputs.approval_decision;

  if (existingDecision) {
    return {
      status: 'completed',
      outputs: {
        decision: existingDecision,
        reasoning: context.play_config.approval_reasoning ?? '',
        decided_by: context.play_config.approved_by ?? context.user?.id,
        decided_at: context.play_config.approved_at ?? new Date().toISOString(),
        auto_approved: false,
        escalated: Boolean(context.play_config.escalated),
        delegated: Boolean(context.play_config.delegated),
      },
    };
  }

  // Step 3: Pause execution waiting for human approval
  const approverRole = config.approver?.role_id ?? 'approver';
  const decisionOptions = config.decision_options || ['approve', 'reject', 'request_more_info'];

  return {
    status: 'waiting_for_input',
    outputs: {},
    pending_action: {
      type: 'approval',
      brick_id: 'approval',
      brick_name: 'Approval',
      node_id: context.execution.node_id,
      description: `Approval required from ${approverRole}`,
      config: {
        approver: config.approver,
        decision_options: decisionOptions,
        escalation: config.escalation,
        delegation: config.delegation,
        sla: config.sla,
        workstream_id: context.workstream.id,
        play_id: context.execution.play_id,
      },
    },
  };
};
