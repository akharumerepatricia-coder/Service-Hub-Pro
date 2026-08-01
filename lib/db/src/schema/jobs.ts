import { pgTable, serial, text, real, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  customerId: real("customer_id").notNull(),
  serviceType: text("service_type").notNull().default("residential"),
  cleaningType: text("cleaning_type").notNull(),
  status: text("status").notNull().default("scheduled"),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  durationHours: real("duration_hours"),
  price: real("price").notNull(),
  assignedEmployeeIds: real("assigned_employee_ids").array(),
  notes: text("notes"),
  completionNotes: text("completion_notes"),
  customerRating: real("customer_rating"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrencePattern: text("recurrence_pattern"),
  invoiceId: real("invoice_id"),
  quoteId: real("quote_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
