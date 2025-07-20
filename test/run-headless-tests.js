#!/usr/bin/env node

/**
 * Console runner for headless browser tests
 * Provides a simple way to run all tests from command line
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting MyBrowser Extension Test Suite\n');

// Check if dependencies are installed
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Dependencies installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Function to run tests with proper error handling
function runTests() {
  console.log('🧪 Running Unit Tests...');
  
  try {
    // Run Jest tests
    execSync('npm test', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('\n✅ All tests passed!\n');
    
    // Display test summary
    console.log('📊 Test Summary:');
    console.log('  • MyBrowser Popover Unit Tests');
    console.log('  • Background Script Tests');
    console.log('  • Headless Browser Integration Tests');
    console.log('  • LLM Mock Integration Tests');
    console.log('  • Element Removal & Manipulation Tests\n');
    
    console.log('🎉 Test suite completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Function to run specific test file
function runSpecificTest(testFile) {
  console.log(`🎯 Running specific test: ${testFile}`);
  
  try {
    execSync(`npx jest ${testFile}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log(`\n✅ ${testFile} tests passed!`);
    
  } catch (error) {
    console.error(`\n❌ ${testFile} tests failed.`);
    process.exit(1);
  }
}

// Function to run tests with coverage
function runTestsWithCoverage() {
  console.log('📈 Running tests with coverage report...');
  
  try {
    execSync('npm run test:coverage', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('\n✅ Tests completed with coverage report!');
    console.log('📁 Coverage report available in ./coverage directory');
    
  } catch (error) {
    console.error('\n❌ Tests failed during coverage run.');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node run-headless-tests.js [options]

Options:
  --help, -h          Show this help message
  --coverage          Run tests with coverage report
  --unit              Run only unit tests
  --integration       Run only integration tests
  --headless          Run only headless browser tests
  --watch             Run tests in watch mode

Examples:
  node run-headless-tests.js                    # Run all tests
  node run-headless-tests.js --coverage         # Run with coverage
  node run-headless-tests.js --unit             # Run unit tests only
  node run-headless-tests.js --headless         # Run headless tests only
`);
  process.exit(0);
}

if (args.includes('--coverage')) {
  runTestsWithCoverage();
} else if (args.includes('--unit')) {
  console.log('🧪 Running Unit Tests Only...');
  runSpecificTest('test/mybrowser-popover.test.js');
  runSpecificTest('test/background.test.js');
} else if (args.includes('--integration')) {
  console.log('🔗 Running Integration Tests Only...');
  runSpecificTest('test/headless-browser.test.js');
} else if (args.includes('--headless')) {
  console.log('🎭 Running Headless Browser Tests Only...');
  runSpecificTest('test/headless-browser.test.js');
} else if (args.includes('--watch')) {
  console.log('👀 Running tests in watch mode...');
  try {
    execSync('npm run test:watch', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' }
    });
  } catch (error) {
    console.error('\n❌ Watch mode failed.');
    process.exit(1);
  }
} else {
  runTests();
}