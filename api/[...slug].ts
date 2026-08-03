/**
 * Vercel catch-all serverless function.
 * Handles every /api/* request and forwards it to the pre-built Express app.
 *
 * We import from the esbuild-bundled dist/app.mjs rather than from
 * TypeScript source so Vercel doesn't need to compile workspace packages
 * (@workspace/db, @workspace/api-zod) that export raw .ts files.
 */
// @ts-ignore — the JS bundle has no type declarations
import app from '../artifacts/api-server/dist/app.mjs';

export default app;
