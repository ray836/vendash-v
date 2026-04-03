import { type IBrowserService, type BrowserFetchOptions, type BrowserFetchResult } from './IBrowserService';
import scraperapiSDK from 'scraperapi-sdk';

/**
 * ScraperAPI implementation of IBrowserService
 * Uses ScraperAPI's cloud-based scraping service with advanced bot bypass
 *
 * To use this service:
 * 1. Sign up at https://www.scraperapi.com
 * 2. Set environment variable: SCRAPERAPI_KEY
 * 3. Set BROWSER_SERVICE=scraperapi in .env
 *
 * Features:
 * - 99.9%+ success rate on difficult sites
 * - Automatic CAPTCHA solving
 * - Residential proxy rotation (200M+ IPs)
 * - JavaScript rendering for SPAs
 * - Bypasses Akamai, Cloudflare, PerimeterX, etc.
 */
export class ScraperAPIBrowserService implements IBrowserService {
  private client: ReturnType<typeof scraperapiSDK>;
  private apiKey: string;

  constructor() {
    const apiKey = process.env.SCRAPERAPI_KEY;

    if (!apiKey) {
      throw new Error(
        'ScraperAPI key not found. Please set SCRAPERAPI_KEY environment variable.'
      );
    }

    this.apiKey = apiKey;
    this.client = scraperapiSDK(apiKey);

    console.log('[ScraperAPIBrowserService] Initialized');
  }

  async fetchPage(url: string, options: BrowserFetchOptions = {}): Promise<BrowserFetchResult> {
    const { timeout = 60000 } = options;
    const startTime = Date.now();

    try {
      console.log(`[ScraperAPIBrowserService] Fetching: ${url}`);

      // Determine if this is an e-commerce site for better scraping
      const isEcommerce = url.includes('samsclub.com') || url.includes('costco.com');

      // ScraperAPI options for e-commerce sites
      const scraperOptions: Record<string, any> = {
        // Enable JavaScript rendering for React SPAs
        render: true,

        // Set country to US for proper product pricing/availability
        country_code: 'us',

        // Use premium proxies for better success with difficult sites
        premium: true,

        // Enable automatic retries
        autoparse: false, // We'll parse HTML ourselves with Cheerio

        // Set device type (desktop for better compatibility)
        device_type: 'desktop',
      };

      console.log(`[ScraperAPIBrowserService] Options:`, {
        render: scraperOptions.render,
        country: scraperOptions.country_code,
        premium: scraperOptions.premium,
        isEcommerce,
      });

      // Use ScraperAPI SDK to fetch the page
      // SDK returns: { body: string, headers: object, statusCode: number }
      const response = await this.client.get(url, scraperOptions);

      // Extract HTML from response body
      const html = response.body;

      const duration = Date.now() - startTime;
      console.log(`[ScraperAPIBrowserService] Page fetched successfully in ${duration}ms (${html.length} bytes)`);

      // Log a preview for debugging
      const htmlPreview = html.substring(0, 500);
      console.log(`[ScraperAPIBrowserService] HTML preview: ${htmlPreview.replace(/\s+/g, ' ')}...`);

      return {
        html,
        screenshot: undefined, // ScraperAPI doesn't support screenshots yet
        url, // ScraperAPI doesn't expose final URL after redirects
        statusCode: response.statusCode || 200,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[ScraperAPIBrowserService] Error after ${duration}ms:`, error);

      if (error instanceof Error) {
        // Provide helpful error messages
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('ScraperAPI authentication failed. Please check your API key.');
        }
        if (error.message.includes('402')) {
          throw new Error('ScraperAPI credits exhausted. Please upgrade your plan or wait until next billing cycle.');
        }
      }

      throw error;
    }
  }

  async cleanup(): Promise<void> {
    // ScraperAPI is stateless - no cleanup needed
    console.log('[ScraperAPIBrowserService] Cleanup complete (no action needed)');
  }
}
