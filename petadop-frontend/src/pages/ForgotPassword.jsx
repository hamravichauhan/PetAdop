// src/pages/ForgotPassword.jsx
import React from "react";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuthStore } from "../store/auth.js";

export default function ForgotPassword() {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErr("");
    setStatus("");
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) return setErr("Enter a valid email");

    setSubmitting(true);
    const res = await forgotPassword(value);
    setSubmitting(false);

    // Privacy-safe message regardless of backend result
    if (res?.ok)
      setStatus(
        "If an account exists for that email, we’ve sent a reset link."
      );
    else
      setStatus(
        "If an account exists for that email, we’ve sent a reset link."
      );
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Forgot password</h1>
      <p className="mb-6 text-sm text-mutedForeground">
        Enter your account email and we'll send you a password reset link.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="email"
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {err && <p className="text-danger text-sm">{err}</p>}
        {status && <p className="text-emerald-600 text-sm">{status}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}
