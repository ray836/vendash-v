export interface Route {
  id: string
  name: string
  description: string | null
  isActive: boolean
  organizationId: string
  assignedToUserId: string | null
  assignedToUser?: { id: string; firstName: string; lastName: string; email: string }
  scheduledDate: Date | null
  estimatedDuration: number | null // in minutes
  recurringPattern: string | null // 'daily', 'weekly', 'custom', null
  stops?: RouteStop[]
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string | null
}

export interface RouteStop {
  id: string
  routeId: string
  locationId: string
  locationName?: string
  locationAddress?: string
  locationLatitude?: number | null
  locationLongitude?: number | null
  order: number
  notes: string | null
  estimatedTime: number | null // in minutes
  isComplete: boolean
  vendingMachineIds: string[] | null
  createdAt: Date
  location?: { // Optional, populated when needed
    id: string
    name: string
    address: string
  }
}

export interface RouteAssignment {
  id: string
  routeId: string
  assignedToUserId: string
  scheduledDate: Date
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  startedAt: Date | null
  completedAt: Date | null
  estimatedDuration: number | null // in minutes
  actualDuration: number | null // in minutes
  notes: string | null
  createdAt: Date
  createdBy: string
}

export interface CreateRouteInput {
  name: string
  description?: string
  isActive?: boolean
  assignedToUserId?: string
  scheduledDate?: Date
  estimatedDuration?: number
  recurringPattern?: string
  stops: CreateRouteStopInput[]
}

export interface CreateRouteStopInput {
  locationId: string
  order: number
  notes?: string
  estimatedTime?: number
  vendingMachineIds?: string[]
}

export interface UpdateRouteInput {
  name?: string
  description?: string | null
  isActive?: boolean
  assignedToUserId?: string | null
  scheduledDate?: Date | null
  estimatedDuration?: number | null
  recurringPattern?: string | null
}

export interface AssignRouteInput {
  routeId: string
  userId: string
  scheduledDate: Date
  estimatedDuration?: number
  notes?: string
}