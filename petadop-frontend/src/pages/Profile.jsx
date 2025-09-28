// src/pages/Profile.jsx
import React from "react";
import { useAuthStore } from "../store/auth.js";
import { usePetsStore } from "../store/pets.js";
import PetCard from "../components/PetCard.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import api from "../utils/api.js";
import { CalendarDays, Mail, Phone, User, Hash } from "lucide-react";

/* ---------- helpers ---------- */
const digitsOnly = (v) => (v == null ? "" : String(v).replace(/\D/g, ""));

function resolveAvatar(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;

  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  if (s.startsWith("/api/uploads/")) return `${base}${s.replace(/^\/api/, "")}`;
  if (s.startsWith("/uploads/")) return `${base}${s}`;
  if (s.startsWith("uploads/")) return `${base}/${s}`;
  return `${base}/uploads/${s.replace(/^\/+/, "")}`;
}

export default function Profile() {
  const { user, loadingMe, loadMe } = useAuthStore();
  const { myListings, fetchMyListings } = usePetsStore();

  React.useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  const [form, setForm] = React.useState({
    fullname: "",
    username: "",
    phone: "",
    avatar: "",
  });

  React.useEffect(() => {
    if (!user) return;
    setForm({
      fullname: user.fullname || "",
      username: user.username || "",
      phone: user.phone || "",
      avatar: user.avatar || "",
    });
  }, [user]);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  function buildDiffPayload() {
    if (!user) return null;
    const phoneDigits = digitsOnly(form.phone);

    // Prepare candidates (trim & normalize)
    const candidate = {
      fullname: form.fullname?.trim(),
      username: form.username?.trim(),
      phone: phoneDigits || "", // if empty, we’ll drop it below
      avatar: (form.avatar || "").trim(),
    };

    // Only include fields that actually changed
    const diff = {};
    if (candidate.fullname && candidate.fullname !== (user.fullname || "")) {
      diff.fullname = candidate.fullname;
    }
    if (candidate.username && candidate.username !== (user.username || "")) {
      diff.username = candidate.username;
    }
    if (candidate.phone !== digitsOnly(user.phone || "")) {
      // allow clearing phone by sending empty string? If backend disallows, just omit when empty:
      if (candidate.phone) diff.phone = candidate.phone;
    }
    if (candidate.avatar !== (user.avatar || "")) {
      // omit blank avatar entirely (let backend keep old one)
      if (candidate.avatar) diff.avatar = candidate.avatar;
      else diff.avatar = ""; // <— if your backend supports clearing avatar; otherwise remove this line
    }

    return diff;
  }

  const submit = async (e) => {
    e?.preventDefault?.();
    if (saving) return;
    setErr("");
    setOk("");

    // front-end validation (basic)
    if (!form.fullname.trim()) return setErr("Full name is required.");
    if (!form.username.trim()) return setErr("Username is required.");
    const phoneDigits = digitsOnly(form.phone);
    if (phoneDigits && !/^[0-9]{10,15}$/.test(phoneDigits)) {
      return setErr("Phone must be 10–15 digits (numbers only).");
    }
    if (form.avatar) {
      try {
        const u = new URL(form.avatar);
        if (!/^https?:$/.test(u.protocol)) throw new Error();
      } catch {
        return setErr("Avatar URL must be a valid http(s) link.");
      }
    }

    const payload = buildDiffPayload();
    if (!payload || Object.keys(payload).length === 0) {
      setOk("Nothing to update.");
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await api.patch("/users/me", payload);
      await loadMe(); // refresh user data
      setOk("Profile updated!");
      setEditing(false);
    } catch (e2) {
      // Surface precise backend reason
      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
        e2?.message ||
        "Failed to update profile.";
      console.warn("PATCH /users/me failed:", msg, e2?.response?.data);
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const avatar =
    resolveAvatar(user?.avatar) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      user?.fullname || user?.username || "Friend"
    )}&backgroundType=gradientLinear`;

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "—";
  const phoneDigits = digitsOnly(user?.phone);
  const waLink = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
        `Hi ${user?.fullname || user?.username || ""}!`
      )}`
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header / identity card */}
      <div className="flex flex-col items-start gap-4 rounded-3xl border p-4 sm:flex-row sm:items-center sm:p-6">
        <img
          src={avatar}
          alt={user?.fullname || "Avatar"}
          className="h-20 w-20 rounded-full object-cover ring-1 ring-white/10"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />

        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold">
              {user?.fullname || user?.username || "Friend"}
            </h1>
            <div className="flex gap-2">
              {!editing ? (
                <Button onClick={() => setEditing(true)} size="sm">
                  Edit profile
                </Button>
              ) : (
                <>
                  <Button onClick={submit} size="sm" disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setErr("");
                      setOk("");
                      setForm({
                        fullname: user?.fullname || "",
                        username: user?.username || "",
                        phone: user?.phone || "",
                        avatar: user?.avatar || "",
                      });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* static info */}
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-mutedForeground sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">
                <span className="mr-1 text-foreground">@</span>
                {user?.username || "—"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a
                href={user?.email ? `mailto:${user.email}` : undefined}
                className="truncate underline-offset-2 hover:underline"
              >
                {user?.email || "—"}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Member since {joined}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:opacity-90"
                  title="Message on WhatsApp"
                >
                  {phoneDigits}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="truncate">
                ID: {user?._id || user?.id || "—"}
              </span>
            </div>
          </div>
        </div>

        {!loadingMe && (
          <div className="mt-2 rounded-2xl bg-muted px-4 py-2 text-sm sm:mt-0">
            {myListings.length} listing{myListings.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {/* Edit form (inline) */}
      {editing && (
        <form
          onSubmit={submit}
          className="mt-4 rounded-3xl border p-4 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              placeholder="Full name"
              value={form.fullname}
              onChange={(e) => onChange("fullname", e.target.value)}
              required
            />
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) => onChange("username", e.target.value)}
              required
            />
            <Input
              placeholder="Phone (digits only)"
              value={form.phone}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => onChange("phone", digitsOnly(e.target.value))}
            />
            <Input
              placeholder="Avatar URL (optional)"
              value={form.avatar}
              onChange={(e) => onChange("avatar", e.target.value)}
            />
          </div>

          {err && <p className="text-sm text-danger">{err}</p>}
          {ok && <p className="text-sm text-emerald-600">{ok}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setErr("");
                setOk("");
                setForm({
                  fullname: user?.fullname || "",
                  username: user?.username || "",
                  phone: user?.phone || "",
                  avatar: user?.avatar || "",
                });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Listings */}
      <h2 className="mt-8 text-2xl font-semibold">My listings</h2>
      {loadingMe ? (
        <p className="mt-3 text-sm text-mutedForeground">Loading…</p>
      ) : myListings.length === 0 ? (
        <p className="mt-3 text-sm text-mutedForeground">
          You haven’t posted any pets yet.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myListings.map((p) => (
            <PetCard key={p._id || p.id} pet={p} />
          ))}
        </div>
      )}
    </div>
  );
}
