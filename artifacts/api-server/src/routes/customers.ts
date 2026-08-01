import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable, jobsTable, communicationsTable, invoicesTable } from "@workspace/db";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import {
  CreateCustomerBody,
  UpdateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  DeleteCustomerParams,
  GetCustomerTimelineParams,
  GetCustomerAiSummaryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/customers", async (req, res): Promise<void> => {
  const { status, propertyType, search, recurring } = req.query as Record<string, string>;
  let query = db.select().from(customersTable).$dynamic();
  if (status) query = query.where(eq(customersTable.status, status));
  if (search) {
    query = query.where(or(ilike(customersTable.name, `%${search}%`), ilike(customersTable.email, `%${search}%`), ilike(customersTable.phone, `%${search}%`)));
  }
  if (recurring === "true") query = query.where(eq(customersTable.isRecurring, true));
  const customers = await query.orderBy(desc(customersTable.createdAt));
  res.json(customers);
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [customer] = await db.insert(customersTable).values(parsed.data).returning();
  res.status(201).json(customer);
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const id = params.data.id as unknown as number;
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  const [recentJobs, recentCommunications, openInvoices, totalJobs] = await Promise.all([
    db.select().from(jobsTable).where(eq(jobsTable.customerId, id as unknown as number)).orderBy(desc(jobsTable.scheduledDate)).limit(5),
    db.select().from(communicationsTable).where(eq(communicationsTable.customerId, id as unknown as number)).orderBy(desc(communicationsTable.createdAt)).limit(5),
    db.select().from(invoicesTable).where(eq(invoicesTable.customerId, id as unknown as number)).orderBy(desc(invoicesTable.createdAt)).limit(5),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(eq(jobsTable.customerId, id as unknown as number)),
  ]);
  res.json({
    ...customer,
    recentJobs,
    recentCommunications,
    openInvoices,
    totalJobsCount: totalJobs[0]?.count ?? 0,
  });
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [customer] = await db.update(customersTable).set(parsed.data).where(eq(customersTable.id, params.data.id as unknown as number)).returning();
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json(customer);
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [c] = await db.delete(customersTable).where(eq(customersTable.id, params.data.id as unknown as number)).returning();
  if (!c) { res.status(404).json({ error: "Customer not found" }); return; }
  res.sendStatus(204);
});

router.get("/customers/:id/timeline", async (req, res): Promise<void> => {
  const params = GetCustomerTimelineParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const id = params.data.id as unknown as number;
  const [jobs, comms, invoices] = await Promise.all([
    db.select().from(jobsTable).where(eq(jobsTable.customerId, id as unknown as number)).orderBy(desc(jobsTable.createdAt)).limit(10),
    db.select().from(communicationsTable).where(eq(communicationsTable.customerId, id as unknown as number)).orderBy(desc(communicationsTable.createdAt)).limit(10),
    db.select().from(invoicesTable).where(eq(invoicesTable.customerId, id as unknown as number)).orderBy(desc(invoicesTable.createdAt)).limit(10),
  ]);
  const events = [
    ...jobs.map(j => ({ id: j.id, type: "job" as const, title: `${j.cleaningType} cleaning`, description: `Scheduled for ${j.scheduledDate} at ${j.scheduledTime}`, date: j.createdAt, amount: j.price, status: j.status })),
    ...comms.map(c => ({ id: c.id, type: "communication" as const, title: c.subject, description: c.content, date: c.createdAt, amount: null, status: c.type })),
    ...invoices.map(i => ({ id: i.id, type: "invoice" as const, title: `Invoice ${i.invoiceNumber}`, description: `Due ${i.dueDate}`, date: i.createdAt, amount: i.total, status: i.status })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(events);
});

router.get("/customers/:id/ai-summary", async (req, res): Promise<void> => {
  const params = GetCustomerAiSummaryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const id = params.data.id as unknown as number;
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  const [jobCount, avgRating, totalSpend] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(eq(jobsTable.customerId, id as unknown as number)),
    db.select({ avg: sql<number>`coalesce(avg(customer_rating), 0)` }).from(jobsTable).where(eq(jobsTable.customerId, id as unknown as number)),
    db.select({ total: sql<number>`coalesce(sum(price), 0)` }).from(jobsTable).where(eq(jobsTable.customerId, id as unknown as number)),
  ]);
  const summary = `${customer.name} is a ${customer.status} ${customer.serviceType} customer${customer.isRecurring ? " on a recurring schedule" : ""}. They have had ${jobCount[0]?.count ?? 0} cleaning sessions with an average rating of ${(avgRating[0]?.avg ?? 0).toFixed(1)}/5 and a total spend of $${(totalSpend[0]?.total ?? 0).toFixed(2)}.`;
  const keyPoints = [
    `Property: ${customer.propertyType ?? "Not specified"} with ${customer.bedrooms ?? "?"} bedrooms, ${customer.bathrooms ?? "?"} bathrooms`,
    `Lifetime value: $${customer.lifetimeValue.toFixed(2)}`,
    customer.recurringSchedule ? `Recurring: ${customer.recurringSchedule}` : "Not on recurring schedule",
    customer.pets ? `Pets: ${customer.pets}` : "No pets",
    customer.cleaningPreferences ? `Preferences: ${customer.cleaningPreferences}` : "No specific preferences noted",
  ].filter(Boolean);
  const recommendations = [
    customer.isRecurring ? "Continue recurring schedule — high retention value" : "Offer recurring discount to increase retention",
    (avgRating[0]?.avg ?? 0) >= 4.5 ? "Ask for a Google review — excellent satisfaction score" : "Follow up on recent jobs to address any concerns",
    "Send seasonal deep-clean promotion in Q4",
  ];
  res.json({ summary, keyPoints, recommendations, lastUpdated: new Date() });
});

export default router;
