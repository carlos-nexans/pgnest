module.exports = {
  displayName: 'PGMQ E2E Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/*.e2e.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: [
    'src/**/*.ts',
  ],
  coverageDirectory: './coverage',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
