/**
 * Logic Brick Executors
 *
 * Executors for conditional logic and flow control bricks.
 * Bricks: if_then, switch_case, loop_until, for_each, evaluate_expression
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// IF THEN (Brick #31)
// ============================================================================

const ifThen: BrickExecutor = async (inputs, context) => {
  const { condition, then_value, else_value } = inputs;

  let conditionResult = false;

  // Evaluate the condition
  if (typeof condition === 'boolean') {
    conditionResult = condition;
  } else if (typeof condition === 'object' && condition !== null) {
    // Condition object with field, operator, value
    const { field, operator, value } = condition as {
      field: string;
      operator: string;
      value: unknown;
    };

    const actualValue = context.previous_outputs[field] ??
                       context.workstream[field] ??
                       context.step_config[field];

    switch (operator) {
      case '=':
      case '==':
        conditionResult = actualValue === value;
        break;
      case '!=':
        conditionResult = actualValue !== value;
        break;
      case '>':
        conditionResult = Number(actualValue) > Number(value);
        break;
      case '>=':
        conditionResult = Number(actualValue) >= Number(value);
        break;
      case '<':
        conditionResult = Number(actualValue) < Number(value);
        break;
      case '<=':
        conditionResult = Number(actualValue) <= Number(value);
        break;
      case 'exists':
        conditionResult = actualValue !== undefined && actualValue !== null;
        break;
      case 'not_exists':
        conditionResult = actualValue === undefined || actualValue === null;
        break;
      case 'contains':
        conditionResult = String(actualValue).includes(String(value));
        break;
      case 'in':
        conditionResult = Array.isArray(value) && value.includes(actualValue);
        break;
      default:
        conditionResult = Boolean(actualValue);
    }
  } else {
    conditionResult = Boolean(condition);
  }

  return {
    status: 'completed',
    outputs: {
      condition_met: conditionResult,
      result: conditionResult ? then_value : else_value,
      branch_taken: conditionResult ? 'then' : 'else',
    },
  };
};

// ============================================================================
// SWITCH CASE (Brick #32)
// ============================================================================

const switchCase: BrickExecutor = async (inputs, context) => {
  const { switch_value, cases, default_case } = inputs;

  // Get the actual value to switch on
  let actualValue: unknown;
  if (typeof switch_value === 'string' && switch_value.startsWith('$')) {
    // Reference to a field
    const fieldName = switch_value.slice(1);
    actualValue = context.previous_outputs[fieldName] ??
                  context.workstream[fieldName] ??
                  context.step_config[fieldName];
  } else {
    actualValue = switch_value;
  }

  // Find matching case
  const casesObj = cases as Record<string, unknown> | undefined;
  let matchedCase: string | undefined;
  let result: unknown = default_case;

  if (casesObj) {
    for (const [caseValue, caseResult] of Object.entries(casesObj)) {
      if (String(actualValue) === caseValue) {
        matchedCase = caseValue;
        result = caseResult;
        break;
      }
    }
  }

  return {
    status: 'completed',
    outputs: {
      matched_case: matchedCase || 'default',
      result: result,
      switch_value: actualValue,
    },
  };
};

// ============================================================================
// LOOP UNTIL (Brick #33)
// ============================================================================

const loopUntil: BrickExecutor = async (inputs, context) => {
  const { condition, max_iterations, current_iteration } = inputs;

  const iteration = typeof current_iteration === 'number' ? current_iteration : 0;
  const maxIter = typeof max_iterations === 'number' ? max_iterations : 100;

  // Check if we've hit max iterations
  if (iteration >= maxIter) {
    return {
      status: 'completed',
      outputs: {
        loop_complete: true,
        exit_reason: 'max_iterations',
        final_iteration: iteration,
      },
    };
  }

  // Evaluate condition (same logic as if_then)
  let conditionMet = false;
  if (typeof condition === 'boolean') {
    conditionMet = condition;
  } else if (typeof condition === 'object' && condition !== null) {
    const { field, operator, value } = condition as {
      field: string;
      operator: string;
      value: unknown;
    };

    const actualValue = context.previous_outputs[field];

    switch (operator) {
      case '=':
      case '==':
        conditionMet = actualValue === value;
        break;
      case '!=':
        conditionMet = actualValue !== value;
        break;
      default:
        conditionMet = Boolean(actualValue);
    }
  }

  if (conditionMet) {
    return {
      status: 'completed',
      outputs: {
        loop_complete: true,
        exit_reason: 'condition_met',
        final_iteration: iteration,
      },
    };
  }

  // Continue loop
  return {
    status: 'completed',
    outputs: {
      loop_complete: false,
      current_iteration: iteration + 1,
      continue_loop: true,
    },
  };
};

// ============================================================================
// FOR EACH (Brick #34)
// ============================================================================

const forEach: BrickExecutor = async (inputs, context) => {
  const { collection, item_variable, current_index } = inputs;

  const items = Array.isArray(collection) ? collection : [];
  const index = typeof current_index === 'number' ? current_index : 0;

  if (index >= items.length) {
    return {
      status: 'completed',
      outputs: {
        iteration_complete: true,
        total_items: items.length,
        final_index: index,
      },
    };
  }

  const currentItem = items[index];

  return {
    status: 'completed',
    outputs: {
      iteration_complete: false,
      [String(item_variable || 'current_item')]: currentItem,
      current_index: index,
      next_index: index + 1,
      remaining_items: items.length - index - 1,
      total_items: items.length,
    },
  };
};

// ============================================================================
// EVALUATE EXPRESSION (Brick #35)
// ============================================================================

const evaluateExpression: BrickExecutor = async (inputs, context) => {
  const { expression, variables } = inputs;

  // Simple expression evaluator for basic math and string operations
  // In a real implementation, this would use a safe expression parser
  let result: unknown = null;

  if (typeof expression === 'string') {
    // Replace variables in expression
    let expr = expression;
    const vars = variables as Record<string, unknown> | undefined;

    if (vars) {
      for (const [varName, varValue] of Object.entries(vars)) {
        expr = expr.replace(new RegExp(`\\$${varName}`, 'g'), String(varValue));
      }
    }

    // Also replace context references
    expr = expr.replace(/\$previous\.(\w+)/g, (_, field) => {
      return String(context.previous_outputs[field] ?? '');
    });
    expr = expr.replace(/\$workstream\.(\w+)/g, (_, field) => {
      return String(context.workstream[field] ?? '');
    });

    // Try to evaluate as a simple math expression
    try {
      // Only allow safe characters for math
      if (/^[\d\s+\-*/%().]+$/.test(expr)) {
        result = Function(`"use strict"; return (${expr})`)();
      } else {
        result = expr;
      }
    } catch {
      result = expr;
    }
  } else {
    result = expression;
  }

  return {
    status: 'completed',
    outputs: {
      result: result,
      expression: expression,
      evaluated_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// WAIT DELAY (Brick #36)
// ============================================================================

const waitDelay: BrickExecutor = async (inputs, context) => {
  const { delay_minutes, delay_until, reason } = inputs;

  let resumeAt: string;

  if (delay_until) {
    resumeAt = String(delay_until);
  } else if (typeof delay_minutes === 'number') {
    const resumeDate = new Date();
    resumeDate.setMinutes(resumeDate.getMinutes() + delay_minutes);
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

  // In a real implementation, this would schedule a resume
  return {
    status: 'waiting_for_event',
    outputs: {
      resume_at: resumeAt,
      delay_started: new Date().toISOString(),
    },
    pending_action: {
      type: 'event',
      brick_id: 'wait_delay',
      brick_name: 'Wait Delay',
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
// AGGREGATE RESULTS (Brick #37)
// ============================================================================

const aggregateResults: BrickExecutor = async (inputs, context) => {
  const { source_field, aggregation_type, group_by } = inputs;

  const sourceData = context.previous_outputs[String(source_field)];
  const items = Array.isArray(sourceData) ? sourceData : [];

  let result: unknown = null;

  switch (aggregation_type) {
    case 'count':
      result = items.length;
      break;

    case 'sum':
      result = items.reduce((acc, item) => acc + Number(item), 0);
      break;

    case 'average':
      result = items.length > 0
        ? items.reduce((acc, item) => acc + Number(item), 0) / items.length
        : 0;
      break;

    case 'min':
      result = items.length > 0 ? Math.min(...items.map(Number)) : null;
      break;

    case 'max':
      result = items.length > 0 ? Math.max(...items.map(Number)) : null;
      break;

    case 'first':
      result = items[0] ?? null;
      break;

    case 'last':
      result = items[items.length - 1] ?? null;
      break;

    case 'concat':
      result = items.join(', ');
      break;

    case 'unique':
      result = [...new Set(items)];
      break;

    default:
      result = items;
  }

  return {
    status: 'completed',
    outputs: {
      aggregated_result: result,
      aggregation_type: aggregation_type,
      source_count: items.length,
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const logicExecutors: BrickRegistry = {
  if_then: ifThen,
  switch_case: switchCase,
  loop_until: loopUntil,
  for_each: forEach,
  evaluate_expression: evaluateExpression,
  wait_delay: waitDelay,
  aggregate_results: aggregateResults,
};
