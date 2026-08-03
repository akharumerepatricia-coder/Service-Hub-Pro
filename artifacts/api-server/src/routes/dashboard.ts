import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  leadsTable,
  customersTable,
  jobsTable,
  invoicesTable,
  employeesTable,
} from "@workspace/db";
import { and, eq, gte, lte, sql, desc, lt } from "drizzle-orm";

const router: IRouter = Router();

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const today = todayStr();
  const mStart = monthStart();

  const [
    jobsToday,
    jobsThisMonth,
    todayRevenue,
    monthRevenue,
    outstandingInvoices,
    upcomingJobs,
    lateJobs,
    cancelledJobs,
    allEmployees,
    recurringCustomers,
    allCustomers,
    allLeads,
    completedJobsMonth,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(eq(jobsTable.scheduledDate, today)),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(gte(jobsTable.scheduledDate, mStart)),
    db.select({ total: sql<number>`coalesce(sum(price), 0)` }).from(jobsTable).where(and(eq(jobsTable.scheduledDate, today), eq(jobsTable.status, "completed"))),
    db.select({ total: sql<number>`coalesce(sum(price), 0)` }).from(jobsTable).where(and(gte(jobsTable.scheduledDate, mStart), eq(jobsTable.status, "completed"))),
    db.select({ count: sql<number>`count(*)::int`, amount: sql<number>`coalesce(sum(total), 0)` }).from(invoicesTable).where(sql`status IN ('sent', 'overdue')`),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(and(gte(jobsTable.scheduledDate, today), eq(jobsTable.status, "scheduled"))),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(eq(jobsTable.status, "late")),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(and(gte(jobsTable.scheduledDate, mStart), eq(jobsTable.status, "cancelled"))),
    db.select().from(employeesTable).where(eq(employeesTable.status, "active")),
    db.select({ count: sql<number>`count(*)::int` }).from(customersTable).where(eq(customersTable.isRecurring, true)),
    db.select({ avgSat: sql<number>`coalesce(avg(satisfaction_score), 0)`, avgReview: sql<number>`coalesce(avg(review_score), 0)`, count: sql<number>`count(*)::int` }).from(customersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(leadsTable),
    db.select({ avgPrice: sql<number>`coalesce(avg(price), 0)` }).from(jobsTable).where(eq(jobsTable.status, "completed")),
  ]);

  const totalEmployees = allEmployees.length;
  const busyToday = await db.execute(
    sql`SELECT COUNT(DISTINCT emp_id)::int AS count FROM jobs, unnest(assigned_employee_ids) AS emp_id WHERE scheduled_date = ${today}`
  );

  res.json({
    revenueToday: todayRevenue[0]?.total ?? 0,
    revenueThisMonth: monthRevenue[0]?.total ?? 0,
    jobsToday: jobsToday[0]?.count ?? 0,
    jobsThisMonth: jobsThisMonth[0]?.count ?? 0,
    outstandingInvoicesCount: outstandingInvoices[0]?.count ?? 0,
    outstandingInvoicesAmount: outstandingInvoices[0]?.amount ?? 0,
    upcomingJobsCount: upcomingJobs[0]?.count ?? 0,
    lateJobsCount: lateJobs[0]?.count ?? 0,
    cancelledJobsThisMonth: cancelledJobs[0]?.count ?? 0,
    cleanerUtilizationPercent: totalEmployees > 0 ? Math.min(100, Math.round((((busyToday.rows[0] as { count?: number } | undefined)?.count ?? 0) / totalEmployees) * 100)) : 0,
    availableStaffCount: allEmployees.filter(e => e.status === "active").length,
    recurringCustomersCount: recurringCustomers[0]?.count ?? 0,
    customerSatisfactionScore: allCustomers[0]?.avgSat ?? 0,
    averageReviewScore: allCustomers[0]?.avgReview ?? 0,
    averageJobValue: completedJobsMonth[0]?.avgPrice ?? 0,
    totalCustomers: allCustomers[0]?.count ?? 0,
    totalLeads: allLeads[0]?.count ?? 0,
  });
});

router.get("/dashboard/revenue", async (req, res): Promise<void> => {
  const period = (req.query.period as string) ?? "month";
  const now = new Date();
  let data: { label: string; amount: number }[] = [];
  let total = 0;

  if (period === "week") {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    const rows = await db
      .select({ date: jobsTable.scheduledDate, total: sql<number>`coalesce(sum(price), 0)` })
      .from(jobsTable)
      .where(and(gte(jobsTable.scheduledDate, days[0]), eq(jobsTable.status, "completed")))
      .groupBy(jobsTable.scheduledDate);
    const map = Object.fromEntries(rows.map(r => [r.date, r.total]));
    data = days.map(d => ({ label: new Date(d + "T12:00:00Z").toLocaleDateString("en-AU", { weekday: "short" }), amount: map[d] ?? 0 }));
  } else if (period === "month") {
    const mStart = monthStart();
    const rows = await db
      .select({ date: jobsTable.scheduledDate, total: sql<number>`coalesce(sum(price), 0)` })
      .from(jobsTable)
      .where(and(gte(jobsTable.scheduledDate, mStart), eq(jobsTable.status, "completed")))
      .groupBy(jobsTable.scheduledDate)
      .orderBy(jobsTable.scheduledDate);
    data = rows.map(r => ({ label: new Date(r.date + "T12:00:00Z").getDate().toString(), amount: r.total }));
  } else if (period === "quarter") {
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mS = d.toISOString().split("T")[0];
      const mE = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
      const [row] = await db.select({ total: sql<number>`coalesce(sum(price), 0)` }).from(jobsTable).where(and(gte(jobsTable.scheduledDate, mS), lte(jobsTable.scheduledDate, mE), eq(jobsTable.status, "completed")));
      data.push({ label: d.toLocaleDateString("en-AU", { month: "short" }), amount: row?.total ?? 0 });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mS = d.toISOString().split("T")[0];
      const mE = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
      const [row] = await db.select({ total: sql<number>`coalesce(sum(price), 0)` }).from(jobsTable).where(and(gte(jobsTable.scheduledDate, mS), lte(jobsTable.scheduledDate, mE), eq(jobsTable.status, "completed")));
      data.push({ label: d.toLocaleDateString("en-AU", { month: "short" }), amount: row?.total ?? 0 });
    }
  }

  total = data.reduce((s, d) => s + d.amount, 0);
  res.json({ period, total, data });
});

router.get("/dashboard/health", async (_req, res): Promise<void> => {
  const today = todayStr();
  const mStart = monthStart();

  const [completedJobs, cancelledJobs, overdueInvoices, totalInvoices, avgRating, activeEmployees] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(and(gte(jobsTable.scheduledDate, mStart), eq(jobsTable.status, "completed"))),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(and(gte(jobsTable.scheduledDate, mStart), eq(jobsTable.status, "cancelled"))),
    db.select({ count: sql<number>`count(*)::int` }).from(invoicesTable).where(eq(invoicesTable.status, "overdue")),
    db.select({ count: sql<number>`count(*)::int` }).from(invoicesTable).where(sql`status IN ('sent', 'paid', 'overdue')`),
    db.select({ avg: sql<number>`coalesce(avg(customer_rating), 0)` }).from(jobsTable).where(sql`customer_rating IS NOT NULL`),
    db.select({ count: sql<number>`count(*)::int` }).from(employeesTable).where(eq(employeesTable.status, "active")),
  ]);

  const total = (completedJobs[0]?.count ?? 0) + (cancelledJobs[0]?.count ?? 0);
  const completionRate = total > 0 ? ((completedJobs[0]?.count ?? 0) / total) * 100 : 100;
  const overdueRate = (totalInvoices[0]?.count ?? 0) > 0 ? ((overdueInvoices[0]?.count ?? 0) / (totalInvoices[0]?.count ?? 1)) * 100 : 0;
  const rating = avgRating[0]?.avg ?? 5;
  const staffCount = activeEmployees[0]?.count ?? 0;

  const score = Math.round(
    completionRate * 0.4 +
    (100 - Math.min(100, overdueRate * 5)) * 0.3 +
    (rating / 5) * 100 * 0.2 +
    Math.min(100, staffCount * 10) * 0.1
  );

  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D";

  const indicators = [
    { name: "Job Completion Rate", value: `${completionRate.toFixed(0)}%`, status: completionRate >= 90 ? "good" : completionRate >= 75 ? "warning" : "critical" },
    { name: "Invoice Collection", value: `${(100 - overdueRate).toFixed(0)}%`, status: overdueRate <= 10 ? "good" : overdueRate <= 25 ? "warning" : "critical" },
    { name: "Customer Rating", value: `${rating.toFixed(1)} / 5`, status: rating >= 4.5 ? "good" : rating >= 3.5 ? "warning" : "critical" },
    { name: "Active Staff", value: String(staffCount), status: staffCount >= 5 ? "good" : staffCount >= 2 ? "warning" : "critical" },
  ];

  res.json({ score, grade, indicators });
});

router.get("/dashboard/top-customers", async (req, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit ?? "5"), 10);
  const rows = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      lifetimeValue: customersTable.lifetimeValue,
      status: customersTable.status,
      jobsCount: sql<number>`coalesce((select count(*) from jobs where customer_id = customers.id), 0)::int`,
    })
    .from(customersTable)
    .orderBy(desc(customersTable.lifetimeValue))
    .limit(limit);
  res.json(rows);
});

router.get("/dashboard/top-employees", async (req, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit ?? "5"), 10);
  const rows = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.status, "active"))
    .orderBy(desc(employeesTable.jobsCompleted))
    .limit(limit);
  res.json(rows.map(e => ({
    id: e.id,
    name: e.name,
    jobsCompleted: e.jobsCompleted ?? 0,
    rating: e.averageRating ?? 0,
    utilizationPercent: e.utilizationPercent ?? 0,
  })));
});

router.get("/dashboard/today-route", async (_req, res): Promise<void> => {
  const today = todayStr();
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.scheduledDate, today)).orderBy(jobsTable.scheduledTime);
  const result = await Promise.all(jobs.map(async j => {
    const [customer] = await db.select({ name: customersTable.name, address: customersTable.address, gpsLat: customersTable.gpsLat, gpsLng: customersTable.gpsLng }).from(customersTable).where(eq(customersTable.id, j.customerId as unknown as number));
    return {
      id: j.id,
      customerName: customer?.name ?? "Unknown",
      address: customer?.address ?? "",
      scheduledTime: j.scheduledTime,
      status: j.status,
      lat: customer?.gpsLat ?? null,
      lng: customer?.gpsLng ?? null,
      employeeName: null,
    };
  }));
  res.json(result);
});

export default router;
