import http from "http";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── SESSION_SECRET ───────────────────────────────────────────────────────────
// A missing SESSION_SECRET must NOT crash the module at load time — that would
// make /api/health unreachable and produce a Vercel 404 on every cold start.
// We log a warning and use a placeholder; auth routes independently gate on
// the presence of the real secret at request time (see routes/auth.ts).
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  logger.warn(
    "SESSION_SECRET is not set — authentication will not work. " +
    "Set SESSION_SECRET in your environment variables.",
  );
}

// Trust the first proxy hop so secure cookies work behind HTTPS reverse proxies
// (Replit, Vercel, etc.) in production.
app.set("trust proxy", 1);

app.use(
  session({
    secret: SESSION_SECRET ?? "__INSECURE_PLACEHOLDER__DO_NOT_USE_IN_PRODUCTION__",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// ── CORS ─────────────────────────────────────────────────────────────────────
// When the API and frontend share the same Vercel project (same domain) no
// CORS headers are needed at all.  When VITE_API_URL points to a separate
// deployment, we allow that origin explicitly.
//
// CORS_ORIGIN env var — comma-separated list of allowed origins.
// Falls back to permitting all *.vercel.app domains and localhost.
const corsOriginEnv = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin requests have no Origin header — always allow.
      if (!origin) return callback(null, true);

      if (corsOriginEnv) {
        const allowed = corsOriginEnv.split(",").map((o) => o.trim());
        if (allowed.some((o) => origin === o || origin.startsWith(o))) {
          return callback(null, true);
        }
      }

      // Permit all Vercel preview/production URLs and local dev unconditionally.
      if (
        origin.endsWith(".vercel.app") ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }

      callback(new Error(`CORS: origin "${origin}" is not allowed`));
    },
    credentials: true, // Required for session cookies in cross-origin requests
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: http.IncomingMessage & { id?: unknown }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: http.ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ── Global error handler ─────────────────────────────────────────────────────
// Express 5 automatically forwards async route errors here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
