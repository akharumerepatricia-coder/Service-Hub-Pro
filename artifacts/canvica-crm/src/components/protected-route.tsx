import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();

  // Still checking session
  if (authenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!authenticated) {
    return <Redirect to="/crm/login" />;
  }

  return <>{children}</>;
}
