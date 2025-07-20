class MyBrowserPopover {
  constructor() {
    this.isVisible = false;
    this.popoverElement = null;
    this.currentWebsite = window.location.hostname;
    this.keySequence = [];
    this.openaiApiKey = null;
    this.snippets = {};
    this.enabledSnippets = {};
    
    this.init();
  }

  async init() {
    this.setupKeyListener();
    await this.loadStoredSnippets();
    await this.loadEnabledSnippets();
    await this.loadOpenAIKey();
    await this.runEnabledSnippets();
  }

  setupKeyListener() {
    document.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.togglePopover();
      }
    });
  }

  async togglePopover() {
    if (this.isVisible) {
      this.hidePopover();
    } else {
      await this.showPopover();
    }
  }

  async showPopover() {
    if (this.popoverElement) {
      this.popoverElement.remove();
    }

    if (!this.openaiApiKey) {
      this.popoverElement = this.createApiKeyInputElement();
    } else {
      this.popoverElement = this.createPopoverElement();
      await this.populateExistingSnippets();
    }
    
    document.body.appendChild(this.popoverElement);
    this.isVisible = true;
  }

  hidePopover() {
    if (this.popoverElement) {
      this.popoverElement.remove();
      this.popoverElement = null;
    }
    this.isVisible = false;
  }

  createPopoverElement() {
    const popover = document.createElement('div');
    popover.id = 'mybrowser-popover';
    popover.innerHTML = `
      <div class="mybrowser-popover-content">
        <div class="mybrowser-header">
          <h3>MyBrowser - ${this.currentWebsite}</h3>
          <button class="mybrowser-close">×</button>
        </div>
        
        <div class="mybrowser-existing-snippets">
          <h4>Existing Snippets:</h4>
          <div id="mybrowser-snippets-list"></div>
        </div>
        
        <div class="mybrowser-new-snippet">
          <h4>Create New Snippet:</h4>
          <textarea id="mybrowser-query" placeholder="Describe what you want to modify on this page..."></textarea>
          <button id="mybrowser-generate">Generate & Apply</button>
        </div>
      </div>
    `;

    this.addPopoverStyles(popover);
    this.addEventListeners(popover);

    return popover;
  }

  createApiKeyInputElement() {
    const popover = document.createElement('div');
    popover.id = 'mybrowser-popover';
    popover.innerHTML = `
      <div class="mybrowser-popover-content">
        <div class="mybrowser-header">
          <h3>MyBrowser - Setup Required</h3>
          <button class="mybrowser-close">×</button>
        </div>
        
        <div class="mybrowser-api-key-setup">
          <h4>OpenAI API Key Required</h4>
          <p>Enter your OpenAI API key to generate JavaScript snippets:</p>
          <input type="password" id="mybrowser-api-key" placeholder="sk-..." autocomplete="off">
          <button id="mybrowser-save-key">Save Key</button>
          <div class="mybrowser-api-help">
            <small>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></small>
          </div>
        </div>
      </div>
    `;

    this.addApiKeyStyles(popover);
    this.addApiKeyEventListeners(popover);

    return popover;
  }

  addPopoverStyles(popover) {
    const style = document.createElement('style');
    style.textContent = `
      #mybrowser-popover {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow-y: auto;
      }
      
      .mybrowser-popover-content {
        padding: 20px;
      }
      
      .mybrowser-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      .mybrowser-header h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
      
      .mybrowser-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }
      
      .mybrowser-existing-snippets, .mybrowser-new-snippet {
        margin-bottom: 20px;
      }
      
      .mybrowser-existing-snippets h4, .mybrowser-new-snippet h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #666;
      }
      
      #mybrowser-snippets-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 15px;
      }
      
      .mybrowser-snippet-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        margin-bottom: 5px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .mybrowser-snippet-name {
        font-weight: bold;
        color: #333;
      }
      
      .mybrowser-snippet-controls {
        display: flex;
        gap: 5px;
      }
      
      .mybrowser-snippet-btn {
        padding: 2px 6px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
      }
      
      .mybrowser-view { background: #6c757d; color: white; }
      .mybrowser-delete { background: #ff9800; color: white; }
      
      .mybrowser-toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 24px;
        margin: 0 8px;
      }
      
      .mybrowser-toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .mybrowser-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .3s;
        border-radius: 24px;
      }
      
      .mybrowser-toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
      }
      
      input:checked + .mybrowser-toggle-slider {
        background-color: #4CAF50;
      }
      
      input:checked + .mybrowser-toggle-slider:before {
        transform: translateX(24px);
      }
      
      #mybrowser-query {
        width: 100%;
        height: 80px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
        margin-bottom: 10px;
      }
      
      #mybrowser-generate {
        width: 100%;
        padding: 10px;
        background: #007cff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      }
      
      #mybrowser-generate:hover {
        background: #0056b3;
      }
      
      .mybrowser-loading {
        opacity: 0.6;
        pointer-events: none;
      }
    `;
    
    popover.appendChild(style);
  }

  addApiKeyStyles(popover) {
    const style = document.createElement('style');
    style.textContent = `
      #mybrowser-popover {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      
      .mybrowser-popover-content {
        padding: 20px;
      }
      
      .mybrowser-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      .mybrowser-header h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
      
      .mybrowser-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }
      
      .mybrowser-api-key-setup h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #333;
      }
      
      .mybrowser-api-key-setup p {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: #666;
        line-height: 1.4;
      }
      
      #mybrowser-api-key {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 10px;
        font-family: monospace;
      }
      
      #mybrowser-save-key {
        width: 100%;
        padding: 10px;
        background: #007cff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 15px;
      }
      
      #mybrowser-save-key:hover {
        background: #0056b3;
      }
      
      .mybrowser-api-help {
        text-align: center;
      }
      
      .mybrowser-api-help a {
        color: #007cff;
        text-decoration: none;
      }
      
      .mybrowser-api-help a:hover {
        text-decoration: underline;
      }
      
      .mybrowser-loading {
        opacity: 0.6;
        pointer-events: none;
      }
    `;
    
    popover.appendChild(style);
  }

  addEventListeners(popover) {
    const generateBtn = popover.querySelector('#mybrowser-generate');
    const queryTextarea = popover.querySelector('#mybrowser-query');
    const closeBtn = popover.querySelector('.mybrowser-close');
    
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateAndApplySnippet());
    }
    
    if (queryTextarea) {
      queryTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.generateAndApplySnippet();
        }
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hidePopover());
    }
  }

  addApiKeyEventListeners(popover) {
    const saveBtn = popover.querySelector('#mybrowser-save-key');
    const apiKeyInput = popover.querySelector('#mybrowser-api-key');
    const closeBtn = popover.querySelector('.mybrowser-close');
    
    const saveApiKey = async () => {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        alert('Please enter your OpenAI API key');
        return;
      }
      
      if (!apiKey.startsWith('sk-')) {
        alert('Invalid API key format. OpenAI API keys start with "sk-"');
        return;
      }
      
      saveBtn.textContent = 'Saving...';
      saveBtn.classList.add('mybrowser-loading');
      
      try {
        await this.saveOpenAIKey(apiKey);
        this.hidePopover();
        await this.showPopover(); // Show normal popover now
      } catch (error) {
        console.error('Error saving API key:', error);
        alert('Error saving API key. Please try again.');
      } finally {
        saveBtn.textContent = 'Save Key';
        saveBtn.classList.remove('mybrowser-loading');
      }
    };
    
    if (saveBtn) {
      saveBtn.addEventListener('click', saveApiKey);
    }
    
    if (apiKeyInput) {
      apiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveApiKey();
        }
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hidePopover());
    }
  }

  async loadStoredSnippets() {
    const result = await chrome.storage.local.get([this.currentWebsite]);
    this.snippets = result[this.currentWebsite] || {};
  }

  async loadEnabledSnippets() {
    const result = await chrome.storage.local.get([`${this.currentWebsite}_enabled`]);
    this.enabledSnippets = result[`${this.currentWebsite}_enabled`] || {};
  }

  async saveEnabledSnippets() {
    await chrome.storage.local.set({
      [`${this.currentWebsite}_enabled`]: this.enabledSnippets
    });
  }

  async runEnabledSnippets() {
    for (const [shortName, isEnabled] of Object.entries(this.enabledSnippets)) {
      if (isEnabled && this.snippets[shortName]) {
        console.log(`Auto-running enabled snippet: ${shortName}`);
        await this.executeSnippet(this.snippets[shortName]);
      }
    }
  }

  async loadOpenAIKey() {
    const result = await chrome.storage.local.get(['openai_api_key']);
    this.openaiApiKey = result.openai_api_key || null;
  }

  async saveOpenAIKey(apiKey) {
    this.openaiApiKey = apiKey;
    await chrome.storage.local.set({ 'openai_api_key': apiKey });
  }

  async populateExistingSnippets() {
    const snippetsList = this.popoverElement.querySelector('#mybrowser-snippets-list');
    
    if (Object.keys(this.snippets).length === 0) {
      snippetsList.innerHTML = '<div style="color: #666; font-style: italic;">No snippets for this website yet.</div>';
      return;
    }
    
    snippetsList.innerHTML = Object.entries(this.snippets).map(([shortName, snippet]) => {
      const isEnabled = this.enabledSnippets[shortName] || false;
      return `
      <div class="mybrowser-snippet-item">
        <span class="mybrowser-snippet-name">${shortName}</span>
        <div class="mybrowser-snippet-controls">
          <button class="mybrowser-snippet-btn mybrowser-view" data-action="view" data-snippet="${shortName}">View</button>
          <label class="mybrowser-toggle-switch">
            <input type="checkbox" data-action="toggle" data-snippet="${shortName}" ${isEnabled ? 'checked' : ''}>
            <span class="mybrowser-toggle-slider"></span>
          </label>
          <button class="mybrowser-snippet-btn mybrowser-delete" data-action="delete" data-snippet="${shortName}">Delete</button>
        </div>
      </div>
    `;
    }).join('');
    
    // Add event listeners after creating the HTML
    this.addSnippetEventListeners();
  }

  addSnippetEventListeners() {
    const snippetButtons = this.popoverElement.querySelectorAll('.mybrowser-snippet-btn');
    const toggleSwitches = this.popoverElement.querySelectorAll('input[data-action="toggle"]');
    
    snippetButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const snippetName = e.target.dataset.snippet;
        
        console.log(`${action} clicked for: ${snippetName}`);
        
        switch(action) {
          case 'view':
            this.viewSnippet(snippetName);
            break;
          case 'delete':
            this.deleteSnippet(snippetName);
            break;
        }
      });
    });
    
    toggleSwitches.forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const snippetName = e.target.dataset.snippet;
        const isEnabled = e.target.checked;
        
        console.log(`Toggle ${isEnabled ? 'enabled' : 'disabled'} for: ${snippetName}`);
        
        this.enabledSnippets[snippetName] = isEnabled;
        await this.saveEnabledSnippets();
        
        if (isEnabled) {
          // Run the snippet immediately when enabled
          await this.executeSnippet(this.snippets[snippetName]);
        }
      });
    });
  }

  async generateAndApplySnippet() {
    const query = this.popoverElement.querySelector('#mybrowser-query').value.trim();
    if (!query) return;

    const generateBtn = this.popoverElement.querySelector('#mybrowser-generate');
    generateBtn.textContent = 'Generating...';
    generateBtn.classList.add('mybrowser-loading');

    try {
      const snippet = await this.generateSnippet(query);
      const shortName = await this.generateShortName(query);
      
      await this.saveSnippet(shortName, snippet);
      this.executeSnippet(snippet);
      
      this.popoverElement.querySelector('#mybrowser-query').value = '';
      await this.populateExistingSnippets();
      
    } catch (error) {
      console.error('Failed to generate snippet:', error);
      alert('Failed to generate snippet. Please try again.');
    } finally {
      generateBtn.textContent = 'Generate & Apply';
      generateBtn.classList.remove('mybrowser-loading');
    }
  }

  getPageHTML() {
    try {
      // Get the main content areas that are most relevant
      const body = document.body;
      const main = document.querySelector('main');
      const content = document.querySelector('#content, .content, [role="main"]');
      
      // Start with the most specific content area if available
      let htmlSource = '';
      
      if (content) {
        htmlSource = content.outerHTML;
      } else if (main) {
        htmlSource = main.outerHTML;
      } else {
        htmlSource = body.innerHTML;
      }
      
      // Limit to first 3000 characters to avoid token limits
      const truncated = htmlSource.substring(0, 3000);
      
      // Clean up the HTML - remove script tags and excessive whitespace
      return truncated
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
        
    } catch (error) {
      console.error('Error getting page HTML:', error);
      return 'Error: Could not extract page HTML';
    }
  }

  async generateSnippet(query) {
    // Get current page HTML structure for better context
    const pageHTML = this.getPageHTML();
    
    const prompt = `TASK: Create JavaScript code that does exactly this: "${query}"

WEBSITE: ${this.currentWebsite}

ACTUAL HTML STRUCTURE:
${pageHTML}

REQUIREMENTS:
- Focus ONLY on the user's specific request: "${query}"
- Use the exact selectors from the HTML above
- Make it work on THIS specific webpage
- Test your selectors against the provided HTML
- Handle cases where elements might not exist

EXAMPLE PATTERNS:
- Hide elements: element.style.display = 'none' or element.remove()
- Show elements: element.style.display = 'block'
- Change text: element.textContent = 'new text'
- Add classes: element.classList.add('className')
- Modify attributes: element.setAttribute('attr', 'value')

USER WANTS: "${query}"

Generate JavaScript code that does EXACTLY what the user asked for. Return ONLY executable JavaScript code:`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a precise JavaScript code generator. Your job is to create code that does EXACTLY what the user requests, nothing more, nothing less. Use the provided HTML structure to find the correct selectors. Be specific and focused.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to generate snippet using OpenAI');
    }
  }

  async generateShortName(query) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'Generate a short, descriptive name (1-3 words, underscore_separated) for a JavaScript snippet based on the user request. Return only the name, no explanations.' 
            },
            { role: 'user', content: `Generate a short name for: "${query}"` }
          ],
          max_tokens: 20,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
      
    } catch (error) {
      console.error('Error generating short name:', error);
      // Fallback to simple generation
      return query.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .slice(0, 3)
        .join('_');
    }
  }

  async saveSnippet(shortName, snippet) {
    this.snippets[shortName] = snippet;
    await chrome.storage.local.set({
      [this.currentWebsite]: this.snippets
    });
  }

  async executeSnippet(snippet) {
    try {
      console.log('Executing snippet via background script:', snippet);
      
      const response = await chrome.runtime.sendMessage({
        action: 'executeSnippet',
        snippet: snippet
      });
      
      if (response && response.success) {
        console.log('Snippet executed successfully');
      } else {
        console.error('Background script execution failed:', response?.error);
        alert(`Failed to execute snippet: ${response?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error communicating with background script:', error);
      alert('Failed to execute snippet due to extension error');
    }
  }


  viewSnippet(shortName) {
    console.log('viewSnippet called with:', shortName);
    console.log('Available snippets:', Object.keys(this.snippets));
    const snippet = this.snippets[shortName];
    console.log('Found snippet:', snippet);
    if (snippet) {
      // Create a modal-style overlay to show the code
      const modal = document.createElement('div');
      modal.id = 'mybrowser-snippet-modal';
      modal.innerHTML = `
        <div class="mybrowser-modal-overlay">
          <div class="mybrowser-modal-content">
            <div class="mybrowser-modal-header">
              <h3>Snippet: ${shortName}</h3>
              <button class="mybrowser-modal-close">×</button>
            </div>
            <div class="mybrowser-modal-body">
              <pre><code>${snippet.replace(/```javascript\n?/g, '').replace(/```\n?/g, '')}</code></pre>
            </div>
            <div class="mybrowser-modal-footer">
              <button class="mybrowser-copy-btn">Copy to Clipboard</button>
              <button class="mybrowser-modal-close-btn">Close</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal styles
      const style = document.createElement('style');
      style.textContent = `
        #mybrowser-snippet-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 20000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .mybrowser-modal-overlay {
          background: rgba(0,0,0,0.7);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .mybrowser-modal-content {
          background: white;
          border-radius: 8px;
          max-width: 80%;
          max-height: 80%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        
        .mybrowser-modal-header {
          padding: 20px 20px 10px 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .mybrowser-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .mybrowser-modal-header button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mybrowser-modal-body {
          padding: 20px;
          overflow: auto;
          flex: 1;
        }
        
        .mybrowser-modal-body pre {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow: auto;
          margin: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.4;
          color: #333;
        }
        
        .mybrowser-modal-footer {
          padding: 10px 20px 20px 20px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        
        .mybrowser-modal-footer button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .mybrowser-modal-footer button:first-child {
          background: #007cff;
          color: white;
        }
        
        .mybrowser-modal-footer button:last-child {
          background: #e9ecef;
          color: #333;
        }
      `;
      
      modal.appendChild(style);
      document.body.appendChild(modal);
      
      // Add event listeners for modal buttons
      const closeBtn = modal.querySelector('.mybrowser-modal-close');
      const closeBtnFooter = modal.querySelector('.mybrowser-modal-close-btn');
      const copyBtn = modal.querySelector('.mybrowser-copy-btn');
      const overlay = modal.querySelector('.mybrowser-modal-overlay');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.remove());
      }
      
      if (closeBtnFooter) {
        closeBtnFooter.addEventListener('click', () => modal.remove());
      }
      
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          try {
            const cleanSnippet = snippet.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
            await navigator.clipboard.writeText(cleanSnippet);
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy to Clipboard';
            }, 2000);
          } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            alert('Failed to copy to clipboard');
          }
        });
      }
      
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            modal.remove();
          }
        });
      }
      
      console.log('Modal should be visible now');
    } else {
      console.error('No snippet found for shortName:', shortName);
      alert(`No snippet found with name: ${shortName}`);
    }
  }

  async deleteSnippet(shortName) {
    if (confirm(`Delete snippet "${shortName}"?`)) {
      delete this.snippets[shortName];
      await chrome.storage.local.set({
        [this.currentWebsite]: this.snippets
      });
      await this.populateExistingSnippets();
    }
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.myBrowserInstance = new MyBrowserPopover();
  });
} else {
  window.myBrowserInstance = new MyBrowserPopover();
}