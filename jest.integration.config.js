const baseConfig = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  testRegex: 'test/integration/.*\\.integration\\.spec\\.ts$',
  testPathIgnorePatterns: [],
  globalSetup: '<rootDir>/test/integration/setup/global-setup.ts',
  globalTeardown: '<rootDir>/test/integration/setup/global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/test/integration/setup/integration-env.ts'],
  maxWorkers: 1,
  testTimeout: 30_000,
  collectCoverageFrom: undefined,
  coverageThreshold: undefined,
};
