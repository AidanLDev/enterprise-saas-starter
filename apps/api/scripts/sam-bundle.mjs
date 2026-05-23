import { execSync } from 'child_process';
import path from 'path';

const root = path.resolve(__dirname, '../../..');

execSync(
  [
    'npx esbuild apps/api/src/index.ts',
    '--bundle',
    '--platform=node',
    '--target=node22',
    '--outfile=apps/api/.sam-bundle/index.js',
    '--external:@aws-sdk/*',
  ].join(' '),
  { cwd: root, stdio: 'inherit' }
);
