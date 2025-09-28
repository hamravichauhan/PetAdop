// src/pages/Register.jsx
import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuthStore } from "../store/auth.js";

/** Preview-only default avatar (backend will generate its own if none sent) */
function buildDefaultAvatar({ username = "", fullname = "" }) {
  const seed = (username?.trim() || fullname?.trim() || "friend")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundType=gradientLinear`;
}

const digitsOnly = (v) => (v == null ? "" : String(v).replace(/\D/g, ""));

export default function Register() {
  const { register: signup, isAuthed } = useAuthStore();
  const nav = useNavigate();
  const from = useLocation().state?.from || "/";

  const [form, setForm] = React.useState({
    fullname: "",
    username: "",
    email: "",
    phone: "", // UI-only; we send contactPhone to backend
    password: "",
    confirm: "",
  });

  // Optional avatar controls
  const [avatarMode, setAvatarMode] = React.useState("auto"); // "auto" | "custom"
  const [avatarUrl, setAvatarUrl] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const autoAvatar = buildDefaultAvatar(form);
  const resolvedAvatar =
    avatarMode === "auto" ? autoAvatar : (avatarUrl || "").trim();

  const validate = () => {
    if (!form.fullname.trim()) return "Full name is required";
    if (!form.username.trim()) return "Username is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Enter a valid email";

    const phoneDigits = digitsOnly(form.phone);
    if (!/^[0-9]{10,15}$/.test(phoneDigits))
      return "Phone must be 10–15 digits (numbers only)";

    const len = form.password.length;
    if (len < 8 || len > 16) return "Password must be 8–16 characters";
    if (form.password !== form.confirm) return "Passwords do not match";

    if (avatarMode === "custom") {
      if (!resolvedAvatar) return "Enter an avatar URL or switch to Auto";
      try {
        const u = new URL(resolvedAvatar);
        if (!/^https?:$/.test(u.protocol)) return "Avatar URL must be http(s)";
      } catch {
        return "Enter a valid avatar URL";
      }
    }
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    const msg = validate();
    if (msg) return setError(msg);

    setSubmitting(true);

    // Only send avatar if user chose a custom URL.
    // Backend will generate a default avatar if avatar is omitted.
    const payload = {
      fullname: form.fullname.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      contactPhone: digitsOnly(form.phone), // ✅ backend expects contactPhone (digits only)
      password: form.password,
      ...(avatarMode === "custom" && resolvedAvatar
        ? { avatar: resolvedAvatar }
        : {}),
    };

    try {
      const res = await signup(payload);
      setSubmitting(false);

      if (res?.ok) {
        nav(from, { replace: true });
      } else {
        // Prefer backend message if present
        setError(
          res?.message || res?.error || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
    }
  };

  // If already authed, bounce to home (nice UX)
  React.useEffect(() => {
    if (isAuthed) nav("/", { replace: true });
  }, [isAuthed, nav]);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-mutedForeground">
        Join the community—save your favorites and list pets for adoption with
        ease.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="fullname"
          placeholder="Full name"
          value={form.fullname}
          onChange={(e) => update("fullname", e.target.value)}
          autoComplete="name"
          required
        />
        <Input
          id="username"
          placeholder="Username"
          value={form.username}
          onChange={(e) => update("username", e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          id="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
          required
        />

        {/* ✅ Phone number (UI keeps digits only; backend receives contactPhone) */}
        <Input
          id="phone"
          placeholder="Phone (digits only, e.g., 919876543210)"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]{10,15}"
          value={form.phone}
          onChange={(e) => update("phone", digitsOnly(e.target.value))}
          autoComplete="tel"
          required
        />
        <p className="text-xs text-mutedForeground -mt-2">
          We’ll use this to connect adopters to you on WhatsApp.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Input
              id="password"
              placeholder="Password (8–16)"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete="new-password"
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

          <div className="relative">
            <Input
              id="confirm"
              placeholder="Confirm password"
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => update("confirm", e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs text-mutedForeground hover:bg-muted"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Avatar (optional) */}
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Avatar (optional)</span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAvatarMode("auto")}
                className={`rounded-md px-2 py-1 ${
                  avatarMode === "auto"
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setAvatarMode("custom")}
                className={`rounded-md px-2 py-1 ${
                  avatarMode === "custom"
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                Custom URL
              </button>
            </div>
          </div>

          {avatarMode === "custom" ? (
            <div className="grid gap-3 sm:grid-cols-[1fr,120px]">
              <Input
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                autoComplete="off"
              />
              <div className="grid place-items-center">
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt="avatar preview"
                    className="h-16 w-16 rounded-full object-cover ring-1 ring-white/10"
                    onError={() => setError("Avatar URL is not reachable")}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted" />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-mutedForeground">
                We’ll generate a clean avatar from your name. You can change it
                later.
              </p>
              <img
                src={autoAvatar}
                alt="auto avatar preview"
                className="h-16 w-16 rounded-full ring-1 ring-white/10"
              />
            </div>
          )}
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating…" : "Sign up"}
        </Button>

        <p className="text-center text-sm text-mutedForeground">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
