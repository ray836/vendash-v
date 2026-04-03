import { type IBrowserService, type BrowserFetchOptions, type BrowserFetchResult } from './IBrowserService';
import Browserbase from '@browserbasehq/sdk';

/**
 * Browserbase implementation of IBrowserService
 * Cloud-based browser service with built-in anti-detection
 *
 * To use this service:
 * 1. Sign up at https://browserbase.com
 * 2. Set environment variables:
 *    - BROWSERBASE_API_KEY
 *    - BROWSERBASE_PROJECT_ID
 * 3. Set BROWSER_SERVICE=browserbase in .env
 */
export class BrowserbaseService implements IBrowserService {
  private client: Browserbase;
  private projectId: string;

  constructor() {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    const projectId = process.env.BROWSERBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
      throw new Error(
        'Browserbase credentials not found. Please set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID environment variables.'
      );
    }

    this.client = new Browserbase({
      apiKey,
    });
    this.projectId = projectId;

    console.log('[BrowserbaseService] Initialized');
  }

  async fetchPage(url: string, options: BrowserFetchOptions = {}): Promise<BrowserFetchResult> {
    const { timeout = 60000 } = options; // Increased default timeout to 60s
    const startTime = Date.now();

    try {
      console.log(`[BrowserbaseService] Fetching: ${url}`);
      console.log(`[BrowserbaseService] Using project ID: ${this.projectId}`);

      // Create a session with enhanced configuration
      // Note: proxies require paid plan ($39/month+)
      const enableProxies = process.env.BROWSERBASE_ENABLE_PROXIES === 'true';

      const session = await this.client.sessions.create({
        projectId: this.projectId,
        ...(enableProxies && { proxies: true }), // Enable residential proxies only if configured
        keepAlive: true, // Keep session alive for debugging/replay
      });

      if (enableProxies) {
        console.log(`[BrowserbaseService] Proxies: ENABLED`);
      } else {
        console.log(`[BrowserbaseService] Proxies: DISABLED (set BROWSERBASE_ENABLE_PROXIES=true to enable)`);
      }

      console.log(`[BrowserbaseService] Session created: ${session.id}`);
      console.log(`[BrowserbaseService] Session URL: https://browserbase.com/sessions/${session.id}`);

      try {
        // Connect to the session using Puppeteer-core
        const puppeteer = await import('puppeteer-core');
        const browser = await puppeteer.connect({
          browserWSEndpoint: session.connectUrl,
        });

        // Get the default context/page or create new one
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // Navigate to the page
        console.log(`[BrowserbaseService] Navigating to page...`);
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout,
        });

        // Log page info for debugging
        const pageTitle = await page.title();
        const finalUrl = page.url();
        console.log(`[BrowserbaseService] Page title: "${pageTitle}"`);
        console.log(`[BrowserbaseService] Final URL: ${finalUrl}`);

        // Check if we got redirected
        if (finalUrl !== url) {
          console.warn(`[BrowserbaseService] ⚠️  URL changed from ${url} to ${finalUrl}`);
        }

        // For Costco, wait for React/JavaScript content to fully load
        if (url.includes('costco.com')) {
          console.log(`[BrowserbaseService] Detected Costco - waiting for React app to load...`);

          try {
            // Strategy 1: Wait for page title to populate (indicates React loaded)
            console.log(`[BrowserbaseService] Waiting for page title...`);
            await page.waitForFunction(
              () => document.title && document.title !== '' && document.title !== 'www.costco.com',
              { timeout: 15000 }
            ).catch(() => {
              console.warn(`[BrowserbaseService] Timeout waiting for title`);
            });

            // Strategy 2: Wait for price elements (key indicator content loaded)
            console.log(`[BrowserbaseService] Waiting for price elements...`);
            await page.waitForSelector('.price, [automation-id="productPrice"], .your-price, .product-price', {
              timeout: 10000
            }).catch(() => {
              console.warn(`[BrowserbaseService] No price element found`);
            });

            // Strategy 3: Wait for images to load
            console.log(`[BrowserbaseService] Waiting for product images...`);
            await page.waitForSelector('img[src*="costco"], .product-image-container img, [data-image-id]', {
              timeout: 10000
            }).catch(() => {
              console.warn(`[BrowserbaseService] No product images found`);
            });

            // Strategy 4: Extra wait + scroll to trigger lazy loading
            await new Promise(resolve => setTimeout(resolve, 2000));
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Check final page title
            const finalTitle = await page.title();
            console.log(`[BrowserbaseService] Final page title after waits: "${finalTitle}"`);

          } catch (error) {
            console.warn(`[BrowserbaseService] Costco-specific waiting failed:`, error);
            // Continue anyway - we'll get whatever loaded
          }
        }

        // Get HTML content
        const html = await page.content();

        // Save HTML to temp file for debugging (only first 50KB for logging)
        const htmlPreview = html.substring(0, 500);
        console.log(`[BrowserbaseService] HTML preview: ${htmlPreview.replace(/\s+/g, ' ')}...`);

        await browser.close();

        const duration = Date.now() - startTime;
        console.log(`[BrowserbaseService] Page fetched successfully in ${duration}ms (${html.length} bytes)`);

        return {
          html,
          screenshot: undefined, // Browserbase doesn't support screenshots yet
          url: finalUrl,
          statusCode: 200, // Browserbase doesn't expose status code
        };
      } finally {
        // Clean up session - Browserbase SDK 2.6.0 format
        try {
          await this.client.sessions.update(session.id, {
            projectId: this.projectId,
            status: 'REQUEST_RELEASE',
          });
        } catch (cleanupError) {
          console.warn('[BrowserbaseService] Session cleanup warning:', cleanupError);
          // Don't throw - session will auto-expire
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[BrowserbaseService] Error after ${duration}ms:`, error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    // Browserbase handles cleanup automatically
    console.log('[BrowserbaseService] Cleanup complete (handled by Browserbase)');
  }
}
