/**
 * Unit Tests for MyBrowser Extension
 * Tests the core functionality including LLM integration and element manipulation
 */

// Import the content script
const fs = require('fs');
const path = require('path');

// Load the actual content script
const contentScript = fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8');

describe('MyBrowserPopover', () => {
  let myBrowserInstance;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful storage responses
    chrome.storage.local.get.mockImplementation((keys) => {
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          if (key === 'example.com') {
            result[key] = { 'remove_ads': 'document.querySelector(".ad").remove();' };
          } else if (key === 'example.com_enabled') {
            result[key] = { 'remove_ads': true };
          } else if (key === 'openai_api_key') {
            result[key] = 'sk-test-key-123';
          }
        });
        return Promise.resolve(result);
      } else if (typeof keys === 'string') {
        const result = {};
        if (keys === 'example.com') {
          result[keys] = { 'remove_ads': 'document.querySelector(".ad").remove();' };
        } else if (keys === 'example.com_enabled') {
          result[keys] = { 'remove_ads': true };
        } else if (keys === 'openai_api_key') {
          result[keys] = 'sk-test-key-123';
        }
        return Promise.resolve(result);
      }
      return Promise.resolve({});
    });
    
    // Execute the content script in test environment
    eval(contentScript);
    
    // Get the instance
    myBrowserInstance = window.myBrowserInstance;
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(myBrowserInstance.isVisible).toBe(false);
      expect(myBrowserInstance.currentWebsite).toBe('example.com');
      expect(myBrowserInstance.snippets).toEqual({});
      expect(myBrowserInstance.enabledSnippets).toEqual({});
    });

    test('should load stored data on initialization', async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async init
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['example.com']);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['example.com_enabled']);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['openai_api_key']);
    });
  });

  describe('Popover Management', () => {
    test('should show popover when toggled', async () => {
      await myBrowserInstance.showPopover();
      
      expect(myBrowserInstance.isVisible).toBe(true);
      expect(document.querySelector('#mybrowser-popover')).toBeTruthy();
    });

    test('should hide popover when toggled', async () => {
      await myBrowserInstance.showPopover();
      myBrowserInstance.hidePopover();
      
      expect(myBrowserInstance.isVisible).toBe(false);
      expect(document.querySelector('#mybrowser-popover')).toBeFalsy();
    });

    test('should show API key input when no key is stored', async () => {
      // Mock no API key stored
      chrome.storage.local.get.mockImplementation((keys) => {
        const result = {};
        if (keys.includes && keys.includes('openai_api_key')) {
          result['openai_api_key'] = null;
        }
        return Promise.resolve(result);
      });

      myBrowserInstance.openaiApiKey = null;
      await myBrowserInstance.showPopover();
      
      expect(document.querySelector('#mybrowser-api-key')).toBeTruthy();
      expect(document.querySelector('#mybrowser-save-key')).toBeTruthy();
    });
  });

  describe('LLM Integration (Mocked)', () => {
    beforeEach(() => {
      // Mock successful OpenAI API response
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: 'document.querySelector(".test-element").style.display = "none";'
              }
            }]
          })
        })
      );
    });

    test('should generate snippet from query', async () => {
      const query = 'hide the advertisement banner';
      const snippet = await myBrowserInstance.generateSnippet(query);
      
      expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-test-key-123'
        },
        body: expect.stringContaining(query)
      });
      
      expect(snippet).toContain('document.querySelector');
      expect(snippet).toContain('style.display');
    });

    test('should generate short name from query', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'hide_banner' }
            }]
          })
        })
      );

      const shortName = await myBrowserInstance.generateShortName('hide the banner');
      expect(shortName).toBe('hide_banner');
    });

    test('should handle API errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401
        })
      );

      await expect(myBrowserInstance.generateSnippet('test query'))
        .rejects.toThrow('Failed to generate snippet using OpenAI');
    });
  });

  describe('Snippet Management', () => {
    test('should save snippet to storage', async () => {
      const shortName = 'hide_ads';
      const snippet = 'document.querySelector(".ad").remove();';
      
      await myBrowserInstance.saveSnippet(shortName, snippet);
      
      expect(myBrowserInstance.snippets[shortName]).toBe(snippet);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'example.com': { [shortName]: snippet }
      });
    });

    test('should execute snippet via background script', async () => {
      const snippet = 'document.querySelector(".test").remove();';
      
      await myBrowserInstance.executeSnippet(snippet);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'executeSnippet',
        snippet: snippet
      });
    });

    test('should delete snippet from storage', async () => {
      // Add a snippet first
      myBrowserInstance.snippets['test_snippet'] = 'test code';
      
      // Mock confirm to return true
      window.confirm = jest.fn(() => true);
      
      await myBrowserInstance.deleteSnippet('test_snippet');
      
      expect(myBrowserInstance.snippets['test_snippet']).toBeUndefined();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Page HTML Extraction', () => {
    test('should extract page HTML content', () => {
      // Setup test DOM
      document.body.innerHTML = `
        <main>
          <div class="content">
            <h1>Test Page</h1>
            <p>Some content</p>
            <script>alert('test');</script>
            <style>.test { color: red; }</style>
          </div>
        </main>
      `;

      const html = myBrowserInstance.getPageHTML();
      
      expect(html).toContain('Test Page');
      expect(html).toContain('Some content');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<style>');
    });

    test('should truncate long HTML content', () => {
      const longContent = 'x'.repeat(5000);
      document.body.innerHTML = `<div>${longContent}</div>`;

      const html = myBrowserInstance.getPageHTML();
      
      expect(html.length).toBeLessThanOrEqual(3000);
    });
  });

  describe('Integration Test: Full Workflow', () => {
    test('should complete full snippet generation and application workflow', async () => {
      // Setup DOM for test
      document.body.innerHTML = `
        <div id="mybrowser-popover">
          <textarea id="mybrowser-query">remove the advertisement</textarea>
          <button id="mybrowser-generate">Generate</button>
        </div>
        <div class="ad">Advertisement</div>
      `;

      // Mock the popover element
      myBrowserInstance.popoverElement = document.querySelector('#mybrowser-popover');
      myBrowserInstance.isVisible = true;

      // Execute the workflow
      await myBrowserInstance.generateAndApplySnippet();

      // Verify API was called
      expect(global.fetch).toHaveBeenCalled();
      
      // Verify snippet was saved
      expect(chrome.storage.local.set).toHaveBeenCalled();
      
      // Verify snippet was executed
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'executeSnippet',
        snippet: expect.stringContaining('document.querySelector')
      });
    });
  });
});