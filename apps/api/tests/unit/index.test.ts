import { DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { handler } from '../../src/index';
import { makeEvent, asStructuredResult, ddbMock, cognitoMock, resetMocks } from './test-utils';

function awsError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

beforeEach(() => {
  resetMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Routing ──────────────────────────────────────────────────────────────────

describe('handler routing', () => {
  it('returns 404 for an unknown route', async () => {
    const event = makeEvent({ path: '/nope' });
    const res = asStructuredResult(await handler(event));

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string).error).toMatch(/route not found/i);
  });

  it('returns 404 when the path matches but the method does not', async () => {
    const event = makeEvent({ path: '/health', method: 'POST' });
    const res = asStructuredResult(await handler(event));

    expect(res.statusCode).toBe(404);
  });

  it('dispatches a static route', async () => {
    const event = makeEvent({ path: '/health' });
    const res = asStructuredResult(await handler(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('dispatches a route with a path parameter', async () => {
    ddbMock.on(DeleteCommand).resolves({});
    cognitoMock.on(AdminDeleteUserCommand).resolves({});

    const event = makeEvent({
      role: 'admin',
      userId: 'admin-user-id',
      path: '/admin/users/other-user-id',
      method: 'DELETE',
    });
    const res = asStructuredResult(await handler(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data).toEqual({ userId: 'other-user-id', status: 'deleted' });
  });
});

// ─── Error translation ────────────────────────────────────────────────────────

describe('handler error translation', () => {
  it('translates an AppError thrown by a handler into its status code', async () => {
    ddbMock.on(UpdateCommand).rejects(awsError('ConditionalCheckFailedException'));

    // handleUpdateProject converts the conditional failure into a NotFoundError
    const event = makeEvent({
      role: 'admin',
      path: '/projects/missing-id',
      method: 'PUT',
      body: { projectName: 'Updated' },
    });
    const res = asStructuredResult(await handler(event));

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string).error).toMatch(/project not found/i);
  });

  it('maps UsernameExistsException from Cognito to a 409', async () => {
    cognitoMock.on(AdminCreateUserCommand).rejects(awsError('UsernameExistsException'));

    const event = makeEvent({
      role: 'admin',
      path: '/admin/invite',
      method: 'POST',
      body: { email: 'taken@example.com' },
    });
    const res = asStructuredResult(await handler(event));

    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body as string).error).toMatch(/already exists/i);
  });

  it('maps ThrottlingException to a 429', async () => {
    ddbMock.on(GetCommand).rejects(awsError('ThrottlingException'));

    const event = makeEvent({ path: '/users/me' });
    const res = asStructuredResult(await handler(event));

    expect(res.statusCode).toBe(429);
  });

  it('returns a generic 500 for unrecognized errors without leaking details', async () => {
    ddbMock.on(GetCommand).rejects(new Error('connection reset by peer'));

    const event = makeEvent({ path: '/users/me' });
    const res = asStructuredResult(await handler(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(res.body).not.toContain('connection reset');
  });
});
