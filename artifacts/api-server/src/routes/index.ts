import { Router, type IRouter } from "express";
import healthRouter from "./health";
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

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(pricingRouter);
router.use(dashboardRouter);
router.use(leadsRouter);
router.use(customersRouter);
router.use(jobsRouter);
router.use(quotesRouter);
router.use(invoicesRouter);
router.use(employeesRouter);
router.use(communicationsRouter);
router.use(applicationsRouter);

export default router;
