import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  serviceType: text("service_type").notNull().default("residential"),
  propertyType: text("property_type"),
  bedrooms: real("bedrooms"),
  bathrooms: real("bathrooms"),
  squareFootage: real("square_footage"),
  cleaningType: text("cleaning_type"),
  frequency: text("frequency"),
  preferredDate: text("preferred_date"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  referralSource: text("referral_source"),
  estimatedValue: real("estimated_value"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
