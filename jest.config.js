module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "json",
    "text",
    "lcov",
    "clover"
  ],
  
  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Activates notifications for test results
  notify: false,
  
  // An enum that specifies notification mode. Requires { notify: true }
  notifyMode: "failure-change",
  
  // A preset that is used as a base for Jest's configuration
  preset: null,
  
  // Run tests from one or more projects
  projects: null,
  
  // The test environment that will be used for testing
  testEnvironment: "node",
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)",
    "**/test/**/*.test.js"
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  
  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: [],
  
  // This option allows the use of a custom results processor
  testResultsProcessor: null,
  
  // Indicates whether each individual test should be reported during the run
  verbose: true
};