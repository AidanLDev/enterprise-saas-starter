import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { jsonResponse, extractPathParams } from '../router';
import { requireRole } from '../middleware/require-role';
import { validateBody, Schema } from '../middleware/validate';
import { inviteUser, updateUserRole } from '../services/user-service';
import { ENTITY_PREFIX } from '@saas-starter/shared';
import type { UserRole } from '@saas-starter/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognitoClient = new CognitoIdentityProviderClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

const VALID_ROLES: UserRole[] = ['admin', 'user'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const updateRoleSchema: Schema = {
  role: { type: 'string', required: true, oneOf: VALID_ROLES },
};

const inviteUserSchema: Schema = {
  email: { type: 'string', required: true, maxLength: 254, pattern: EMAIL_PATTERN },
  role: { type: 'string', oneOf: VALID_ROLES },
};

export async function handleListUsers(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const lastKeyParam = event.queryStringParameters?.lastKey;
  const exclusiveStartKey = lastKeyParam ? JSON.parse(decodeURIComponent(lastKeyParam)) : undefined;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': 'USERS' },
      ScanIndexForward: false,
      Limit: 50,
      ExclusiveStartKey: exclusiveStartKey,
    })
  );

  return jsonResponse(200, {
    data: result.Items,
    lastKey: result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : undefined,
  });
}

export async function handleUpdateUserRole(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const { userId } = extractPathParams(event, '/admin/users/{userId}/role');
  if (!userId) return jsonResponse(400, { error: 'Missing userId' });

  const currentUserId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
  if (userId === currentUserId) {
    return jsonResponse(400, { error: 'Cannot change your own role' });
  }

  const validation = validateBody<{ role: UserRole }>(event, updateRoleSchema);
  if (!validation.ok) return validation.response;
  const { role: newRole } = validation.data;

  const { user } = await updateUserRole({ userId, newRole });
  return jsonResponse(200, { data: user });
}

export async function handleInviteUser(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const validation = validateBody<{ email: string; role?: UserRole }>(event, inviteUserSchema);
  if (!validation.ok) return validation.response;
  const { email, role = 'user' } = validation.data;

  const result = await inviteUser({ email, role });
  return jsonResponse(200, { data: result });
}

export async function handleDeleteUser(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const { userId } = extractPathParams(event, '/admin/users/{userId}');
  if (!userId) return jsonResponse(400, { error: 'Missing userId' });

  const currentUserId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
  if (userId === currentUserId) {
    return jsonResponse(400, { error: 'Cannot delete your own account' });
  }

  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `${ENTITY_PREFIX.USER}${userId}`,
        SK: `${ENTITY_PREFIX.USER}${userId}`,
      },
    })
  );

  await cognitoClient.send(
    new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    })
  );

  return jsonResponse(200, { data: { userId, status: 'deleted' } });
}
