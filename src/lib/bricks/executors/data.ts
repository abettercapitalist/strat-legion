/**
 * Data Brick Executors
 *
 * Executors for data collection, validation, and transformation bricks.
 * Bricks: collect_data, validate_data, transform_data, enrich_data, map_fields
 */

import type { BrickExecutor, BrickExecutorResult, BrickRegistry } from '../types';

// ============================================================================
// COLLECT DATA (Brick #1)
// ============================================================================

const collectData: BrickExecutor = async (inputs, context) => {
  const {
    field_name,
    input_type,
    required,
    validation_rules,
    label,
    placeholder,
    options,
  } = inputs;

  // This brick typically pauses execution waiting for user input
  // The actual collection happens through the UI
  return {
    status: 'waiting_for_input',
    outputs: {},
    pending_action: {
      type: 'input',
      brick_id: 'collect_data',
      brick_name: 'Collect Data',
      description: label ? String(label) : `Please provide: ${field_name}`,
      config: {
        field_name,
        input_type: input_type || 'text',
        required: required !== false,
        validation_rules,
        label,
        placeholder,
        options,
      },
    },
  };
};

// ============================================================================
// VALIDATE DATA (Brick #2)
// ============================================================================

const validateData: BrickExecutor = async (inputs, context) => {
  const { field, validation_type, validation_rules, error_message } = inputs;

  // Get the value to validate from context
  const value = context.previous_outputs[String(field)];

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

    case 'custom':
      // Custom validation would be handled by specific rules
      // For now, pass through
      break;

    default:
      // No validation
      break;
  }

  return {
    status: 'completed',
    outputs: {
      is_valid: isValid,
      validation_errors: errors,
      validated_value: value,
    },
  };
};

// ============================================================================
// TRANSFORM DATA (Brick #3)
// ============================================================================

const transformData: BrickExecutor = async (inputs, context) => {
  const { input_field, transformation, output_field, config } = inputs;

  const inputValue = context.previous_outputs[String(input_field)];
  let outputValue: unknown = inputValue;

  switch (transformation) {
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
      const dateConfig = config as { format?: string } | undefined;
      if (inputValue) {
        const date = new Date(String(inputValue));
        outputValue = date.toISOString();
      }
      break;

    case 'calculate':
      // Simple calculation support
      const calcConfig = config as { expression?: string } | undefined;
      if (calcConfig?.expression) {
        // This would need a safe expression evaluator
        outputValue = inputValue;
      }
      break;

    default:
      outputValue = inputValue;
  }

  return {
    status: 'completed',
    outputs: {
      [String(output_field || 'transformed_value')]: outputValue,
    },
  };
};

// ============================================================================
// ENRICH DATA (Brick #4)
// ============================================================================

const enrichData: BrickExecutor = async (inputs, context) => {
  const { source_field, enrichment_source, enrichment_config } = inputs;

  const sourceValue = context.previous_outputs[String(source_field)];

  // In a real implementation, this would call external services
  // For now, return the source value with metadata
  return {
    status: 'completed',
    outputs: {
      enriched_data: sourceValue,
      enrichment_applied: false,
      enrichment_source: enrichment_source,
    },
  };
};

// ============================================================================
// MAP FIELDS (Brick #5)
// ============================================================================

const mapFields: BrickExecutor = async (inputs, context) => {
  const { field_mapping, source_object } = inputs;

  const source =
    typeof source_object === 'string'
      ? context.previous_outputs[source_object]
      : source_object || context.previous_outputs;

  if (!source || typeof source !== 'object') {
    return {
      status: 'completed',
      outputs: {
        mapped_object: {},
      },
    };
  }

  const mapped: Record<string, unknown> = {};
  const mapping = field_mapping as Record<string, string>;

  if (mapping) {
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      mapped[targetField] = (source as Record<string, unknown>)[sourceField];
    }
  }

  return {
    status: 'completed',
    outputs: {
      mapped_object: mapped,
    },
  };
};

// ============================================================================
// EXPORT REGISTRY
// ============================================================================

export const dataExecutors: BrickRegistry = {
  collect_data: collectData,
  validate_data: validateData,
  transform_data: transformData,
  enrich_data: enrichData,
  map_fields: mapFields,
};
