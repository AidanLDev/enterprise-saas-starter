# Contributing

Thanks for considering a contribution. This is a reference architecture that a lot of people fork and adapt, so the bar for changes is less "does this add a feature" and more "does this keep the foundation clean, minimal, and easy to understand."

## Before You Start

For anything beyond a small fix — new features, structural changes, new dependencies — please open an issue first to discuss the approach. This project deliberately keeps its dependency footprint small (see the [root README](README.md)); a PR that's a great idea in isolation might still not fit that goal.

## Project Structure

See the [root README](README.md#project-structure) for the monorepo layout, and each app/package's own README for details:

- [apps/web](apps/web/README.md)
- [apps/api](apps/api/README.md)
- [packages/infra](packages/infra/README.md)
- [packages/shared](packages/shared/README.md)

## Getting Set Up

```bash
pnpm install
```

You'll need an AWS account if you want to deploy and test against real infrastructure (see the root README's Getting Started section). Local development against the API doesn't require a deployed backend — `apps/api` can run locally via SAM.

## Making Changes

- Keep PRs focused — one logical change per PR.
- Match the existing code style; formatting is enforced by Prettier and linting by ESLint (both run in CI, and via a pre-commit hook through Husky/lint-staged, so most issues get caught before you even push).
- Write commit messages and PR descriptions that explain _why_, not just _what_.
- Add or update tests for behavior you change (Jest for `apps/api`, Playwright for `apps/web`).

## Before Opening a PR

Run the same checks CI runs:

```bash
pnpm run format:check   # or `pnpm run format` to auto-fix
pnpm run lint
pnpm run build
pnpm --filter @saas-starter/api test
pnpm --filter @saas-starter/infra synth   # confirms the CDK stack still synthesizes cleanly
```

E2E tests (`pnpm --filter web test:e2e`) require Playwright browsers installed (`pnpm --filter web exec playwright install`) and are also run in CI.

## Opening a PR

- Target `main`.
- Describe what changed and why, and call out anything that needs manual verification (e.g. infra changes that can't be fully validated by `cdk synth` alone).
- Link any related issue.

## Reporting Bugs / Requesting Features

Open a GitHub issue using the bug report or feature request template. For bugs, include repro steps and which part of the stack is affected (frontend, API, infra). For feature requests, a short rationale for why it belongs in a _starter_ rather than something you'd add after forking helps a lot.

## Reporting Security Issues

Please don't open a public issue for security vulnerabilities — see [SECURITY.md](SECURITY.md) for how to report privately.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
