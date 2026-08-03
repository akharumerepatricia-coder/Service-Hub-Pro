import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { employeesTable, jobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  ListJobsByEmployeeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/employees/available-today", async (_req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable).where(eq(employeesTable.status, "active")).orderBy(employeesTable.name);
  res.json(employees);
});

router.get("/employees", async (req, res): Promise<void> => {
  const { status, role } = req.query as Record<string, string>;
  let query = db.select().from(employeesTable).$dynamic();
  if (status) query = query.where(eq(employeesTable.status, status));
  if (role) query = query.where(eq(employeesTable.role, role));
  const employees = await query.orderBy(desc(employeesTable.jobsCompleted));
  res.json(employees);
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employee] = await db.insert(employeesTable).values(parsed.data as any).returning();
  res.status(201).json(employee);
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, params.data.id as unknown as number));
  if (!employee) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json(employee);
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employee] = await db.update(employeesTable).set(parsed.data as any).where(eq(employeesTable.id, params.data.id as unknown as number)).returning();
  if (!employee) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json(employee);
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [emp] = await db.delete(employeesTable).where(eq(employeesTable.id, params.data.id as unknown as number)).returning();
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  res.sendStatus(204);
});

router.get("/employees/:id/jobs", async (req, res): Promise<void> => {
  const params = ListJobsByEmployeeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const id = params.data.id as unknown as number;
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.customerId, id)).orderBy(desc(jobsTable.scheduledDate)).limit(20);
  res.json(jobs);
});

export default router;
