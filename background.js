// Background script to handle snippet execution
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeSnippet') {
    executeSnippetSafely(request.snippet, sender.tab.id)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function executeSnippetSafely(snippet, tabId) {
  // Clean the snippet of any markdown formatting
  const cleanSnippet = snippet
    .split('\n')
    .filter(line => !line.trim().startsWith('```'))
    .join('\n')
    .trim();
  
  console.log('Attempting to execute cleaned snippet:', cleanSnippet);
  
  try {
    // Primary method: Execute as extension function with privileges
    // This bypasses CSP by running with extension context
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: executeWithExtensionPrivileges,
      args: [cleanSnippet]
    });
    console.log('Snippet executed successfully with extension privileges');
  } catch (error) {
    console.error('Extension privilege execution failed:', error);
    
    // Fallback: try script injection method
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: injectScriptElement,
        args: [cleanSnippet]
      });
      console.log('Snippet executed via script injection fallback');
    } catch (fallbackError) {
      console.error('All execution methods failed:', fallbackError);
      throw new Error(`Execution failed: ${error.message}`);
    }
  }
}

// Primary method: execute with extension privileges 
function executeWithExtensionPrivileges(code) {
  try {
    console.log('Executing code with extension privileges:', code.substring(0, 100) + '...');
    
    // Parse and execute common DOM operations without eval
    // This avoids CSP eval restrictions entirely
    
    if (code.includes('document.querySelectorAll')) {
      // Execute querySelectorAll operations
      const querySelectorAllMatch = code.match(/document\.querySelectorAll\(['"`]([^'"`]+)['"`]\)/);
      
      if (querySelectorAllMatch) {
        const selector = querySelectorAllMatch[1];
        console.log('Executing querySelectorAll with selector:', selector);
        
        const elements = document.querySelectorAll(selector);
        console.log('Found elements:', elements.length);
        
        // Check what operation to perform
        if (code.includes('.remove()')) {
          elements.forEach(element => {
            console.log('Removing element:', element);
            element.remove();
          });
        } else if (code.includes('style.display')) {
          const displayMatch = code.match(/style\.display\s*=\s*['"`]([^'"`]+)['"`]/);
          const displayValue = displayMatch ? displayMatch[1] : 'none';
          elements.forEach(element => {
            element.style.display = displayValue;
          });
        }
      }
      
    } else if (code.includes('document.querySelector')) {
      // Execute querySelector operations
      const querySelectorMatch = code.match(/document\.querySelector\(['"`]([^'"`]+)['"`]\)/);
      
      if (querySelectorMatch) {
        const selector = querySelectorMatch[1];
        console.log('Executing querySelector with selector:', selector);
        
        const element = document.querySelector(selector);
        
        if (element) {
          if (code.includes('.remove()')) {
            element.remove();
          } else if (code.includes('style.display')) {
            const displayMatch = code.match(/style\.display\s*=\s*['"`]([^'"`]+)['"`]/);
            const displayValue = displayMatch ? displayMatch[1] : 'none';
            element.style.display = displayValue;
          }
        } else {
          console.log('Element not found for selector:', selector);
        }
      }
      
    } else if (code.includes('document.getElementById')) {
      // Execute getElementById operations
      const getElementByIdMatch = code.match(/document\.getElementById\(['"`]([^'"`]+)['"`]\)/);
      
      if (getElementByIdMatch) {
        const elementId = getElementByIdMatch[1];
        console.log('Executing getElementById with id:', elementId);
        
        const element = document.getElementById(elementId);
        
        if (element) {
          if (code.includes('.remove()')) {
            element.remove();
          } else if (code.includes('style.display')) {
            const displayMatch = code.match(/style\.display\s*=\s*['"`]([^'"`]+)['"`]/);
            const displayValue = displayMatch ? displayMatch[1] : 'none';
            element.style.display = displayValue;
          }
        }
      }
      
    } else {
      console.log('Unsupported code pattern:', code);
      throw new Error('Code pattern not supported by CSP-safe parser');
    }
    
    console.log('Extension privilege execution succeeded');
  } catch (error) {
    console.error('Extension privilege execution failed:', error);
    throw error;
  }
}


// Fallback method: inject code as a script element
function injectScriptElement(code) {
  try {
    console.log('Creating script element with code:', code.substring(0, 100) + '...');
    
    const script = document.createElement('script');
    script.textContent = code;
    script.setAttribute('data-mybrowser-snippet', 'true');
    
    // Inject into document head
    document.head.appendChild(script);
    console.log('Script element injected successfully');
    
    // Clean up after execution
    setTimeout(() => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
        console.log('Script element cleaned up');
      }
    }, 100);
  } catch (error) {
    console.error('Script injection error:', error);
    throw error;
  }
}

// Fallback method: direct code execution
function executeCodeSafely(code) {
  try {
    console.log('Attempting direct code execution');
    // This will likely fail on strict CSP sites, but worth trying
    eval(code);
    console.log('Direct execution succeeded');
  } catch (error) {
    console.error('Direct execution failed:', error);
    throw error;
  }
}