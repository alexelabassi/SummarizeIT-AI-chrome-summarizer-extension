interface OptionsForm {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model: string;
  temperature: number;
}

class OptionsPage {
  private form: HTMLFormElement;
  private statusMessage: HTMLElement;
  private temperatureSlider: HTMLInputElement;
  private temperatureValue: HTMLElement;

  constructor() {
    this.form = document.getElementById('options-form') as HTMLFormElement;
    this.statusMessage = document.getElementById('status-message') as HTMLElement;
    this.temperatureSlider = document.getElementById('temperature') as HTMLInputElement;
    this.temperatureValue = document.getElementById('temperature-value') as HTMLElement;

    this.init();
  }

  private init() {
    // Load saved settings
    this.loadSettings();

    // Add event listeners
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('test-btn')?.addEventListener('click', () => this.testConnection());
    
    // Update temperature display
    this.temperatureSlider.addEventListener('input', () => {
      this.temperatureValue.textContent = this.temperatureSlider.value;
    });
  }

  private async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(['provider', 'apiKey', 'model', 'temperature']);
      
      if (settings.provider) {
        (document.getElementById('provider') as HTMLSelectElement).value = settings.provider;
      }
      
      if (settings.apiKey) {
        (document.getElementById('api-key') as HTMLInputElement).value = settings.apiKey;
      }
      
      if (settings.model) {
        (document.getElementById('model') as HTMLInputElement).value = settings.model;
      }
      
      if (settings.temperature !== undefined) {
        this.temperatureSlider.value = settings.temperature.toString();
        this.temperatureValue.textContent = settings.temperature.toString();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    
    const formData = new FormData(this.form);
    const options: OptionsForm = {
      provider: formData.get('provider') as 'openai' | 'gemini',
      apiKey: formData.get('apiKey') as string,
      model: formData.get('model') as string,
      temperature: parseFloat(formData.get('temperature') as string)
    };

    try {
      await chrome.storage.sync.set(options);
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      this.showStatus('Failed to save settings. Please try again.', 'error');
    }
  }

  private async testConnection() {
    const formData = new FormData(this.form);
    const apiKey = formData.get('apiKey') as string;
    const provider = formData.get('provider') as 'openai' | 'gemini';
    const model = formData.get('model') as string;
    const temperature = parseFloat(formData.get('temperature') as string);

    if (!apiKey) {
      this.showStatus('Please enter an API key first.', 'error');
      return;
    }

    this.showStatus('Testing connection...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'RUN_SUMMARY',
        mode: 'selection',
        text: 'This is a test message to verify the API connection is working properly.',
        provider,
        model,
        temperature
      });

      if (response.ok) {
        this.showStatus('Connection successful! Your API key is working.', 'success');
      } else {
        this.showStatus(`Connection failed: ${response.error}`, 'error');
      }
    } catch (error) {
      this.showStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info') {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    this.statusMessage.classList.remove('hidden');

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.statusMessage.classList.add('hidden');
      }, 3000);
    }
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
