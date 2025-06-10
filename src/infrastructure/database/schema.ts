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
    .references(() => products.id)
    .notNull(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .default("1")
    .notNull(),
  labelCode: text("label_code").notNull(),
  ccReaderCode: text("cc_reader_code").default(""),
  cardReaderId: text("card_reader_id").default(""),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").default(10),
  currentQuantity: integer("current_quantity").default(0),
  sequenceNumber: integer("sequence_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  updatedBy: text("updated_by")
    .references(() => users.id)
    .notNull(),
})

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
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
  caseCost: decimal("case_cost", { precision: 10, scale: 2 }).notNull(),
  caseSize: text("case_size").notNull(),
  shippingAvailable: boolean("shipping_available").notNull(),
  shippingTimeInDays: integer("shipping_time_in_days").notNull(),
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
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  slotCode: text("slot_code").notNull().default(""),
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
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const routes = pgTable("routes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
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
  isComplete: boolean("is_complete").notNull().default(false),
  vendingMachineIds: text("vending_machine_ids").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  status: varchar("status", { length: 20 }).notNull(), // 'draft', 'placed', etc.
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

export const preKits = pgTable("pre_kits", {
  id: text("id").primaryKey(),
  machineId: text("machine_id")
    .references(() => vendingMachines.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull().default("OPEN"),
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
