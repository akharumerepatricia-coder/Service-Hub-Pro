import { Router } from "express";

const router = Router();

// Hardcoded staff credentials — replace with DB-backed users when ready.
const STAFF_EMAIL = (process.env.STAFF_EMAIL ?? "admin@canvica.com").toLowerCase();
const STAFF_PASSWORD = process.env.STAFF_PASSWORD ?? "canvica2026";

router.post("/auth/login", (req, res) => {
  // Guard: if SESSION_SECRET was not provided at startup, sessions are non-functional.
  if (!process.env.SESSION_SECRET) {
    res.status(503).json({
      error: "Authentication is not available. SESSION_SECRET is not configured on this deployment.",
    });
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  if (email.toLowerCase() !== STAFF_EMAIL || password !== STAFF_PASSWORD) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.authenticated = true;
  req.session.email = email.toLowerCase();

  res.json({ ok: true });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (req.session.authenticated) {
    res.json({ authenticated: true, email: req.session.email });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
