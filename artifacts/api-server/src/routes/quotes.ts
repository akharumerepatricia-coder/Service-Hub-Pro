import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { quotesTable, customersTable, pricingSettingsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  CreateQuoteBody,
  UpdateQuoteBody,
  GetQuoteParams,
  UpdateQuoteParams,
  DeleteQuoteParams,
  SendQuoteParams,
  AcceptQuoteParams,
  RejectQuoteParams,
  CalculateQuoteBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

interface LineItem { description: string; quantity: number; unitPrice: number; total: number; }

function calcTotals(lineItems: LineItem[], taxRate: number) {
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

async function enrichQuote(q: typeof quotesTable.$inferSelect) {
  const [customer] = await db.select({ name: customersTable.name, email: customersTable.email }).from(customersTable).where(eq(customersTable.id, q.customerId as unknown as number));
  return { ...q, customerName: customer?.name ?? "Unknown", customerEmail: customer?.email ?? null };
}

router.get("/quotes", async (req, res): Promise<void> => {
  const { status, customerId } = req.query as Record<string, string>;
  let query = db.select().from(quotesTable).$dynamic();
  if (status) query = query.where(eq(quotesTable.status, status));
  if (customerId) query = query.where(eq(quotesTable.customerId, parseFloat(customerId)));
  const quotes = await query.orderBy(desc(quotesTable.createdAt));
  const enriched = await Promise.all(quotes.map(enrichQuote));
  res.json(enriched);
});

router.post("/quotes", async (req, res): Promise<void> => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const lineItems = (parsed.data.lineItems ?? []) as LineItem[];
  const taxRate = parsed.data.taxRate ?? 10;
  const { subtotal, tax, total } = calcTotals(lineItems, taxRate);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote] = await db.insert(quotesTable).values({ ...parsed.data, lineItems, subtotal, tax, total, taxRate } as any).returning();
  res.status(201).json(await enrichQuote(quote));
});

router.post("/quotes/calculate", async (req, res): Promise<void> => {
  const parsed = CalculateQuoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const d = parsed.data;

  // Base pricing
  const basePrices: Record<string, number> = {
    standard: 120,
    deep: 220,
    move_in_out: 350,
    post_construction: 450,
    recurring: 100,
  };
  const bedroomRate = 25;
  const bathroomRate = 20;
  const sqftRate = 0.08;

  let basePrice = basePrices[d.cleaningType] ?? 150;
  if (d.bedrooms) basePrice += d.bedrooms * bedroomRate;
  if (d.bathrooms) basePrice += d.bathrooms * bathroomRate;
  if (d.squareFootage && d.squareFootage > 500) basePrice += (d.squareFootage - 500) * sqftRate;

  const extrasMap: Record<string, number> = {
    oven: 40, fridge: 35, windows: 60, laundry: 30, blinds: 45, garage: 80, carpet_steam: 120, upholstery: 90,
  };
  const extrasList = (d.extras ?? []).map(e => ({ name: e.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), price: extrasMap[e] ?? 30 }));
  const extrasTotal = extrasList.reduce((s, e) => s + e.price, 0);

  let discountPercent = 0;
  if (d.frequency === "weekly") discountPercent = 20;
  else if (d.frequency === "biweekly") discountPercent = 15;
  else if (d.frequency === "monthly") discountPercent = 10;

  const subtotalBeforeDiscount = basePrice + extrasTotal;
  const discountAmount = subtotalBeforeDiscount * (discountPercent / 100);
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const taxRate = 10;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const lineItems: LineItem[] = [
    { description: `${d.cleaningType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} Clean${d.serviceType === "commercial" ? " (Commercial)" : ""}`, quantity: 1, unitPrice: basePrice, total: basePrice },
    ...extrasList.map(e => ({ description: e.name, quantity: 1, unitPrice: e.price, total: e.price })),
  ];
  if (discountAmount > 0) {
    lineItems.push({ description: `Recurring discount (${discountPercent}%)`, quantity: 1, unitPrice: -discountAmount, total: -discountAmount });
  }

  res.json({ basePrice, extras: extrasList, subtotal, taxRate, tax, total, discountPercent, discountAmount, lineItems, notes: "Prices are estimates. Final quote may vary based on property inspection." });
});

router.get("/quotes/:id", async (req, res): Promise<void> => {
  const params = GetQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, params.data.id as unknown as number));
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  res.json(await enrichQuote(quote));
});

router.patch("/quotes/:id", async (req, res): Promise<void> => {
  const params = UpdateQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateQuoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const lineItems = (parsed.data.lineItems ?? []) as LineItem[];
  const taxRate = parsed.data.taxRate ?? 10;
  const { subtotal, tax, total } = lineItems.length > 0 ? calcTotals(lineItems, taxRate) : { subtotal: 0, tax: 0, total: 0 };
  const updateData = lineItems.length > 0 ? { ...parsed.data, subtotal, tax, total } : parsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote] = await db.update(quotesTable).set(updateData as any).where(eq(quotesTable.id, params.data.id as unknown as number)).returning();
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  res.json(await enrichQuote(quote));
});

router.delete("/quotes/:id", async (req, res): Promise<void> => {
  const params = DeleteQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [q] = await db.delete(quotesTable).where(eq(quotesTable.id, params.data.id as unknown as number)).returning();
  if (!q) { res.status(404).json({ error: "Quote not found" }); return; }
  res.sendStatus(204);
});

router.post("/quotes/:id/send", async (req, res): Promise<void> => {
  const params = SendQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [quote] = await db.update(quotesTable).set({ status: "sent", sentAt: new Date() }).where(eq(quotesTable.id, params.data.id as unknown as number)).returning();
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  res.json(await enrichQuote(quote));
});

router.post("/quotes/:id/accept", async (req, res): Promise<void> => {
  const params = AcceptQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [quote] = await db.update(quotesTable).set({ status: "accepted", acceptedAt: new Date() }).where(eq(quotesTable.id, params.data.id as unknown as number)).returning();
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  res.json(await enrichQuote(quote));
});

router.post("/quotes/:id/reject", async (req, res): Promise<void> => {
  const params = RejectQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [quote] = await db.update(quotesTable).set({ status: "rejected" }).where(eq(quotesTable.id, params.data.id as unknown as number)).returning();
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  res.json(await enrichQuote(quote));
});

export default router;
