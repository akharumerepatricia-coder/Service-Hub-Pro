/**
 * Vercel catch-all serverless function.
 * Handles every /api/* request and forwards it to the Express app.
 * Using a catch-all ([...slug]) so Vercel routes /api/dashboard/stats,
 * /api/customers, etc. here without requiring manual rewrites.
 */
import app from '../artifacts/api-server/src/app';

export default app;
