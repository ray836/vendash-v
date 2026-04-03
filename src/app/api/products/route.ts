import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { Product } from '@/domains/Product/entities/Product';
import { db } from '@/infrastructure/database';
import { randomUUID } from 'node:crypto';
import * as ProductService from '@/domains/Product/ProductService';
import { generateProductAliases } from '@/lib/generateProductAliases';
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth';

// CORS headers for Chrome extension and mobile app support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const productRepo = new ProductRepository(db)
    const products = await ProductService.getOrgProducts(productRepo, user.organizationId)
    return NextResponse.json({ success: true, data: products }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json();
    const {
      name,
      image,
      caseCost,
      caseSize,
      vendorSku,
      barcode,
      urlIdentifier,
      pricePerEach,
      vendorLink,
      category,
      recommendedPriceMultiplier,
    } = body;
    const organizationId = user.organizationId;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Product image is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!caseCost || caseCost <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid case cost is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!caseSize || caseSize <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid case size is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!vendorSku) {
      return NextResponse.json(
        { success: false, error: 'Vendor SKU is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate recommended price (case_cost / case_size * multiplier)
    const multiplier = recommendedPriceMultiplier || 1.5;
    const recommendedPrice = (caseCost / caseSize) * multiplier;

    const repository = new ProductRepository(db);

    // Check if product already exists (by vendorSku + organizationId)
    const existingProduct = await repository.findByVendorSku(vendorSku, organizationId);

    let product: Product;
    let action: 'created' | 'updated';

    if (existingProduct) {
      // Update existing product
      console.log(`[Products API] Updating existing product: ${vendorSku} for org ${organizationId}`);

      product = new Product({
        id: existingProduct.id,
        name,
        image,
        caseCost,
        caseSize,
        vendorSku,
        barcode: barcode || existingProduct.barcode,
        urlIdentifier: urlIdentifier || existingProduct.urlIdentifier,
        vendorLink: vendorLink || existingProduct.vendorLink,
        category: category || existingProduct.category,
        recommendedPrice: Math.round(recommendedPrice * 100) / 100,
        shippingAvailable: existingProduct.shippingAvailable,
        shippingTimeInDays: existingProduct.shippingTimeInDays,
        aliases: existingProduct.aliases ?? [], // preserve existing aliases on update
        organizationId: existingProduct.organizationId,
        createdAt: existingProduct.props.createdAt,
        updatedAt: new Date(),
      });

      await repository.update(product);
      action = 'updated';
    } else {
      // Create new product
      console.log(`[Products API] Creating new product: ${vendorSku} for org ${organizationId}`);

      const aliases = await generateProductAliases(name);

      product = new Product({
        id: randomUUID(),
        name,
        recommendedPrice: Math.round(recommendedPrice * 100) / 100,
        category: category || 'Snacks',
        image,
        vendorLink: vendorLink || '',
        vendorSku,
        barcode: barcode || null,
        urlIdentifier: urlIdentifier || null,
        caseCost,
        caseSize,
        shippingAvailable: true,
        shippingTimeInDays: 5,
        aliases,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.create(product);
      action = 'created';
    }

    console.log(`[Products API] Product ${action} successfully: ${product.name} (${product.id})`);

    return NextResponse.json({
      success: true,
      action,
      product: {
        id: product.id,
        name: product.name,
        vendorSku: product.vendorSku,
        barcode: product.barcode,
        urlIdentifier: product.urlIdentifier,
        caseCost: product.caseCost,
        caseSize: product.caseSize,
        recommendedPrice: product.recommendedPrice,
        image: product.image,
        category: product.category,
        pricePerEach: pricePerEach || null,
      },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Products API] Error processing product:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process product',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
