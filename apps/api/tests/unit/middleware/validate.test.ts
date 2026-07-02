import { validateFields, validateBody, Schema } from '../../../src/middleware/validate';
import { makeEvent } from '../test-utils';

// ─── validateFields ───────────────────────────────────────────────────────────

describe('validateFields', () => {
  it('returns no errors for valid data', () => {
    const schema: Schema = { name: { type: 'string', required: true } };
    expect(validateFields({ name: 'Alice' }, schema)).toEqual({});
  });

  it('flags a missing required field', () => {
    const schema: Schema = { name: { type: 'string', required: true } };
    const errors = validateFields({}, schema);
    expect(errors.name).toMatch(/required/i);
  });

  it('does not flag a missing optional field', () => {
    const schema: Schema = { name: { type: 'string' } };
    expect(validateFields({}, schema)).toEqual({});
  });

  it('treats null and empty string as empty', () => {
    const schema: Schema = { name: { type: 'string', required: true } };
    expect(validateFields({ name: null }, schema).name).toMatch(/required/i);
    expect(validateFields({ name: '' }, schema).name).toMatch(/required/i);
  });

  it('flags the wrong type', () => {
    const schema: Schema = { age: { type: 'number' } };
    const errors = validateFields({ age: 'not-a-number' }, schema);
    expect(errors.age).toMatch(/must be a number/i);
  });

  it('flags a string shorter than minLength', () => {
    const schema: Schema = { name: { type: 'string', minLength: 3 } };
    const errors = validateFields({ name: 'ab' }, schema);
    expect(errors.name).toMatch(/at least 3/i);
  });

  it('flags a string longer than maxLength', () => {
    const schema: Schema = { name: { type: 'string', maxLength: 3 } };
    const errors = validateFields({ name: 'abcd' }, schema);
    expect(errors.name).toMatch(/at most 3/i);
  });

  it('flags a string that fails the pattern', () => {
    const schema: Schema = { email: { type: 'string', pattern: /^\S+@\S+$/ } };
    const errors = validateFields({ email: 'not-an-email' }, schema);
    expect(errors.email).toMatch(/valid format/i);
  });

  it('flags a value not in oneOf', () => {
    const schema: Schema = { role: { type: 'string', oneOf: ['admin', 'user'] } };
    const errors = validateFields({ role: 'super_duper_user' }, schema);
    expect(errors.role).toMatch(/must be one of/i);
  });

  it('accepts a value in oneOf', () => {
    const schema: Schema = { role: { type: 'string', oneOf: ['admin', 'user'] } };
    expect(validateFields({ role: 'admin' }, schema)).toEqual({});
  });

  it('runs a custom validator and surfaces its message', () => {
    const schema: Schema = {
      age: { type: 'number', validate: (value) => (value === 13 ? 'unlucky number' : undefined) },
    };
    const errors = validateFields({ age: 13 }, schema);
    expect(errors.age).toBe('unlucky number');
  });

  it('skips the custom validator when it returns undefined', () => {
    const schema: Schema = {
      age: { type: 'number', validate: () => undefined },
    };
    expect(validateFields({ age: 30 }, schema)).toEqual({});
  });
});

// ─── validateBody ─────────────────────────────────────────────────────────────

describe('validateBody', () => {
  const schema: Schema = { name: { type: 'string', required: true } };

  it('returns a 400 response for invalid JSON', () => {
    const event = makeEvent({ method: 'POST' });
    event.body = '{not-json';

    const result = validateBody(event, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.statusCode).toBe(400);
  });

  it('returns a 400 response when the body is a JSON array', () => {
    const event = makeEvent({ method: 'POST' });
    event.body = '[1,2,3]';

    const result = validateBody(event, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.statusCode).toBe(400);
  });

  it('returns a 400 response when required fields are missing', () => {
    const event = makeEvent({ method: 'POST', body: {} });

    const result = validateBody(event, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = JSON.parse(result.response.body as string);
      expect(body.fields.name).toMatch(/required/i);
    }
  });

  it('treats a missing body as an empty object', () => {
    const event = makeEvent({ method: 'POST' });

    const result = validateBody(event, schema);
    expect(result.ok).toBe(false);
  });

  it('returns parsed data when validation succeeds', () => {
    const event = makeEvent({ method: 'POST', body: { name: 'Alice' } });

    const result = validateBody<{ name: string }>(event, schema);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe('Alice');
  });
});
