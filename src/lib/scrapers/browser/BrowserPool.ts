import puppeteer, { type Browser } from 'puppeteer';

/**
 * Browser instance pool for Puppeteer
 * Manages a pool of browser instances to reuse across requests
 */
export class BrowserPool {
  private static instance: BrowserPool | null = null;
  private browsers: Browser[] = [];
  private maxBrowsers: number;
  private inUse: Set<Browser> = new Set();

  private constructor(maxBrowsers: number = 3) {
    this.maxBrowsers = maxBrowsers;

    console.log(`[BrowserPool] Initialized with max ${maxBrowsers} browsers`);
  }

  /**
   * Get singleton instance
   */
  static getInstance(maxBrowsers?: number): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool(maxBrowsers);
    }
    return BrowserPool.instance;
  }

  /**
   * Get a browser instance from the pool
   */
  async acquireBrowser(): Promise<Browser> {
    // Try to find an available browser
    const availableBrowser = this.browsers.find(b => !this.inUse.has(b));

    if (availableBrowser) {
      // Check if browser is still connected
      if (availableBrowser.isConnected()) {
        this.inUse.add(availableBrowser);
        console.log(`[BrowserPool] Reusing existing browser (${this.inUse.size}/${this.browsers.length} in use)`);
        return availableBrowser;
      } else {
        // Remove disconnected browser
        console.log(`[BrowserPool] Removing disconnected browser`);
        this.browsers = this.browsers.filter(b => b !== availableBrowser);
      }
    }

    // Create new browser if we haven't hit the limit
    if (this.browsers.length < this.maxBrowsers) {
      console.log(`[BrowserPool] Creating new browser (${this.browsers.length + 1}/${this.maxBrowsers})`);
      const browser = await this.createBrowser();
      this.browsers.push(browser);
      this.inUse.add(browser);
      return browser;
    }

    // Wait for a browser to become available
    console.log(`[BrowserPool] Pool full, waiting for available browser...`);
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.browsers.find(b => !this.inUse.has(b) && b.isConnected());
        if (available) {
          clearInterval(checkInterval);
          this.inUse.add(available);
          console.log(`[BrowserPool] Acquired waiting browser`);
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
    console.log(`[BrowserPool] Released browser (${this.inUse.size}/${this.browsers.length} in use)`);
  }

  /**
   * Create a new browser instance with stealth configuration
   */
  private async createBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch({
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
      defaultViewport: {
        width: 1920 + Math.floor(Math.random() * 100),
        height: 1080 + Math.floor(Math.random() * 100),
      },
    });

    // Handle browser crashes
    browser.on('disconnected', () => {
      console.log(`[BrowserPool] Browser disconnected, removing from pool`);
      this.browsers = this.browsers.filter(b => b !== browser);
      this.inUse.delete(browser);
    });

    return browser;
  }

  /**
   * Close all browsers in the pool
   */
  async closeAll(): Promise<void> {
    console.log(`[BrowserPool] Closing all ${this.browsers.length} browsers`);
    await Promise.all(this.browsers.map(async (browser) => {
      try {
        await browser.close();
      } catch (error) {
        console.error(`[BrowserPool] Error closing browser:`, error);
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
