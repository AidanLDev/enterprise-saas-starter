import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { route, resolve, jsonResponse } from './router';
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

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const routeHandler = resolve(event);
  if (!routeHandler) {
    return jsonResponse(404, { error: 'Route not found' });
  }

  try {
    return await routeHandler(event);
  } catch (error) {
    console.error('Unhandled error:', error);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
