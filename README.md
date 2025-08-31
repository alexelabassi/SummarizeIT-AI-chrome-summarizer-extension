# SummarizeIt (AI) - Chrome Extension

A Chrome extension that summarizes web pages and text selections using AI providers (OpenAI or Google Gemini).

## Features

- **Page Summarization**: Extract and summarize the main content of any web page
- **Selection Summarization**: Summarize selected text with right-click context menu
- **Idle Nudge**: Automatic suggestion to summarize long articles after 30 seconds of inactivity
- **Multiple AI Providers**: Support for OpenAI and Google Gemini
- **Customizable Settings**: Configurable models, temperature, and API keys
- **Keyboard Shortcuts**: Ctrl/Cmd+Shift+U to summarize current page
- **Clean UI**: Modern, non-intrusive interface with copy functionality

## Installation

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd chrome-summarizer-2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the build output

### Production Build

```bash
npm run build
npm run zip
```

This creates `summarizeit-ai.zip` ready for Chrome Web Store submission.

## Configuration

### Setting Up API Keys

1. **OpenAI Setup**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key for use in the extension

2. **Google Gemini Setup**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key for use in the extension

### Extension Configuration

1. **Open Options**: Click the extension icon, then click the ⚙️ settings button
2. **Choose Provider**: Select OpenAI or Google Gemini
3. **Enter API Key**: Paste your API key in the designated field
4. **Optional Settings**:
   - **Model**: Specify a custom model name (defaults: `gpt-4o-mini` for OpenAI, `gemini-1.5-flash` for Gemini)
   - **Temperature**: Adjust creativity level (0 = focused, 1 = creative)
5. **Test Connection**: Use the "Test Connection" button to verify your setup
6. **Save Settings**: Click "Save Settings" to store your configuration

## Usage

### Page Summarization

1. **Via Popup**: Click the extension icon and select "📄 Summarize Page"
2. **Via Keyboard**: Press `Ctrl+Shift+U` (Windows/Linux) or `Cmd+Shift+U` (Mac)
3. **Via Idle Nudge**: Stay on a long article for 30 seconds without activity

### Selection Summarization

1. **Select Text**: Highlight the text you want to summarize (minimum 50 characters)
2. **Right-Click**: Choose "Summarize selection with SummarizeIt" from context menu
3. **Via Popup**: Select text, then click "✂️ Summarize Selection" in the popup

### Idle Nudge Feature

- **Trigger**: Automatically appears after 30 seconds of inactivity on pages with ≥1,500 words
- **Location**: Bottom-right corner toast notification
- **Actions**: 
  - Click "Summarize" to generate a summary
  - Click "Dismiss" to hide and not show again on this page

## Technical Details

### Architecture

- **Manifest V3**: Modern Chrome extension architecture
- **TypeScript**: Full type safety throughout the codebase
- **Service Worker**: Background script for API calls and message handling
- **Content Scripts**: Page interaction and text extraction
- **Popup**: User interface for manual summarization
- **Options Page**: Configuration management

### File Structure

```
chrome-summarizer-2/
├── package.json              # Dependencies and build scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Build configuration
├── README.md               # This file
└── ext/                    # Extension source code
    ├── manifest.json       # Extension manifest
    ├── background/         # Service worker
    │   ├── index.ts       # Main background script
    │   ├── prompts.ts     # AI prompt templates
    │   └── providers/     # AI provider implementations
    │       ├── openai.ts
    │       └── gemini.ts
    ├── content/           # Content scripts
    │   ├── index.ts       # Main content script
    │   ├── readability.ts # Text extraction logic
    │   └── toast.css      # Toast and modal styles
    ├── popup/            # Extension popup
    │   ├── index.html
    │   ├── popup.ts
    │   └── popup.css
    ├── options/          # Options page
    │   ├── index.html
    │   ├── options.ts
    │   └── options.css
    └── assets/           # Extension icons
        ├── icon-16.png
        ├── icon-32.png
        ├── icon-48.png
        └── icon-128.png
```

### Permissions

- `activeTab`: Access to current tab for text extraction
- `storage`: Save user preferences and settings
- `scripting`: Inject content scripts for text extraction
- `contextMenus`: Right-click context menu for selection summarization

### AI Integration

#### OpenAI
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Default Model**: `gpt-4o-mini`
- **Authentication**: Bearer token in Authorization header

#### Google Gemini
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Default Model**: `gemini-1.5-flash`
- **Authentication**: API key as URL parameter

### Text Extraction

1. **Primary Method**: Mozilla Readability library for article extraction
2. **Fallback Methods**:
   - Largest `<article>` element
   - Main content selectors (`main`, `[role="main"]`, etc.)
   - Longest paragraph cluster
   - Full body text (last resort)

### Storage

Uses `chrome.storage.sync` to store:
- Provider selection (openai/gemini)
- API key
- Model name
- Temperature setting

## Development

### Build Commands

```bash
npm run dev      # Development build with watch mode
npm run build    # Production build
npm run zip      # Create distributable zip file
```

### Development Workflow

1. Make changes to TypeScript files in `ext/`
2. Run `npm run dev` for automatic rebuilding
3. Reload the extension in `chrome://extensions/`
4. Test functionality

### Key Implementation Details

#### Message Passing
- **Popup → Background**: `RUN_SUMMARY` with mode, text, and metadata
- **Content → Background**: Same message format for idle nudge
- **Background → Popup/Content**: `SUMMARY_RESULT` with success/error status

#### Idle Tracking
- Monitors scroll, keydown, mousemove, and click events
- Resets 30-second timer on any activity
- Checks word count before showing nudge
- Prevents duplicate nudges on same page

#### Error Handling
- API key validation
- Network error recovery
- Provider-specific error messages
- Graceful fallbacks for text extraction

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Open extension options and enter your API key
   - Ensure you've selected the correct provider

2. **"No readable content found"**
   - The page may not have sufficient text content
   - Try selecting specific text instead

3. **"Connection failed"**
   - Verify your API key is correct
   - Check your internet connection
   - Ensure you have sufficient API credits

4. **Extension not working**
   - Reload the extension in `chrome://extensions/`
   - Check the browser console for errors
   - Verify all permissions are granted

### Debug Mode

Enable debug logging by opening the browser console and looking for messages from the extension.

## Privacy

- No analytics or tracking
- API keys are stored locally in Chrome sync storage
- No data is sent to servers other than the configured AI providers
- All summarization requests are user-initiated
