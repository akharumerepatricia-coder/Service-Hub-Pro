---
name: Vercel serverless + TypeScript workspace packages
description: Why api/ serverless functions must import pre-built JS, not workspace .ts source
---

## Rule
Vercel's `@vercel/node` bundler cannot resolve pnpm workspace packages whose
`exports` field points to raw `.ts` source files (e.g. `"./src/index.ts"`).
The function silently fails to deploy and Vercel returns `NOT_FOUND` (404) for
every matching route — no build-time error is shown to the user.

**Why:** `@vercel/node` uses its own esbuild pipeline and does not honour the
workspace `customConditions: ["workspace"]` TypeScript resolver or follow pnpm
symlinks the same way the local dev environment does.

## How to apply
Any `api/*.ts` Vercel function that needs code from a workspace package must
import from a **pre-built JS bundle**, not from `src/*.ts`.

Pattern used in this project:
1. Add the Express app (`src/app.ts`) as a second esbuild entry point in
   `artifacts/api-server/build.mjs` → emits `dist/app.mjs`.
2. `api/[...slug].ts` imports `'../artifacts/api-server/dist/app.mjs'`.
3. `vercel.json` `buildCommand` runs the API server build first so `dist/app.mjs`
   is always fresh before the static site is built.

## Symptoms to recognise
- `/api/*` routes return `HTTP 404 NOT_FOUND` with a Vercel request ID.
- The same routes work perfectly in local dev (Vite proxy → Express server).
- No TypeScript errors locally; error only appears on Vercel deployment.
