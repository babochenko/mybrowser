// Mock Chrome Extension APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys) => Promise.resolve({})),
      set: jest.fn((data) => Promise.resolve())
    }
  },
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve({ success: true })),
    onMessage: {
      addListener: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve([{ result: null }]))
  }
};

// Mock fetch for OpenAI API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ 
        message: { 
          content: 'document.querySelector(".test-element").remove();' 
        } 
      }]
    })
  })
);

// Mock DOM methods
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'example.com'
  },
  writable: true
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve())
  },
  writable: true
});

// Setup JSDOM environment
require('jest-environment-jsdom');