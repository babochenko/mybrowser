document.addEventListener('DOMContentLoaded', async () => {
  const openPopoverBtn = document.getElementById('open-popover');
  const manageSettingsBtn = document.getElementById('manage-settings');
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const currentWebsiteEl = document.getElementById('current-website');

  // Get current tab info
  let currentTab;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    
    if (currentTab) {
      const url = new URL(currentTab.url);
      currentWebsiteEl.textContent = url.hostname;
    } else {
      currentWebsiteEl.textContent = 'Unknown';
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
    currentWebsiteEl.textContent = 'Error loading';
  }

  // Check API key status
  try {
    const result = await chrome.storage.local.get(['openai_api_key']);
    const hasApiKey = !!(result.openai_api_key);
    
    statusDiv.style.display = 'flex';
    if (hasApiKey) {
      statusText.textContent = 'API key configured ✓';
      statusDiv.className = 'status';
      openPopoverBtn.disabled = false;
    } else {
      statusText.textContent = 'API key required';
      statusDiv.className = 'status error';
      openPopoverBtn.textContent = 'Setup API Key First';
    }
  } catch (error) {
    console.error('Error checking API key:', error);
    statusDiv.style.display = 'flex';
    statusDiv.className = 'status error';
    statusText.textContent = 'Error checking configuration';
  }

  // Open popover button
  openPopoverBtn.addEventListener('click', async () => {
    if (!currentTab) {
      alert('Cannot access current tab. Please refresh the page and try again.');
      return;
    }

    try {
      // Inject the content script if it's not already there and execute the popover
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          if (window.myBrowserInstance) {
            window.myBrowserInstance.showPopover();
          } else {
            console.error('MyBrowser content script not loaded');
            alert('Please refresh the page and try again.');
          }
        }
      });
      
      // Close the popup
      window.close();
    } catch (error) {
      console.error('Error opening popover:', error);
      alert('Error opening popover. Please refresh the page and try again.');
    }
  });

  // Manage settings button
  manageSettingsBtn.addEventListener('click', async () => {
    if (!currentTab) {
      alert('Cannot access current tab. Please refresh the page and try again.');
      return;
    }

    try {
      // Clear the API key to force the setup UI
      await chrome.storage.local.remove(['openai_api_key']);
      
      // Open popover to show API key input
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          if (window.myBrowserInstance) {
            window.myBrowserInstance.openaiApiKey = null;
            window.myBrowserInstance.showPopover();
          } else {
            console.error('MyBrowser content script not loaded');
            alert('Please refresh the page and try again.');
          }
        }
      });
      
      // Close the popup
      window.close();
    } catch (error) {
      console.error('Error managing settings:', error);
      alert('Error accessing settings. Please refresh the page and try again.');
    }
  });
});