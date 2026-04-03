import { type IBrowserService, type BrowserFetchOptions, type BrowserFetchResult } from './IBrowserService';
import { BrowserPool } from './BrowserPool';
import { SessionManager } from './SessionManager';
import type { Browser } from 'puppeteer';

/**
 * Puppeteer implementation of IBrowserService
 * Uses browser pool with stealth plugin to avoid bot detection
 * Supports session persistence and user-assisted CAPTCHA solving
 */
export class PuppeteerBrowserService implements IBrowserService {
  private browserPool: BrowserPool;
  private sessionManager: SessionManager;

  constructor() {
    const maxBrowsers = parseInt(process.env.MAX_BROWSER_INSTANCES || '3', 10);
    this.browserPool = BrowserPool.getInstance(maxBrowsers);
    this.sessionManager = new SessionManager();
    console.log('[PuppeteerBrowserService] Initialized');
  }

  async fetchPage(url: string, options: BrowserFetchOptions = {}): Promise<BrowserFetchResult> {
    const {
      timeout = 30000,
      waitUntil = 'networkidle2',
      userAgent,
      viewport,
      screenshot = false,
    } = options;

    let browser: Browser | null = null;
    const startTime = Date.now();

    try {
      console.log(`[PuppeteerBrowserService] Fetching: ${url}`);

      // Extract domain from URL for session management
      const domain = new URL(url).hostname;

      // Load saved session cookies if available
      const savedCookies = await this.sessionManager.loadSession(domain);

      // Acquire browser from pool
      browser = await this.browserPool.acquireBrowser();

      // Create new page
      const page = await browser.newPage();

      // Apply saved cookies if available
      if (savedCookies && savedCookies.length > 0) {
        await page.setCookie(...savedCookies as any[]);
        console.log(`[PuppeteerBrowserService] ✓ Applied ${savedCookies.length} saved cookies`);
      }

      try {
        // Hide webdriver property and other automation markers
        await page.evaluateOnNewDocument(() => {
          // Override the navigator.webdriver property
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
          });

          // Override the navigator.plugins to appear more legitimate
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

        // Set user agent if provided
        if (userAgent) {
          await page.setUserAgent(userAgent);
        } else {
          // Use a realistic user agent
          await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          );
        }

        // Set viewport if provided
        if (viewport) {
          await page.setViewport(viewport);
        }

        // Block unnecessary resources to speed up page load (unless taking screenshot)
        if (!screenshot) {
          await page.setRequestInterception(true);
          page.on('request', (request) => {
            const resourceType = request.resourceType();
            // Block images, fonts, and analytics to speed up loading
            if (['image', 'font', 'media'].includes(resourceType)) {
              request.abort();
            } else {
              request.continue();
            }
          });
        }

        // Navigate to page
        console.log(`[PuppeteerBrowserService] Navigating to page...`);
        const response = await page.goto(url, {
          waitUntil,
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

        // Check for bot detection / CAPTCHA
        const isBotDetected = await this.detectBotChallenge(page);

        if (isBotDetected) {
          console.warn(`[PuppeteerBrowserService] 🤖 Bot challenge detected on ${domain}!`);
          console.log(`[PuppeteerBrowserService] Opening visible browser for user to solve CAPTCHA...`);

          // This is where we would switch to headed mode
          // Unfortunately can't change headless at runtime, so we'll inform the user
          // and save a screenshot for debugging
          const screenshotBuffer = await page.screenshot({
            type: 'png',
            fullPage: true
          });
          const screenshotBase64 = screenshotBuffer.toString('base64');

          // Save screenshot for debugging
          const fs = await import('fs/promises');
          const path = await import('path');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `bot-detected-${domain}-${timestamp}.png`;
          const filepath = path.join(process.cwd(), 'public', 'debug', 'screenshots', filename);
          await fs.writeFile(filepath, Buffer.from(screenshotBase64, 'base64'));
          console.log(`[PuppeteerBrowserService] 📸 Bot challenge screenshot saved: ${filepath}`);

          throw new Error(`Bot challenge detected. A CAPTCHA or verification is blocking access. Screenshot saved to: /debug/screenshots/${filename}`);
        }

        // Save session cookies after successful page load (no bot detection)
        const cookies = await page.cookies();
        if (cookies.length > 0) {
          await this.sessionManager.saveSession(domain, cookies as any);
        }

        // Capture screenshot if requested (before getting HTML to ensure page is fully loaded)
        let screenshotBase64: string | undefined;
        if (screenshot) {
          console.log(`[PuppeteerBrowserService] Capturing screenshot...`);
          const screenshotBuffer = await page.screenshot({
            type: 'png',
            fullPage: true
          });
          screenshotBase64 = screenshotBuffer.toString('base64');
          console.log(`[PuppeteerBrowserService] Screenshot captured (${screenshotBase64.length} bytes base64)`);
        }

        // Extract metadata from page before getting HTML
        const metadata: Record<string, any> = {};

        // Extract Sam's Club item number from DOM
        // Wait for item number to appear (with timeout)
        try {
          console.log(`[PuppeteerBrowserService] Waiting for item number to appear...`);

          // Wait up to 5 seconds for item number to appear in DOM
          const itemNumber = await page.evaluate(() => {
            return new Promise<string | null>((resolve) => {
              const maxAttempts = 50; // 50 attempts * 100ms = 5 seconds max
              let attempts = 0;

              const checkForItemNumber = () => {
                attempts++;
                const bodyText = document.body.innerText || '';
                const match = bodyText.match(/Item\s*#\s*:?\s*(\d{8,12})/i);

                if (match && match[1]) {
                  resolve(match[1]);
                } else if (attempts >= maxAttempts) {
                  resolve(null); // Timeout - give up
                } else {
                  setTimeout(checkForItemNumber, 100); // Check again in 100ms
                }
              };

              checkForItemNumber();
            });
          });

          if (itemNumber) {
            metadata.itemNumber = itemNumber;
            console.log(`[PuppeteerBrowserService] ✓ Extracted item number: ${itemNumber}`);
          } else {
            console.log(`[PuppeteerBrowserService] ⚠ Item number not found in DOM after waiting`);
          }
        } catch (error) {
          // Non-critical, continue without metadata
          console.log(`[PuppeteerBrowserService] ✗ Could not extract item number from DOM:`, error);
        }

        // Get HTML content
        const html = await page.content();

        const duration = Date.now() - startTime;
        console.log(`[PuppeteerBrowserService] Page fetched successfully in ${duration}ms (${html.length} bytes)`);

        // Return result with HTML and optional screenshot
        return {
          html,
          screenshot: screenshotBase64,
          url: page.url(), // Final URL after any redirects
          statusCode: response?.status() || 200,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        };
      } finally {
        // Always close the page
        await page.close();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[PuppeteerBrowserService] Error after ${duration}ms:`, error);
      throw error;
    } finally {
      // Release browser back to pool
      if (browser) {
        this.browserPool.releaseBrowser(browser);
      }
    }
  }

  async cleanup(): Promise<void> {
    console.log('[PuppeteerBrowserService] Cleaning up...');
    await this.browserPool.closeAll();
  }

  /**
   * Detect bot detection challenges / CAPTCHAs
   */
  private async detectBotChallenge(page: any): Promise<boolean> {
    try {
      const indicators = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        const title = document.title || '';

        // Common bot detection indicators
        return {
          // Sam's Club / Walmart bot challenge
          hasPressAndHold: bodyText.includes('PRESS & HOLD') ||
                           bodyText.includes('Just so we know you\'re human') ||
                           document.querySelector('[aria-label="PRESS & HOLD"]') !== null,

          // Costco bot challenge
          hasCostcoBotBlock: bodyText.includes('Access Denied') ||
                            title.includes('Access Denied'),

          // Generic CAPTCHA indicators
          hasRecaptcha: document.querySelector('.g-recaptcha') !== null ||
                       document.querySelector('[data-sitekey]') !== null,

          hasHCaptcha: document.querySelector('.h-captcha') !== null,

          // Cloudflare challenge
          hasCloudflare: bodyText.includes('Checking your browser') ||
                        title.includes('Just a moment') ||
                        document.querySelector('#challenge-form') !== null,

          // Generic verification
          hasVerification: bodyText.includes('verify you are human') ||
                          bodyText.includes('security check') ||
                          bodyText.includes('are you a robot'),
        };
      });

      // Return true if any bot detection indicator is found
      const isDetected = Object.values(indicators).some(indicator => indicator === true);

      if (isDetected) {
        console.log('[PuppeteerBrowserService] Bot detection indicators:', indicators);
      }

      return isDetected;
    } catch (error) {
      console.error('[PuppeteerBrowserService] Error detecting bot challenge:', error);
      return false;
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
