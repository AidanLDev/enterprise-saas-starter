import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

export const ddbMock = mockClient(DynamoDBDocumentClient);
export const cognitoMock = mockClient(CognitoIdentityProviderClient);

export function resetMocks(): void {
  ddbMock.reset();
  cognitoMock.reset();
  process.env.TABLE_NAME = 'test-table';
  process.env.USER_POOL_ID = 'us-east-1_test';
}

export function makeEvent(overrides: {
  userId?: string;
  role?: string;
  path?: string;
  method?: string;
  body?: unknown;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}): APIGatewayProxyEventV2WithJWTAuthorizer {
  const {
    userId = 'admin-user-id',
    role = 'admin',
    path = '/',
    method = 'GET',
    body,
    pathParameters,
    queryStringParameters,
  } = overrides;

  return {
    version: '2.0',
    routeKey: '$default',
    rawPath: path,
    rawQueryString: '',
    headers: {},
    pathParameters,
    queryStringParameters,
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test-api.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test-api',
      http: {
        method,
        path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'test-request-id',
      routeKey: '$default',
      stage: '$default',
      time: '01/Jan/2026:00:00:00 +0000',
      timeEpoch: 0,
      authorizer: {
        principalId: userId,
        integrationLatency: 0,
        jwt: {
          claims: {
            sub: userId,
            'cognito:groups': role,
          },
          scopes: [],
        },
      },
    },
  };
}

export function asStructuredResult(
  result: APIGatewayProxyResultV2
): APIGatewayProxyStructuredResultV2 {
  if (typeof result === 'string') {
    throw new Error('Expected a structured API Gateway result, got a string');
  }
  return result;
}
