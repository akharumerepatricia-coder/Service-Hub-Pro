/**
 * Vercel serverless entry point.
 * Exports the Express app so Vercel's @vercel/node runtime can invoke it.
 * All /api/* requests are routed here by vercel.json.
 */
import app from '../artifacts/api-server/src/app';

export default app;
