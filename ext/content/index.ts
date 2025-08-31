import { extractReadableText } from './readability';

interface IdleTracker {
  timer: number | null;
  lastActivity: number;
  isActive: boolean;
}

class ContentScript {
  private idleTracker: IdleTracker = {
    timer: null,
    lastActivity: Date.now(),
    isActive: false
  };

  private hasShownToast = false;
  private toastElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for messages from background script and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SUMMARY_RESULT') {
        this.handleSummaryResult(message);
      } else if (message.type === 'GET_SELECTION') {
        const selection = this.getSelection();
        sendResponse({ text: selection });
      } else if (message.type === 'GET_PAGE_TEXT') {
        this.getPageText().then(text => {
          sendResponse({ text });
        });
        return true; // Keep message channel open for async response
      }
    });

    // Start idle tracking
    this.startIdleTracking();

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        this.summarizePage();
      }
    });
  }

  private startIdleTracking() {
    const events = ['scroll', 'keydown', 'mousemove', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.resetIdleTimer();
      }, { passive: true });
    });

    // Start the initial timer
    this.resetIdleTimer();
  }

  private resetIdleTimer() {
    if (this.idleTracker.timer) {
      clearTimeout(this.idleTracker.timer);
    }

    this.idleTracker.lastActivity = Date.now();
    this.idleTracker.timer = window.setTimeout(() => {
      this.checkIdleNudge();
    }, 30000); // 30 seconds
  }

  private async checkIdleNudge() {
    if (this.hasShownToast) return;

    const text = await extractReadableText();
    if (!text) return;

    const wordCount = text.split(/\s+/).length;
    if (wordCount < 1500) return;

    this.showIdleToast();
  }

  private showIdleToast() {
    if (this.toastElement) return;

    this.toastElement = document.createElement('div');
    this.toastElement.className = 'summarizeit-toast';
    this.toastElement.innerHTML = `
      <div class="toast-content">
        <span>Summarize this page?</span>
        <div class="toast-buttons">
          <button class="toast-btn summarize-btn">Summarize</button>
          <button class="toast-btn dismiss-btn">Dismiss</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.toastElement);

    // Add event listeners
    this.toastElement.querySelector('.summarize-btn')?.addEventListener('click', () => {
      this.summarizePage();
      this.hideToast();
    });

    this.toastElement.querySelector('.dismiss-btn')?.addEventListener('click', () => {
      this.hideToast();
    });

    this.hasShownToast = true;
  }

  private hideToast() {
    if (this.toastElement) {
      this.toastElement.remove();
      this.toastElement = null;
    }
  }

  private async summarizePage() {
    const text = await this.getPageText();
    if (!text) {
      this.showError('No readable content found on this page.');
      return;
    }

    this.sendSummaryRequest('page', text);
  }

  private async getPageText(): Promise<string | null> {
    return await extractReadableText();
  }

  private getSelection(): string | null {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (!text || text.length < 50) {
      return null;
    }
    
    return text;
  }

  private sendSummaryRequest(mode: 'page' | 'selection', text: string) {
    chrome.runtime.sendMessage({
      type: 'RUN_SUMMARY',
      mode,
      text,
      title: document.title,
      url: window.location.href
    });
  }

  private handleSummaryResult(message: { ok: boolean; summary?: string; error?: string }) {
    if (message.ok && message.summary) {
      this.showSummary(message.summary);
    } else {
      this.showError(message.error || 'Failed to generate summary');
    }
  }

  private showSummary(summary: string) {
    // Create a modal to display the summary
    const modal = document.createElement('div');
    modal.className = 'summarizeit-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Summary</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <pre class="summary-text">${summary}</pre>
        </div>
        <div class="modal-footer">
          <button class="copy-btn">Copy</button>
          <button class="close-modal-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.close-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.close-modal-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.copy-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(summary);
      const copyBtn = modal.querySelector('.copy-btn') as HTMLButtonElement;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  private showError(message: string) {
    const modal = document.createElement('div');
    modal.className = 'summarizeit-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Error</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="error-text">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="close-modal-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.close-modal-btn')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

// Initialize content script
new ContentScript();
