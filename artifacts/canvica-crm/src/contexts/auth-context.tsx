import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthState {
  authenticated: boolean | null; // null = loading
  email: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ authenticated: null, email: null });

  // Check session on mount
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { authenticated: boolean; email?: string }) => {
        setState({ authenticated: data.authenticated, email: data.email ?? null });
      })
      .catch(() => {
        setState({ authenticated: false, email: null });
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setState({ authenticated: true, email: email.toLowerCase() });
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Login failed" };
    } catch {
      return { ok: false, error: "Network error — please try again" };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setState({ authenticated: false, email: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
