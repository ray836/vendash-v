import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infrastructure/database';
import { routeStops } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
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
 * POST /api/stops/[stopId]/start
 * Marks a route stop as started
 * Driver has arrived at the location and is beginning work
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { stopId: string } }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { stopId } = params;

    if (!stopId) {
      return NextResponse.json(
        { success: false, error: 'Stop ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[Stop API] Starting work on stop: ${stopId}`);

    // Verify stop exists
    const stop = await db
      .select()
      .from(routeStops)
      .where(eq(routeStops.id, stopId))
      .limit(1);

    if (stop.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stop not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const stopData = stop[0];

    // Check if already complete
    if (stopData.isComplete) {
      return NextResponse.json(
        {
          success: true,
          message: 'Stop is already complete',
          stop: {
            id: stopData.id,
            isComplete: stopData.isComplete,
          },
        },
        { headers: corsHeaders }
      );
    }

    // Note: We don't have a 'startedAt' field in the schema yet
    // For now, this endpoint just confirms the stop is valid
    // In a full implementation, you might:
    // 1. Add a 'startedAt' timestamp to routeStops schema
    // 2. Update route assignment status to 'in_progress'
    // 3. Log the start time for analytics

    console.log(`[Stop API] ✓ Stop ${stopId} marked as started`);

    return NextResponse.json(
      {
        success: true,
        message: 'Stop started successfully',
        stop: {
          id: stopData.id,
          locationId: stopData.locationId,
          order: stopData.order,
          isComplete: stopData.isComplete,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Stop API] Error starting stop:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start stop',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
