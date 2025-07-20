# MyBrowser Extension - Testing Guide

This document explains how to run the comprehensive test suite for the MyBrowser extension.

## Test Overview

The test suite includes:

- **Unit Tests**: Test individual components and functions with mocked dependencies
- **Integration Tests**: Test component interactions and data flow
- **Headless Browser Tests**: Test the extension in a real browser environment
- **LLM Mock Tests**: Test with simulated OpenAI API responses
- **Element Manipulation Tests**: Verify element removal and hiding functionality

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Or use the custom test runner
node test/run-headless-tests.js
```

## Test Commands

```bash
# Run all tests
npm test
node test/run-headless-tests.js

# Run with coverage report
npm run test:coverage
node test/run-headless-tests.js --coverage

# Run only unit tests
node test/run-headless-tests.js --unit

# Run only integration tests  
node test/run-headless-tests.js --integration

# Run only headless browser tests
node test/run-headless-tests.js --headless

# Run in watch mode (auto-rerun on file changes)
npm run test:watch
node test/run-headless-tests.js --watch
```

## Test Structure

```
test/
├── setup.js                 # Jest configuration and mocks
├── mybrowser-popover.test.js # Unit tests for main extension class
├── background.test.js        # Unit tests for background script
├── headless-browser.test.js  # Integration tests with real browser
├── run-headless-tests.js     # Console test runner
└── test-page.html           # Sample page for manual testing
```

## What Gets Tested

### MyBrowser Popover Tests
- ✅ Extension initialization and setup
- ✅ Popover show/hide functionality  
- ✅ API key management
- ✅ Storage operations (save/load snippets)
- ✅ LLM integration with mocked responses
- ✅ Snippet generation and naming
- ✅ Error handling for API failures
- ✅ HTML content extraction
- ✅ Full workflow integration

### Background Script Tests
- ✅ Message handling between content and background scripts
- ✅ Snippet execution with extension privileges
- ✅ CSP bypass functionality
- ✅ Fallback execution methods
- ✅ Code cleaning and sanitization
- ✅ DOM manipulation (querySelector, querySelectorAll, getElementById)
- ✅ Element removal and style changes
- ✅ Script injection fallbacks

### Headless Browser Tests
- ✅ Extension loading in real browser environment
- ✅ Content script injection and initialization
- ✅ Keyboard shortcut activation (Cmd+K/Ctrl+K)
- ✅ Popover UI interaction
- ✅ Element removal from actual DOM
- ✅ Element hiding vs removal
- ✅ Multiple page structures
- ✅ Snippet persistence and reuse
- ✅ Error handling in browser context

## Mocked Dependencies

The tests mock the following APIs and services:

### Chrome Extension APIs
- `chrome.storage.local` - Extension storage
- `chrome.runtime.sendMessage` - Message passing
- `chrome.scripting.executeScript` - Script injection

### External APIs
- **OpenAI API**: Mocked to return predictable JavaScript snippets
- **Fetch API**: Mocked for HTTP requests
- **DOM APIs**: Partial mocking for testing

### Sample Mock Responses

```javascript
// Typical mocked LLM response
{
  choices: [{
    message: {
      content: 'document.querySelector(".test-element").remove();'
    }
  }]
}

// Mocked storage response
{
  'example.com': {
    'remove_ads': 'document.querySelector(".ad").remove();'
  },
  'example.com_enabled': {
    'remove_ads': true
  }
}
```

## Manual Testing

Use the included test page for manual verification:

```bash
# Open the test page in your browser
open test/test-page.html
```

The test page includes:
- Various advertisement elements to remove
- Different page structures (banners, sidebars, popups)
- Interactive controls to add dynamic content
- Console logging for debugging

### Manual Test Scenarios

1. **Load Extension**: Ensure the extension loads and initializes
2. **Open Popover**: Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
3. **Test Queries**: Try different removal requests:
   - "remove all advertisements"
   - "hide the banner ads"
   - "remove the sidebar ads"
   - "hide the social share buttons"

## Test Environment Requirements

- **Node.js** 16+ (for Jest and Puppeteer)
- **Chrome/Chromium** (for headless browser tests)
- **JSDOM** (for unit test DOM simulation)

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

The test suite is designed to run in CI/CD environments:

- All tests are deterministic with mocked dependencies
- No external API calls in test mode
- Headless browser mode for server environments
- Configurable timeouts and retry logic

## Debugging Tests

### Console Output
Tests include detailed console logging for debugging:

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npx jest test/mybrowser-popover.test.js --verbose
```

### Browser DevTools
For headless browser tests, you can enable visible browser mode:

```javascript
// In headless-browser.test.js, change:
headless: 'new'
// to:
headless: false
```

## Common Issues

### Puppeteer Installation
If Puppeteer fails to download Chromium:
```bash
npx puppeteer browsers install chrome
```

### Permission Errors
Ensure the test runner is executable:
```bash
chmod +x test/run-headless-tests.js
```

### Extension Loading
If headless tests fail to load the extension:
- Verify manifest.json is valid
- Check file permissions
- Ensure Chrome/Chromium is available

---

## Example Test Output

```
🚀 Starting MyBrowser Extension Test Suite

📦 Installing dependencies...
✅ Dependencies installed successfully

🧪 Running Unit Tests...

 PASS  test/mybrowser-popover.test.js
 PASS  test/background.test.js  
 PASS  test/headless-browser.test.js

✅ All tests passed!

📊 Test Summary:
  • MyBrowser Popover Unit Tests
  • Background Script Tests
  • Headless Browser Integration Tests
  • LLM Mock Integration Tests
  • Element Removal & Manipulation Tests

🎉 Test suite completed successfully!
```

This comprehensive test suite ensures the MyBrowser extension works reliably across different scenarios and browser environments.