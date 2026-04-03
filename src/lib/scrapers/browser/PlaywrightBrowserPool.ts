import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser } from 'playwright';

/**
 * Browser instance pool for Playwright
 * Manages a pool of Playwright browser instances with stealth plugin
 */
export class PlaywrightBrowserPool {
  private static instance: PlaywrightBrowserPool | null = null;
  private browsers: Browser[] = [];
  private maxBrowsers: number;
  private inUse: Set<Browser> = new Set();
  private initialized: boolean = false;

  private constructor(maxBrowsers: number = 3) {
    this.maxBrowsers = maxBrowsers;
    console.log(`[PlaywrightBrowserPool] Initialized with max ${maxBrowsers} browsers`);
  }

  /**
   * Get singleton instance
   */
  static getInstance(maxBrowsers?: number): PlaywrightBrowserPool {
    if (!PlaywrightBrowserPool.instance) {
      PlaywrightBrowserPool.instance = new PlaywrightBrowserPool(maxBrowsers);
    }
    return PlaywrightBrowserPool.instance;
  }

  /**
   * Initialize stealth plugin (only once)
   */
  private initializeStealth() {
    if (!this.initialized) {
      chromium.use(StealthPlugin());
      this.initialized = true;
      console.log('[PlaywrightBrowserPool] Stealth plugin registered');
    }
  }

  /**
   * Get a browser instance from the pool
   */
  async acquireBrowser(): Promise<Browser> {
    // Ensure stealth plugin is initialized
    this.initializeStealth();

    // Try to find an available browser
    const availableBrowser = this.browsers.find(b => !this.inUse.has(b));

    if (availableBrowser) {
      // Check if browser is still connected
      if (availableBrowser.isConnected()) {
        this.inUse.add(availableBrowser);
        console.log(`[PlaywrightBrowserPool] Reusing existing browser (${this.inUse.size}/${this.browsers.length} in use)`);
        return availableBrowser;
      } else {
        // Remove disconnected browser
        console.log(`[PlaywrightBrowserPool] Removing disconnected browser`);
        this.browsers = this.browsers.filter(b => b !== availableBrowser);
      }
    }

    // Create new browser if we haven't hit the limit
    if (this.browsers.length < this.maxBrowsers) {
      console.log(`[PlaywrightBrowserPool] Creating new browser (${this.browsers.length + 1}/${this.maxBrowsers})`);
      const browser = await this.createBrowser();
      this.browsers.push(browser);
      this.inUse.add(browser);
      return browser;
    }

    // Wait for a browser to become available
    console.log(`[PlaywrightBrowserPool] Pool full, waiting for available browser...`);
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.browsers.find(b => !this.inUse.has(b) && b.isConnected());
        if (available) {
          clearInterval(checkInterval);
          this.inUse.add(available);
          console.log(`[PlaywrightBrowserPool] Acquired waiting browser`);
          resolve(available);
        }
      }, 100);
    });
  }

  /**
   * Release a browser back to the pool
   */
  releaseBrowser(browser: Browser): void {
    this.inUse.delete(browser);
    console.log(`[PlaywrightBrowserPool] Released browser (${this.inUse.size}/${this.browsers.length} in use)`);
  }

  /**
   * Create a new browser instance with stealth configuration
   */
  private async createBrowser(): Promise<Browser> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled', // Hide webdriver flag
        '--disable-features=IsolateOrigins,site-per-process', // Help with some sites
        '--disable-site-isolation-trials',
        // Randomize window size slightly
        `--window-size=${1920 + Math.floor(Math.random() * 100)},${1080 + Math.floor(Math.random() * 100)}`,
      ],
    });

    // Handle browser crashes
    browser.on('disconnected', () => {
      console.log(`[PlaywrightBrowserPool] Browser disconnected, removing from pool`);
      this.browsers = this.browsers.filter(b => b !== browser);
      this.inUse.delete(browser);
    });

    return browser;
  }

  /**
   * Close all browsers in the pool
   */
  async closeAll(): Promise<void> {
    console.log(`[PlaywrightBrowserPool] Closing all ${this.browsers.length} browsers`);
    await Promise.all(this.browsers.map(async (browser) => {
      try {
        await browser.close();
      } catch (error) {
        console.error(`[PlaywrightBrowserPool] Error closing browser:`, error);
      }
    }));
    this.browsers = [];
    this.inUse.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      total: this.browsers.length,
      inUse: this.inUse.size,
      available: this.browsers.length - this.inUse.size,
      maxBrowsers: this.maxBrowsers,
    };
  }
}
