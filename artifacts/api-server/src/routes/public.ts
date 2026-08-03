import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leadsTable, pricingSettingsTable } from "@workspace/db";
import {
  SubmitInquiryBody,
  CalculateQuotePublicBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getPricing() {
  const [row] = await db.select().from(pricingSettingsTable).limit(1);
  if (row) return row;
  const [created] = await db.insert(pricingSettingsTable).values({}).returning();
  return created;
}

function calcQuote(d: {
  cleaningType: string;
  serviceType?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
  frequency?: string | null;
  extras?: string[];
}, p: ReturnType<typeof getPricing> extends Promise<infer T> ? T : never) {
  const basePrices: Record<string, number> = {
    standard: p.priceStandard,
    deep: p.priceDeep,
    move_in_out: p.priceMoveInOut,
    post_construction: p.pricePostConstruction,
    recurring: p.priceRecurring,
  };

  let basePrice = basePrices[d.cleaningType] ?? p.priceStandard;
  if (d.bedrooms) basePrice += d.bedrooms * p.ratePerBedroom;
  if (d.bathrooms) basePrice += d.bathrooms * p.ratePerBathroom;
  if (d.squareFootage && d.squareFootage > 500) basePrice += (d.squareFootage - 500) * p.rateSqftOver500;

  const extrasMap: Record<string, number> = {
    oven: p.extraOven,
    fridge: p.extraFridge,
    windows: p.extraWindows,
    laundry: p.extraLaundry,
    blinds: p.extraBlinds,
    garage: p.extraGarage,
    carpet_steam: p.extraCarpetSteam,
    upholstery: p.extraUpholstery,
  };

  const extrasList = (d.extras ?? []).map(e => ({
    name: e.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    price: extrasMap[e] ?? 30,
  }));
  const extrasTotal = extrasList.reduce((s, e) => s + e.price, 0);

  let discountPercent = 0;
  if (d.frequency === "weekly") discountPercent = p.discountWeeklyPercent;
  else if (d.frequency === "biweekly") discountPercent = p.discountBiweeklyPercent;
  else if (d.frequency === "monthly") discountPercent = p.discountMonthlyPercent;

  const subtotalBeforeDiscount = basePrice + extrasTotal;
  const discountAmount = subtotalBeforeDiscount * (discountPercent / 100);
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const tax = subtotal * (p.taxRatePercent / 100);
  const total = subtotal + tax;

  const lineItems = [
    { description: `${d.cleaningType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} Clean${d.serviceType === "commercial" ? " (Commercial)" : ""}`, quantity: 1, unitPrice: basePrice, total: basePrice },
    ...extrasList.map(e => ({ description: e.name, quantity: 1, unitPrice: e.price, total: e.price })),
    ...(discountAmount > 0 ? [{ description: `Recurring discount (${discountPercent}%)`, quantity: 1, unitPrice: -discountAmount, total: -discountAmount }] : []),
  ];

  return { basePrice, extras: extrasList, subtotal, taxRate: p.taxRatePercent, tax, total, discountPercent, discountAmount, lineItems, notes: "Prices are estimates. Final quote may vary based on property inspection." };
}

router.post("/public/inquiry", async (req, res): Promise<void> => {
  const parsed = SubmitInquiryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [lead] = await db.insert(leadsTable).values({ ...parsed.data, status: "new" }).returning();
    res.status(201).json(lead);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(503).json({ error: "Unable to save inquiry. The database may not be configured yet.", detail: message });
  }
});

router.post("/public/calculate-quote", async (req, res): Promise<void> => {
  const parsed = CalculateQuotePublicBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const pricing = await getPricing();
    res.json(calcQuote(parsed.data, pricing));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(503).json({ error: "Unable to calculate quote. The database may not be configured yet.", detail: message });
  }
});

export default router;
