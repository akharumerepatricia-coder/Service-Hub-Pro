import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /api/health
 * Simple liveness probe — returns 200 with no dependencies (no DB, no session).
 * Use this to confirm the Vercel serverless function is deployed and reachable.
 */
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * GET /api/healthz
 * Validated health check using the shared Zod schema.
 */
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
