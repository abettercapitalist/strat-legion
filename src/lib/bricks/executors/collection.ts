/**
 * Collection Brick Executor
 *
 * Gathers structured information from users via configurable form fields.
 * Absorbs: collect_data, validate_data, retrieve_data, collect_document,
 *          request_meeting, record_decision, assign_ownership
 */

import type {
  BrickExecutor,
  CollectionBrickConfig,
  CollectionField,
  ExecutionContext,
} from '../types';

/**
 * Checks whether a field has a value in the execution context.
 */
function getFieldValue(field: CollectionField, context: ExecutionContext): unknown {
  return (
    context.previous_outputs[field.name] ??
    context.play_config[field.name] ??
    field.default_value
  );
}

/**
 * Validates a single field value against its validation rules.
 */
function validateField(
  field: CollectionField,
  value: unknown
): { valid: boolean; error?: string } {
  if (field.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: field.validation?.error_message || `${field.label} is required` };
  }

  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }

  const v = field.validation;
  if (!v) return { valid: true };

  if (v.type === 'email' && typeof value === 'string') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { valid: false, error: v.error_message || 'Invalid email format' };
    }
  }

  if (v.type === 'number' && isNaN(Number(value))) {
    return { valid: false, error: v.error_message || 'Must be a number' };
  }

  if (v.pattern && typeof value === 'string') {
    if (!new RegExp(v.pattern).test(value)) {
      return { valid: false, error: v.error_message || 'Invalid format' };
    }
  }

  if (v.min_length !== undefined && typeof value === 'string' && value.length < v.min_length) {
    return { valid: false, error: v.error_message || `Minimum length is ${v.min_length}` };
  }

  if (v.max_length !== undefined && typeof value === 'string' && value.length > v.max_length) {
    return { valid: false, error: v.error_message || `Maximum length is ${v.max_length}` };
  }

  if (v.min !== undefined) {
    const num = Number(value);
    if (!isNaN(num) && num < v.min) {
      return { valid: false, error: v.error_message || `Value must be at least ${v.min}` };
    }
  }

  if (v.max !== undefined) {
    const num = Number(value);
    if (!isNaN(num) && num > v.max) {
      return { valid: false, error: v.error_message || `Value must be at most ${v.max}` };
    }
  }

  return { valid: true };
}

/**
 * Resolves {{var}} template variables in a string using context data.
 */
function resolveTemplateVars(
  template: string,
  previousOutputs: Record<string, unknown>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => String(previousOutputs[key] ?? `{{${key}}}`)
  );
}

/**
 * Collection executor: handles form field collection, validation, and data gathering.
 */
export const collectionExecutor: BrickExecutor = async (inputs, context) => {
  const config = (inputs._brick_config || inputs) as Partial<CollectionBrickConfig>;
  const fields = config.fields || [];

  // If no fields configured, treat as a pass-through
  if (fields.length === 0) {
    return {
      status: 'completed',
      outputs: {
        collected_values: {},
        collected_at: new Date().toISOString(),
        collected_by: context.user?.id,
        validation_passed: true,
      },
    };
  }

  // Check which required fields are missing values
  const missingFields: CollectionField[] = [];
  const collectedValues: Record<string, unknown> = {};

  for (const field of fields) {
    const value = getFieldValue(field, context);
    if (field.required && (value === undefined || value === null || value === '')) {
      missingFields.push(field);
    } else {
      collectedValues[field.name] = value;
    }
  }

  // Resolve template variables in instructions
  const resolvedInstructions = config.instructions
    ? resolveTemplateVars(config.instructions, context.previous_outputs)
    : undefined;

  // If there are missing required fields, pause for user input
  if (missingFields.length > 0) {
    return {
      status: 'waiting_for_input',
      outputs: {},
      pending_action: {
        type: 'collection',
        brick_id: 'collection',
        brick_name: 'Collection',
        node_id: context.execution.node_id,
        description: `Please complete: ${missingFields.map(f => f.label).join(', ')}`,
        config: {
          fields: missingFields,
          all_fields: fields,
          collected_values: collectedValues,
          upstream_context: context.previous_outputs,
          instructions: resolvedInstructions,
          owner_assignment: config.owner_assignment,
          workstream_id: context.workstream.id,
        },
      },
    };
  }

  // Validate all fields
  const validationErrors: Record<string, string> = {};
  for (const field of fields) {
    const value = collectedValues[field.name];
    const result = validateField(field, value);
    if (!result.valid && result.error) {
      validationErrors[field.name] = result.error;
    }
  }

  if (Object.keys(validationErrors).length > 0) {
    return {
      status: 'waiting_for_input',
      outputs: {
        validation_errors: validationErrors,
        collected_values: collectedValues,
      },
      pending_action: {
        type: 'collection',
        brick_id: 'collection',
        brick_name: 'Collection',
        node_id: context.execution.node_id,
        description: 'Please fix validation errors',
        config: {
          fields,
          all_fields: fields,
          collected_values: collectedValues,
          upstream_context: context.previous_outputs,
          instructions: resolvedInstructions,
          validation_errors: validationErrors,
          owner_assignment: config.owner_assignment,
          workstream_id: context.workstream.id,
        },
      },
    };
  }

  // All fields collected and validated
  return {
    status: 'completed',
    outputs: {
      collected_values: collectedValues,
      ...collectedValues,
      collected_at: new Date().toISOString(),
      collected_by: context.user?.id,
      validation_passed: true,
    },
  };
};
