import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communicationsTable = pgTable("communications", {
  id: serial("id").primaryKey(),
  customerId: real("customer_id").notNull(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  direction: text("direction").notNull().default("internal"),
  staffName: text("staff_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunicationSchema = createInsertSchema(communicationsTable).omit({ id: true, createdAt: true });
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communicationsTable.$inferSelect;
