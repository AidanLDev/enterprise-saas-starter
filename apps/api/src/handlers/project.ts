import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { requireRole } from '../middleware/require-role';
import { jsonResponse } from '../router';
import { ENTITY_PREFIX, GSI_PREFIX, Project } from '@saas-starter/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export async function handleCreateProject(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const body = JSON.parse(event.body || '{}');
  const { projectName, projectDescription } = body as {
    projectName?: string;
    projectDescription?: string;
  };
  const currentUserId = event.requestContext.authorizer?.jwt?.claims?.sub as string;

  if (!projectName) return jsonResponse(400, { error: 'Project name is required' });
  if (!currentUserId) return jsonResponse(401, { error: 'Unauthorized' });

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const project: Project = {
    id,
    name: projectName,
    description: projectDescription ?? '',
    createdBy: currentUserId,
    createdAt,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `${ENTITY_PREFIX.PROJECT}${id}`,
        SK: `${ENTITY_PREFIX.PROJECT}${id}`,
        GSI1PK: GSI_PREFIX.PROJECTS,
        GSI1SK: createdAt,
        entityType: 'PROJECT',
        ...project,
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );

  return jsonResponse(201, { data: project });
}
