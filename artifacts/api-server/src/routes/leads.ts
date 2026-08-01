import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leadsTable, customersTable } from "@workspace/db";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import {
  CreateLeadBody,
  UpdateLeadBody,
  GetLeadParams,
  UpdateLeadParams,
  DeleteLeadParams,
  ConvertLeadParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leads/stats", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ status: leadsTable.status, count: sql<number>`count(*)::int` })
    .from(leadsTable)
    .groupBy(leadsTable.status);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.count;
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  const won = map["won"] ?? 0;
  const lost = map["lost"] ?? 0;
  res.json({
    new: map["new"] ?? 0,
    contacted: map["contacted"] ?? 0,
    quoted: map["quoted"] ?? 0,
    won,
    lost,
    total,
    conversionRate: (won + lost) > 0 ? (won / (won + lost)) * 100 : 0,
  });
});

router.get("/leads", async (req, res): Promise<void> => {
  const { status, search } = req.query as { status?: string; search?: string };
  let query = db.select().from(leadsTable).$dynamic();
  if (status) query = query.where(eq(leadsTable.status, status));
  if (search) {
    query = query.where(
      or(ilike(leadsTable.name, `%${search}%`), ilike(leadsTable.email, `%${search}%`), ilike(leadsTable.phone, `%${search}%`))
    );
  }
  const leads = await query.orderBy(desc(leadsTable.createdAt));
  res.json(leads);
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [lead] = await db.insert(leadsTable).values(parsed.data).returning();
  res.status(201).json(lead);
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id as unknown as number));
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json(lead);
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [lead] = await db.update(leadsTable).set(parsed.data).where(eq(leadsTable.id, params.data.id as unknown as number)).returning();
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json(lead);
});

router.delete("/leads/:id", async (req, res): Promise<void> => {
  const params = DeleteLeadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [lead] = await db.delete(leadsTable).where(eq(leadsTable.id, params.data.id as unknown as number)).returning();
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  res.sendStatus(204);
});

router.post("/leads/:id/convert", async (req, res): Promise<void> => {
  const params = ConvertLeadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id as unknown as number));
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  const [customer] = await db.insert(customersTable).values({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address ?? undefined,
    serviceType: lead.serviceType,
    propertyType: lead.propertyType ?? undefined,
    bedrooms: lead.bedrooms ?? undefined,
    bathrooms: lead.bathrooms ?? undefined,
    squareFootage: lead.squareFootage ?? undefined,
    referralSource: lead.referralSource ?? undefined,
    notes: lead.notes ?? undefined,
    status: "active",
    isRecurring: false,
  }).returning();
  await db.update(leadsTable).set({ status: "won" }).where(eq(leadsTable.id, params.data.id as unknown as number));
  res.json(customer);
});

export default router;
