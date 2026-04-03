import { type IBrowserService } from './IBrowserService';
import { PuppeteerBrowserService } from './PuppeteerBrowserService';
import { PlaywrightBrowserService } from './PlaywrightBrowserService';
import { BrowserbaseService } from './BrowserbaseService';
import { ScraperAPIBrowserService } from './ScraperAPIBrowserService';
import { ScrapingBeeBrowserService } from './ScrapingBeeBrowserService';

/**
 * Factory for creating browser service instances
 * Selects implementation based on BROWSER_SERVICE environment variable
 */
export class BrowserServiceFactory {
  private static instance: IBrowserService | null = null;

  /**
   * Get browser service singleton
   * Implementation is determined by BROWSER_SERVICE env var:
   * - 'puppeteer' (default): Use Puppeteer with stealth plugin
   * - 'playwright': Use Playwright with stealth plugin
   * - 'browserbase': Use Browserbase cloud service
   * - 'scraperapi': Use ScraperAPI cloud service
   * - 'scrapingbee': Use ScrapingBee cloud service
   */
  static getBrowserService(): IBrowserService {
    if (!BrowserServiceFactory.instance) {
      const serviceType = (process.env.BROWSER_SERVICE || 'puppeteer').toLowerCase();

      console.log(`[BrowserServiceFactory] Creating browser service: ${serviceType}`);

      switch (serviceType) {
        case 'playwright':
          BrowserServiceFactory.instance = new PlaywrightBrowserService();
          break;

        case 'browserbase':
          BrowserServiceFactory.instance = new BrowserbaseService();
          break;

        case 'scraperapi':
          BrowserServiceFactory.instance = new ScraperAPIBrowserService();
          break;

        case 'scrapingbee':
          BrowserServiceFactory.instance = new ScrapingBeeBrowserService();
          break;

        case 'puppeteer':
        default:
          BrowserServiceFactory.instance = new PuppeteerBrowserService();
          break;
      }
    }

    return BrowserServiceFactory.instance;
  }

  /**
   * Reset the singleton (useful for testing or switching services)
   */
  static async reset(): Promise<void> {
    if (BrowserServiceFactory.instance) {
      await BrowserServiceFactory.instance.cleanup();
      BrowserServiceFactory.instance = null;
    }
  }

  /**
   * Get the current service type
   */
  static getServiceType(): string {
    return (process.env.BROWSER_SERVICE || 'puppeteer').toLowerCase();
  }
}
