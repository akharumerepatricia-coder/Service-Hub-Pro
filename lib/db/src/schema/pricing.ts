import { pgTable, serial, real, timestamp, text, jsonb } from "drizzle-orm/pg-core";

export const pricingSettingsTable = pgTable("pricing_settings", {
  id: serial("id").primaryKey(),
  // Base prices per clean type
  priceStandard: real("price_standard").notNull().default(120),
  priceDeep: real("price_deep").notNull().default(220),
  priceMoveInOut: real("price_move_in_out").notNull().default(350),
  pricePostConstruction: real("price_post_construction").notNull().default(450),
  priceRecurring: real("price_recurring").notNull().default(100),
  // Per-unit add-ons
  ratePerBedroom: real("rate_per_bedroom").notNull().default(25),
  ratePerBathroom: real("rate_per_bathroom").notNull().default(20),
  rateSqftOver500: real("rate_sqft_over_500").notNull().default(0.08),
  // Extras
  extraOven: real("extra_oven").notNull().default(40),
  extraFridge: real("extra_fridge").notNull().default(35),
  extraWindows: real("extra_windows").notNull().default(60),
  extraLaundry: real("extra_laundry").notNull().default(30),
  extraBlinds: real("extra_blinds").notNull().default(45),
  extraGarage: real("extra_garage").notNull().default(80),
  extraCarpetSteam: real("extra_carpet_steam").notNull().default(120),
  extraUpholstery: real("extra_upholstery").notNull().default(90),
  // Recurring discounts
  discountWeeklyPercent: real("discount_weekly_percent").notNull().default(20),
  discountBiweeklyPercent: real("discount_biweekly_percent").notNull().default(15),
  discountMonthlyPercent: real("discount_monthly_percent").notNull().default(10),
  // Tax
  taxRatePercent: real("tax_rate_percent").notNull().default(10),
  // Meta
  currency: text("currency").notNull().default("AUD"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PricingSettings = typeof pricingSettingsTable.$inferSelect;
