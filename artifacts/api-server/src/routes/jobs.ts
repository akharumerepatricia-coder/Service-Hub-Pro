import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jobsTable, customersTable, employeesTable } from "@workspace/db";
import { eq, gte, lte, and, sql, desc, inArray } from "drizzle-orm";
import {
  CreateJobBody,
  UpdateJobBody,
  GetJobParams,
  UpdateJobParams,
  DeleteJobParams,
  UpdateJobStatusParams,
  UpdateJobStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichJob(j: typeof jobsTable.$inferSelect) {
  const [customer] = await db.select({ name: customersTable.name, address: customersTable.address }).from(customersTable).where(eq(customersTable.id, j.customerId as unknown as number));
  const empIds = ((j.assignedEmployeeIds ?? []) as number[]).map(n => Math.round(Number(n)));
  let empNames: string[] = [];
  if (empIds.length > 0) {
    const emps = await db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).where(inArray(employeesTable.id, empIds));
    empNames = emps.map(e => e.name);
  }
  return {
    ...j,
    customerName: customer?.name ?? "Unknown",
    customerAddress: customer?.address ?? null,
    assignedEmployeeNames: empNames,
  };
}

router.get("/jobs/today", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.scheduledDate, today)).orderBy(jobsTable.scheduledTime);
  const enriched = await Promise.all(jobs.map(enrichJob));
  res.json(enriched);
});

router.get("/jobs/upcoming", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const future = new Date();
  future.setDate(future.getDate() + 7);
  const futureStr = future.toISOString().split("T")[0];
  const jobs = await db.select().from(jobsTable).where(and(gte(jobsTable.scheduledDate, today), lte(jobsTable.scheduledDate, futureStr), eq(jobsTable.status, "scheduled"))).orderBy(jobsTable.scheduledDate, jobsTable.scheduledTime);
  const enriched = await Promise.all(jobs.map(enrichJob));
  res.json(enriched);
});

router.get("/jobs", async (req, res): Promise<void> => {
  const { status, date, customerId, employeeId } = req.query as Record<string, string>;
  let query = db.select().from(jobsTable).$dynamic();
  if (status) query = query.where(eq(jobsTable.status, status));
  if (date) query = query.where(eq(jobsTable.scheduledDate, date));
  if (customerId) query = query.where(eq(jobsTable.customerId, parseFloat(customerId)));
  const jobs = await query.orderBy(desc(jobsTable.scheduledDate), jobsTable.scheduledTime);
  const enriched = await Promise.all(jobs.map(enrichJob));
  res.json(enriched);
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [job] = await db.insert(jobsTable).values(parsed.data as any).returning();
  const enriched = await enrichJob(job);
  res.status(201).json(enriched);
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id as unknown as number));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(await enrichJob(job));
});

router.patch("/jobs/:id", async (req, res): Promise<void> => {
  const params = UpdateJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [job] = await db.update(jobsTable).set(parsed.data as any).where(eq(jobsTable.id, params.data.id as unknown as number)).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(await enrichJob(job));
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [job] = await db.delete(jobsTable).where(eq(jobsTable.id, params.data.id as unknown as number)).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.sendStatus(204);
});

router.patch("/jobs/:id/status", async (req, res): Promise<void> => {
  const params = UpdateJobStatusParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateJobStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [job] = await db.update(jobsTable).set(parsed.data as any).where(eq(jobsTable.id, params.data.id as unknown as number)).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  // Update customer lifetime value if job completed
  if (parsed.data.status === "completed") {
    await db.execute(sql`UPDATE customers SET lifetime_value = (SELECT COALESCE(SUM(price), 0) FROM jobs WHERE customer_id = ${job.customerId} AND status = 'completed') WHERE id = ${job.customerId}`);
  }
  res.json(await enrichJob(job));
});

export default router;
