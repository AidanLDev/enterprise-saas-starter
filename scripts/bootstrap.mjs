#!/usr/bin/env node

/**
 * Interactive one-time setup for deploying from GitHub Actions.
 *
 * Walks through everything the Deploy workflow needs:
 *   1. Bootstraps the AWS account/region for CDK
 *   2. Deploys the GithubOidcStack (OIDC provider + IAM deploy role)
 *   3. Sets the AWS_ROLE_ARN and AWS_REGION repository variables on GitHub
 *      (via the gh CLI when available, otherwise prints instructions)
 *
 * Requires AWS credentials with admin-level access in the shell environment
 * (the same credentials you would use to run `cdk deploy` locally).
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const outputsPath = path.join(rootDir, 'packages', 'infra', 'bootstrap-outputs.json');

// shell: true lets Windows resolve pnpm.cmd / gh.cmd
const spawnOptions = { cwd: rootDir, shell: process.platform === 'win32' };

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    ...spawnOptions,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, { ...spawnOptions, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function detectGithubRepo() {
  const remote = capture('git', ['remote', 'get-url', 'origin']);
  const match = remote.match(/github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?$/);
  return match ? match[1] : '';
}

async function main() {
  console.log('This sets up AWS so the GitHub Actions Deploy workflow can run:');
  console.log('  1. cdk bootstrap for the target account/region');
  console.log('  2. Deploy the GithubOidcStack (OIDC provider + deploy role)');
  console.log('  3. Set the AWS_ROLE_ARN / AWS_REGION repository variables\n');
  console.log('AWS credentials with admin access must be available in this shell.\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // rl.question never settles once stdin closes (e.g. piped input running
  // out), which would otherwise end the process silently with exit code 0.
  const closed = new Promise((resolve) => rl.once('close', () => resolve(null)));
  const ask = async (question) => {
    const answer = await Promise.race([rl.question(question), closed]);
    if (answer === null) {
      throw new Error('Input ended before setup was confirmed; run this script interactively.');
    }
    return answer;
  };

  const detectedRepo = detectGithubRepo();
  let repo = (await ask(`GitHub repository (owner/name) [${detectedRepo}]: `)).trim();
  repo = repo || detectedRepo;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.error('A repository in "owner/name" form is required.');
    process.exitCode = 1;
    rl.close();
    return;
  }

  const defaultRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const region = (await ask(`AWS region [${defaultRegion}]: `)).trim() || defaultRegion;

  // An AWS account can only have one OIDC provider per URL, so if another
  // project already set one up for GitHub Actions we must reference it
  // instead of creating it. If unsure answer no; a failed deploy with
  // "EntityAlreadyExists" means the answer was yes - just rerun.
  const reuseAnswer = await ask(
    'Does this AWS account already have a GitHub Actions OIDC provider? (y/N): '
  );
  const reuseProvider = reuseAnswer.trim().toLowerCase().startsWith('y');

  console.log(`\nAbout to set up deployments for ${repo} in ${region}.`);
  const confirm = await ask('Continue? (Y/n): ');
  rl.close();
  if (confirm.trim().toLowerCase().startsWith('n')) {
    console.log('Aborted; nothing was changed.');
    return;
  }

  const context = ['-c', `githubRepo=${repo}`];
  if (reuseProvider) {
    context.push('-c', 'reuseOidcProvider=true');
  }
  const awsEnv = { AWS_REGION: region };
  const cdk = ['--filter', '@saas-starter/infra', 'exec', 'cdk'];

  console.log('\nStep 1/3: Bootstrapping the AWS environment for CDK...');
  run('pnpm', [...cdk, 'bootstrap', ...context], awsEnv);

  console.log('\nStep 2/3: Deploying the GitHub OIDC provider and deploy role...');
  run(
    'pnpm',
    [
      ...cdk,
      'deploy',
      'GithubOidcStack',
      '--require-approval',
      'never',
      '--outputs-file',
      'bootstrap-outputs.json',
      ...context,
    ],
    awsEnv
  );

  const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  const roleArn = outputs.GithubOidcStack?.DeployRoleArn;
  if (!roleArn) {
    throw new Error(`DeployRoleArn not found in ${outputsPath}`);
  }

  console.log('\nStep 3/3: Setting GitHub repository variables...');
  const hasGhCli = capture('gh', ['--version']) !== '';
  let variablesSet = false;
  if (hasGhCli) {
    try {
      run('gh', ['variable', 'set', 'AWS_ROLE_ARN', '--repo', repo, '--body', roleArn]);
      run('gh', ['variable', 'set', 'AWS_REGION', '--repo', repo, '--body', region]);
      variablesSet = true;
    } catch {
      console.log('Could not set variables via the gh CLI (not authenticated?).');
    }
  }
  if (!variablesSet) {
    console.log(`\nSet these repository variables manually on GitHub`);
    console.log(`(https://github.com/${repo}/settings/variables/actions):`);
    console.log(`  AWS_ROLE_ARN = ${roleArn}`);
    console.log(`  AWS_REGION   = ${region}`);
  }

  console.log('\nDone. Push to main or run the Deploy workflow to deploy the app.');
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
