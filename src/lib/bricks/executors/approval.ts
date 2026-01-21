/**
 * Approval Brick Executors
 *
 * Executors for approval workflow bricks.
 * Bricks: check_threshold, check_criteria, require_approval, auto_approve,
 *         multi_stage_approval, delegate_approval, record_decision
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// CHECK THRESHOLD (Brick #6)
// ============================================================================

const checkThreshold: BrickExecutor = async (inputs, context) => {
  const { field, operator, threshold, unit } = inputs;

  const value = context.previous_outputs[String(field)] ??
                context.workstream[String(field)];

  let exceeds = false;
  const numValue = Number(value);
  const numThreshold = Number(threshold);

  if (!isNaN(numValue) && !isNaN(numThreshold)) {
    switch (operator) {
      case '>':
        exceeds = numValue > numThreshold;
        break;
      case '>=':
        exceeds = numValue >= numThreshold;
        break;
      case '<':
        exceeds = numValue < numThreshold;
        break;
      case '<=':
        exceeds = numValue <= numThreshold;
        break;
      case '=':
      case '==':
        exceeds = numValue === numThreshold;
        break;
      case '!=':
        exceeds = numValue !== numThreshold;
        break;
      default:
        exceeds = numValue > numThreshold;
    }
  }

  return {
    status: 'completed',
    outputs: {
      exceeds_threshold: exceeds,
      actual_value: numValue,
      threshold_value: numThreshold,
      comparison: `${numValue} ${operator || '>'} ${numThreshold}`,
    },
  };
};

// ============================================================================
// CHECK CRITERIA (Brick #7)
// ============================================================================

const checkCriteria: BrickExecutor = async (inputs, context) => {
  const { criteria_list, match_mode } = inputs;

  const criteriaArray = Array.isArray(criteria_list) ? criteria_list : [];
  const results: boolean[] = [];

  for (const criterion of criteriaArray) {
    const { field, operator, value } = criterion as {
      field: string;
      operator: string;
      value: unknown;
    };

    const actualValue = context.previous_outputs[field] ?? context.workstream[field];
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
      case 'contains':
        met = String(actualValue).includes(String(value));
        break;
      case 'in':
        met = Array.isArray(value) && value.includes(actualValue);
        break;
      default:
        met = actualValue === value;
    }

    results.push(met);
  }

  const allMet = results.every(Boolean);
  const anyMet = results.some(Boolean);
  const criteriaMet = match_mode === 'any' ? anyMet : allMet;

  return {
    status: 'completed',
    outputs: {
      all_criteria_met: allMet,
      any_criteria_met: anyMet,
      criteria_met: criteriaMet,
      results_by_criterion: results,
    },
  };
};

// ============================================================================
// REQUIRE APPROVAL (Brick #8)
// ============================================================================

const requireApproval: BrickExecutor = async (inputs, context) => {
  const {
    approver_role,
    decision_options,
    sla_hours,
    escalation_rules,
    approval_context,
    info_request_config,
  } = inputs;

  // This brick pauses execution waiting for approval
  return {
    status: 'waiting_for_input',
    outputs: {},
    pending_action: {
      type: 'approval',
      brick_id: 'require_approval',
      brick_name: 'Require Approval',
      description: `Approval required from ${approver_role}`,
      config: {
        approver_role,
        decision_options: decision_options || ['approve', 'reject', 'request_more_info'],
        sla_hours,
        escalation_rules,
        approval_context,
        info_request_config,
        workstream_id: context.workstream.id,
        step_id: context.execution.step_id,
      },
    },
  };
};

// ============================================================================
// AUTO APPROVE (Brick #9)
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
                       context.step_config[field];

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
      default:
        met = actualValue === value;
    }

    results.push(met);
  }

  const logic = condition_logic === 'OR' ? 'OR' : 'AND';
  const conditionsMet = logic === 'OR'
    ? results.some(Boolean)
    : results.every(Boolean);

  // If conditions are met, auto-approve
  if (conditionsMet || conditionArray.length === 0) {
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
// MULTI STAGE APPROVAL (Brick #10)
// ============================================================================

const multiStageApproval: BrickExecutor = async (inputs, context) => {
  const { stages, current_stage, require_all_stages } = inputs;

  const stageArray = Array.isArray(stages) ? stages : [];
  const currentIdx = typeof current_stage === 'number' ? current_stage : 0;

  if (currentIdx >= stageArray.length) {
    // All stages complete
    return {
      status: 'completed',
      outputs: {
        all_stages_complete: true,
        current_stage: currentIdx,
        total_stages: stageArray.length,
      },
    };
  }

  const currentStage = stageArray[currentIdx] as {
    approver_role: string;
    stage_name: string;
  };

  return {
    status: 'waiting_for_input',
    outputs: {
      all_stages_complete: false,
      current_stage: currentIdx,
      total_stages: stageArray.length,
    },
    pending_action: {
      type: 'approval',
      brick_id: 'multi_stage_approval',
      brick_name: `Stage ${currentIdx + 1}: ${currentStage.stage_name || 'Approval'}`,
      description: `Stage ${currentIdx + 1} of ${stageArray.length}: Approval required from ${currentStage.approver_role}`,
      config: {
        stage: currentStage,
        stage_index: currentIdx,
        total_stages: stageArray.length,
        workstream_id: context.workstream.id,
      },
    },
  };
};

// ============================================================================
// DELEGATE APPROVAL (Brick #11)
// ============================================================================

const delegateApproval: BrickExecutor = async (inputs, context) => {
  const { original_approver, delegate_to, reason, expires_at } = inputs;

  // Record the delegation
  return {
    status: 'completed',
    outputs: {
      delegation_recorded: true,
      original_approver: original_approver,
      delegated_to: delegate_to,
      delegation_reason: reason,
      delegation_expires: expires_at,
      delegated_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// RECORD DECISION (Brick #38)
// ============================================================================

const recordDecision: BrickExecutor = async (inputs, context) => {
  const { decision_type, decision_value, decision_by, rationale, evidence } = inputs;

  return {
    status: 'completed',
    outputs: {
      decision_recorded: true,
      decision_type: decision_type,
      decision_value: decision_value,
      decided_by: decision_by || context.user?.id,
      rationale: rationale,
      evidence: evidence,
      recorded_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const approvalExecutors: BrickRegistry = {
  check_threshold: checkThreshold,
  check_criteria: checkCriteria,
  require_approval: requireApproval,
  auto_approve: autoApprove,
  multi_stage_approval: multiStageApproval,
  delegate_approval: delegateApproval,
  record_decision: recordDecision,
};
