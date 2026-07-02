import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handleGetMe } from '../../../src/handlers/users';
import { makeEvent, asStructuredResult, ddbMock, resetMocks } from '../test-utils';

beforeEach(resetMocks);

// ─── handleGetMe ──────────────────────────────────────────────────────────────

describe('handleGetMe', () => {
  it('returns 404 when user is not found', async () => {
    ddbMock.on(GetCommand).resolves({});

    const event = makeEvent({ userId: 'missing-user-id' });
    const res = asStructuredResult(await handleGetMe(event));

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string).error).toMatch(/not found/i);
  });

  it('returns the current user on success', async () => {
    const user = { id: 'user-id', email: 'me@example.com', role: 'user' };
    ddbMock.on(GetCommand).resolves({ Item: user });

    const event = makeEvent({ userId: 'user-id' });
    const res = asStructuredResult(await handleGetMe(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data).toEqual(user);
  });
});
