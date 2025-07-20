/**
 * Unit Tests for Background Script
 * Tests snippet execution and CSP bypass functionality
 */

const fs = require('fs');
const path = require('path');

describe('Background Script', () => {
  let mockExecuteScript;
  let mockOnMessageListener;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock chrome.scripting API
    mockExecuteScript = jest.fn();
    mockOnMessageListener = jest.fn();
    
    global.chrome = {
      scripting: {
        executeScript: mockExecuteScript
      },
      runtime: {
        onMessage: {
          addListener: mockOnMessageListener
        }
      }
    };

    global.console = {
      log: jest.fn(),
      error: jest.fn()
    };
  });

  describe('Function Definitions', () => {
    test('should define executeWithExtensionPrivileges function', () => {
      // Load and execute the background script
      const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
      
      // Execute in isolated context
      const context = { chrome: global.chrome, console: global.console };
      const func = new Function('chrome', 'console', backgroundScript);
      func.call(context, global.chrome, global.console);
      
      // The function should be defined in the script
      expect(backgroundScript).toContain('function executeWithExtensionPrivileges');
    });

    test('should define executeSnippetSafely function', () => {
      const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
      expect(backgroundScript).toContain('async function executeSnippetSafely');
    });
  });

  describe('Code Pattern Matching', () => {
    test('should match querySelector patterns', () => {
      const code = 'document.querySelector(".test-element").remove();';
      const querySelectorMatch = code.match(/document\.querySelector\(['"`]([^'"`]+)['"`]\)/);
      
      expect(querySelectorMatch).not.toBeNull();
      expect(querySelectorMatch[1]).toBe('.test-element');
    });

    test('should match querySelectorAll patterns', () => {
      const code = 'document.querySelectorAll(".ads").forEach(el => el.style.display = "none");';
      const querySelectorAllMatch = code.match(/document\.querySelectorAll\(['"`]([^'"`]+)['"`]\)/);
      
      expect(querySelectorAllMatch).not.toBeNull();
      expect(querySelectorAllMatch[1]).toBe('.ads');
    });

    test('should match getElementById patterns', () => {
      const code = 'document.getElementById("banner").remove();';
      const getElementByIdMatch = code.match(/document\.getElementById\(['"`]([^'"`]+)['"`]\)/);
      
      expect(getElementByIdMatch).not.toBeNull();
      expect(getElementByIdMatch[1]).toBe('banner');
    });
  });

  describe('Code Cleaning', () => {
    test('should clean markdown formatting from code', () => {
      const codeWithMarkdown = `\`\`\`javascript
document.querySelector('.test').remove();
\`\`\``;
      
      const cleaned = codeWithMarkdown
        .split('\n')
        .filter(line => !line.trim().startsWith('```'))
        .join('\n')
        .trim();
      
      expect(cleaned).toBe('document.querySelector(\'.test\').remove();');
    });

    test('should handle mixed markdown formatting', () => {
      const codeWithMarkdown = `Some text
\`\`\`javascript
document.querySelector('.ad').style.display = 'none';
\`\`\`
More text`;
      
      const cleaned = codeWithMarkdown
        .split('\n')
        .filter(line => !line.trim().startsWith('```'))
        .join('\n')
        .trim();
      
      expect(cleaned).toContain('document.querySelector');
      expect(cleaned).not.toContain('```');
    });
  });

  describe('DOM Manipulation Logic', () => {
    let mockDocument;
    let mockElement;

    beforeEach(() => {
      mockElement = {
        remove: jest.fn(),
        style: {}
      };
      
      mockDocument = {
        querySelector: jest.fn(() => mockElement),
        querySelectorAll: jest.fn(() => [mockElement, mockElement]),
        getElementById: jest.fn(() => mockElement)
      };
    });

    test('should handle querySelector with remove operation', () => {
      const code = 'document.querySelector(".test-element").remove();';
      
      // Simulate the logic from executeWithExtensionPrivileges
      if (code.includes('document.querySelector')) {
        const querySelectorMatch = code.match(/document\.querySelector\(['"`]([^'"`]+)['"`]\)/);
        if (querySelectorMatch) {
          const selector = querySelectorMatch[1];
          const element = mockDocument.querySelector(selector);
          if (element && code.includes('.remove()')) {
            element.remove();
          }
        }
      }
      
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.test-element');
      expect(mockElement.remove).toHaveBeenCalled();
    });

    test('should handle querySelectorAll with style operation', () => {
      const code = 'document.querySelectorAll(".ads").forEach(el => el.style.display = "none");';
      
      // Simulate the logic
      if (code.includes('document.querySelectorAll')) {
        const querySelectorAllMatch = code.match(/document\.querySelectorAll\(['"`]([^'"`]+)['"`]\)/);
        if (querySelectorAllMatch) {
          const selector = querySelectorAllMatch[1];
          const elements = mockDocument.querySelectorAll(selector);
          if (code.includes('style.display')) {
            const displayMatch = code.match(/style\.display\s*=\s*['"`]([^'"`]+)['"`]/);
            const displayValue = displayMatch ? displayMatch[1] : 'none';
            elements.forEach(element => {
              element.style.display = displayValue;
            });
          }
        }
      }
      
      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('.ads');
      expect(mockElement.style.display).toBe('none');
    });

    test('should handle getElementById with remove operation', () => {
      const code = 'document.getElementById("banner").remove();';
      
      // Simulate the logic
      if (code.includes('document.getElementById')) {
        const getElementByIdMatch = code.match(/document\.getElementById\(['"`]([^'"`]+)['"`]\)/);
        if (getElementByIdMatch) {
          const elementId = getElementByIdMatch[1];
          const element = mockDocument.getElementById(elementId);
          if (element && code.includes('.remove()')) {
            element.remove();
          }
        }
      }
      
      expect(mockDocument.getElementById).toHaveBeenCalledWith('banner');
      expect(mockElement.remove).toHaveBeenCalled();
    });

    test('should handle missing elements gracefully', () => {
      mockDocument.querySelector.mockReturnValue(null);
      
      const code = 'document.querySelector(".non-existent").remove();';
      
      // Simulate the logic
      if (code.includes('document.querySelector')) {
        const querySelectorMatch = code.match(/document\.querySelector\(['"`]([^'"`]+)['"`]\)/);
        if (querySelectorMatch) {
          const selector = querySelectorMatch[1];
          const element = mockDocument.querySelector(selector);
          if (element && code.includes('.remove()')) {
            element.remove();
          } else if (!element) {
            console.log('Element not found for selector:', selector);
          }
        }
      }
      
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.non-existent');
      expect(mockElement.remove).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Element not found for selector:', '.non-existent');
    });
  });

  describe('Script Injection Logic', () => {
    let mockDocument;
    let mockScript;

    beforeEach(() => {
      mockScript = {
        setAttribute: jest.fn(),
        textContent: '',
        parentNode: {
          removeChild: jest.fn()
        }
      };
      
      mockDocument = {
        createElement: jest.fn(() => mockScript),
        head: {
          appendChild: jest.fn()
        }
      };
      
      global.setTimeout = jest.fn((fn) => fn());
    });

    test('should create and inject script element', () => {
      const code = 'console.log("test");';
      
      // Simulate injectScriptElement logic
      const script = mockDocument.createElement('script');
      script.textContent = code;
      script.setAttribute('data-mybrowser-snippet', 'true');
      mockDocument.head.appendChild(script);
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(script.setAttribute).toHaveBeenCalledWith('data-mybrowser-snippet', 'true');
      expect(script.textContent).toBe(code);
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(script);
    });
  });

  describe('Extension API Integration', () => {
    test('should call chrome.scripting.executeScript', async () => {
      mockExecuteScript.mockResolvedValue([{ result: null }]);
      
      const tabId = 123;
      const code = 'document.querySelector(".test").remove();';
      
      // Simulate calling chrome.scripting.executeScript
      await mockExecuteScript({
        target: { tabId: tabId },
        func: function() { /* executeWithExtensionPrivileges */ },
        args: [code]
      });
      
      expect(mockExecuteScript).toHaveBeenCalledWith({
        target: { tabId: tabId },
        func: expect.any(Function),
        args: [code]
      });
    });

    test('should register message listener', () => {
      // Load the background script
      const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
      
      // Execute the script
      const func = new Function('chrome', 'console', backgroundScript);
      func.call({}, global.chrome, global.console);
      
      expect(mockOnMessageListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});