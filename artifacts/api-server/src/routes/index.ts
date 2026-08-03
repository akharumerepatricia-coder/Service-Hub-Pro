import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import leadsRouter from "./leads";
import customersRouter from "./customers";
import jobsRouter from "./jobs";
import quotesRouter from "./quotes";
import invoicesRouter from "./invoices";
import employeesRouter from "./employees";
import communicationsRouter from "./communications";
import publicRouter from "./public";
import pricingRouter from "./pricing";
import applicationsRouter from "./applications";
import { requireAuth } from "../middleware/require-auth";

const router: IRouter = Router();

// ── Public routes (no session required) ────────────────────────────────────
router.use(healthRouter);
router.use(authRouter);
router.use(publicRouter);

// ── Protected CRM routes (session required) ─────────────────────────────────
router.use(requireAuth);
router.use(applicationsRouter);
router.use(pricingRouter);
router.use(dashboardRouter);
router.use(leadsRouter);
router.use(customersRouter);
router.use(jobsRouter);
router.use(quotesRouter);
router.use(invoicesRouter);
router.use(employeesRouter);
router.use(communicationsRouter);

export default router;
