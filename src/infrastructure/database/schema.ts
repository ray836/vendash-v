import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const vendingMachines = pgTable("vending_machines", {
  id: text("id").primaryKey(),
  type: varchar("type", { length: 256 }).notNull(),
  locationId: text("location_id").notNull(),
  model: varchar("model", { length: 256 }).notNull(),
  notes: text("notes"),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// TODO: check if this schema will work
export const inventory = pgTable("inventory", {
  productId: text("product_id")
    .references(() => products.id)
    .primaryKey()
    .notNull(),
  storage: integer("storage").notNull(),
  machines: integer("machines").notNull(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  transactionType: text("transaction_type").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  last4CardDigits: text("last_4_card_digits").notNull(),
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
