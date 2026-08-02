import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobApplicationsTable = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  yearsExperience: integer("years_experience").notNull().default(0),
  cleaningTypes: text("cleaning_types").array().notNull().default([]),
  availability: text("availability").array().notNull().default([]),
  hasOwnSupplies: boolean("has_own_supplies").notNull().default(false),
  hasVehicle: boolean("has_vehicle").notNull().default(false),
  message: text("message"),
  status: text("status").notNull().default("review"), // recommended | review | not_suitable | hired | rejected
  autoScore: integer("auto_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplicationsTable.$inferSelect;
