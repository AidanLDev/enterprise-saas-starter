## What changed and why

<!-- Focus on why — the diff already shows what. -->

## Which part of the stack does this touch?

<!-- e.g. frontend (apps/web), API (apps/api), infra/CDK (packages/infra), shared (packages/shared), CI/CD -->

## Checklist

- [ ] `pnpm run format:check` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` passes
- [ ] `pnpm --filter @saas-starter/api test` passes
- [ ] `pnpm --filter @saas-starter/infra synth` passes (if infra changed)
- [ ] Tests added/updated for behavior that changed
- [ ] Linked to a related issue, if one exists

## Manual verification needed?

<!--
e.g. infra changes that can't be fully validated by `cdk synth` alone,
or anything a reviewer should actually click through to confirm.
-->
