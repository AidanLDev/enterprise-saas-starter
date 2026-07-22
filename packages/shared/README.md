# packages/shared

Types and constants shared between [apps/web](../../apps/web/README.md), [apps/api](../../apps/api/README.md), and [packages/infra](../infra/README.md), so the frontend, backend, and infrastructure code all agree on the shape of the data without duplicating it.

See the [root README](../../README.md) for how this fits into the rest of the monorepo.

## What's In Here

Everything is re-exported from [src/index.ts](src/index.ts). Currently:

- **Domain types** — `User`, `Project`, `UserRole` (`'admin' | 'user'`), `ApiResponse<T>`
- **`COGNITO_GROUPS`** — the Cognito group names used for role checks (kept in sync with `UserRole`)
- **`ENTITY_PREFIX`** / **`GSI_PREFIX`** — the key prefixes used in the DynamoDB single-table design (e.g. `USER#`, `PROJECT#`), so item-key construction stays consistent between the API and any infra code (like the post-confirmation trigger) that writes to the table directly

There's no runtime logic here — just types and const objects — so it's safe to import into both Lambda code and the Next.js app.

## Usage

Other workspace packages depend on this via the pnpm workspace protocol:

```json
"@saas-starter/shared": "workspace:*"
```

```ts
import { User, UserRole, ENTITY_PREFIX } from '@saas-starter/shared';
```

## Development

```bash
pnpm --filter @saas-starter/shared run build   # compiles src/ to dist/ (main/types entry points)
```

Consuming packages import from `dist/`, so after changing something here, dependents need this rebuilt — `pnpm build` at the repo root (`pnpm -r build`) handles that ordering for you.
