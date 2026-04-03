import { type IBrowserService, type BrowserFetchOptions, type BrowserFetchResult } from './IBrowserService';
import { PlaywrightBrowserPool } from './PlaywrightBrowserPool';
import type { Browser } from 'playwright';

/**
 * Playwright implementation of IBrowserService
 * Uses browser pool with stealth plugin to avoid bot detection
 *
 * Playwright-extra uses the same stealth plugin as puppeteer-extra-plugin-stealth
 * but with Playwright's more modern and actively maintained browser automation API.
 */
export class PlaywrightBrowserService implements IBrowserService {
  private browserPool: PlaywrightBrowserPool;

  constructor() {
    const maxBrowsers = parseInt(process.env.MAX_BROWSER_INSTANCES || '3', 10);
    this.browserPool = PlaywrightBrowserPool.getInstance(maxBrowsers);
    console.log('[PlaywrightBrowserService] Initialized');
  }

  async fetchPage(url: string, options: BrowserFetchOptions = {}): Promise<BrowserFetchResult> {
    const {
      timeout = 30000,
      waitUntil = 'networkidle2',
      userAgent,
      viewport,
    } = options;

    let browser: Browser | null = null;
    const startTime = Date.now();

    try {
      console.log(`[PlaywrightBrowserService] Fetching: ${url}`);

      // Acquire browser from pool
      browser = await this.browserPool.acquireBrowser();

      // Create new page context and page
      const context = await browser.newContext({
        userAgent: userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: viewport || {
          width: 1920 + Math.floor(Math.random() * 100),
          height: 1080 + Math.floor(Math.random() * 100),
        },
        // Additional anti-detection settings
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: [],
      });

      const page = await context.newPage();

      try {
        // Additional stealth measures (supplement to stealth plugin)
        await page.addInitScript(() => {
          // Override the navigator.webdriver property
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
          });

          // Override navigator.plugins to appear more legitimate
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });

          // Override chrome runtime
          (window as any).chrome = {
            runtime: {},
          };

          // Mock permissions
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters: any) =>
            parameters.name === 'notifications'
              ? Promise.resolve({ state: 'denied' } as PermissionStatus)
              : originalQuery(parameters);
        });

        // Block unnecessary resources to speed up page load
        await page.route('**/*', (route) => {
          const request = route.request();
          const resourceType = request.resourceType();

          // Block images, fonts, and media to speed up loading
          if (['image', 'font', 'media'].includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });

        // Map Puppeteer's waitUntil to Playwright's waitUntil
        const playwrightWaitUntil = this.mapWaitUntil(waitUntil);

        // Navigate to page
        console.log(`[PlaywrightBrowserService] Navigating to page...`);
        const response = await page.goto(url, {
          waitUntil: playwrightWaitUntil,
          timeout,
        });

        if (!response) {
          throw new Error('No response received from page');
        }

        // Add human-like delay
        await this.randomDelay(500, 1500);

        // Scroll page to trigger lazy loading
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await this.randomDelay(300, 700);

        // Get HTML content
        const html = await page.content();

        // Get final URL and status code
        const finalUrl = page.url();
        const statusCode = response.status();

        const duration = Date.now() - startTime;
        console.log(`[PlaywrightBrowserService] Page fetched successfully in ${duration}ms (${html.length} bytes)`);

        return {
          html,
          screenshot: undefined, // Playwright doesn't support screenshots yet (can be added later)
          url: finalUrl,
          statusCode,
        };
      } finally {
        // Always close the context (which closes the page)
        await context.close();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[PlaywrightBrowserService] Error after ${duration}ms:`, error);
      throw error;
    } finally {
      // Release browser back to pool
      if (browser) {
        this.browserPool.releaseBrowser(browser);
      }
    }
  }

  async cleanup(): Promise<void> {
    console.log('[PlaywrightBrowserService] Cleaning up...');
    await this.browserPool.closeAll();
  }

  /**
   * Map Puppeteer's waitUntil options to Playwright's
   */
  private mapWaitUntil(waitUntil: string): 'load' | 'domcontentloaded' | 'networkidle' | 'commit' {
    switch (waitUntil) {
      case 'networkidle0':
      case 'networkidle2':
        return 'networkidle';
      case 'domcontentloaded':
        return 'domcontentloaded';
      case 'load':
      default:
        return 'load';
    }
  }

  /**
   * Random delay to simulate human behavior
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats() {
    return this.browserPool.getStats();
  }
}
