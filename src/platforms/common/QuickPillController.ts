import { ThemeConfig } from '../../types/theme';

export interface QuickPillOptions {
  platformName: string; // e.g. 'LeetCode' or 'Codeforces'
}

export class QuickPillController {
  private pillElement: HTMLElement | null = null;
  private clickHandler: (() => void) | null = null;
  private readonly platformName: string;

  constructor(options: QuickPillOptions) {
    this.platformName = options.platformName;
  }

  /**
   * Renders or updates the floating quick-switcher pill.
   * Ensures only one instance exists in the DOM and avoids duplicate event listeners.
   */
  public render(config: ThemeConfig): void {
    if (typeof document === 'undefined' || !document.body) return;

    if (!this.pillElement) {
      // Check if an existing element is already in the DOM
      const existing = document.getElementById('themeflow-quick-pill');
      if (existing) {
        this.pillElement = existing;
      } else {
        this.pillElement = document.createElement('div');
        this.pillElement.id = 'themeflow-quick-pill';
        this.pillElement.title = `ThemeFlow ${this.platformName}: Click to open Theme Studio`;

        this.clickHandler = () => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'open_studio' });
          }
        };
        this.pillElement.addEventListener('click', this.clickHandler);
        document.body.appendChild(this.pillElement);
      }
    }

    // Update markup and label cleanly
    this.pillElement.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m4.93 4.93 4.24 4.24"></path>
        <path d="m14.83 9.17 4.24-4.24"></path>
        <path d="m14.83 14.83 4.24 4.24"></path>
        <path d="m9.17 14.83-4.24 4.24"></path>
      </svg>
      <span class="tf-pill-text">${this.platformName} • ${config.name}</span>
    `;
  }

  /**
   * Cleans up the pill element and event listener.
   */
  public remove(): void {
    if (this.pillElement) {
      if (this.clickHandler) {
        this.pillElement.removeEventListener('click', this.clickHandler);
        this.clickHandler = null;
      }
      if (this.pillElement.parentNode) {
        this.pillElement.parentNode.removeChild(this.pillElement);
      }
      this.pillElement = null;
    } else {
      const orphan = typeof document !== 'undefined' ? document.getElementById('themeflow-quick-pill') : null;
      if (orphan && orphan.parentNode) {
        orphan.parentNode.removeChild(orphan);
      }
    }
  }

  public destroy(): void {
    this.remove();
  }
}
