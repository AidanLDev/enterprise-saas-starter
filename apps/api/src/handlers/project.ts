import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { requireRole } from '../middleware/require-role';
import { validateBody, Schema } from '../middleware/validate';
import { jsonResponse, extractPathParams } from '../router';
import { NotFoundError } from '../errors';
import { ENTITY_PREFIX, GSI_PREFIX, Project } from '@saas-starter/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

const projectSchema: Schema = {
  projectName: { type: 'string', required: true, minLength: 1, maxLength: 120 },
  projectDescription: { type: 'string', maxLength: 2000 },
};

export async function handleCreateProject(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const result = validateBody<{ projectName: string; projectDescription?: string }>(
    event,
    projectSchema
  );
  if (!result.ok) return result.response;
  const { projectName, projectDescription } = result.data;

  const currentUserId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
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

export async function handleUpdateProject(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const { projectId } = extractPathParams(event, '/projects/{projectId}');
  if (!projectId) return jsonResponse(400, { error: 'Project ID is required' });

  const validation = validateBody<{ projectName: string; projectDescription?: string }>(
    event,
    projectSchema
  );
  if (!validation.ok) return validation.response;
  const { projectName, projectDescription } = validation.data;

  const pk = `${ENTITY_PREFIX.PROJECT}${projectId}`;

  let updateResult;
  try {
    updateResult = await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: pk },
        ConditionExpression: 'attribute_exists(PK)',
        UpdateExpression: 'SET #name = :name, description = :description',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':name': projectName,
          ':description': projectDescription ?? '',
        },
        ReturnValues: 'ALL_NEW',
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      throw new NotFoundError('Project not found');
    }
    throw error;
  }

  return jsonResponse(200, { data: updateResult.Attributes });
}

export async function handleDeleteProject(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const denied = requireRole(event, 'admin');
  if (denied) return denied;

  const { projectId } = extractPathParams(event, '/projects/{projectId}');
  if (!projectId) return jsonResponse(400, { error: 'Project ID is required' });

  const pk = `${ENTITY_PREFIX.PROJECT}${projectId}`;

  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: pk },
    })
  );

  return jsonResponse(200, { data: { projectId, status: 'deleted' } });
}

export async function handleListProjects(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const lastKeyParam = event.queryStringParameters?.lastKey;
  const exclusiveStartKey = lastKeyParam ? JSON.parse(decodeURIComponent(lastKeyParam)) : undefined;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': GSI_PREFIX.PROJECTS },
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
