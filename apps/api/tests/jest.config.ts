import { defineConfig } from 'jest';

export default defineConfig({
  verbose: true,
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/setup-env.ts'],
  roots: ['<rootDir>/unit'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
});
