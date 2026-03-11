import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { jsonResponse } from '../router';
import type { UserRole } from '@saas-starter/shared';

export function getUserRole(event: APIGatewayProxyEventV2WithJWTAuthorizer): UserRole | null {
  const groups = event.requestContext.authorizer?.jwt?.claims?.['cognito:groups'];
  if (Array.isArray(groups)) return groups[0] as UserRole;
  if (typeof groups === 'string') {
    // API Gateway v2 JWT authorizer may serialize array claims as "[admin]" or "admin"
    const cleaned = groups.replace(/^\[|\]$/g, '').trim();
    return (cleaned || null) as UserRole | null;
  }
  return null;
}

export function requireRole(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
  role: UserRole
): APIGatewayProxyResultV2 | null {
  const userRole = getUserRole(event);
  if (userRole !== role) {
    return jsonResponse(403, { error: 'Forbidden' });
  }
  return null;
}
