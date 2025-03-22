export interface ProductInventory {
  id: string
  name: string
  image: string
  category: string
  price: number
  inventory: {
    total: number
    storage: number
    machines: number
  }
  sales: {
    daily: number
    weekly: number
    trend: "up" | "down" | "stable"
    velocity: "high" | "medium" | "low"
    velocityRank: number
  }
  reorderPoint: number
  reorderStatus: "ok" | "warning" | "critical"
  daysUntilStockout: number
}

export const mockProductInventory: ProductInventory[] = [
  {
    id: "1",
    name: "Coca-Cola",
    image:
      "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop",
    category: "drink",
    price: 2.5,
    inventory: {
      total: 240,
      storage: 180,
      machines: 60,
    },
    sales: {
      daily: 24,
      weekly: 168,
      trend: "up",
      velocity: "high",
      velocityRank: 3,
    },
    reorderPoint: 100,
    reorderStatus: "ok",
    daysUntilStockout: 10,
  },
  {
    id: "2",
    name: "Doritos",
    image:
      "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=300&h=300&fit=crop",
    category: "snack",
    price: 1.99,
    inventory: {
      total: 85,
      storage: 45,
      machines: 40,
    },
    sales: {
      daily: 15,
      weekly: 105,
      trend: "stable",
      velocity: "medium",
      velocityRank: 8,
    },
    reorderPoint: 75,
    reorderStatus: "warning",
    daysUntilStockout: 5,
  },
  {
    id: "3",
    name: "M&Ms",
    image:
      "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=300&h=300&fit=crop",
    category: "candy",
    price: 1.5,
    inventory: {
      total: 25,
      storage: 5,
      machines: 20,
    },
    sales: {
      daily: 12,
      weekly: 84,
      trend: "up",
      velocity: "high",
      velocityRank: 4,
    },
    reorderPoint: 50,
    reorderStatus: "critical",
    daysUntilStockout: 2,
  },
  {
    id: "4",
    name: "Aquafina",
    image:
      "https://images.unsplash.com/photo-1616118132534-731551be37d3?w=300&h=300&fit=crop",
    category: "drink",
    price: 1.75,
    inventory: {
      total: 180,
      storage: 120,
      machines: 60,
    },
    sales: {
      daily: 16,
      weekly: 112,
      trend: "down",
      velocity: "medium",
      velocityRank: 12,
    },
    reorderPoint: 90,
    reorderStatus: "ok",
    daysUntilStockout: 11,
  },
  {
    id: "5",
    name: "Snickers",
    image:
      "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=300&fit=crop",
    category: "candy",
    price: 1.25,
    inventory: {
      total: 45,
      storage: 15,
      machines: 30,
    },
    sales: {
      daily: 20,
      weekly: 140,
      trend: "up",
      velocity: "high",
      velocityRank: 2,
    },
    reorderPoint: 60,
    reorderStatus: "warning",
    daysUntilStockout: 2,
  },
]
