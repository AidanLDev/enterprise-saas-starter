import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { jsonResponse, extractPathParams } from '../router';
import { requireRole } from '../middleware/require-role';
import { ENTITY_PREFIX } from '@saas-starter/shared';
import type { UserRole } from '@saas-starter/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognitoClient = new CognitoIdentityProviderClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

const VALID_ROLES: UserRole[] = ['admin', 'user'];

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

  const body = JSON.parse(event.body || '{}');
  const newRole = body.role as UserRole;
  if (!VALID_ROLES.includes(newRole)) {
    return jsonResponse(400, { error: 'Invalid role. Must be "admin" or "user"' });
  }

  // Get current user to find old role
  const userKey = {
    PK: `${ENTITY_PREFIX.USER}${userId}`,
    SK: `${ENTITY_PREFIX.USER}${userId}`,
  };

  const updateResult = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: userKey,
      UpdateExpression: 'SET #role = :role',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': newRole },
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!updateResult.Attributes) {
    return jsonResponse(404, { error: 'User not found' });
  }

  const oldRole = newRole === 'admin' ? 'user' : 'admin';

  // Swap Cognito groups
  await cognitoClient.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      GroupName: oldRole,
    })
  );

  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      GroupName: newRole,
    })
  );

  return jsonResponse(200, { data: updateResult.Attributes });
}

export async function handleInviteUser(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const body = JSON.parse(event.body || '{}');
  const { email, role = 'user' } = body as { email?: string; role?: UserRole };

  if (!email) return jsonResponse(400, { error: 'Email is required' });
  if (!VALID_ROLES.includes(role)) {
    return jsonResponse(400, { error: 'Invalid role. Must be "admin" or "user"' });
  }

  const createResult = await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
      DesiredDeliveryMediums: ['EMAIL'],
    })
  );

  const sub = createResult.User?.Attributes?.find((a) => a.Name === 'sub')?.Value;
  if (!sub) {
    return jsonResponse(500, { error: 'Failed to retrieve user ID from Cognito' });
  }

  const now = new Date().toISOString();

  // Create user record in DynamoDB (AdminCreateUser does not trigger PostConfirmation)
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `${ENTITY_PREFIX.USER}${sub}`,
        SK: `${ENTITY_PREFIX.USER}${sub}`,
        GSI1PK: 'USERS',
        GSI1SK: now,
        id: sub,
        email,
        role,
        createdAt: now,
        entityType: 'USER',
      },
    })
  );

  // Sync role to Cognito group
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: sub,
      GroupName: role,
    })
  );

  return jsonResponse(200, { data: { email, role, status: 'invited' } });
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
