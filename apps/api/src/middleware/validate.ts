import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { jsonResponse } from '../router';

export type FieldErrors = Record<string, string>;

export interface FieldRule<T = unknown> {
  required?: boolean;
  type: 'string' | 'number' | 'boolean';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  oneOf?: readonly T[];
  /** Custom check run after type/length/pattern checks pass. Return an error message, or undefined if valid. */
  validate?: (value: T) => string | undefined;
}

export type Schema = Record<string, FieldRule>;

/**
 * Validates a plain object against a schema of field rules.
 * Returns field-level error messages, or an empty object if valid.
 */
export function validateFields(data: Record<string, unknown>, schema: Schema): FieldErrors {
  const errors: FieldErrors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const isEmpty = value === undefined || value === null || value === '';

    if (isEmpty) {
      if (rule.required) errors[field] = `${field} is required`;
      continue;
    }

    if (typeof value !== rule.type) {
      errors[field] = `${field} must be a ${rule.type}`;
      continue;
    }

    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
        continue;
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors[field] = `${field} must be at most ${rule.maxLength} characters`;
        continue;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = `${field} is not in a valid format`;
        continue;
      }
    }

    if (rule.oneOf && !rule.oneOf.includes(value as never)) {
      errors[field] = `${field} must be one of: ${rule.oneOf.join(', ')}`;
      continue;
    }

    const customError = rule.validate?.(value as never);
    if (customError) errors[field] = customError;
  }

  return errors;
}

/**
 * Parses and validates the JSON request body against a schema.
 * Returns either { data } with the parsed body, or { response } with a 400 to return immediately.
 */
export type ValidateBodyResult<T> =
  { ok: true; data: T } | { ok: false; response: ReturnType<typeof jsonResponse> };

export function validateBody<T = Record<string, unknown>>(
  event: APIGatewayProxyEventV2,
  schema: Schema
): ValidateBodyResult<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body || '{}');
  } catch {
    return { ok: false, response: jsonResponse(400, { error: 'Request body must be valid JSON' }) };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      response: jsonResponse(400, { error: 'Request body must be a JSON object' }),
    };
  }

  const errors = validateFields(parsed as Record<string, unknown>, schema);
  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      response: jsonResponse(400, { error: 'Validation failed', fields: errors }),
    };
  }

  return { ok: true, data: parsed as T };
}
