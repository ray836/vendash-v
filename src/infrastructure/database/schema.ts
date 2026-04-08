import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  primaryKey,
  jsonb,
  real,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const vendingMachines = pgTable("vending_machines", {
  id: text("id").primaryKey(),
  type: varchar("type", { length: 256 }).notNull(),
  locationId: text("location_id").notNull(),
  model: varchar("model", { length: 256 }).notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 256 }).notNull().default("OFFLINE"),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  cardReaderId: text("card_reader_id"),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by")
    .references(() => users.id)
    .notNull(),
})

export const slots = pgTable("slots", {
  id: text("id").primaryKey(),
  machineId: text("machine_id")
    .references(() => vendingMachines.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .default("1")
    .notNull(),
  labelCode: text("label_code").notNull(),
  rowKey: text("row_key"),
  colIndex: integer("col_index"),
  ccReaderCode: text("cc_reader_code").default(""),
  cardReaderId: text("card_reader_id").default(""),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").default(10),
  currentQuantity: integer("current_quantity").default(0),
  sequenceNumber: integer("sequence_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
})

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  apiKey: text("api_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const integrationLogs = pgTable("integration_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  source: text("source").notNull(), // e.g. 'cantaloupe'
  status: text("status").notNull(), // 'success' | 'error'
  message: text("message"), // error detail if failed
  cardReaderId: text("card_reader_id"), // populated for real device transactions
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const invitations = pgTable("invitations", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull(),
  clerkInvitationId: text("clerk_invitation_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role").notNull(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  recommendedPrice: decimal("recommended_price", {
    precision: 10,
    scale: 2,
  }).notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  vendorLink: text("vendor_link").notNull(),
  vendorSku: text("vendor_sku"), // Sam's Club item number from receipt (e.g., "990000730")
  barcode: text("barcode"), // Product GTIN-13 barcode (e.g., "038000263446")
  urlIdentifier: text("url_identifier"), // URL identifier (e.g., "13626865899")
  caseCost: decimal("case_cost", { precision: 10, scale: 2 }).notNull(),
  caseSize: text("case_size").notNull(),
  shippingAvailable: boolean("shipping_available").notNull(),
  shippingTimeInDays: integer("shipping_time_in_days").notNull(),
  reorderPoint: integer("reorder_point"),
  aliases: text("aliases").array(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const inventory = pgTable(
  "inventory",
  {
    productId: text("product_id")
      .references(() => products.id)
      .notNull(),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    storage: integer("storage").notNull(),
    machines: integer("machines").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.organizationId, table.productId] }),
  })
)

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  transactionType: text("transaction_type").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  last4CardDigits: text("last_4_card_digits").notNull(),
  cardReaderId: text("card_reader_id").notNull(),
  data: jsonb("data").notNull().default({}),
})

export const transactionItems = pgTable("transaction_items", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .references(() => transactions.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  slotCode: text("slot_code").notNull().default(""),
})

// Tracks which transaction_items have been consumed during the iOS slot-linking flow.
// Lambda writes to transactions/transaction_items; this table is written by the consume endpoint.
export const linkingConsumedTransactions = pgTable("linking_consumed_transactions", {
  id: text("id").primaryKey(),
  transactionItemId: text("transaction_item_id").notNull(),
  cardReaderId: text("card_reader_id").notNull(),
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
})

// Define the relations
export const transactionsRelations = relations(transactions, ({ many }) => ({
  transactionItems: many(transactionItems),
}))

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
  })
)

export const locations = pgTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const routes = pgTable("routes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("PLANNED"),
  // Statuses: 'PLANNED', 'PICKING', 'IN_PROGRESS', 'COMPLETED'
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  assignedToUserId: text("assigned_to_user_id")
    .references(() => users.id),
  scheduledDate: timestamp("scheduled_date"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  recurringPattern: text("recurring_pattern"), // 'daily', 'weekly', 'custom', null
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by")
    .references(() => users.id),
})

export const routeStops = pgTable("route_stops", {
  id: text("id").primaryKey(),
  routeId: text("route_id")
    .references(() => routes.id)
    .notNull(),
  locationId: text("location_id")
    .references(() => locations.id)
    .notNull(),
  order: integer("order").notNull(),
  notes: text("notes").default(""),
  estimatedTime: integer("estimated_time"), // in minutes
  isComplete: boolean("is_complete").notNull().default(false),
  vendingMachineIds: text("vending_machine_ids").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const routeAssignments = pgTable("route_assignments", {
  id: text("id").primaryKey(),
  routeId: text("route_id")
    .references(() => routes.id)
    .notNull(),
  assignedToUserId: text("assigned_to_user_id")
    .references(() => users.id)
    .notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("scheduled"),
  // statuses: 'scheduled', 'in_progress', 'completed', 'cancelled'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
})

export const restockRecords = pgTable("restock_records", {
  id: text("id").primaryKey(),
  routeId: text("route_id")
    .references(() => routes.id)
    .notNull(),
  locationId: text("location_id")
    .references(() => locations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull(),
  stockedBy: text("stocked_by")
    .references(() => users.id)
    .notNull(),
})

export const RestockMachineData = pgTable("restock_machine_data", {
  id: text("id").primaryKey(),
  machineId: text("machine_id")
    .references(() => vendingMachines.id)
    .notNull(),
  cashAmount: integer("cash_amount").notNull(),
  pictures: text("pictures").array().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  restockRecordId: text("restock_record_id")
    .references(() => restockRecords.id)
    .notNull(),
})

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  status: text("status").notNull(), // 'draft', 'placed', etc.
  scheduledOrderDate: timestamp("scheduled_order_date"),
  orderPlacedDate: timestamp("order_placed_date"),
  taxPaid: decimal("tax_paid", { precision: 10, scale: 2 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  placedBy: text("placed_by")
    .references(() => users.id)
    .notNull(),
  updatedBy: text("updated_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  updatedBy: text("updated_by")
    .references(() => users.id)
    .notNull(),
})

// Purchase orders track inventory purchases from vendors (different from sales orders)
export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  receiptImageUrl: text("receipt_image_url"), // URL to uploaded receipt image
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("recorded"), // 'recorded', 'processed', 'cancelled'
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: text("id").primaryKey(),
  purchaseOrderId: text("purchase_order_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id), // Can be null if product not found in catalog
  vendorSku: text("vendor_sku").notNull(), // Item number from receipt
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  productName: text("product_name"), // Store name even if not matched to product
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const preKits = pgTable("pre_kits", {
  id: text("id").primaryKey(),
  machineId: text("machine_id")
    .references(() => vendingMachines.id)
    .notNull(),
  routeStopId: text("route_stop_id")
    .references(() => routeStops.id),
  scheduledDate: timestamp("scheduled_date"),
  status: text("status").notNull().default("OPEN"),
  // Statuses: 'OPEN', 'PICKED', 'STOCKED'
  lastRecalculatedAt: timestamp("last_recalculated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  updatedBy: text("updated_by").references(() => users.id),
})

export const preKitItems = pgTable("pre_kit_items", {
  id: text("id").primaryKey(),
  preKitId: text("pre_kit_id")
    .references(() => preKits.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  slotId: text("slot_id")
    .references(() => slots.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  updatedBy: text("updated_by")
    .references(() => users.id)
    .notNull(),
})

export const stockingRecords = pgTable("stocking_records", {
  id: text("id").primaryKey(),
  preKitId: text("pre_kit_id")
    .references(() => preKits.id)
    .notNull(),
  cashCollected: decimal("cash_collected", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
})

// Add relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
  placedByUser: one(users, {
    fields: [orders.placedBy],
    references: [users.id],
    relationName: "placedByUser",
  }),
  updatedByUser: one(users, {
    fields: [orders.updatedBy],
    references: [users.id],
    relationName: "updatedByUser",
  }),
  orderItems: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchaseOrders.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  purchaseOrderItems: many(purchaseOrderItems),
}))

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}))

export const organizationsRelations = relations(organizations, ({ many }) => ({
  orders: many(orders),
}))

export const usersRelations = relations(users, ({ many }) => ({
  placedOrders: many(orders, {
    relationName: "placedByUser",
  }),
  updatedOrders: many(orders, {
    relationName: "updatedByUser",
  }),
}))

export const preKitsRelations = relations(preKits, ({ one, many }) => ({
  vendingMachine: one(vendingMachines, {
    fields: [preKits.machineId],
    references: [vendingMachines.id],
  }),
  routeStop: one(routeStops, {
    fields: [preKits.routeStopId],
    references: [routeStops.id],
  }),
  createdByUser: one(users, {
    fields: [preKits.createdBy],
    references: [users.id],
    relationName: "preKitCreatedBy",
  }),
  updatedByUser: one(users, {
    fields: [preKits.updatedBy],
    references: [users.id],
    relationName: "preKitUpdatedBy",
  }),
  preKitItems: many(preKitItems),
}))

export const preKitItemsRelations = relations(preKitItems, ({ one }) => ({
  preKit: one(preKits, {
    fields: [preKitItems.preKitId],
    references: [preKits.id],
  }),
  product: one(products, {
    fields: [preKitItems.productId],
    references: [products.id],
  }),
  slot: one(slots, {
    fields: [preKitItems.slotId],
    references: [slots.id],
  }),
  createdByUser: one(users, {
    fields: [preKitItems.createdBy],
    references: [users.id],
    relationName: "preKitItemCreatedBy",
  }),
  updatedByUser: one(users, {
    fields: [preKitItems.updatedBy],
    references: [users.id],
    relationName: "preKitItemUpdatedBy",
  }),
}))

// Inventory tracking tables
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  transactionType: varchar("transaction_type", { length: 30 }).notNull(),
  // Types: 'order_received', 'stocked_to_machine', 'sale',
  //        'adjustment', 'transfer', 'expired', 'damaged', 'return'
  quantity: integer("quantity").notNull(), // positive or negative based on type
  locationFrom: text("location_from"), // e.g., 'storage', 'machine_123', 'supplier'
  locationTo: text("location_to"), // e.g., 'storage', 'machine_123', 'customer'
  referenceType: varchar("reference_type", { length: 30 }), // 'order', 'pre_kit', 'sale_transaction', 'adjustment'
  referenceId: text("reference_id"), // FK to related record
  notes: text("notes"),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}), // for additional context
})

export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  adjustmentType: varchar("adjustment_type", { length: 30 }).notNull(),
  // Types: 'count_correction', 'damage', 'expiry', 'theft', 'other'
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  reason: text("reason").notNull(),
  approvedBy: text("approved_by").references(() => users.id),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  inventoryTransactionId: text("inventory_transaction_id")
    .references(() => inventoryTransactions.id)
    .notNull(),
})

// Relations for inventory tracking
export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [inventoryTransactions.productId],
      references: [products.id],
    }),
    organization: one(organizations, {
      fields: [inventoryTransactions.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [inventoryTransactions.createdBy],
      references: [users.id],
    }),
    adjustments: many(inventoryAdjustments),
  })
)

export const inventoryAdjustmentsRelations = relations(
  inventoryAdjustments,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryAdjustments.productId],
      references: [products.id],
    }),
    organization: one(organizations, {
      fields: [inventoryAdjustments.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [inventoryAdjustments.createdBy],
      references: [users.id],
    }),
    approvedByUser: one(users, {
      fields: [inventoryAdjustments.approvedBy],
      references: [users.id],
    }),
    inventoryTransaction: one(inventoryTransactions, {
      fields: [inventoryAdjustments.inventoryTransactionId],
      references: [inventoryTransactions.id],
    }),
  })
)

// Route-related relations
export const routesRelations = relations(routes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [routes.organizationId],
    references: [organizations.id],
  }),
  assignedToUser: one(users, {
    fields: [routes.assignedToUserId],
    references: [users.id],
    relationName: "routeAssignedTo",
  }),
  createdByUser: one(users, {
    fields: [routes.createdBy],
    references: [users.id],
    relationName: "routeCreatedBy",
  }),
  updatedByUser: one(users, {
    fields: [routes.updatedBy],
    references: [users.id],
    relationName: "routeUpdatedBy",
  }),
  routeStops: many(routeStops),
  routeAssignments: many(routeAssignments),
}))

export const routeStopsRelations = relations(routeStops, ({ one, many }) => ({
  route: one(routes, {
    fields: [routeStops.routeId],
    references: [routes.id],
  }),
  location: one(locations, {
    fields: [routeStops.locationId],
    references: [locations.id],
  }),
  preKits: many(preKits),
}))

export const routeAssignmentsRelations = relations(routeAssignments, ({ one }) => ({
  route: one(routes, {
    fields: [routeAssignments.routeId],
    references: [routes.id],
  }),
  assignedToUser: one(users, {
    fields: [routeAssignments.assignedToUserId],
    references: [users.id],
    relationName: "assignmentUser",
  }),
  createdByUser: one(users, {
    fields: [routeAssignments.createdBy],
    references: [users.id],
    relationName: "assignmentCreatedBy",
  }),
}))
