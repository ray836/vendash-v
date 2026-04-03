# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Lint code
```

### Database
```bash
npm run db:generate # Generate Drizzle migrations
npm run db:push     # Push schema changes to database
npm run db:drop     # Drop all tables (destructive!)
npm run studio      # Open Drizzle Studio
```

## Architecture

This is a Next.js vending machine management application using:
- **Next.js 15** with App Router
- **Drizzle ORM** with PostgreSQL (Neon)
- **TypeScript** with strict type checking
- **Tailwind CSS** + **shadcn/ui** components
- **Clean Architecture** with Domain-Driven Design

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   └── scrape-product/ # Sam's Club product scraper endpoint
│   └── web/               # Web application pages
│       └── products/      # Product management
├── domains/               # Domain entities and business logic
│   └── Product/          # Product domain
│       ├── entities/     # Product entity classes
│       ├── repositories/ # Repository interfaces
│       ├── schemas/      # Zod validation schemas
│       └── use-cases/    # Business logic use cases
├── infrastructure/        # External implementations
│   ├── database/         # Database connection and schema
│   │   └── schema.ts    # Drizzle ORM schema definitions
│   └── repositories/     # Repository implementations
│       └── DrizzleProductRepository.ts
├── lib/                   # Shared utilities
│   └── scrapers/         # Web scrapers
│       ├── samsclub-scraper.ts  # Sam's Club product scraper
│       └── costco-scraper.ts    # Costco product scraper
└── components/           # Reusable UI components
    └── ui/              # shadcn/ui components
```

### Key Features

#### Product Scraper (Browser-Based)

**Status**: ✅ **Automated scraping is ENABLED** using real browser instances to bypass bot detection.

The application uses **Puppeteer with custom stealth techniques** (or optionally Browserbase) to scrape Sam's Club and Costco product pages using real Chrome browser instances that bypass bot detection systems.

**Locations**:
- `src/lib/scrapers/samsclub-scraper.ts` - Sam's Club scraper
- `src/lib/scrapers/costco-scraper.ts` - Costco scraper
- `src/lib/scrapers/browser/` - Browser service abstraction layer
  - `IBrowserService.ts` - Browser service interface
  - `PuppeteerBrowserService.ts` - Puppeteer implementation (default)
  - `BrowserbaseService.ts` - Browserbase cloud implementation (optional)
  - `BrowserServiceFactory.ts` - Factory for choosing implementation
  - `BrowserPool.ts` - Browser instance pool manager

**How It Works**:
1. User pastes Sam's Club or Costco product URL
2. System uses BrowserServiceFactory to get configured browser service
3. Browser service launches real Chrome instance with stealth configuration
4. Page is loaded like a real user (with human-like delays and scrolling)
5. HTML is extracted and parsed using existing Cheerio logic
6. Product data is saved to database

**Configuration** (`.env`):
```env
# Browser service type: 'puppeteer' (default) or 'browserbase'
BROWSER_SERVICE=puppeteer

# Browser pool size (Puppeteer only)
MAX_BROWSER_INSTANCES=3

# Browserbase credentials (only if using BROWSER_SERVICE=browserbase)
BROWSERBASE_API_KEY=your_key
BROWSERBASE_PROJECT_ID=your_project_id
```

**Switching to Browserbase**:
To switch to Browserbase cloud service (higher success rate, costs ~$0.05/scrape):
1. Sign up at https://browserbase.com
2. Get API key and project ID
3. Add to `.env`: `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID`
4. Change: `BROWSER_SERVICE=browserbase`
5. Restart server - no code changes needed!

**Performance**:
- Speed: 11-15 seconds per scrape (vs <1s with simple fetch, but fetch gets blocked)
- Success Rate:
  - Sam's Club: ~90-95% (vanilla Puppeteer works well)
  - Costco: ~40-60% (stricter bot protection, may need Browserbase)
- Memory: ~200-300MB per browser instance
- Fallback: Manual entry still available if scraping fails

**Note on Costco**: Costco has more aggressive bot detection and may return HTTP/2 protocol errors even with Puppeteer stealth techniques. For better Costco success rates, consider using Browserbase (see "Switching to Browserbase" below).

**Stealth Techniques Used**:
- Vanilla Puppeteer (removed puppeteer-extra due to compatibility issues)
- `--disable-blink-features=AutomationControlled` flag to hide webdriver
- Override `navigator.webdriver` property via `evaluateOnNewDocument`
- Realistic User-Agent strings
- Human-like behavior: random delays (500-1500ms), scrolling simulation
- Resource blocking (images/fonts) for faster page loads
- Browser instance pooling to reuse browsers across requests

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use 'mcp_playwright_browser_navigate' to visit each changed view
3. **Validate feature implementation** - Ensure the change fulfills the user's specific request
4. **Check acceptance criteria** - Review any provided context files or requirements
5. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
6. **Check for errors** - Run 'mcp_playwright_browser_console_messages'

### Database Schema

**Products Table**:
- `id`: UUID primary key
- `name`: Product name
- `recommendedPrice`: Suggested selling price (decimal)
- `category`: Product category (cookies, chips, drink, candy, snack)
- `image`: Image URL
- `vendorLink`: Retailer URL (Sam's Club or Costco)
- `vendorSku`: Item number from retailer (e.g., "81771902116") - **NEW** - Used for receipt matching
- `caseCost`: Cost per case (decimal)
- `caseSize`: Number of items in case (text)
- `shippingAvailable`: Boolean
- `shippingTimeInDays`: Integer
- `organizationId`: Foreign key to organizations
- `createdAt`, `updatedAt`: Timestamps

**Purchase Orders Tables** (for receipt tracking):
- `purchase_orders`: Tracks inventory purchases from vendors
  - `id`, `organizationId`, `receiptImageUrl`, `totalAmount`, `status`, `notes`, `uploadedAt`, `createdBy`
- `purchase_order_items`: Individual items from receipts
  - `id`, `purchaseOrderId`, `productId` (nullable), `vendorSku`, `quantity`, `unitPrice`, `totalPrice`, `productName`

### Important Patterns

1. **Server Actions**: Located in `actions.ts` files alongside pages
2. **Type Safety**: All database queries use Drizzle ORM with TypeScript
3. **Form Validation**: Zod schemas in `schemas/` directories
4. **Repository Pattern**: All database access goes through repository interfaces
5. **Organization Context**: Most operations are scoped to `organizationId: '1'` (TODO: auth)

#### Receipt Upload & Purchase Order Tracking

**NEW FEATURE**: Upload receipts to automatically track inventory purchases.

**Location**: Orders page → "Record Purchase Order" button

**How it works**:
1. User uploads Sam's Club receipt image (JPG, PNG, PDF)
2. **Tesseract.js OCR** extracts text from receipt
3. Parser detects items using pattern: `ITEM_NUMBER    PRODUCT_NAME    PRICE`
4. System matches item numbers to products in catalog via `vendorSku` field
5. Shows review table with matched/unmatched items
6. Creates purchase order record with all items

**OCR Pattern Matching** (Sam's Club receipts):
- Format: `0990323993    BLT MXD PUF    19.94 Y`
- Extracts: Item number (10 digits), product name, price
- Matches by comparing receipt item number to `products.vendorSku`

**Files**:
- `src/app/web/orders/upload-receipt-dialog.tsx` - Receipt upload UI
- `src/app/web/orders/purchase-order-actions.ts` - Server actions
- `src/lib/scrapers/samsclub-scraper.ts` - Extracts item number from URL
- `src/infrastructure/database/schema.ts` - Purchase order tables

**Dependencies**:
- `tesseract.js` - Client-side OCR processing

### Development Notes

- Organization ID is currently hardcoded to `org-demo-001` - needs proper authentication
- **Automated scraping is ENABLED** - uses Puppeteer with stealth techniques to bypass bot detection
- Price calculation uses 1.5x markup by default (configurable in API)
- Cheerio is used for HTML parsing after Puppeteer fetches the page
- Receipt OCR runs client-side with Tesseract.js
- Purchase orders support partial matching (items not in catalog are still recorded)
- Browser pooling reuses browser instances for better performance
