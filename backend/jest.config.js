module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000, // 30 seconds
  detectOpenHandles: true,
  forceExit: true,
  verbose: true
};
