# apps/web

The frontend: a [Next.js](https://nextjs.org) (App Router) app styled with Tailwind, statically exported (`output: 'export'`) and served from S3 via CloudFront. Handles authentication (via Cognito) and the authenticated app shell.

Because it's a static export, there's no Next.js server at request time — pages fetch dynamic data client-side against the API (see [lib/api.ts](lib/api.ts)) rather than relying on server-side rendering per request.

See the [root README](../../README.md) for how this fits into the rest of the monorepo.

## Structure

```
app/
  (app)/            authenticated routes — dashboard, projects, team
  login/
  signup/
  confirm/          Cognito email confirmation
  forgot-password/
  reset-password/
components/
  ui/                shared, generic UI primitives (Button, Input, Modal, ...)
  projects/          feature-specific components
  auth-provider.tsx  Cognito session/auth context
  sidebar-nav.tsx
lib/
  api.ts             fetch wrapper for the backend API
  auth.ts            Cognito auth helpers
  config.ts           reads NEXT_PUBLIC_* env vars
e2e/                 Playwright end-to-end tests
```

## Configuration

The app reads its Cognito and API settings from environment variables (see [lib/config.ts](lib/config.ts)):

```
NEXT_PUBLIC_API_URL             # base URL of the deployed API
NEXT_PUBLIC_USER_POOL_ID        # Cognito user pool ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID # Cognito app client ID
```

Locally these live in `.env.local` (gitignored). After running `pnpm deploy` from the repo root, `scripts/sync-env.mjs` writes these automatically from the CDK stack outputs — you shouldn't need to set them by hand unless you're pointing at infra deployed some other way.

## Development

From the repo root:

```bash
pnpm dev
```

Or from this directory:

```bash
pnpm dev          # start the dev server on http://localhost:3000
pnpm build        # production build
pnpm start         # run a production build locally
pnpm lint          # eslint
```

## Testing

End-to-end tests use [Playwright](https://playwright.dev):

```bash
pnpm test:e2e      # run e2e tests headless
pnpm test:e2e:ui   # run with the Playwright UI
```

## Deployment

This app is deployed as static/SSR assets to CloudFront via OpenNext, defined in [packages/infra](../../packages/infra/README.md). It isn't deployed independently — run `pnpm deploy` from the repo root, which builds this app and deploys it as part of the full stack.
