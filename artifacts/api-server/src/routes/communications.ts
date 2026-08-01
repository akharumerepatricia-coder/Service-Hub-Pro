import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { communicationsTable, customersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateCommunicationBody,
  DeleteCommunicationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/communications", async (req, res): Promise<void> => {
  const { customerId, type } = req.query as Record<string, string>;
  let query = db.select().from(communicationsTable).$dynamic();
  if (customerId) query = query.where(eq(communicationsTable.customerId, parseFloat(customerId)));
  if (type) query = query.where(eq(communicationsTable.type, type));
  const comms = await query.orderBy(desc(communicationsTable.createdAt)).limit(100);
  const enriched = await Promise.all(comms.map(async c => {
    const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, c.customerId as unknown as number));
    return { ...c, customerName: customer?.name ?? null };
  }));
  res.json(enriched);
});

router.post("/communications", async (req, res): Promise<void> => {
  const parsed = CreateCommunicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [comm] = await db.insert(communicationsTable).values(parsed.data).returning();
  res.status(201).json(comm);
});

router.delete("/communications/:id", async (req, res): Promise<void> => {
  const params = DeleteCommunicationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [c] = await db.delete(communicationsTable).where(eq(communicationsTable.id, params.data.id as unknown as number)).returning();
  if (!c) { res.status(404).json({ error: "Communication not found" }); return; }
  res.sendStatus(204);
});

export default router;
