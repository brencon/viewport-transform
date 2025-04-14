module.exports = {
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  
  // An array of file extensions your modules use
  moduleFileExtensions: ["js", "json", "jsx", "node"],
  
  // The test environment that will be used for testing
  testEnvironment: "node",
  
  // The glob patterns Jest uses to detect test files
  testMatch: ["**/test/**/*.test.js"],
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["json", "text", "lcov", "clover", "html"],
  
  // The threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8"
};