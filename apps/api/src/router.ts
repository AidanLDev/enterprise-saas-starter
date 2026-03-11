import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteHandler = (event: any) => Promise<APIGatewayProxyResultV2>;

interface RouteEntry {
  method: string;
  path: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: RouteEntry[] = [];

export function route(method: string, path: string, handler: RouteHandler): void {
  const paramNames: string[] = [];
  const patternStr = path.replace(/\{([^}]+)\}/g, (_match, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const pattern = new RegExp(`^${patternStr}$`);
  routes.push({ method, path, pattern, paramNames, handler });
}

export function resolve(event: APIGatewayProxyEventV2): RouteHandler | undefined {
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  for (const entry of routes) {
    if (entry.method !== method) continue;
    if (entry.pattern.test(path)) return entry.handler;
  }

  return undefined;
}

export function extractPathParams(
  event: APIGatewayProxyEventV2,
  routePath: string
): Record<string, string> {
  const paramNames: string[] = [];
  const patternStr = routePath.replace(/\{([^}]+)\}/g, (_match, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const pattern = new RegExp(`^${patternStr}$`);
  const match = event.rawPath.match(pattern);
  if (!match) return {};

  const params: Record<string, string> = {};
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1];
  });
  return params;
}

export function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
