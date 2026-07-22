# apps/api

The backend: a serverless REST API running as a single Lambda function behind API Gateway (HTTP API, JWT authorizer wired to Cognito). Routing, auth, and validation are hand-rolled rather than pulled in from a framework, to keep the dependency footprint small.

See the [root README](../../README.md) for how this fits into the rest of the monorepo.

## Structure

```
src/
  index.ts              Lambda entry point — resolves the route, runs it, maps errors to responses
  router.ts             tiny routing layer (path patterns, param extraction, JSON responses)
  openapi.ts             OpenAPI spec served at /docs
  errors.ts              AppError and friends — thrown errors become JSON error responses
  logger.ts
  middleware/
    require-role.ts      reads the Cognito group claim off the JWT authorizer context, enforces RBAC
    validate.ts           request body/schema validation
  handlers/               one file per resource (health, users, admin, project, docs)
  services/               business logic that talks to DynamoDB, separate from HTTP concerns
tests/
  unit/                   Jest unit tests
scripts/
  sam-bundle.mjs          bundles the Lambda for local invocation via SAM
template.yaml             AWS SAM template used for local API emulation
```

## Routing & Auth

Routes are registered in [src/index.ts](src/index.ts) with a plain `route(method, path, handler)` call — no framework, see [src/router.ts](src/router.ts). Path params use `{param}` syntax (e.g. `/admin/users/{userId}/role`).

Authentication is handled entirely by API Gateway's JWT authorizer against the Cognito user pool (configured in [packages/infra](../../packages/infra/README.md)) — by the time a request reaches a handler, it's already authenticated. Role-based access control is enforced per-handler via [`requireRole`](src/middleware/require-role.ts), which reads the `cognito:groups` claim off the authorizer context.

Thrown `AppError`s (see [src/errors.ts](src/errors.ts)) and known AWS SDK exceptions are mapped to appropriate HTTP status codes centrally in `index.ts`; anything unexpected becomes a logged 500.

## API Docs

Once running, interactive Swagger docs are served at `/docs` (spec at `/docs/openapi.json`), generated from [src/openapi.ts](src/openapi.ts).

## Development

Requires the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to emulate API Gateway + Lambda locally.

```bash
pnpm sam:start     # bundles the Lambda and starts a local API Gateway emulator
```

This is what `pnpm dev` at the repo root points the frontend at by default (`NEXT_PUBLIC_API_URL=http://localhost:3001`).

## Testing

```bash
pnpm test          # Jest unit tests
```

## Deployment

This function is deployed as part of the CDK app in [packages/infra](../../packages/infra/README.md), wired to API Gateway and the Cognito authorizer there. It isn't deployed independently — run `pnpm deploy` from the repo root.
