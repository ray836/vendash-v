import * as cheerio from 'cheerio';
import { BrowserServiceFactory } from './browser/BrowserServiceFactory';

/**
 * Product information extracted from Sam's Club
 */
export interface ScrapedProductInfo {
  name: string;
  image: string;
  case_cost: string;
  case_size: string;
  price_per_each?: string;
  vendor_sku?: string; // Item number from receipt (e.g., "990000730")
  barcode?: string; // GTIN-13 barcode (e.g., "038000263446")
  url_identifier?: string; // URL identifier (e.g., "13626865899")
}

/**
 * Scrapes product information from a Sam's Club product URL
 * Uses browser service (Puppeteer or Browserbase) to bypass bot detection
 * @param url - The Sam's Club product URL
 * @returns Product information including name, image, case_cost, case_size, and optionally price_per_each
 */
export async function scrapeSamsClubProduct(url: string): Promise<ScrapedProductInfo> {
  const startTime = Date.now();
  console.log(`[Sam's Club Scraper] Starting scrape for: ${url}`);

  try {
    // Use browser service to fetch page (bypasses bot detection)
    console.log(`[Sam's Club Scraper] Fetching page with browser service...`);
    const browserService = BrowserServiceFactory.getBrowserService();

    const fetchResult = await browserService.fetchPage(url, {
      timeout: 45000,
      waitUntil: 'networkidle2',
      screenshot: true, // Enable screenshot for debugging failed scrapes
    });

    const { html, screenshot, metadata } = fetchResult;

    console.log(`[Sam's Club Scraper] Page fetched, size: ${html.length} bytes`);
    const $ = cheerio.load(html);

    // Initialize result object
    const result: Partial<ScrapedProductInfo> = {
      name: '',
      image: '',
      case_cost: '',
      case_size: '',
      vendor_sku: '',
      barcode: '',
      url_identifier: ''
    };

    // Extract URL identifier from URL
    // Sam's Club URLs have pattern: https://www.samsclub.com/p/product-name/URL_ID
    // or /ip/product-name/URL_ID
    const urlMatch = url.match(/\/(?:p|ip)\/[^\/]+\/(\d+)/);
    if (urlMatch) {
      result.url_identifier = urlMatch[1];
    }

    // Method 1: Try to extract from window.__INITIAL_STATE__
    const scriptTags = $('script');
    scriptTags.each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('window.__INITIAL_STATE__')) {
        try {
          // Extract the JSON from the script tag
          const match = scriptContent.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});?\s*$/s);
          if (match && match[1]) {
            const initialState = JSON.parse(match[1]);

            // Navigate through the state object to find product data
            if (initialState?.product?.productDetails) {
              const product = initialState.product.productDetails;

              result.name = result.name || product.productName || product.name || '';
              result.image = result.image || product.primaryImage || product.imageUrl || '';

              // Extract price
              if (product.priceInfo?.memberPrice) {
                result.case_cost = result.case_cost || product.priceInfo.memberPrice.toString();
              } else if (product.price) {
                result.case_cost = result.case_cost || product.price.toString();
              }

              // Extract case size
              if (product.unitOfMeasure) {
                result.case_size = result.case_size || product.unitOfMeasure;
              } else if (product.quantity) {
                result.case_size = result.case_size || product.quantity.toString();
              }
            }
          }
        } catch (e) {
          // Continue to next method if parsing fails
        }
      }
    });

    // Method 2: Try to extract from JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');

        if (jsonData['@type'] === 'Product') {
          result.name = result.name || jsonData.name || '';
          result.image = result.image || jsonData.image || '';

          // Extract barcode (GTIN-13, GTIN-12, UPC, EAN)
          result.barcode = result.barcode ||
                          jsonData.gtin13 ||
                          jsonData.gtin12 ||
                          jsonData.gtin ||
                          jsonData.upc ||
                          jsonData.ean || '';

          if (jsonData.offers) {
            result.case_cost = result.case_cost || jsonData.offers.price?.toString() || '';
          }
        }
      } catch (e) {
        // Continue if parsing fails
      }
    });

    // Method 3: Try to extract from meta tags
    if (!result.name) {
      result.name = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('h1').first().text().trim() || '';
    }

    if (!result.image) {
      result.image = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') || '';
    }

    // Method 4: Try to extract from HTML elements with common class names
    if (!result.name) {
      result.name = $('.product-name, .product-title, [data-automation-id="product-title"]').first().text().trim();
    }

    if (!result.image) {
      const mainImage = $('.product-image img, [data-automation-id="product-image"] img, .primary-image img').first();
      result.image = mainImage.attr('src') || mainImage.attr('data-src') || '';
    }

    if (!result.case_cost) {
      // Try multiple strategies to find the main product price

      // Strategy 1: Look for "Now $X.XX" pattern (sale price)
      const bodyText = $('body').text();
      const nowPriceMatch = bodyText.match(/Now\s+\$(\d+\.\d{2})/i);
      if (nowPriceMatch) {
        result.case_cost = nowPriceMatch[1];
      }

      // Strategy 2: Look for spans with specific price patterns, excluding strikethrough
      if (!result.case_cost) {
        $('span').each((_, element) => {
          if (!result.case_cost) {
            const $el = $(element);
            const text = $el.text().trim();

            // Skip if this span or its parent has strikethrough styling
            const hasStrikethrough = $el.css('text-decoration')?.includes('line-through') ||
                                    $el.parent().css('text-decoration')?.includes('line-through') ||
                                    $el.closest('[style*="line-through"]').length > 0;

            if (!hasStrikethrough) {
              // Match patterns like "$13.48" that are standalone or at the start
              const priceMatch = text.match(/^\$?(\d+\.\d{2})$/);
              if (priceMatch) {
                // Verify this is likely a product price (reasonable range)
                const price = parseFloat(priceMatch[1]);
                if (price > 0 && price < 10000) {
                  result.case_cost = priceMatch[1];
                }
              }
            }
          }
        });
      }

      // Strategy 3: Look for specific price class selectors
      if (!result.case_cost) {
        const priceElement = $('.price, .product-price, [data-automation-id="price"]').first().text().trim();
        const priceMatch = priceElement.match(/\$?(\d+\.\d{2})/);
        if (priceMatch) {
          result.case_cost = priceMatch[1];
        }
      }

      // Strategy 4: Search for price near the product title
      if (!result.case_cost && result.name) {
        // Get text content around the product name area
        const mainSection = $('main, article, [role="main"]').first().text();
        // Look for price that appears early in the main content
        const priceMatch = mainSection.match(/\$(\d+\.\d{2})/);
        if (priceMatch) {
          result.case_cost = priceMatch[1];
        }
      }
    }

    if (!result.case_size) {
      // Strategy 1: Extract from product name/title first (most reliable)
      // Look for patterns like "50 pk", "36 ct", etc. in the product name
      if (result.name) {
        const nameMatch = result.name.match(/(\d+)\s*(pk|ct|count|pack)/i);
        if (nameMatch) {
          result.case_size = nameMatch[1];
        }
      }

      // Strategy 2: Fall back to searching entire page
      if (!result.case_size) {
        const bodyText = $('body').text();
        const sizeMatch = bodyText.match(/(\d+)\s*(ct|count|pack|pk)/i);
        if (sizeMatch) {
          result.case_size = sizeMatch[1];
        }
      }
    }

    // Method 5: Extract Item Number (Multiple strategies with fallback)
    // Strategies in order of preference:
    // 1. From metadata (extracted by Puppeteer from live DOM)
    // 2. From raw HTML string search
    // 3. From Cheerio body text
    // 4. Fallback to URL identifier
    if (!result.vendor_sku) {
      let extractionMethod = '';

      // Strategy 1: Check metadata from Puppeteer
      if (metadata?.itemNumber) {
        result.vendor_sku = metadata.itemNumber;
        extractionMethod = 'Puppeteer DOM';
      }

      // Strategy 2: Search raw HTML
      if (!result.vendor_sku) {
        const rawHtmlMatch = html.match(/Item\s*#\s*:?\s*(\d{8,12})/i);
        if (rawHtmlMatch) {
          result.vendor_sku = rawHtmlMatch[1];
          extractionMethod = 'Raw HTML';
        }
      }

      // Strategy 3: Search Cheerio body text (legacy method)
      if (!result.vendor_sku) {
        const bodyText = $('body').text();
        const bodyTextMatch = bodyText.match(/Item\s*#\s*:?\s*(\d{8,12})/i);
        if (bodyTextMatch) {
          result.vendor_sku = bodyTextMatch[1];
          extractionMethod = 'Cheerio body text';
        }
      }

      // Strategy 4: Fallback to URL identifier
      if (!result.vendor_sku && result.url_identifier) {
        result.vendor_sku = result.url_identifier;
        extractionMethod = 'URL ID fallback';
      }

      if (result.vendor_sku && extractionMethod) {
        console.log(`[Sam's Club Scraper] Item number extracted via: ${extractionMethod}`);
      }
    }

    // Extract unit price (price per each) - optional field
    // Look for patterns like "$0.37/ea" or "$0.37 /ea"
    const bodyText = $('body').text();
    const unitPriceMatch = bodyText.match(/\$?(\d+\.\d{2})\s*\/\s*ea/i);
    if (unitPriceMatch) {
      result.price_per_each = unitPriceMatch[1];
    }

    // Log what we extracted
    console.log(`[Sam's Club Scraper] Extraction results:`);
    console.log(`  - Name: ${result.name ? '✓' : '✗'} "${result.name}"`);
    console.log(`  - Image: ${result.image ? '✓' : '✗'} "${result.image?.substring(0, 50)}..."`);
    console.log(`  - Case Cost: ${result.case_cost ? '✓' : '✗'} "$${result.case_cost}"`);
    console.log(`  - Case Size: ${result.case_size ? '✓' : '✗'} "${result.case_size}"`);
    console.log(`  - Item Number: ${result.vendor_sku ? '✓' : '✗'} "${result.vendor_sku}"`);
    console.log(`  - Barcode: ${result.barcode ? '✓' : '✗'} "${result.barcode}"`);
    console.log(`  - URL ID: ${result.url_identifier ? '✓' : '✗'} "${result.url_identifier}"`);

    // Validate that we have all required fields
    if (!result.name || !result.image || !result.case_cost || !result.case_size) {
      const missing = [];
      if (!result.name) missing.push('name');
      if (!result.image) missing.push('image');
      if (!result.case_cost) missing.push('case_cost');
      if (!result.case_size) missing.push('case_size');

      console.error(`[Sam's Club Scraper] ✗ Missing required fields: ${missing.join(', ')}`);

      // Save screenshot for debugging if available
      if (screenshot) {
        try {
          const fs = await import('fs/promises');
          const path = await import('path');

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const sku = result.vendor_sku || 'unknown';
          const filename = `samsclub-fail-${timestamp}-${sku}.png`;
          const filepath = path.join(process.cwd(), 'public', 'debug', 'screenshots', filename);

          await fs.writeFile(filepath, Buffer.from(screenshot, 'base64'));

          const viewUrl = `/debug/screenshots/${filename}`;
          console.log(`[Sam's Club Scraper] 📸 Screenshot saved: ${filepath}`);
          console.log(`[Sam's Club Scraper] 📸 View at: http://localhost:3000${viewUrl}`);
        } catch (screenshotError) {
          console.error(`[Sam's Club Scraper] Failed to save screenshot:`, screenshotError);
        }
      }

      // Save first 5000 chars of HTML for debugging
      console.log(`[Sam's Club Scraper] HTML sample (first 5000 chars):`);
      console.log(html.substring(0, 5000));

      // Check for common patterns
      console.log(`[Sam's Club Scraper] Checking for common patterns...`);
      console.log(`  - Contains "__INITIAL_STATE__": ${html.includes('__INITIAL_STATE__')}`);
      console.log(`  - Contains "application/ld+json": ${html.includes('application/ld+json')}`);
      console.log(`  - Contains "og:title": ${html.includes('og:title')}`);
      console.log(`  - Title tag: ${$('title').text()}`);

      throw new Error(`Could not extract all required fields. Missing: ${missing.join(', ')}`);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Sam's Club Scraper] ✓ Scraping completed successfully in ${totalDuration}ms`);

    return result as ScrapedProductInfo;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to scrape Sam's Club product: ${error.message}`);
    }
    throw new Error('Failed to scrape Sam\'s Club product: Unknown error');
  }
}
