import { openaiProvider } from './providers/openai';
import { geminiProvider } from './providers/gemini';
import { generatePrompt } from './prompts';

interface StorageData {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model: string;
  temperature: number;
}

interface SummaryRequest {
  mode: 'page' | 'selection';
  text: string;
  title?: string;
  url?: string;
}

interface SummaryResponse {
  ok: boolean;
  summary?: string;
  error?: string;
}

// Initialize context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarize-selection',
    title: 'Summarize selection with SummarizeIt',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'summarize-selection' && tab?.id) {
    const selection = info.selectionText?.trim();
    if (!selection || selection.length < 50) {
      return;
    }

    const storage = await chrome.storage.sync.get(['provider', 'apiKey', 'model', 'temperature']);
    if (!storage.apiKey) {
      return;
    }

    const response = await runSummary({
      mode: 'selection',
      text: selection,
      title: tab.title,
      url: tab.url
    }, storage);

    // Send result to content script
    chrome.tabs.sendMessage(tab.id, {
      type: 'SUMMARY_RESULT',
      ...response
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RUN_SUMMARY') {
    handleSummaryRequest(message, sender.tab?.id).then(sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleSummaryRequest(request: SummaryRequest, tabId?: number): Promise<SummaryResponse> {
  try {
    const storage = await chrome.storage.sync.get(['provider', 'apiKey', 'model', 'temperature']);
    
    if (!storage.apiKey) {
      return { ok: false, error: 'API key not configured. Please set it in the options page.' };
    }

    const response = await runSummary(request, storage);
    
    // If this was triggered from content script, send result back
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'SUMMARY_RESULT',
        ...response
      });
    }
    
    return response;
  } catch (error) {
    console.error('Summary request failed:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

async function runSummary(request: SummaryRequest, storage: StorageData): Promise<SummaryResponse> {
  const { provider, apiKey, model, temperature } = storage;
  const prompt = generatePrompt(request.mode, request.text, request.title, request.url);

  try {
    let summary: string;
    
    if (provider === 'openai') {
      summary = await openaiProvider(apiKey, model, prompt, temperature);
    } else if (provider === 'gemini') {
      summary = await geminiProvider(apiKey, model, prompt, temperature);
    } else {
      throw new Error('Invalid provider');
    }

    return { ok: true, summary };
  } catch (error) {
    console.error(`${provider} API error:`, error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : `${provider} API error` 
    };
  }
}
