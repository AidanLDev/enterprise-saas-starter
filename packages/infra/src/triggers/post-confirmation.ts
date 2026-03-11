import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: PostConfirmationTriggerEvent) => {
  const { sub, email } = event.request.userAttributes;
  const userPoolId = event.userPoolId;
  const now = new Date().toISOString();

  // Check if any users exist to determine if this is the first user
  const existingUsers = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': 'USERS' },
      Limit: 1,
    })
  );

  const role = existingUsers.Items?.length ? 'user' : 'admin';

  // Create user in DynamoDB
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${sub}`,
        SK: `USER#${sub}`,
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
  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: sub,
      GroupName: role,
    })
  );

  return event;
};
