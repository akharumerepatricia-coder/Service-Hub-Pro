/**
 * Vercel serverless entry point — API project only.
 *
 * Why a plain .js file with a dynamic import instead of a TypeScript static import:
 *
 * 1. @vercel/node compiles .ts files with esbuild and BUNDLES every static
 *    import into a single Lambda ZIP. If we statically import dist/app.mjs,
 *    esbuild re-processes that file and breaks two things:
 *      a) import.meta.url is rewritten to a wrong value, so the CJS banner
 *         (which calls createRequire(import.meta.url)) points to the wrong dir.
 *      b) The pino worker file paths computed at build time (relative to
 *         dist/app.mjs) no longer resolve at Lambda runtime.
 *
 * 2. A dynamic import whose path is built from __dirname at *runtime* cannot
 *    be statically analysed by esbuild, so dist/app.mjs is NOT re-bundled.
 *    Vercel includes it verbatim via the "includeFiles" setting in vercel.json,
 *    and Node.js loads it as a proper ES module — import.meta.url, __dirname
 *    in the banner, and all pino worker paths resolve correctly.
 *
 * Deployment checklist (set in Vercel project settings):
 *   Root Directory : artifacts/api-server
 *   Build Command  : (leave empty — vercel.json buildCommand is used)
 *   Environment    : DATABASE_URL, SESSION_SECRET, CORS_ORIGIN
 */

const path = require("path");

let _app = null;

async function loadApp() {
  if (!_app) {
    // Runtime path — esbuild cannot statically analyse this, so it is NOT
    // re-bundled.  dist/app.mjs is present because vercel.json includeFiles
    // copies the entire dist/ directory into the Lambda package.
    const distAppPath = path.resolve(__dirname, "..", "dist", "app.mjs");
    const mod = await import(`file://${distAppPath}`);
    _app = mod.default;
  }
  return _app;
}

module.exports = async function handler(req, res) {
  const app = await loadApp();
  return app(req, res);
};
