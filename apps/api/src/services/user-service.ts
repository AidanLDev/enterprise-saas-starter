import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ENTITY_PREFIX } from '@saas-starter/shared';
import type { UserRole } from '@saas-starter/shared';
import { NotFoundError } from '../errors';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognitoClient = new CognitoIdentityProviderClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

export interface InviteUserInput {
  email: string;
  role: UserRole;
}

export interface InviteUserResult {
  email: string;
  role: UserRole;
  status: 'invited';
}

/**
 * Creates a Cognito user, writes the DynamoDB record, and assigns the Cognito group.
 * All three steps are attempted in order; if DynamoDB or the group assignment fails,
 * the Cognito user will already exist — callers should treat errors as potentially
 * partially applied and investigate before retrying.
 */
export async function inviteUser(input: InviteUserInput): Promise<InviteUserResult> {
  const { email, role } = input;

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
  if (!sub) throw new Error('Failed to retrieve user ID from Cognito');

  const now = new Date().toISOString();

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

  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: sub,
      GroupName: role,
    })
  );

  return { email, role, status: 'invited' };
}

export interface UpdateUserRoleInput {
  userId: string;
  newRole: UserRole;
}

export interface UpdateUserRoleResult {
  user: Record<string, unknown>;
}

/**
 * Updates the user's role in DynamoDB, then swaps Cognito groups.
 * The old role is derived as the opposite of newRole — safe while there are
 * only two roles. Extend this if roles expand beyond admin/user.
 */
export async function updateUserRole(input: UpdateUserRoleInput): Promise<UpdateUserRoleResult> {
  const { userId, newRole } = input;

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

  if (!updateResult.Attributes) throw new NotFoundError('User not found');

  const oldRole: UserRole = newRole === 'admin' ? 'user' : 'admin';

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

  return { user: updateResult.Attributes as Record<string, unknown> };
}
