# packages/infra

All infrastructure as code, defined with the [AWS CDK](https://aws.amazon.com/cdk/) (TypeScript). This is what `pnpm deploy` runs — there's no manual console setup.

See the [root README](../../README.md) for how this fits into the rest of the monorepo.

## Structure

```
src/
  main.ts                      CDK app entry point — picks which stack to synthesize
  saas-stack.ts                 the application stack: wires Database, Auth, Api, Frontend together
  github-oidc-stack.ts          one-time CI/CD prerequisites (see below)
  constructs/
    database.ts                 DynamoDB table
    auth.ts                     Cognito user pool + client + post-confirmation trigger
    api.ts                      API Gateway (HTTP API) + Lambda, wired to the JWT authorizer
    frontend.ts                  S3 + CloudFront for the built Next.js app
  triggers/
    post-confirmation.ts        Cognito Lambda trigger — provisions a user row on signup
template.yaml (apps/api)        used for local API emulation only, not for deployment
```

## Stacks

`src/main.ts` synthesizes exactly one stack per run, chosen by CDK context:

- **`SaasStack`** (default) — the actual application: DynamoDB table, Cognito user pool, API Gateway + Lambda, CloudFront + S3 for the frontend. Deployed by `pnpm deploy`.
- **`GithubOidcStack`** — deployed once via `pnpm bootstrap` (see [scripts/bootstrap.mjs](../../scripts/bootstrap.mjs) at the repo root). Sets up a GitHub OIDC identity provider and an IAM role scoped to your repo, so GitHub Actions can deploy without long-lived AWS credentials.

## What Gets Deployed

- **Database** — a single DynamoDB table (`PK`/`SK` + a `GSI1` inverted index for email/cross-entity lookups), following a single-table design. Pay-per-request billing, point-in-time recovery on, streams enabled.
- **Auth** — a Cognito user pool with self-signup and email verification. A post-confirmation Lambda trigger provisions a corresponding user row in DynamoDB on signup — the **first user to confirm is automatically made `admin`**, everyone after that is a regular `user`.
- **Api** — an HTTP API (API Gateway v2) backed by a single Lambda (see [apps/api](../../apps/api/README.md)), authenticated via a JWT authorizer against the Cognito user pool.
- **Frontend** — the Next.js app is statically exported (`apps/web/out`) and served from S3 via CloudFront (HTTPS-only, optimized caching).

Stack outputs (table name, user pool ID/client ID, API URL, frontend URL) are written to `cdk-outputs.json` and consumed by `scripts/sync-env.mjs` at the repo root to populate the frontend's `.env.local`.

## Commands

```bash
pnpm --filter @saas-starter/infra run synth   # synthesize CloudFormation without deploying
pnpm --filter @saas-starter/infra run diff    # show what would change
pnpm --filter @saas-starter/infra run deploy  # deploy (normally run via `pnpm deploy` at the root)
```

Deploying requires the target AWS account to be [CDK-bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) — `pnpm bootstrap` at the repo root handles this as part of first-time setup.

## Removal Policy

Resources here (DynamoDB table, S3 bucket) use `RemovalPolicy.DESTROY` and, for the frontend bucket, `autoDeleteObjects` — intentional for a starter kit, so `cdk destroy` cleanly tears everything down. If you're building toward production with real data, revisit this before you have data you can't afford to lose.
