import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { jsonResponse } from '../router';
import { ENTITY_PREFIX } from '@saas-starter/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export async function handleGetMe(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
  if (!userId) return jsonResponse(401, { error: 'Unauthorized' });

  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `${ENTITY_PREFIX.USER}${userId}`,
        SK: `${ENTITY_PREFIX.USER}${userId}`,
      },
    })
  );

  if (!result.Item) return jsonResponse(404, { error: 'User not found' });
  return jsonResponse(200, { data: result.Item });
}
