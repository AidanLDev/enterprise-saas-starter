import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {
  handleListUsers,
  handleUpdateUserRole,
  handleInviteUser,
  handleDeleteUser,
} from '../../../src/handlers/admin';

const ddbMock = mockClient(DynamoDBDocumentClient);
const cognitoMock = mockClient(CognitoIdentityProviderClient);

beforeEach(() => {
  ddbMock.reset();
  cognitoMock.reset();
  process.env.TABLE_NAME = 'test-table';
  process.env.USER_POOL_ID = 'us-east-1_test';
});

function makeEvent(overrides: {
  userId?: string;
  role?: string;
  path?: string;
  method?: string;
  body?: unknown;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}): APIGatewayProxyEventV2WithJWTAuthorizer {
  const {
    userId = 'admin-user-id',
    role = 'admin',
    path = '/',
    method = 'GET',
    body,
    pathParameters,
    queryStringParameters,
  } = overrides;

  return {
    version: '2.0',
    routeKey: '$default',
    rawPath: path,
    rawQueryString: '',
    headers: {},
    pathParameters,
    queryStringParameters,
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test-api.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test-api',
      http: {
        method,
        path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'test-request-id',
      routeKey: '$default',
      stage: '$default',
      time: '01/Jan/2026:00:00:00 +0000',
      timeEpoch: 0,
      authorizer: {
        principalId: userId,
        integrationLatency: 0,
        jwt: {
          claims: {
            sub: userId,
            'cognito:groups': role,
          },
          scopes: [],
        },
      },
    },
  };
}

function asStructuredResult(result: APIGatewayProxyResultV2): APIGatewayProxyStructuredResultV2 {
  if (typeof result === 'string') {
    throw new Error('Expected a structured API Gateway result, got a string');
  }
  return result;
}

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
});

// ─── handleUpdateUserRole ─────────────────────────────────────────────────────

describe('handleUpdateUserRole', () => {
  it('returns 403 for non-admin', async () => {
    const event = makeEvent({ role: 'user', path: '/admin/users/other-id/role' });
    const res = asStructuredResult(await handleUpdateUserRole(event));
    expect(res.statusCode).toBe(403);
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
      body: { role: 'superuser' },
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
    ddbMock.on(UpdateCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const event = makeEvent({ role: 'admin', body: { email: 'new@example.com' } });
    const res = asStructuredResult(await handleInviteUser(event));
    const body = JSON.parse(res.body as string);

    expect(res.statusCode).toBe(200);
    expect(body.data.role).toBe('user');
    expect(body.data.status).toBe('invited');
  });

  it('invites user with explicit admin role', async () => {
    cognitoMock.on(AdminCreateUserCommand).resolves({
      User: { Attributes: [{ Name: 'sub', Value: 'new-sub-id' }] },
    });
    ddbMock.on(UpdateCommand).resolves({});
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
