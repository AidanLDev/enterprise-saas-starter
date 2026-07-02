#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SaasStack } from './saas-stack';
import { GithubOidcStack } from './github-oidc-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// `pnpm run bootstrap` passes the githubRepo context to deploy the CI/CD
// prerequisites. Only one stack exists per mode so plain `cdk deploy` and
// `cdk synth` stay unambiguous, and synthesizing the OIDC stack doesn't
// require the frontend to have been built (SaasStack bundles apps/web/out).
const githubRepo: string | undefined = app.node.tryGetContext('githubRepo');

if (githubRepo) {
  new GithubOidcStack(app, 'GithubOidcStack', {
    githubRepo,
    reuseExistingProvider: app.node.tryGetContext('reuseOidcProvider') === 'true',
    env,
  });
} else {
  new SaasStack(app, 'SaasStack', { env });
}
