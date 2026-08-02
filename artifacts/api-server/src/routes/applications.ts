import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jobApplicationsTable, employeesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
const router: IRouter = Router();

// ── Scoring ───────────────────────────────────────────────────────────────────
function computeAutoStatus(data: {
  yearsExperience: number;
  hasVehicle: boolean;
  hasOwnSupplies: boolean;
  cleaningTypes: string[];
}): { autoScore: number; status: string } {
  const score =
    data.yearsExperience * 10 +
    (data.hasVehicle ? 15 : 0) +
    (data.hasOwnSupplies ? 10 : 0) +
    (data.cleaningTypes?.length ?? 0) * 5;

  let status: string;
  if (data.yearsExperience >= 2 && score >= 35) status = "recommended";
  else if (score >= 20 || data.yearsExperience >= 1) status = "review";
  else status = "not_suitable";

  return { autoScore: score, status };
}

// ── Manual validation helpers ─────────────────────────────────────────────────
const VALID_STATUSES = ["recommended", "review", "not_suitable", "hired", "rejected"] as const;

function validateApplyBody(body: Record<string, unknown>): { error?: string; data?: {
  name: string; email: string; phone: string; yearsExperience: number;
  cleaningTypes: string[]; availability: string[]; hasOwnSupplies: boolean;
  hasVehicle: boolean; message?: string;
}} {
  if (typeof body.name !== "string" || body.name.trim().length < 2) return { error: "name must be at least 2 characters" };
  if (typeof body.email !== "string" || !body.email.includes("@")) return { error: "valid email is required" };
  if (typeof body.phone !== "string" || body.phone.trim().length < 7) return { error: "phone must be at least 7 characters" };
  return {
    data: {
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      yearsExperience: typeof body.yearsExperience === "number" ? Math.max(0, Math.min(50, Math.floor(body.yearsExperience))) : 0,
      cleaningTypes: Array.isArray(body.cleaningTypes) ? (body.cleaningTypes as string[]).filter(s => typeof s === "string") : [],
      availability: Array.isArray(body.availability) ? (body.availability as string[]).filter(s => typeof s === "string") : [],
      hasOwnSupplies: body.hasOwnSupplies === true,
      hasVehicle: body.hasVehicle === true,
      message: typeof body.message === "string" ? body.message.trim() : undefined,
    },
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** Public: submit a job application */
router.post("/public/apply", async (req, res): Promise<void> => {
  const validated = validateApplyBody(req.body as Record<string, unknown>);
  if (validated.error) { res.status(400).json({ error: validated.error }); return; }
  const { autoScore, status } = computeAutoStatus(validated.data!);
  const [application] = await db
    .insert(jobApplicationsTable)
    .values({ ...validated.data!, autoScore, status })
    .returning();
  res.status(201).json(application);
});

/** CRM: list all applications */
router.get("/applications", async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;
  let query = db.select().from(jobApplicationsTable).$dynamic();
  if (status && status !== "all") {
    query = query.where(eq(jobApplicationsTable.status, status));
  }
  const applications = await query.orderBy(desc(jobApplicationsTable.createdAt));
  res.json(applications);
});

/** CRM: manually override status */
router.patch("/applications/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = req.body as Record<string, unknown>;
  const status = body.status as string | undefined;
  if (status && !(VALID_STATUSES as readonly string[]).includes(status)) {
    res.status(400).json({ error: "Invalid status value" }); return;
  }
  const [updated] = await db
    .update(jobApplicationsTable)
    .set(status ? { status } : {})
    .where(eq(jobApplicationsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(updated);
});

/** CRM: hire an applicant → creates employee record */
router.post("/applications/:id/hire", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [application] = await db
    .select()
    .from(jobApplicationsTable)
    .where(eq(jobApplicationsTable.id, id));
  if (!application) { res.status(404).json({ error: "Application not found" }); return; }
  if (application.status === "hired") { res.status(409).json({ error: "Already hired" }); return; }

  // Create employee from application data
  const today = new Date().toISOString().split("T")[0];
  const [employee] = await db
    .insert(employeesTable)
    .values({
      name: application.name,
      email: application.email,
      phone: application.phone,
      role: "cleaner",
      status: "active",
      hireDate: today,
      skills: application.cleaningTypes,
      jobsCompleted: 0,
      notes: `Hired from job application. Message: ${application.message ?? "N/A"}`,
    })
    .returning();

  // Mark application as hired
  await db
    .update(jobApplicationsTable)
    .set({ status: "hired" })
    .where(eq(jobApplicationsTable.id, id));

  res.status(201).json({ employee, applicationId: id });
});

export default router;
