# Security Policy

This is a reference architecture that people deploy into their own AWS accounts. A vulnerability here isn't just a bug in this repo — it can end up live in production for anyone who's forked and deployed it. Please report responsibly.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, use [GitHub's private vulnerability reporting](../../security/advisories/new) for this repo (Security tab → "Report a vulnerability"). This opens a private draft advisory visible only to maintainers, so the issue isn't public before there's a fix.

If you can't use that for some reason, email dev@aidanlowson.com with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal repro is ideal)
- Which part of the stack is affected — frontend, API, infra/CDK, or auth

## What Counts as a Security Issue Here

Given the stack (Cognito, API Gateway, Lambda, DynamoDB, CDK), things worth reporting privately include:

- Anything that lets a request bypass Cognito JWT validation or role checks (see [`requireRole`](apps/api/src/middleware/require-role.ts))
- IAM policies in [packages/infra/src/constructs](packages/infra/src/constructs) that are broader than they need to be
- Any way user data could leak across tenants/users in DynamoDB access patterns
- Secrets or credentials that could end up baked into a deployed artifact (frontend bundle, Lambda package, CloudFormation template)

General code quality issues, missing features, or "this could be more secure by default but isn't exploitable" observations are fine as normal public issues or PRs.

## Response

This is a community-maintained OSS project, not a funded security team — there's no guaranteed SLA. Reports will be acknowledged as soon as reasonably possible, and a fix or mitigation will be prioritized based on severity.
