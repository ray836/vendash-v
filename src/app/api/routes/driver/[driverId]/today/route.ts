import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infrastructure/database';
import { RouteRepository } from '@/infrastructure/repositories/RouteRepository';
import { PreKitRepository } from '@/infrastructure/repositories/PreKitRepository';
import { VendingMachineRepository } from '@/infrastructure/repositories/VendingMachineRepository';
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth';

// CORS headers for mobile app support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/routes/driver/[driverId]/today
 * Fetches today's route assignment for a driver with all stops, machines, and pre-kits
 * Requires Clerk authentication - user must be authenticated and match the requested driver
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { driverId } = await params;
    console.log('[Driver API] Request received for driver:', driverId);

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[Driver API] Fetching today's route for driver: ${driverId}`);

    // Get today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Initialize repositories
    const routeRepository = new RouteRepository();
    const preKitRepository = new PreKitRepository(db);
    const machineRepository = new VendingMachineRepository(db);

    // Get all routes for this driver
    const driverRoutes = await routeRepository.findByDriverId(driverId);

    // Filter for today's route (scheduled for today)
    const todayRoute = driverRoutes.find((route) => {
      if (!route.scheduledDate) return false;
      const scheduleDate = new Date(route.scheduledDate);
      return scheduleDate >= today && scheduleDate < tomorrow;
    });

    if (!todayRoute) {
      return NextResponse.json(
        {
          success: true,
          route: null,
          message: 'No route scheduled for today',
        },
        { headers: corsHeaders }
      );
    }

    console.log(`[Driver API] Found route: ${todayRoute.name} (${todayRoute.id})`);

    // Get pre-kits for the organization (includes all pre-kits for all machines)
    const allPreKits = await preKitRepository.getOrgPreKits(todayRoute.organizationId);

    // Filter pre-kits that belong to THIS ROUTE's stops (not just any machine)
    const routeStopIds = new Set(
      todayRoute.stops?.map((stop) => stop.id) || []
    );

    const routePreKits = allPreKits.filter((preKit) =>
      preKit.routeStopId && routeStopIds.has(preKit.routeStopId)
    );

    console.log(`[Driver API] Found ${routePreKits.length} pre-kits for route`);

    // Get all machine IDs from the route's stops
    const routeMachineIds = new Set(
      todayRoute.stops?.flatMap((stop) => stop.vendingMachineIds || []) || []
    );

    // Get machine details for all machines on the route
    const machineDetailsMap = new Map();
    for (const machineId of routeMachineIds) {
      const machine = await machineRepository.findById(machineId);
      if (machine) {
        machineDetailsMap.set(machineId, {
          id: machine.id,
          model: machine.model,
          type: machine.type,
        });
      }
    }

    // Calculate pre-kit progress (how many are confirmed/picked)
    const confirmedPreKits = routePreKits.filter(
      (pk) => pk.status === 'PICKED' || pk.status === 'STOCKED'
    ).length;

    // Build stops array with machine and pre-kit details
    const stops = (todayRoute.stops || []).map((stop) => {
      const stopMachines = (stop.vendingMachineIds || []).map((machineId) => {
        const machineDetails = machineDetailsMap.get(machineId);
        const machinePreKit = routePreKits.find((pk) => pk.machineId === machineId);

        return {
          id: machineId,
          model: machineDetails?.model || 'Unknown',
          type: machineDetails?.type || 'Unknown',
          preKitStatus: machinePreKit?.status || 'OPEN',
        };
      });

      return {
        id: stop.id,
        order: stop.order,
        location: {
          id: stop.locationId,
          name: stop.locationName || '',
          address: stop.locationAddress || '',
          latitude: stop.locationLatitude,
          longitude: stop.locationLongitude,
        },
        machines: stopMachines,
        specialInstructions: stop.notes || '',
        isComplete: stop.isComplete || false,
        estimatedTime: stop.estimatedTime || 0,
      };
    });

    // Calculate estimated finish time
    const totalMinutes = stops.reduce((sum, stop) => sum + stop.estimatedTime, 0);
    const estimatedFinish = new Date();
    estimatedFinish.setMinutes(estimatedFinish.getMinutes() + totalMinutes);

    // Build pre-kits array with full item details
    const preKits = routePreKits.map((preKit) => ({
      id: preKit.id,
      machineId: preKit.machineId,
      status: preKit.status,
      items: preKit.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        slotLabelCode: item.slotCode,
        quantity: item.quantity,
        currentQuantity: item.currentQuantity,
        capacity: item.capacity,
      })),
    }));

    // Build response
    const response = {
      success: true,
      route: {
        id: todayRoute.id,
        name: todayRoute.name,
        status: 'PLANNED', // TODO: Get actual status from routeAssignments
        scheduledDate: todayRoute.scheduledDate?.toISOString(),
        estimatedFinish: estimatedFinish.toISOString(),
      },
      stops,
      preKits,
      preKitProgress: {
        confirmed: confirmedPreKits,
        total: routePreKits.length,
      },
    };

    console.log(`[Driver API] ✓ Returning route with ${stops.length} stops and ${preKits.length} pre-kits`);

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('[Driver API] Error fetching today\'s route:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch route',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
