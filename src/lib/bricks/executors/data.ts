/**
 * Data Brick Executors
 *
 * Executors for data collection, validation, and transformation bricks.
 * Bricks: collect_data, validate_data, calculate_value, store_data,
 *         retrieve_data, transform_data, delete_data
 */

import type { BrickExecutor, BrickRegistry } from '../types';

// ============================================================================
// COLLECT DATA
// ============================================================================

const collectData: BrickExecutor = async (inputs, context) => {
  const {
    field_name,
    input_type,
    required,
    validation_rules,
    options,
  } = inputs;

  // Check if we already have the data from user input
  const existingValue = context.previous_outputs[String(field_name)] ??
                        context.play_config[String(field_name)];

  if (existingValue !== undefined) {
    return {
      status: 'completed',
      outputs: {
        collected_value: existingValue,
        collected_at: new Date().toISOString(),
      },
    };
  }

  // This brick pauses execution waiting for user input
  return {
    status: 'waiting_for_input',
    outputs: {},
    pending_action: {
      type: 'input',
      brick_id: 'collect_data',
      brick_name: 'Collect Data',
      node_id: context.execution.node_id,
      description: `Please provide: ${field_name}`,
      config: {
        field_name,
        input_type: input_type || 'text',
        required: required !== false,
        validation_rules,
        options,
        workstream_id: context.workstream.id,
      },
    },
  };
};

// ============================================================================
// VALIDATE DATA
// ============================================================================

const validateData: BrickExecutor = async (inputs, context) => {
  const { field, validation_type, validation_rules, error_message } = inputs;

  // Get the value to validate from context
  const value = context.previous_outputs[String(field)] ??
                context.play_config[String(field)];

  let isValid = true;
  const errors: string[] = [];

  // Built-in validation types
  switch (validation_type) {
    case 'required':
      if (value === undefined || value === null || value === '') {
        isValid = false;
        errors.push(error_message as string || 'This field is required');
      }
      break;

    case 'email':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        isValid = false;
        errors.push(error_message as string || 'Invalid email format');
      }
      break;

    case 'number':
      if (value && isNaN(Number(value))) {
        isValid = false;
        errors.push(error_message as string || 'Must be a number');
      }
      break;

    case 'min_length':
      const minLen = validation_rules as number;
      if (value && String(value).length < minLen) {
        isValid = false;
        errors.push(error_message as string || `Minimum length is ${minLen}`);
      }
      break;

    case 'max_length':
      const maxLen = validation_rules as number;
      if (value && String(value).length > maxLen) {
        isValid = false;
        errors.push(error_message as string || `Maximum length is ${maxLen}`);
      }
      break;

    case 'pattern':
      const pattern = validation_rules as string;
      if (value && !new RegExp(pattern).test(String(value))) {
        isValid = false;
        errors.push(error_message as string || 'Invalid format');
      }
      break;

    case 'range':
      const rules = validation_rules as { min?: number; max?: number };
      const numValue = Number(value);
      if (rules?.min !== undefined && numValue < rules.min) {
        isValid = false;
        errors.push(error_message as string || `Value must be at least ${rules.min}`);
      }
      if (rules?.max !== undefined && numValue > rules.max) {
        isValid = false;
        errors.push(error_message as string || `Value must be at most ${rules.max}`);
      }
      break;

    default:
      break;
  }

  return {
    status: 'completed',
    outputs: {
      is_valid: isValid,
      validation_errors: errors,
      validated_value: value,
      validated_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// CALCULATE VALUE
// ============================================================================

const calculateValue: BrickExecutor = async (inputs, context) => {
  const { formula, input_fields, output_field } = inputs;

  // Gather input values
  const fieldArray = Array.isArray(input_fields) ? input_fields : [];
  const values: Record<string, unknown> = {};

  for (const fieldName of fieldArray) {
    values[fieldName as string] = context.previous_outputs[fieldName as string] ??
                                   context.play_config[fieldName as string] ??
                                   context.workstream[fieldName as string];
  }

  let result: unknown = null;

  // Simple formula evaluation
  if (typeof formula === 'string') {
    let expr = formula;

    // Replace field references with values
    for (const [key, val] of Object.entries(values)) {
      expr = expr.replace(new RegExp(`\\$${key}`, 'g'), String(val ?? 0));
    }

    // Try to evaluate as a simple math expression
    try {
      if (/^[\d\s+\-*/%().]+$/.test(expr)) {
        result = Function(`"use strict"; return (${expr})`)();
      } else {
        result = expr;
      }
    } catch {
      result = expr;
    }
  }

  return {
    status: 'completed',
    outputs: {
      calculated_value: result,
      [String(output_field || 'result')]: result,
      calculated_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// STORE DATA
// ============================================================================

const storeData: BrickExecutor = async (inputs, context) => {
  const { field, value, location } = inputs;

  // In a real implementation, this would persist to the specified location
  // For now, we store in the outputs which will be persisted to node_execution_state

  return {
    status: 'completed',
    outputs: {
      storage_status: true,
      storage_location: location || 'workstream',
      stored_field: field,
      stored_value: value,
      stored_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// RETRIEVE DATA
// ============================================================================

const retrieveData: BrickExecutor = async (inputs, context) => {
  const { source, field, fallback_value } = inputs;

  let value: unknown = fallback_value;
  let sourceLocation = source || 'workstream';

  // Try to retrieve from different sources
  switch (source) {
    case 'workstream':
      value = context.workstream[String(field)] ?? fallback_value;
      break;

    case 'play_config':
      value = context.play_config[String(field)] ?? fallback_value;
      break;

    case 'previous_output':
      value = context.previous_outputs[String(field)] ?? fallback_value;
      break;

    case 'user':
      value = context.user?.[String(field) as keyof typeof context.user] ?? fallback_value;
      break;

    default:
      // Try all sources
      value = context.previous_outputs[String(field)] ??
              context.play_config[String(field)] ??
              context.workstream[String(field)] ??
              fallback_value;
  }

  return {
    status: 'completed',
    outputs: {
      retrieved_value: value,
      source_location: sourceLocation,
      retrieved_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// TRANSFORM DATA
// ============================================================================

const transformData: BrickExecutor = async (inputs, context) => {
  const { input_field, transformation_type, output_field, config } = inputs;

  const inputValue = context.previous_outputs[String(input_field)] ??
                     context.play_config[String(input_field)];
  let outputValue: unknown = inputValue;

  switch (transformation_type) {
    case 'uppercase':
      outputValue = typeof inputValue === 'string' ? inputValue.toUpperCase() : inputValue;
      break;

    case 'lowercase':
      outputValue = typeof inputValue === 'string' ? inputValue.toLowerCase() : inputValue;
      break;

    case 'trim':
      outputValue = typeof inputValue === 'string' ? inputValue.trim() : inputValue;
      break;

    case 'number':
      outputValue = Number(inputValue);
      break;

    case 'string':
      outputValue = String(inputValue);
      break;

    case 'boolean':
      outputValue = Boolean(inputValue);
      break;

    case 'json_parse':
      try {
        outputValue = typeof inputValue === 'string' ? JSON.parse(inputValue) : inputValue;
      } catch {
        outputValue = inputValue;
      }
      break;

    case 'json_stringify':
      outputValue = JSON.stringify(inputValue);
      break;

    case 'date_format':
      if (inputValue) {
        const date = new Date(String(inputValue));
        outputValue = date.toISOString();
      }
      break;

    case 'split':
      const delimiter = (config as { delimiter?: string })?.delimiter || ',';
      outputValue = typeof inputValue === 'string' ? inputValue.split(delimiter) : inputValue;
      break;

    case 'join':
      const joinDelimiter = (config as { delimiter?: string })?.delimiter || ',';
      outputValue = Array.isArray(inputValue) ? inputValue.join(joinDelimiter) : inputValue;
      break;

    default:
      outputValue = inputValue;
  }

  return {
    status: 'completed',
    outputs: {
      transformed_value: outputValue,
      [String(output_field || 'result')]: outputValue,
      transformed_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// DELETE DATA
// ============================================================================

const deleteData: BrickExecutor = async (inputs, context) => {
  const { field, location, require_confirmation } = inputs;

  // If confirmation required and not provided, pause
  const confirmed = context.play_config.deletion_confirmed;
  if (require_confirmation && !confirmed) {
    return {
      status: 'waiting_for_input',
      outputs: {},
      pending_action: {
        type: 'input',
        brick_id: 'delete_data',
        brick_name: 'Delete Data',
        node_id: context.execution.node_id,
        description: `Confirm deletion of ${field}`,
        config: {
          field,
          location,
          confirmation_required: true,
          workstream_id: context.workstream.id,
        },
      },
    };
  }

  // In a real implementation, this would delete from the specified location
  return {
    status: 'completed',
    outputs: {
      deletion_status: true,
      deleted_field: field,
      deleted_from: location || 'workstream',
      deleted_at: new Date().toISOString(),
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const dataExecutors: BrickRegistry = {
  collect_data: collectData,
  validate_data: validateData,
  calculate_value: calculateValue,
  store_data: storeData,
  retrieve_data: retrieveData,
  transform_data: transformData,
  delete_data: deleteData,
};
