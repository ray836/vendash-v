import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infrastructure/database';
import { PreKitRepository } from '@/infrastructure/repositories/PreKitRepository';
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
 * POST /api/prekits/[preKitId]/confirm
 * Marks a pre-kit as "PICKED" (warehouse preparation complete)
 * Driver has confirmed all items are loaded into the bin
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

    console.log(`[PreKit API] Confirming pre-kit: ${preKitId}`);

    const preKitRepository = new PreKitRepository(db);

    // Verify pre-kit exists
    const preKit = await preKitRepository.findById(preKitId);
    if (!preKit) {
      return NextResponse.json(
        { success: false, error: 'PreKit not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check current status
    if (preKit.status === 'PICKED') {
      return NextResponse.json(
        {
          success: true,
          message: 'PreKit already confirmed',
          preKit: {
            id: preKit.id,
            machineId: preKit.machineId,
            status: preKit.status,
          },
        },
        { headers: corsHeaders }
      );
    }

    if (preKit.status === 'STOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: 'PreKit is already stocked in machine. Cannot change status.',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update status to PICKED
    // TODO: Get userId from authentication - for now using createdBy
    const userId = preKit.createdBy;
    await preKitRepository.updateStatus(preKitId, 'PICKED', userId);

    console.log(`[PreKit API] ✓ PreKit ${preKitId} marked as PICKED`);

    return NextResponse.json(
      {
        success: true,
        message: 'PreKit confirmed successfully',
        preKit: {
          id: preKit.id,
          machineId: preKit.machineId,
          status: 'PICKED',
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[PreKit API] Error confirming pre-kit:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm pre-kit',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
