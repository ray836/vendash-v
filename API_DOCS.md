# VenDrop API Documentation

This document describes the API endpoints used by the VenDrop Chrome Extension to integrate with the vending management system.

## Authentication

Currently, authentication is handled via `organizationId` passed in the request body. Future versions may implement token-based authentication.

## Endpoints

### POST /api/scrape-product

Scrapes and imports a product from supported retailer websites (Sam's Club, Costco).

**Endpoint:** `POST http://localhost:3000/api/scrape-product`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://www.samsclub.com/p/product-name/12345678",
  "organizationId": "your-org-id",
  "category": "Snacks",
  "recommendedPriceMultiplier": 1.5
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Full product URL from Sam's Club or Costco |
| `organizationId` | string | Yes | Your organization's unique identifier |
| `category` | string | No | Product category (default: "Snacks") |
| `recommendedPriceMultiplier` | number | No | Markup multiplier for recommended price (default: 1.5 = 50% markup) |

**Success Response (200):**
```json
{
  "success": true,
  "product": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Lay's Classic Potato Chips",
    "vendorSku": "990000730",
    "barcode": "038000263446",
    "urlIdentifier": "13626865899",
    "caseCost": 24.98,
    "caseSize": 50,
    "recommendedPrice": 1.87,
    "image": "https://scene7.samsclub.com/...",
    "pricePerEach": "0.37"
  }
}
```

**Error Response (400/500):**
```json
{
  "error": "Only Sam's Club and Costco URLs are supported. Please use Manual Entry for other retailers.",
  "details": "Error stack trace (in development)"
}
```

**Common Error Messages:**

- `"URL is required"` - No URL provided in request
- `"Organization ID is required"` - No organizationId provided
- `"Only Sam's Club and Costco URLs are supported"` - Invalid retailer URL
- `"Failed to scrape product: ..."` - Scraping failed (network issue, page structure changed, etc.)

## Supported Retailers

### Sam's Club
- **Domain:** `samsclub.com`
- **URL Format:** `https://www.samsclub.com/p/product-name/URL_IDENTIFIER`
  - Example: `https://www.samsclub.com/p/lays-potato-chips/13626865899`

### Costco
- **Domain:** `costco.com`
- **URL Format:** `https://www.costco.com/product-name.product.PRODUCT_ID.html`
  - Example: `https://www.costco.com/kirkland-signature-mixed-nuts.product.100334910.html`

## Data Extracted

The scraper extracts the following information:

| Field | Description | Sam's Club | Costco |
|-------|-------------|------------|--------|
| `name` | Product name | ✓ | ✓ |
| `image` | Product image URL | ✓ | ✓ |
| `case_cost` | Total case/pack price | ✓ | ✓ |
| `case_size` | Number of items per case | ✓ | ✓ |
| `vendor_sku` | Retailer's item/SKU number | ✓ | ✓ |
| `barcode` | GTIN-13 barcode | ✓ | ✓ |
| `price_per_each` | Unit price (optional) | ✓ | ✓ |

## CORS Configuration

For local development with the Chrome extension, ensure CORS is enabled in your Next.js API route.

**Add to your route handler:**
```typescript
// Add CORS headers for Chrome extension
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers });
}
```

## Rate Limiting

Currently, there are no rate limits enforced. For production use, consider implementing:
- Rate limiting per organization
- Request throttling
- API key authentication

## Development Notes

### Local Development
1. Start your Next.js app: `npm run dev` (runs on http://localhost:3000)
2. Load the Chrome extension in development mode
3. Configure the extension with your organizationId
4. Navigate to a supported product page
5. Click the extension icon and "Add to Catalog"

### Testing the API Directly

```bash
curl -X POST http://localhost:3000/api/scrape-product \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.samsclub.com/p/lays-potato-chips/13626865899",
    "organizationId": "test-org-123",
    "category": "Snacks",
    "recommendedPriceMultiplier": 1.5
  }'
```

## Future Enhancements

- [ ] Token-based authentication
- [ ] Webhook notifications on successful import
- [ ] Batch import endpoint
- [ ] Product preview endpoint (without saving)
- [ ] Support for additional retailers
- [ ] Custom scraping rules per organization
- [ ] API rate limiting and quotas

## Support

For issues or questions:
- Check the scraper logs in your Next.js console
- Review the Chrome extension console for client-side errors
- Ensure both the extension and API are on the latest version
