import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { route, resolve, jsonResponse } from './router';
import { handleHealth } from './handlers/health';
import { handleGetMe } from './handlers/users';

route('GET', '/health', handleHealth);
route('GET', '/users/me', handleGetMe);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('routeKey:', event.routeKey);

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
