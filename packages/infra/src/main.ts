#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SaasStack } from './saas-stack';

const app = new cdk.App();

new SaasStack(app, 'SaasStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
