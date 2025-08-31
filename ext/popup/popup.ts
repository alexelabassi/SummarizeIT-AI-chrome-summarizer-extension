interface StorageData {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model: string;
  temperature: number;
}

class Popup {
  private statusElement: HTMLElement;
  private outputSection: HTMLElement;
  private errorSection: HTMLElement;
  private outputElement: HTMLElement;
  private errorElement: HTMLElement;

  constructor() {
    this.statusElement = document.getElementById('status') as HTMLElement;
    this.outputSection = document.getElementById('output-section') as HTMLElement;
    this.errorSection = document.getElementById('error-section') as HTMLElement;
    this.outputElement = document.getElementById('output') as HTMLElement;
    this.errorElement = document.getElementById('error-message') as HTMLElement;

    this.init();
  }

  private init() {
    // Add event listeners
    document.getElementById('summarize-page')?.addEventListener('click', () => {
      this.summarizePage();
    });

    document.getElementById('summarize-selection')?.addEventListener('click', () => {
      this.summarizeSelection();
    });

    document.getElementById('copy-btn')?.addEventListener('click', () => {
      this.copyToClipboard();
    });

    document.getElementById('options-btn')?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Check if API key is configured
    this.checkConfiguration();
  }

  private async checkConfiguration() {
    const storage = await chrome.storage.sync.get(['apiKey', 'provider']);
    
    if (!storage.apiKey) {
      this.showError('Please configure your API key in the options page.');
      this.disableButtons();
    } else {
      this.updateStatus(`Ready to summarize (${storage.provider || 'openai'})`);
    }
  }

  private disableButtons() {
    const buttons = document.querySelectorAll('.action-btn');
    buttons.forEach(btn => {
      (btn as HTMLButtonElement).disabled = true;
    });
  }

  private async summarizePage() {
    this.updateStatus('Extracting page content...');
    this.hideOutput();
    this.hideError();

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script to extract page text
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_TEXT'
      });

      if (!response || !response.text) {
        throw new Error('No readable content found on this page.');
      }

      this.updateStatus('Generating summary...');

      // Send message to background script
      const summaryResponse = await chrome.runtime.sendMessage({
        type: 'RUN_SUMMARY',
        mode: 'page',
        text: response.text,
        title: tab.title,
        url: tab.url
      });

      this.handleResponse(summaryResponse);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to summarize page');
    }
  }

  private async summarizeSelection() {
    this.updateStatus('Getting selection...');
    this.hideOutput();
    this.hideError();

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script to get selection
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_SELECTION'
      });

      if (!response || !response.text) {
        throw new Error('No text selected. Please select at least 50 characters.');
      }

      this.updateStatus('Generating summary...');

      // Send message to background script
      const summaryResponse = await chrome.runtime.sendMessage({
        type: 'RUN_SUMMARY',
        mode: 'selection',
        text: response.text,
        title: tab.title,
        url: tab.url
      });

      this.handleResponse(summaryResponse);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to summarize selection');
    }
  }

  private handleResponse(response: { ok: boolean; summary?: string; error?: string }) {
    if (response.ok && response.summary) {
      this.showOutput(response.summary);
      this.updateStatus('Summary generated successfully');
    } else {
      this.showError(response.error || 'Failed to generate summary');
    }
  }

  private updateStatus(message: string) {
    this.statusElement.textContent = message;
  }

  private showOutput(summary: string) {
    this.outputElement.innerHTML = this.renderMarkdown(summary);
    this.outputSection.classList.remove('hidden');
    this.errorSection.classList.add('hidden');
  }

  private renderMarkdown(text: string): string {
    return text
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code: `text`
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Bullet points: - text or * text
      .replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>')
      // Wrap lists in ul tags (simple approach)
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  private showError(message: string) {
    this.errorElement.textContent = message;
    this.errorSection.classList.remove('hidden');
    this.outputSection.classList.add('hidden');
    this.updateStatus('Error occurred');
  }

  private hideOutput() {
    this.outputSection.classList.add('hidden');
  }

  private hideError() {
    this.errorSection.classList.add('hidden');
  }

  private async copyToClipboard() {
    const text = this.outputElement.textContent;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Popup();
});
