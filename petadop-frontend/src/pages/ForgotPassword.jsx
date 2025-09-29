// src/pages/ForgotPassword.jsx
import React from "react";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuthStore } from "../store/auth.js";
import { Link } from "react-router-dom";

function toRelativeIfSameOrigin(link) {
  try {
    const u = new URL(link);
    const here = window.location;
    if (u.origin === here.origin) {
      // keep path+query+hash for SPA routing
      return `${u.pathname}${u.search}${u.hash || ""}`;
    }
    return link; // different origin → leave absolute
  } catch {
    return link; // if parse fails, just return as-is
  }
}

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuthStore();

  // email submission
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // link + token from backend when email exists
  const [resetLink, setResetLink] = React.useState("");
  const [token, setToken] = React.useState("");

  // inline reset form
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [resetting, setResetting] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErr("");
    setStatus("");
    setResetLink("");
    setToken("");
    setResetMsg("");

    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) return setErr("Enter a valid email");

    setSubmitting(true);
    try {
      // Backend should return { success, link? }
      const res = await forgotPassword(value);

      if (res?.link) {
        // ✅ Show link on the page (no email needed)
        setResetLink(res.link);
        setStatus(""); // clear any generic text
        try {
          const url = new URL(res.link);
          const t = url.searchParams.get("token") || "";
          setToken(t);
        } catch {
          // ignore URL parse errors
        }
      } else {
        // Privacy-safe fallback in environments where link isn't returned
        setStatus(
          "If an account exists for that email, we’ve sent a reset link."
        );
      }
    } catch (e2) {
      setErr(e2?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const onInlineReset = async (e) => {
    e.preventDefault();
    if (resetting) return;

    setResetMsg("");
    if (!token) return setResetMsg("Missing token. Please use the link above.");
    if (pwd.length < 8 || pwd.length > 128) {
      return setResetMsg("Password must be 8–128 characters.");
    }
    if (pwd !== pwd2) {
      return setResetMsg("Passwords do not match.");
    }

    setResetting(true);
    try {
      const resp = await resetPassword({ token, password: pwd });
      if (resp?.success || resp?.ok) {
        setResetMsg(
          "✅ Password updated. You can sign in with your new password."
        );
      } else {
        setResetMsg(
          resp?.message || "Could not reset password. The link may be expired."
        );
      }
    } catch (e3) {
      setResetMsg(e3?.message || "Could not reset password.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Forgot password</h1>
      <p className="mb-6 text-sm text-mutedForeground">
        Enter your account email to get a password reset link.
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
        {status && !resetLink && (
          <p className="text-emerald-600 text-sm">{status}</p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      {/* Show the reset link directly on the page (no email) when backend returns it */}
      {resetLink && (
        <div className="mt-8 rounded-xl border p-4">
          <div className="mb-3 text-sm text-mutedForeground">Reset link:</div>

          {/* If same origin, use <Link> with relative path for SPA; else fall back to <a> */}
          {(() => {
            const relative = toRelativeIfSameOrigin(resetLink);
            const sameOrigin = relative !== resetLink;
            return sameOrigin ? (
              <div className="mb-4 break-all">
                <Link to={relative} className="underline text-primary">
                  {resetLink}
                </Link>
              </div>
            ) : (
              <div className="mb-4 break-all">
                <a href={resetLink} className="underline text-primary">
                  {resetLink}
                </a>
              </div>
            );
          })()}

          {/* Inline reset form so the user can change password right here */}
          <form onSubmit={onInlineReset} className="space-y-3">
            <Input
              id="new-password"
              placeholder="New password"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Input
              id="confirm-password"
              placeholder="Confirm new password"
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
              required
            />
            {resetMsg && (
              <p
                className={`text-sm ${
                  resetMsg.startsWith("✅") ? "text-emerald-600" : "text-danger"
                }`}
              >
                {resetMsg}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={resetting}>
              {resetting ? "Updating…" : "Set new password"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
