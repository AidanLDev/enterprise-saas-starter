import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { route, resolve, jsonResponse } from './router';
import { AppError } from './errors';
import { logger } from './logger';
import { handleHealth } from './handlers/health';
import { handleGetMe } from './handlers/users';
import {
  handleListUsers,
  handleUpdateUserRole,
  handleInviteUser,
  handleDeleteUser,
} from './handlers/admin';
import {
  handleCreateProject,
  handleDeleteProject,
  handleListProjects,
  handleUpdateProject,
} from './handlers/project';
import { handleDocsHtml, handleDocsJson } from './handlers/docs';

route('GET', '/health', handleHealth);
route('GET', '/users/me', handleGetMe);
route('GET', '/admin/users', handleListUsers);
route('PUT', '/admin/users/{userId}/role', handleUpdateUserRole);
route('POST', '/admin/invite', handleInviteUser);
route('DELETE', '/admin/users/{userId}', handleDeleteUser);
route('GET', '/projects', handleListProjects);
route('POST', '/projects', handleCreateProject);
route('PUT', '/projects/{projectId}', handleUpdateProject);
route('DELETE', '/projects/{projectId}', handleDeleteProject);
route('GET', '/docs/openapi.json', handleDocsJson);
route('GET', '/docs', handleDocsHtml);

/** Known AWS SDK exception names mapped to an HTTP status + message. */
const AWS_ERROR_MAP: Record<string, { statusCode: number; message: string }> = {
  ConditionalCheckFailedException: { statusCode: 409, message: 'Resource state conflict' },
  ResourceNotFoundException: { statusCode: 404, message: 'Resource not found' },
  ValidationException: { statusCode: 400, message: 'Invalid request' },
  UsernameExistsException: { statusCode: 409, message: 'User already exists' },
  UserNotFoundException: { statusCode: 404, message: 'User not found' },
  TooManyRequestsException: { statusCode: 429, message: 'Too many requests, please retry' },
  ThrottlingException: { statusCode: 429, message: 'Too many requests, please retry' },
};

function toErrorResponse(error: unknown): APIGatewayProxyResultV2 {
  if (error instanceof AppError) {
    return jsonResponse(error.statusCode, {
      error: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
    });
  }

  if (error instanceof Error && error.name in AWS_ERROR_MAP) {
    const mapped = AWS_ERROR_MAP[error.name];
    return jsonResponse(mapped.statusCode, { error: mapped.message });
  }

  logger.error('Unhandled error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return jsonResponse(500, { error: 'Internal server error' });
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { method, path } = event.requestContext.http;
  const start = Date.now();

  const routeHandler = resolve(event);
  if (!routeHandler) {
    logger.warn('Route not found', { method, path });
    return jsonResponse(404, { error: 'Route not found' });
  }

  let response: APIGatewayProxyResultV2;
  try {
    response = await routeHandler(event);
  } catch (error) {
    response = toErrorResponse(error);
  }

  const statusCode =
    typeof response === 'object' && 'statusCode' in response ? response.statusCode : undefined;

  logger.info('Request handled', { method, path, statusCode, durationMs: Date.now() - start });

  return response;
};
