import { pgTable, serial, text, real, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  customerId: real("customer_id").notNull(),
  jobId: real("job_id"),
  status: text("status").notNull().default("draft"),
  lineItems: jsonb("line_items").notNull().default([]),
  subtotal: real("subtotal").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(10),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull().default(0),
  paidAmount: real("paid_amount").notNull().default(0),
  paymentMethod: text("payment_method"),
  paymentDate: date("payment_date", { mode: "string" }),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
