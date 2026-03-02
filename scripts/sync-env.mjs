#!/usr/bin/env node

/**
 * Reads CDK stack outputs from packages/infra/cdk-outputs.json
 * and writes the frontend environment variables to apps/web/.env.local
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputsPath = path.join(__dirname, '..', 'packages', 'infra', 'cdk-outputs.json');
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');

if (!fs.existsSync(outputsPath)) {
  console.error('Error: cdk-outputs.json not found. Run "pnpm run deploy" first.');
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// CDK outputs are nested under the stack name
const stackName = Object.keys(outputs)[0];
if (!stackName) {
  console.error('Error: No stack found in cdk-outputs.json.');
  process.exit(1);
}

const values = outputs[stackName];

const env = [
  `NEXT_PUBLIC_API_URL=${values.ApiUrl ?? ''}`,
  `NEXT_PUBLIC_USER_POOL_ID=${values.UserPoolId ?? ''}`,
  `NEXT_PUBLIC_USER_POOL_CLIENT_ID=${values.UserPoolClientId ?? ''}`,
  '',
].join('\n');

fs.writeFileSync(envPath, env, 'utf-8');
console.log(`Wrote environment variables to ${path.relative(process.cwd(), envPath)}`);
