import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pricingSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreatePricing() {
  const [existing] = await db.select().from(pricingSettingsTable).limit(1);
  if (existing) return existing;
  // Seed default row if none exists
  const [created] = await db.insert(pricingSettingsTable).values({}).returning();
  return created;
}

// GET /pricing — public endpoint used by the booking calculator
router.get("/pricing", async (_req, res): Promise<void> => {
  const pricing = await getOrCreatePricing();
  res.json(pricing);
});

// PUT /pricing — CRM admin updates pricing
router.put("/pricing", async (req, res): Promise<void> => {
  const pricing = await getOrCreatePricing();
  const updates: Partial<typeof pricingSettingsTable.$inferInsert> = {};

  const numericFields = [
    "priceStandard", "priceDeep", "priceMoveInOut", "pricePostConstruction", "priceRecurring",
    "ratePerBedroom", "ratePerBathroom", "rateSqftOver500",
    "extraOven", "extraFridge", "extraWindows", "extraLaundry", "extraBlinds", "extraGarage", "extraCarpetSteam", "extraUpholstery",
    "discountWeeklyPercent", "discountBiweeklyPercent", "discountMonthlyPercent",
    "taxRatePercent",
  ] as const;

  for (const field of numericFields) {
    if (req.body[field] !== undefined) {
      const val = parseFloat(String(req.body[field]));
      if (!isNaN(val) && val >= 0) {
        (updates as Record<string, number>)[field] = val;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields provided" });
    return;
  }

  const [updated] = await db.update(pricingSettingsTable).set(updates).where(eq(pricingSettingsTable.id, pricing.id)).returning();
  res.json(updated);
});

export default router;
