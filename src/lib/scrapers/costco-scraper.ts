import * as cheerio from 'cheerio';
import { BrowserServiceFactory } from './browser/BrowserServiceFactory';

/**
 * Product information extracted from Costco
 */
export interface ScrapedProductInfo {
  name: string;
  image: string;
  case_cost: string;
  case_size: string;
  price_per_each?: string;
  vendor_sku?: string; // Item number
}

/**
 * Scrapes product information from a Costco product URL
 * Uses browser service (Puppeteer or Browserbase) to bypass bot detection
 * @param url - The Costco product URL
 * @returns Product information including name, image, case_cost, case_size, and optionally price_per_each
 */
export async function scrapeCostcoProduct(url: string): Promise<ScrapedProductInfo> {
  const startTime = Date.now();
  console.log(`[Costco Scraper] Starting scrape for: ${url}`);

  try {
    // Use browser service to fetch page (bypasses bot detection)
    console.log(`[Costco Scraper] Fetching page with browser service...`);
    const browserService = BrowserServiceFactory.getBrowserService();

    const fetchResult = await browserService.fetchPage(url, {
      timeout: 45000,
      waitUntil: 'networkidle2',
      screenshot: true, // Enable screenshot for debugging failed scrapes
    });

    const { html, screenshot } = fetchResult;

    console.log(`[Costco Scraper] Page fetched, size: ${html.length} bytes`);

    console.log(`[Costco Scraper] Parsing HTML with Cheerio...`);
    const parseStart = Date.now();
    const $ = cheerio.load(html);
    const parseDuration = Date.now() - parseStart;
    console.log(`[Costco Scraper] HTML parsed in ${parseDuration}ms`);

    // Initialize result object
    const result: Partial<ScrapedProductInfo> = {
      name: '',
      image: '',
      case_cost: '',
      case_size: '',
      vendor_sku: ''
    };

    // Extract vendor SKU from URL
    // Costco URLs have pattern: https://www.costco.com/product-name.product.ITEM_NUMBER.html
    const skuMatch = url.match(/\.product\.(\d+)\.html/);
    if (skuMatch) {
      result.vendor_sku = skuMatch[1];
    }

    console.log(`[Costco Scraper] Starting data extraction...`);

    // Method 1: Try to extract from JSON-LD structured data
    console.log(`[Costco Scraper] Method 1: Checking JSON-LD structured data...`);
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');

        if (jsonData['@type'] === 'Product') {
          result.name = result.name || jsonData.name || '';
          result.image = result.image || jsonData.image || (Array.isArray(jsonData.image) ? jsonData.image[0] : '');

          if (jsonData.offers) {
            const offers = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
            result.case_cost = result.case_cost || offers.price?.toString() || '';
          }
        }
      } catch (e) {
        // Continue if parsing fails
      }
    });

    // Method 2: Try to extract from meta tags
    if (!result.name) {
      result.name = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('meta[property="og:description"]').attr('content')?.split('|')[0]?.trim() ||
                    $('h1').first().text().trim() || '';
    }

    if (!result.image) {
      result.image = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') || '';
    }

    // Method 3: Try Costco-specific selectors
    if (!result.name) {
      result.name = $('[automation-id="productName"]').text().trim() ||
                    $('.product-h1').text().trim() ||
                    $('h1[itemprop="name"]').text().trim();
    }

    if (!result.image) {
      const mainImage = $('.product-image-container img, [data-image-id] img, .primary-image').first();
      result.image = mainImage.attr('src') || mainImage.attr('data-src') || '';

      // Costco sometimes uses low-res placeholder images, try to get high-res
      if (result.image && result.image.includes('thumbnail')) {
        result.image = result.image.replace('thumbnail', 'enlarge');
      }
    }

    if (!result.case_cost) {
      // Strategy 1: Look for price in common Costco price selectors
      const priceSelectors = [
        '[automation-id="productPrice"]',
        '.price',
        '.product-price',
        '[itemprop="price"]',
        '.your-price'
      ];

      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim();
        const priceMatch = priceText.match(/\$?(\d+\.\d{2})/);
        if (priceMatch) {
          result.case_cost = priceMatch[1];
          break;
        }
      }

      // Strategy 2: Search for price patterns in the page text
      if (!result.case_cost) {
        const bodyText = $('body').text();
        // Look for patterns like "$29.99" or "Price: $29.99"
        const priceMatch = bodyText.match(/(?:Price|Cost)?\s*\$(\d+\.\d{2})/i);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1]);
          // Verify it's a reasonable product price
          if (price > 0 && price < 10000) {
            result.case_cost = priceMatch[1];
          }
        }
      }

      // Strategy 3: Look specifically for span elements with price-like text
      if (!result.case_cost) {
        $('span, div').each((_, element) => {
          if (!result.case_cost) {
            const $el = $(element);
            const text = $el.text().trim();

            // Skip if has strikethrough (old price)
            const hasStrikethrough = $el.css('text-decoration')?.includes('line-through') ||
                                    $el.parent().css('text-decoration')?.includes('line-through');

            if (!hasStrikethrough) {
              const priceMatch = text.match(/^\$(\d+\.\d{2})$/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 0 && price < 10000) {
                  result.case_cost = priceMatch[1];
                }
              }
            }
          }
        });
      }
    }

    // Extract case size from product name
    if (!result.case_size && result.name) {
      // Look for patterns like "12-pack", "12 pack", "12-ct", "12 ct", "12 Count"
      const patterns = [
        /(\d+)[-\s]pack/i,
        /(\d+)[-\s]ct/i,
        /(\d+)[-\s]count/i,
        /(\d+)[-\s]pk/i,
        /,\s*(\d+)[-\s]pack/i,
        /\((\d+)[-\s]pack\)/i,
      ];

      for (const pattern of patterns) {
        const match = result.name.match(pattern);
        if (match) {
          result.case_size = match[1];
          break;
        }
      }
    }

    // Fallback: search entire page for case size
    if (!result.case_size) {
      const bodyText = $('body').text();
      const sizeMatch = bodyText.match(/(\d+)[-\s](?:pack|ct|count|pk)/i);
      if (sizeMatch) {
        result.case_size = sizeMatch[1];
      }
    }

    // If still no case size, try to find it in structured data or meta
    if (!result.case_size) {
      // Look in the page for quantity information
      const quantityText = $('[automation-id="itemQuantity"], .quantity, [itemprop="quantity"]').text();
      const quantityMatch = quantityText.match(/(\d+)/);
      if (quantityMatch) {
        result.case_size = quantityMatch[1];
      }
    }

    // Extract unit price (price per each) - optional field
    const bodyText = $('body').text();
    const unitPricePatterns = [
      /\$?(\d+\.\d{2})\s*\/\s*(?:ea|each|unit)/i,
      /(?:unit price|price per item):\s*\$?(\d+\.\d{2})/i,
    ];

    for (const pattern of unitPricePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        result.price_per_each = match[1];
        break;
      }
    }

    // Validate that we have all required fields
    console.log(`[Costco Scraper] Validating extracted data...`);
    console.log(`[Costco Scraper] Extracted - Name: ${result.name ? '✓' : '✗'}, Image: ${result.image ? '✓' : '✗'}, Cost: ${result.case_cost ? '✓' : '✗'}, Size: ${result.case_size ? '✓' : '✗'}`);

    if (!result.name || !result.image || !result.case_cost || !result.case_size) {
      const missing = [];
      if (!result.name) missing.push('name');
      if (!result.image) missing.push('image');
      if (!result.case_cost) missing.push('case_cost');
      if (!result.case_size) missing.push('case_size');

      console.error(`[Costco Scraper] Missing required fields: ${missing.join(', ')}`);

      // Save screenshot for debugging if available
      if (screenshot) {
        try {
          const fs = await import('fs/promises');
          const path = await import('path');

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const sku = result.vendor_sku || 'unknown';
          const filename = `costco-fail-${timestamp}-${sku}.png`;
          const filepath = path.join(process.cwd(), 'public', 'debug', 'screenshots', filename);

          await fs.writeFile(filepath, Buffer.from(screenshot, 'base64'));

          const viewUrl = `/debug/screenshots/${filename}`;
          console.log(`[Costco Scraper] 📸 Screenshot saved: ${filepath}`);
          console.log(`[Costco Scraper] 📸 View at: http://localhost:3000${viewUrl}`);
        } catch (screenshotError) {
          console.error(`[Costco Scraper] Failed to save screenshot:`, screenshotError);
        }
      }

      throw new Error(`Could not extract all required fields. Missing: ${missing.join(', ')}`);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Costco Scraper] ✓ Scraping completed successfully in ${totalDuration}ms`);
    console.log(`[Costco Scraper] Result: ${result.name} - $${result.case_cost} (${result.case_size} pack)`);

    return result as ScrapedProductInfo;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[Costco Scraper] ✗ Scraping failed after ${totalDuration}ms`);

    if (error instanceof Error) {
      console.error(`[Costco Scraper] Error: ${error.message}`);
      // Provide more helpful error messages
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        throw new Error('Failed to connect to Costco. The website may be blocking automated requests. Please try again later or add the product manually.');
      }
      throw new Error(`Failed to scrape Costco product: ${error.message}`);
    }
    console.error(`[Costco Scraper] Unknown error type:`, error);
    throw new Error('Failed to scrape Costco product: Unknown error');
  }
}
