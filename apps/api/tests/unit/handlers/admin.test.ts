import { QueryCommand, DeleteCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  AdminDeleteUserCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  handleListUsers,
  handleUpdateUserRole,
  handleInviteUser,
  handleDeleteUser,
} from '../../../src/handlers/admin';
import { makeEvent, asStructuredResult, ddbMock, cognitoMock, resetMocks } from '../test-utils';

beforeEach(resetMocks);

// ─── handleListUsers ──────────────────────────────────────────────────────────

describe('handleListUsers', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({ role: 'user' });
    const res = asStructuredResult(await handleListUsers(event));
    expect(res.statusCode).toBe(403);
  });

  it('returns user list on success', async () => {
    const users = [{ id: '1', email: 'a@example.com' }];
    ddbMock.on(QueryCommand).resolves({ Items: users });

    const event = makeEvent({ role: 'admin' });
    const res = asStructuredResult(await handleListUsers(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data).toEqual(users);
    expect(body.lastKey).toBeUndefined();
  });

  it('returns lastKey when DynamoDB paginates', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [],
      LastEvaluatedKey: { PK: 'USER#abc' },
    });

    const event = makeEvent({ role: 'admin' });
    const res = asStructuredResult(await handleListUsers(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.lastKey).toBeDefined();
  });

  it('passes a provided lastKey to DynamoDB as ExclusiveStartKey', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });

    const lastKey = encodeURIComponent(JSON.stringify({ PK: 'USER#abc' }));
    const event = makeEvent({ role: 'admin', queryStringParameters: { lastKey } });
    const res = asStructuredResult(await handleListUsers(event));

    expect(res.statusCode).toBe(200);
    const queryInput = ddbMock.commandCalls(QueryCommand)[0].args[0].input;
    expect(queryInput.ExclusiveStartKey).toEqual({ PK: 'USER#abc' });
  });
});

// ─── handleUpdateUserRole ─────────────────────────────────────────────────────

describe('handleUpdateUserRole', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({ role: 'user', path: '/admin/users/other-id/role' });
    const res = asStructuredResult(await handleUpdateUserRole(event));
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when the path does not contain a userId', async () => {
    const event = makeEvent({
      role: 'admin',
      path: '/admin/users//role',
      method: 'PUT',
      body: { role: 'user' },
    });
    const res = asStructuredResult(await handleUpdateUserRole(event));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).error).toMatch(/userId/i);
  });

  it('returns 400 when trying to change own role', async () => {
    const event = makeEvent({
      userId: 'admin-user-id',
      role: 'admin',
      path: '/admin/users/admin-user-id/role',
      method: 'PUT',
      body: { role: 'user' },
    });
    const res = asStructuredResult(await handleUpdateUserRole(event));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).error).toMatch(/own role/i);
  });

  it('returns 400 for invalid role value', async () => {
    const event = makeEvent({
      userId: 'admin-user-id',
      role: 'admin',
      path: '/admin/users/other-user-id/role',
      method: 'PUT',
      body: { role: 'super_duper_user' },
    });
    const res = asStructuredResult(await handleUpdateUserRole(event));
    expect(res.statusCode).toBe(400);
  });

  it('updates role and returns updated user', async () => {
    const updatedUser = { id: 'other-user-id', role: 'admin' };
    ddbMock.on(UpdateCommand).resolves({ Attributes: updatedUser });
    cognitoMock.on(AdminRemoveUserFromGroupCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const event = makeEvent({
      userId: 'admin-user-id',
      role: 'admin',
      path: '/admin/users/other-user-id/role',
      method: 'PUT',
      body: { role: 'admin' },
    });
    const res = asStructuredResult(await handleUpdateUserRole(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data).toEqual(updatedUser);
  });
});

// ─── handleInviteUser ─────────────────────────────────────────────────────────

describe('handleInviteUser', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({ role: 'user' });
    const res = asStructuredResult(await handleInviteUser(event));
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for invalid email', async () => {
    const event = makeEvent({ role: 'admin', body: { email: 'not-an-email' } });
    const res = asStructuredResult(await handleInviteUser(event));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const event = makeEvent({ role: 'admin', body: { role: 'user' } });
    const res = asStructuredResult(await handleInviteUser(event));
    expect(res.statusCode).toBe(400);
  });

  it('invites user with default role of user', async () => {
    cognitoMock.on(AdminCreateUserCommand).resolves({
      User: { Attributes: [{ Name: 'sub', Value: 'new-sub-id' }] },
    });
    ddbMock.on(PutCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const event = makeEvent({ role: 'admin', body: { email: 'new@example.com' } });
    const res = asStructuredResult(await handleInviteUser(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data.role).toBe('user');
    expect(body.data.status).toBe('invited');

    const putInput = ddbMock.commandCalls(PutCommand)[0].args[0].input;
    expect(putInput.TableName).toBe('test-table');
    expect(putInput.Item).toMatchObject({
      PK: 'USER#new-sub-id',
      SK: 'USER#new-sub-id',
      GSI1PK: 'USERS',
      id: 'new-sub-id',
      email: 'new@example.com',
      role: 'user',
      entityType: 'USER',
    });
  });

  it('invites user with explicit admin role', async () => {
    cognitoMock.on(AdminCreateUserCommand).resolves({
      User: { Attributes: [{ Name: 'sub', Value: 'new-sub-id' }] },
    });
    ddbMock.on(PutCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const event = makeEvent({ role: 'admin', body: { email: 'new@example.com', role: 'admin' } });
    const res = asStructuredResult(await handleInviteUser(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data.role).toBe('admin');
  });
});

// ─── handleDeleteUser ─────────────────────────────────────────────────────────

describe('handleDeleteUser', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({ role: 'user', path: '/admin/users/other-id' });
    const res = asStructuredResult(await handleDeleteUser(event));
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when trying to delete own account', async () => {
    const event = makeEvent({
      userId: 'admin-user-id',
      role: 'admin',
      path: '/admin/users/admin-user-id',
      method: 'DELETE',
    });
    const res = asStructuredResult(await handleDeleteUser(event));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).error).toMatch(/own account/i);
  });

  it('deletes from DynamoDB and Cognito and returns success', async () => {
    ddbMock.on(DeleteCommand).resolves({});
    cognitoMock.on(AdminDeleteUserCommand).resolves({});

    const event = makeEvent({
      userId: 'admin-user-id',
      role: 'admin',
      path: '/admin/users/other-user-id',
      method: 'DELETE',
    });
    const res = asStructuredResult(await handleDeleteUser(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data.status).toBe('deleted');
  });
});
