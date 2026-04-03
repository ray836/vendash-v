# Driver Mobile App API Documentation

This document describes the API endpoints for the vending machine driver mobile app.

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: TBD

## Authentication
Currently, no authentication is implemented. The endpoints use the `driverId` parameter to identify the driver.

**TODO**: Implement JWT authentication and use authenticated user context.

---

## Endpoints

### 1. Get Today's Route

**GET** `/api/routes/driver/{driverId}/today`

Fetches today's route assignment for the driver with all stops, machines, and pre-kits.

#### Parameters
- `driverId` (path) - The driver's user ID

#### Response
```json
{
  "success": true,
  "route": {
    "id": "route-uuid",
    "name": "Downtown Route",
    "status": "PLANNED",
    "scheduledDate": "2025-10-28T00:00:00.000Z",
    "estimatedFinish": "2025-10-28T14:30:00.000Z"
  },
  "stops": [
    {
      "id": "stop-uuid",
      "order": 1,
      "location": {
        "id": "location-uuid",
        "name": "TechHub HQ",
        "address": "123 Innovation Drive, Suite 400"
      },
      "machines": [
        {
          "id": "machine-uuid",
          "model": "Dixie Narco 501E",
          "type": "SNACK",
          "preKitStatus": "DRAFT"
        }
      ],
      "specialInstructions": "Use side entrance",
      "isComplete": false,
      "estimatedTime": 30
    }
  ],
  "preKits": [
    {
      "id": "prekit-uuid",
      "machineId": "machine-uuid",
      "status": "DRAFT",
      "items": [
        {
          "id": "item-uuid",
          "productId": "product-uuid",
          "productName": "Lay's Classic Chips",
          "productImage": "https://...",
          "slotLabelCode": "A1",
          "quantity": 5,
          "currentQuantity": 2,
          "capacity": 10
        }
      ]
    }
  ],
  "preKitProgress": {
    "confirmed": 0,
    "total": 10
  }
}
```

#### Status Codes
- `200` - Success
- `400` - Missing driver ID
- `500` - Server error

---

### 2. Confirm Pre-Kit

**POST** `/api/prekits/{preKitId}/confirm`

Marks a pre-kit as "PICKED" (warehouse preparation complete). Driver has confirmed all items are loaded into the bin.

#### Parameters
- `preKitId` (path) - The pre-kit ID

#### Response
```json
{
  "success": true,
  "message": "PreKit confirmed successfully",
  "preKit": {
    "id": "prekit-uuid",
    "machineId": "machine-uuid",
    "status": "PICKED"
  }
}
```

#### Status Codes
- `200` - Success
- `400` - Invalid request (already stocked, missing ID)
- `404` - PreKit not found
- `500` - Server error

#### Status Flow
- `DRAFT` → `PICKED` ✅
- `PICKED` → `PICKED` (idempotent)
- `STOCKED` → Error (cannot un-stock)

---

### 3. Stock Pre-Kit

**POST** `/api/prekits/{preKitId}/stock`

Marks a pre-kit as "STOCKED" (loaded into vending machine at location). Updates slot quantities to reflect the stocked items.

#### Parameters
- `preKitId` (path) - The pre-kit ID

#### Response
```json
{
  "success": true,
  "message": "PreKit stocked successfully",
  "preKit": {
    "id": "prekit-uuid",
    "machineId": "machine-uuid",
    "status": "STOCKED"
  },
  "itemsUpdated": 4
}
```

#### Status Codes
- `200` - Success
- `400` - Invalid request (not yet confirmed, missing ID)
- `404` - PreKit not found
- `500` - Server error

#### Status Flow
- `DRAFT` → Error (must confirm first)
- `PICKED` → `STOCKED` ✅
- `STOCKED` → `STOCKED` (idempotent)

#### Side Effects
- Updates slot `currentQuantity` for each item
- Caps quantities at slot capacity
- Creates inventory transaction records (future enhancement)

---

### 4. Start Stop

**POST** `/api/stops/{stopId}/start`

Marks a route stop as started. Driver has arrived at the location and is beginning work.

#### Parameters
- `stopId` (path) - The route stop ID

#### Response
```json
{
  "success": true,
  "message": "Stop started successfully",
  "stop": {
    "id": "stop-uuid",
    "locationId": "location-uuid",
    "order": 1,
    "isComplete": false
  }
}
```

#### Status Codes
- `200` - Success
- `400` - Missing stop ID
- `404` - Stop not found
- `500` - Server error

#### Notes
- Currently this is a simple status check
- **Future Enhancement**: Add `startedAt` timestamp to schema
- **Future Enhancement**: Update route assignment status to 'in_progress'

---

### 5. Complete Stop

**POST** `/api/stops/{stopId}/complete`

Marks a route stop as complete. Driver has finished all work at this location.

#### Parameters
- `stopId` (path) - The route stop ID

#### Response
```json
{
  "success": true,
  "message": "Stop completed successfully",
  "stop": {
    "id": "stop-uuid",
    "locationId": "location-uuid",
    "order": 1,
    "isComplete": true
  }
}
```

#### Status Codes
- `200` - Success
- `400` - Missing stop ID
- `404` - Stop not found
- `500` - Server error

#### Side Effects
- Sets `isComplete` = true on the route stop
- **Future Enhancement**: Record completion timestamp
- **Future Enhancement**: Check if all stops complete → mark route complete

---

## Workflow

### Typical Driver Day Flow

1. **Morning**: Driver arrives at warehouse
   ```
   GET /api/routes/driver/{driverId}/today
   → Receives route with 10 pre-kits to prepare
   ```

2. **Pre-Kit Preparation**: Driver loads products into bins
   ```
   POST /api/prekits/{preKitId1}/confirm
   POST /api/prekits/{preKitId2}/confirm
   ...
   POST /api/prekits/{preKitId10}/confirm
   → All 10 pre-kits marked as PICKED
   ```

3. **Route Starts**: Driver leaves warehouse and navigates to first stop
   ```
   POST /api/stops/{stopId1}/start
   ```

4. **At Location**: Driver stocks machines
   ```
   POST /api/prekits/{preKitId1}/stock  (for machine 1)
   POST /api/prekits/{preKitId2}/stock  (for machine 2)
   ```

5. **Finish Stop**: All machines stocked
   ```
   POST /api/stops/{stopId1}/complete
   ```

6. **Repeat**: Continue for each stop in the route

7. **End of Day**: All stops complete, driver returns to warehouse

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Stack trace or additional details (dev mode only)"
}
```

---

## CORS

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

Preflight `OPTIONS` requests are supported on all endpoints.

---

## Testing

### Using curl

```bash
# Get today's route
curl http://localhost:3000/api/routes/driver/user-123/today

# Confirm pre-kit
curl -X POST http://localhost:3000/api/prekits/prekit-123/confirm

# Stock pre-kit
curl -X POST http://localhost:3000/api/prekits/prekit-123/stock

# Start stop
curl -X POST http://localhost:3000/api/stops/stop-123/start

# Complete stop
curl -X POST http://localhost:3000/api/stops/stop-123/complete
```

### Using Postman

Import the collection:
- Base URL: `http://localhost:3000`
- Create requests for each endpoint above
- No authentication required (yet)

---

## Future Enhancements

1. **Authentication**: JWT tokens, driver login
2. **Real-time Updates**: WebSocket support for live route updates
3. **Photos**: Upload machine photos before/after stocking
4. **Cash Collection**: Record cash collected from machines
5. **Problem Reporting**: Report machine issues/maintenance needs
6. **Offline Support**: Queue API calls when offline, sync when online
7. **Analytics**: Track time spent at each stop, efficiency metrics
8. **Push Notifications**: Route changes, urgent updates
