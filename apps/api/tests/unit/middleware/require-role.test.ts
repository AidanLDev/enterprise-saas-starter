import { getUserRole, requireRole } from '../../../src/middleware/require-role';
import { makeEvent } from '../test-utils';

// ─── getUserRole ──────────────────────────────────────────────────────────────

describe('getUserRole', () => {
  it('reads a plain string claim', () => {
    const event = makeEvent({ role: 'admin' });
    expect(getUserRole(event)).toBe('admin');
  });

  it('reads the first element when the claim is an array', () => {
    const event = makeEvent({ role: 'admin' });
    event.requestContext.authorizer!.jwt.claims['cognito:groups'] = ['admin', 'user'] as never;
    expect(getUserRole(event)).toBe('admin');
  });

  it('strips brackets when API Gateway serializes an array as "[admin]"', () => {
    const event = makeEvent({ role: 'admin' });
    event.requestContext.authorizer!.jwt.claims['cognito:groups'] = '[admin]';
    expect(getUserRole(event)).toBe('admin');
  });

  it('returns null when the claim is an empty bracketed string', () => {
    const event = makeEvent({ role: 'admin' });
    event.requestContext.authorizer!.jwt.claims['cognito:groups'] = '[]';
    expect(getUserRole(event)).toBeNull();
  });

  it('returns null when the claim is missing', () => {
    const event = makeEvent({ role: 'admin' });
    delete event.requestContext.authorizer!.jwt.claims['cognito:groups'];
    expect(getUserRole(event)).toBeNull();
  });
});

// ─── requireRole ──────────────────────────────────────────────────────────────

describe('requireRole', () => {
  it('returns null when the user has the required role', () => {
    const event = makeEvent({ role: 'admin' });
    expect(requireRole(event, 'admin')).toBeNull();
  });

  it('returns a 403 response when the user has a different role', () => {
    const event = makeEvent({ role: 'user' });
    const result = requireRole(event, 'admin');
    expect(result).not.toBeNull();
    expect(result?.statusCode).toBe(403);
  });

  it('returns a 403 response when the user has no role', () => {
    const event = makeEvent({ role: 'admin' });
    delete event.requestContext.authorizer!.jwt.claims['cognito:groups'];
    const result = requireRole(event, 'admin');
    expect(result?.statusCode).toBe(403);
  });
});
