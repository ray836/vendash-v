import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infrastructure/database';
import { PreKitRepository } from '@/infrastructure/repositories/PreKitRepository';
import { SlotRepository } from '@/infrastructure/repositories/SlotRepository';
import * as schema from '@/infrastructure/database/schema';
import { nanoid } from 'nanoid';
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth';

// CORS headers for mobile app support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/prekits/[preKitId]/stock
 * Marks a pre-kit as "STOCKED" (loaded into vending machine at location)
 * Updates slot quantities to reflect the stocked items
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { preKitId: string } }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { preKitId } = params;

    if (!preKitId) {
      return NextResponse.json(
        { success: false, error: 'PreKit ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse request body for optional cash and notes
    let cashCollected: string | undefined;
    let notes: string | undefined;

    try {
      const body = await request.json();
      cashCollected = body.cashCollected;
      notes = body.notes;
    } catch (error) {
      // Body is optional, ignore parse errors
    }

    console.log(`[PreKit API] Stocking pre-kit into machine: ${preKitId}`);

    const preKitRepository = new PreKitRepository(db);
    const slotRepository = new SlotRepository(db);

    // Verify pre-kit exists
    const preKit = await preKitRepository.findById(preKitId);
    if (!preKit) {
      return NextResponse.json(
        { success: false, error: 'PreKit not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check current status
    if (preKit.status === 'STOCKED') {
      return NextResponse.json(
        {
          success: true,
          message: 'PreKit already stocked',
          preKit: {
            id: preKit.id,
            machineId: preKit.machineId,
            status: preKit.status,
          },
        },
        { headers: corsHeaders }
      );
    }

    if (preKit.status === 'OPEN') {
      return NextResponse.json(
        {
          success: false,
          error: 'PreKit must be confirmed (PICKED) before stocking',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get pre-kit items
    const preKitItems = await preKitRepository.getItems(preKitId);

    console.log(`[PreKit API] Updating ${preKitItems.length} slots with stocked items`);

    // Update slot quantities for each item
    // TODO: Get userId from authentication - for now using createdBy
    const userId = preKit.createdBy;

    for (const item of preKitItems) {
      try {
        // Get current slot
        const slot = await slotRepository.findById(item.slotId);
        if (!slot) {
          console.warn(`[PreKit API] Slot ${item.slotId} not found, skipping`);
          continue;
        }

        // Add the pre-kit quantity to current quantity
        const newQuantity = slot.currentQuantity + item.quantity;

        // Cap at capacity
        const finalQuantity = Math.min(newQuantity, slot.capacity);

        // Update slot
        await slotRepository.updateSlotQuantity(item.slotId, finalQuantity);

        console.log(
          `[PreKit API] Updated slot ${slot.labelCode}: ${slot.currentQuantity} → ${finalQuantity} (added ${item.quantity})`
        );
      } catch (error) {
        console.error(`[PreKit API] Error updating slot ${item.slotId}:`, error);
        // Continue with other slots even if one fails
      }
    }

    // Update pre-kit status to STOCKED
    await preKitRepository.updateStatus(preKitId, 'STOCKED', userId);

    console.log(`[PreKit API] ✓ PreKit ${preKitId} marked as STOCKED`);

    // Create stocking record with optional cash and notes
    let stockingRecordId: string | undefined;
    if (cashCollected || notes) {
      stockingRecordId = nanoid();
      await db.insert(schema.stockingRecords).values({
        id: stockingRecordId,
        preKitId: preKitId,
        cashCollected: cashCollected,
        notes: notes,
        createdBy: userId,
      });
      console.log(`[PreKit API] ✓ Created stocking record ${stockingRecordId}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'PreKit stocked successfully',
        preKit: {
          id: preKit.id,
          machineId: preKit.machineId,
          status: 'STOCKED',
        },
        itemsUpdated: preKitItems.length,
        stockingRecordId,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[PreKit API] Error stocking pre-kit:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stock pre-kit',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
