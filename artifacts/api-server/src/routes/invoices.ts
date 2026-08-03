import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { invoicesTable, customersTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  CreateInvoiceBody,
  UpdateInvoiceBody,
  GetInvoiceParams,
  UpdateInvoiceParams,
  DeleteInvoiceParams,
  SendInvoiceParams,
  MarkInvoicePaidParams,
  MarkInvoicePaidBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

interface LineItem { description: string; quantity: number; unitPrice: number; total: number; }

function nextInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-6)}`;
}

async function enrichInvoice(inv: typeof invoicesTable.$inferSelect) {
  const [customer] = await db.select({ name: customersTable.name, email: customersTable.email }).from(customersTable).where(eq(customersTable.id, inv.customerId as unknown as number));
  return { ...inv, customerName: customer?.name ?? "Unknown", customerEmail: customer?.email ?? null };
}

router.get("/invoices", async (req, res): Promise<void> => {
  const { status, customerId } = req.query as Record<string, string>;
  let query = db.select().from(invoicesTable).$dynamic();
  if (status) query = query.where(eq(invoicesTable.status, status));
  if (customerId) query = query.where(eq(invoicesTable.customerId, parseFloat(customerId)));
  const invoices = await query.orderBy(desc(invoicesTable.createdAt));
  const enriched = await Promise.all(invoices.map(enrichInvoice));
  res.json(enriched);
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const lineItems = (parsed.data.lineItems ?? []) as LineItem[];
  const taxRate = parsed.data.taxRate ?? 10;
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [inv] = await db.insert(invoicesTable).values({ ...parsed.data, lineItems, subtotal, tax, total, taxRate, invoiceNumber: nextInvoiceNumber() } as any).returning();
  res.status(201).json(await enrichInvoice(inv));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id as unknown as number));
  if (!inv) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(await enrichInvoice(inv));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [inv] = await db.update(invoicesTable).set(parsed.data as any).where(eq(invoicesTable.id, params.data.id as unknown as number)).returning();
  if (!inv) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(await enrichInvoice(inv));
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [inv] = await db.delete(invoicesTable).where(eq(invoicesTable.id, params.data.id as unknown as number)).returning();
  if (!inv) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.sendStatus(204);
});

router.post("/invoices/:id/send", async (req, res): Promise<void> => {
  const params = SendInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [inv] = await db.update(invoicesTable).set({ status: "sent", sentAt: new Date() }).where(eq(invoicesTable.id, params.data.id as unknown as number)).returning();
  if (!inv) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(await enrichInvoice(inv));
});

router.patch("/invoices/:id/pay", async (req, res): Promise<void> => {
  const params = MarkInvoicePaidParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = MarkInvoicePaidBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [inv] = await db.update(invoicesTable).set({
    status: "paid",
    paidAmount: parsed.data.paidAmount,
    paymentMethod: parsed.data.paymentMethod,
    paymentDate: (parsed.data.paymentDate ?? new Date().toISOString().split("T")[0]) as string,
  }).where(eq(invoicesTable.id, params.data.id as unknown as number)).returning();
  if (!inv) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(await enrichInvoice(inv));
});

export default router;
