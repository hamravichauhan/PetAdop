// src/pages/Login.jsx
import React from "react";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuthStore } from "../store/auth.js";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const { login, isAuthed } = useAuthStore();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);

  const nav = useNavigate();
  const from = useLocation().state?.from || "/";

  // If already logged in, bounce to home (nice UX)
  React.useEffect(() => {
    if (isAuthed) nav("/", { replace: true });
  }, [isAuthed, nav]);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return; // prevent double-submit
    setErr("");

    const em = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) {
      return setErr("Enter a valid email address");
    }
    // If you want to mirror reset rule exactly, use 8–16:
    if (password.length < 8) {
      return setErr("Password must be at least 8 characters");
    }

    setSubmitting(true);
    try {
      // Backend expects { email, password }
      const res = await login({ email: em, password });
      setSubmitting(false);

      if (res?.ok) {
        nav(from, { replace: true });
      } else {
        setErr(res?.message || res?.error || "Invalid credentials");
      }
    } catch {
      setSubmitting(false);
      setErr("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
      <p className="mb-6 text-sm text-mutedForeground">
        Sign in to list pets and manage your adoptions.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <Input
          id="email"
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email username"
          required
        />

        <div className="relative">
          <Input
            id="password"
            placeholder="Password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs text-mutedForeground hover:bg-muted"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        </div>

        {err && <p className="text-danger text-sm">{err}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <div className="mt-2 text-right">
          {/* ✅ route path corrected */}
          <Link to="/forgot-password" className="text-sm underline">
            Forgot password?
          </Link>
        </div>
      </form>

      <p className="mt-4 text-sm text-mutedForeground">
        New here?{" "}
        <Link to="/register" className="underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
