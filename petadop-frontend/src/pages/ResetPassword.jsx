// src/pages/ResetPassword.jsx
import React from "react";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuthStore } from "../store/auth.js";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { resetPassword } = useAuthStore();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErr("");

    if (!token)
      return setErr("Reset token missing. Use the link from your email.");
    if (password.length < 8 || password.length > 16)
      return setErr("Password must be 8–16 characters");
    if (password !== confirm) return setErr("Passwords do not match");

    setSubmitting(true);
    const res = await resetPassword({ token, password });
    setSubmitting(false);

    if (res?.ok) {
      setOk(true);
      setTimeout(() => nav("/login", { replace: true }), 1500);
    } else {
      setErr(res?.error || "Reset failed. Request a new link.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Set a new password</h1>
      {!token && (
        <p className="mb-6 text-sm text-danger">
          Missing token in URL. Re-request a reset link.
        </p>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <Input
            id="password"
            placeholder="New password (8–16)"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs text-mutedForeground hover:bg-muted"
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        </div>

        <div className="relative">
          <Input
            id="confirm"
            placeholder="Confirm password"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs text-mutedForeground hover:bg-muted"
          >
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>

        {err && <p className="text-danger text-sm">{err}</p>}
        {ok && (
          <p className="text-emerald-600 text-sm">
            Password updated! Redirecting…
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
