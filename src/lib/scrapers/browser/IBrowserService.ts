/**
 * Browser service interface for web scraping
 * Abstracts browser implementation to allow switching between Puppeteer and Browserbase
 */
export interface IBrowserService {
  /**
   * Fetch HTML content from a URL using a real browser
   * @param url - The URL to fetch
   * @param options - Optional configuration
   * @returns Browser fetch result with HTML and optional screenshot
   */
  fetchPage(url: string, options?: BrowserFetchOptions): Promise<BrowserFetchResult>;

  /**
   * Cleanup resources (close browsers, connections, etc.)
   */
  cleanup(): Promise<void>;
}

export interface BrowserFetchOptions {
  /**
   * Maximum time to wait for page load (milliseconds)
   * @default 30000
   */
  timeout?: number;

  /**
   * Wait for specific network conditions before returning
   * @default 'networkidle2'
   */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';

  /**
   * User agent string to use
   */
  userAgent?: string;

  /**
   * Viewport dimensions
   */
  viewport?: {
    width: number;
    height: number;
  };

  /**
   * Take a screenshot for debugging (base64 encoded)
   */
  screenshot?: boolean;
}

export interface BrowserFetchResult {
  html: string;
  screenshot?: string; // base64 encoded PNG
  url: string; // Final URL after any redirects
  statusCode: number;
  metadata?: Record<string, any>; // Optional metadata extracted during page load
}
