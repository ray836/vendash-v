import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infrastructure/database';
import { routeStops, locations, vendingMachines, preKits } from '@/infrastructure/database/schema';
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
 * POST /api/stops/[stopId]/complete
 * Marks a route stop as complete
 * Driver has finished all work at this location
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

    console.log(`[Stop API] Completing stop: ${stopId}`);

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

    // Check if already complete - still return full object
    if (stopData.isComplete) {
      // Fetch full location data
      const locationData = await db
        .select()
        .from(locations)
        .where(eq(locations.id, stopData.locationId))
        .limit(1);

      if (locationData.length === 0) {
        throw new Error('Location not found for stop');
      }

      const location = locationData[0];

      // Fetch all machines at this location
      const machinesData = await db
        .select()
        .from(vendingMachines)
        .where(eq(vendingMachines.locationId, stopData.locationId));

      // Fetch pre-kit status for each machine
      const machinesWithPreKitStatus = await Promise.all(
        machinesData.map(async (machine) => {
          const preKitData = await db
            .select()
            .from(preKits)
            .where(eq(preKits.machineId, machine.id))
            .limit(1);

          const preKitStatus = preKitData.length > 0 ? preKitData[0].status : 'OPEN';

          return {
            id: machine.id,
            model: machine.model,
            type: machine.type,
            preKitStatus: preKitStatus,
          };
        })
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Stop is already complete',
          stop: {
            id: stopData.id,
            order: stopData.order,
            location: {
              id: location.id,
              name: location.name,
              address: location.address,
            },
            machines: machinesWithPreKitStatus,
            specialInstructions: stopData.notes,
            isComplete: true,
            estimatedTime: stopData.estimatedTime,
          },
        },
        { headers: corsHeaders }
      );
    }

    // Update stop to mark as complete
    await db
      .update(routeStops)
      .set({
        isComplete: true,
      })
      .where(eq(routeStops.id, stopId));

    console.log(`[Stop API] ✓ Stop ${stopId} marked as complete`);

    // Fetch full location data
    const locationData = await db
      .select()
      .from(locations)
      .where(eq(locations.id, stopData.locationId))
      .limit(1);

    if (locationData.length === 0) {
      throw new Error('Location not found for stop');
    }

    const location = locationData[0];

    // Fetch all machines at this location
    const machinesData = await db
      .select()
      .from(vendingMachines)
      .where(eq(vendingMachines.locationId, stopData.locationId));

    // Fetch pre-kit status for each machine
    const machinesWithPreKitStatus = await Promise.all(
      machinesData.map(async (machine) => {
        const preKitData = await db
          .select()
          .from(preKits)
          .where(eq(preKits.machineId, machine.id))
          .limit(1);

        const preKitStatus = preKitData.length > 0 ? preKitData[0].status : 'OPEN';

        return {
          id: machine.id,
          model: machine.model,
          type: machine.type,
          preKitStatus: preKitStatus,
        };
      })
    );

    // Return full RouteStop object
    return NextResponse.json(
      {
        success: true,
        message: 'Stop completed successfully',
        stop: {
          id: stopData.id,
          order: stopData.order,
          location: {
            id: location.id,
            name: location.name,
            address: location.address,
          },
          machines: machinesWithPreKitStatus,
          specialInstructions: stopData.notes,
          isComplete: true,
          estimatedTime: stopData.estimatedTime,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Stop API] Error completing stop:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete stop',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
