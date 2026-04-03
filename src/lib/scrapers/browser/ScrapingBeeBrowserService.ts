import { type IBrowserService, type BrowserFetchOptions, type BrowserFetchResult } from './IBrowserService';
import { ScrapingBeeClient } from 'scrapingbee';

/**
 * ScrapingBee implementation of IBrowserService
 * Uses ScrapingBee's cloud-based scraping service with advanced bot bypass
 *
 * To use this service:
 * 1. Sign up at https://www.scrapingbee.com
 * 2. Set environment variable: SCRAPINGBEE_API_KEY
 * 3. Set BROWSER_SERVICE=scrapingbee in .env
 *
 * Features:
 * - 99.9%+ success rate on difficult sites
 * - JavaScript rendering for SPAs
 * - Premium residential proxies
 * - Bypasses Cloudflare, Akamai, PerimeterX, etc.
 */
export class ScrapingBeeBrowserService implements IBrowserService {
  private client: ScrapingBeeClient;
  private apiKey: string;

  constructor() {
    const apiKey = process.env.SCRAPINGBEE_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ScrapingBee API key not found. Please set SCRAPINGBEE_API_KEY environment variable.'
      );
    }

    this.apiKey = apiKey;
    this.client = new ScrapingBeeClient(apiKey);

    console.log('[ScrapingBeeBrowserService] Initialized');
  }

  async fetchPage(url: string, options: BrowserFetchOptions = {}): Promise<BrowserFetchResult> {
    const { timeout = 60000 } = options;
    const startTime = Date.now();

    try {
      console.log(`[ScrapingBeeBrowserService] Fetching: ${url}`);

      // Determine if this is an e-commerce site for better scraping
      const isEcommerce = url.includes('samsclub.com') || url.includes('costco.com');

      // ScrapingBee options for e-commerce sites
      const scrapingBeeOptions: Record<string, any> = {
        // Enable JavaScript rendering for React SPAs
        render_js: true,

        // Try stealth mode instead of premium proxies for Sam's Club
        stealth_proxy: true,

        // Wait time after page load (in ms)
        wait: 3000,

        // Set timeout
        timeout: timeout,
      };

      console.log(`[ScrapingBeeBrowserService] Options:`, {
        render_js: scrapingBeeOptions.render_js,
        wait: scrapingBeeOptions.wait,
        stealth_proxy: scrapingBeeOptions.stealth_proxy,
        isEcommerce,
      });

      // Use ScrapingBee client to fetch the page
      // Returns Axios response: { data, status, statusText, headers, config }
      const response = await this.client.get({
        url,
        params: scrapingBeeOptions,
      });

      // Extract HTML from Axios response data
      const html = response.data;

      const duration = Date.now() - startTime;
      console.log(`[ScrapingBeeBrowserService] Page fetched successfully in ${duration}ms (${html.length} bytes)`);

      // Log a preview for debugging
      const htmlPreview = html.substring(0, 500);
      console.log(`[ScrapingBeeBrowserService] HTML preview: ${htmlPreview.replace(/\s+/g, ' ')}...`);

      return {
        html,
        screenshot: undefined, // ScrapingBee doesn't support screenshots yet
        url, // ScrapingBee doesn't expose final URL after redirects
        statusCode: response.status || 200,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[ScrapingBeeBrowserService] Error after ${duration}ms:`, error);

      if (error instanceof Error) {
        // Provide helpful error messages
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('ScrapingBee authentication failed. Please check your API key.');
        }
        if (error.message.includes('402')) {
          throw new Error('ScrapingBee credits exhausted. Please upgrade your plan or wait until next billing cycle.');
        }
      }

      throw error;
    }
  }

  async cleanup(): Promise<void> {
    // ScrapingBee is stateless - no cleanup needed
    console.log('[ScrapingBeeBrowserService] Cleanup complete (no action needed)');
  }
}
