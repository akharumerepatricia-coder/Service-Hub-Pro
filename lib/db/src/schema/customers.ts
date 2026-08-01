import { pgTable, serial, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  gpsLat: real("gps_lat"),
  gpsLng: real("gps_lng"),
  serviceType: text("service_type").notNull().default("residential"),
  propertyType: text("property_type"),
  bedrooms: real("bedrooms"),
  bathrooms: real("bathrooms"),
  squareFootage: real("square_footage"),
  entryInstructions: text("entry_instructions"),
  alarmCode: text("alarm_code"),
  gateCode: text("gate_code"),
  pets: text("pets"),
  preferredProducts: text("preferred_products"),
  cleaningPreferences: text("cleaning_preferences"),
  specialInstructions: text("special_instructions"),
  recurringSchedule: text("recurring_schedule"),
  status: text("status").notNull().default("active"),
  referralSource: text("referral_source"),
  lifetimeValue: real("lifetime_value").notNull().default(0),
  isRecurring: boolean("is_recurring").notNull().default(false),
  satisfactionScore: real("satisfaction_score"),
  reviewScore: real("review_score"),
  notes: text("notes"),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
