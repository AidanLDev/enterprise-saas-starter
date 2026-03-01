import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { jsonResponse } from '../router';

export async function handleHealth(_event: APIGatewayProxyEventV2) {
  console.log('Health check endpoint called: ', _event);
  return jsonResponse(200, { status: 'ok', timestamp: new Date().toISOString() });
}
