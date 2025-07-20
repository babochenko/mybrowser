# MyBrowser Chrome Extension

A power-user tool for dynamic page modification using LLM-generated JavaScript snippets.

## Features

- **Hotkey Activation**: Press `Ctrl/Cmd + Space` then `b` to open the popover
- **Dynamic Snippets**: Generate JavaScript code using natural language queries
- **Persistent Storage**: Snippets are saved per website in local storage
- **Snippet Management**: Enable, disable, or delete saved snippets
- **Instant Application**: New snippets are applied immediately

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension is now installed and active on all websites

## Setup

1. **First Time Setup**: When you first open the popover, you'll be prompted to enter your OpenAI API key
2. **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys) to get your API key
3. **Save Key**: Enter your API key (starts with `sk-`) and click "Save Key"

## Usage

1. **Open Popover**: On any website, press `Ctrl/Cmd + K` or click the extension icon
2. **Create Snippet**: 
   - Type your request in natural language (e.g., "Add a red border around all images")
   - Press "Generate & Apply" or `Ctrl/Cmd + Enter`
   - The extension uses OpenAI to generate JavaScript code from your description
3. **Manage Snippets**:
   - View existing snippets for the current website at the top of the popover
   - Enable/disable snippets (disable requires page refresh)
   - Delete unwanted snippets

## Examples

- "Hide all ads on this page"
- "Add a dark mode toggle button"
- "Make all links open in new tabs"
- "Add copy buttons to code blocks"
- "Change the background color to dark gray"

## Technical Details

- Uses Chrome Extension Manifest V3
- Stores snippets in `chrome.storage.local`
- Executes code safely using `new Function()`
- Keyboard shortcuts use leader-key pattern

## Current Limitations

- Snippet disabling requires page refresh
- No syntax highlighting or code validation
- OpenAI API usage costs apply (pay-per-use)

## Development

The extension consists of:
- `manifest.json`: Extension configuration and permissions
- `content.js`: Main functionality and UI injection

To test changes:
1. Make your modifications
2. Go to `chrome://extensions/`
3. Click the refresh icon on the MyBrowser extension
4. Reload any open tabs to see changes