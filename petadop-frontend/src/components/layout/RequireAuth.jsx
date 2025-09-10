// src/components/layout/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.js";

export default function RequireAuth({ children }) {
  const { isAuthed, loadingMe } = useAuthStore();
  const loc = useLocation();

  // While we’re restoring session from localStorage + /users/me
  if (loadingMe) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="flex items-center gap-3 text-sm text-mutedForeground">
          <span className="h-3 w-3 animate-pulse rounded-full bg-primary/60" />
          Checking your session…
        </div>
      </div>
    );
  }

  // If not authed, send to /login and remember where user tried to go
  if (!isAuthed) {
    // Keep a simple string path so your Login.jsx `from` works as written
    const fromPath = `${loc.pathname}${loc.search}${loc.hash}`;
    return <Navigate to="/login" replace state={{ from: fromPath }} />;
  }

  // Authed → render the protected content
  return children;
}
