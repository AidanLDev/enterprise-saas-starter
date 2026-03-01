import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteHandler = (event: any) => Promise<APIGatewayProxyResultV2>;

const routes = new Map<string, RouteHandler>();

export function route(method: string, path: string, handler: RouteHandler): void {
  routes.set(`${method} ${path}`, handler);
}

export function resolve(event: APIGatewayProxyEventV2): RouteHandler | undefined {
  return routes.get(event.routeKey);
}

export function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
