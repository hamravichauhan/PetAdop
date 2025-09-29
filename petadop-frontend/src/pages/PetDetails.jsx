// src/pages/PetDetails.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePetsStore } from "../store/pets.js";
import { Card, CardContent } from "../components/ui/Card.jsx";
import { useAuthStore } from "../store/auth.js";
import Badge from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import api from "../utils/api.js";
import {
  MapPin,
  Syringe,
  ShieldCheck,
  Baby,
  Dog,
  Cat,
  Share2,
  Flag,
  CalendarDays,
  Check,
  ImageOff,
  Phone,
  MessageCircle,
  User,
} from "lucide-react";

/* ---------- utils ---------- */
function formatAge(months) {
  if (months == null) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr` : null, m ? `${m} mo` : null].filter(Boolean).join(" ");
}

/** Resolve photo path using api.defaults.baseURL to find the host */
function resolvePhoto(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;

  const baseURL = api?.defaults?.baseURL || "";
  const host = baseURL.replace(/\/api\/?$/, "");

  if (s.startsWith("/api/uploads/")) return `${host}${s.replace(/^\/api/, "")}`;
  if (s.startsWith("/uploads/")) return `${host}${s}`;
  if (s.startsWith("uploads/")) return `${host}/${s}`;
  return `${host}/uploads/${s.replace(/^\/+/, "")}`;
}

const digitsOnly = (v) => (v == null ? "" : String(v).replace(/\D/g, ""));

/* Owner info aggregator */
function getOwnerInfo(pet) {
  const listedByObj =
    typeof pet?.listedBy === "object" && pet.listedBy ? pet.listedBy : null;

  const ownerName =
    pet?.ownerName || listedByObj?.fullname || listedByObj?.username || "Owner";

  const ownerPhone =
    pet?.contactPhone || pet?.ownerPhone || listedByObj?.phone || "";

  const ownerId =
    pet?.ownerId ??
    listedByObj?._id ??
    listedByObj?.id ??
    (typeof pet?.listedBy === "string" ? pet.listedBy : null);

  const ownerAvatar = listedByObj?.avatar
    ? resolvePhoto(listedByObj.avatar)
    : null;

  return {
    ownerId: ownerId || null,
    ownerName,
    ownerPhone,
    ownerAvatar,
  };
}

function NoPhoto({ className = "" }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}
    >
      <div className="flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 dark:bg-white/10">
        <ImageOff className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          No photo
        </span>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function PetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { current, fetchOne, loading, error } = usePetsStore();

  React.useEffect(() => {
    fetchOne(id);
  }, [id, fetchOne]);

  // Local UI state (declare ALL hooks unconditionally)
  const [copied, setCopied] = React.useState(false);
  const [mainIdx, setMainIdx] = React.useState(0);
  const [mainError, setMainError] = React.useState(false);
  const [thumbErrors, setThumbErrors] = React.useState({}); // { [index]: true }
  const [showOwnerCard, setShowOwnerCard] = React.useState(false);

  // Derive photos safely even when `current` is not loaded yet
  const resolvedPhotos = React.useMemo(() => {
    if (!current || !Array.isArray(current.photos)) return [];
    return current.photos.map((p) => resolvePhoto(p)).filter(Boolean);
  }, [current]);

  const photos = resolvedPhotos.length > 0 ? resolvedPhotos : [null];
  const safeIdx = Math.min(mainIdx, Math.max(photos.length - 1, 0));
  const mainPhoto = photos[safeIdx] || null;

  // Reset main image error whenever the main photo source changes
  React.useEffect(() => {
    setMainError(false);
  }, [mainPhoto]);

  const posted = current?.createdAt
    ? new Date(current.createdAt).toLocaleDateString()
    : "recently";

  const goodWith = [
    current?.goodWithKids ? { label: "Kids", icon: Baby } : null,
    current?.goodWithDogs ? { label: "Dogs", icon: Dog } : null,
    current?.goodWithCats ? { label: "Cats", icon: Cat } : null,
  ].filter(Boolean);

  const copyLink = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: current?.name || "PetAdop", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* ignore */
    }
  };

  // 👉 Adopt: show owner card (or ask to login first)
  const handleAdopt = () => {
    if (!user) {
      navigate(`/login?redirect=/pets/${id}`);
      return;
    }
    setShowOwnerCard(true);
  };

  /* ---------- render ---------- */
  const showLoading = loading && !current;
  const showError = !!error;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {showLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-[360px] rounded-3xl" />
          <Skeleton className="h-[360px] rounded-3xl" />
        </div>
      ) : showError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Couldn’t load this pet right now. Please try again.
        </div>
      ) : !current ? (
        <div className="text-center text-sm text-mutedForeground">
          Pet not found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* LEFT: Media + details */}
          <div className="lg:col-span-2">
            {/* main image */}
            <div className="relative overflow-hidden rounded-3xl shadow-soft">
              <div className="relative aspect-[3/2] w-full bg-gray-100 dark:bg-gray-800">
                {mainPhoto && !mainError ? (
                  <img
                    src={mainPhoto}
                    alt={current.name || "Adoptable pet"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setMainError(true)}
                  />
                ) : (
                  <NoPhoto />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge color="green">{current?.status || "Available"}</Badge>
                  {current?.species && (
                    <Badge className="capitalize">{current.species}</Badge>
                  )}
                  {current?.breed && <Badge>{current.breed}</Badge>}
                </div>
              </div>

              {/* thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto p-3">
                  {photos.map((src, i) => {
                    const broken = thumbErrors[i] || !src;
                    return (
                      <button
                        key={i}
                        onClick={() => setMainIdx(i)}
                        className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border ${
                          safeIdx === i
                            ? "ring-2 ring-emerald-500"
                            : "opacity-80 hover:opacity-100"
                        }`}
                        aria-label={`Show photo ${i + 1}`}
                      >
                        {broken ? (
                          <NoPhoto />
                        ) : (
                          <img
                            src={src}
                            alt={`Thumbnail ${i + 1}`}
                            className="h-full w-full object-cover"
                            onError={() =>
                              setThumbErrors((prev) => ({ ...prev, [i]: true }))
                            }
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Title + meta */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold tracking-tight">
                {current.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-mutedForeground">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>Posted {posted}</span>
                </div>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-gray-50 dark:hover:bg-white/10"
                  title="Share / Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Share"}
                </button>
                <button
                  onClick={() => {}}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-gray-50 dark:hover:bg-white/10"
                  title="Report listing"
                >
                  <Flag className="h-4 w-4" />
                  Report
                </button>
              </div>
            </div>

            {/* Facts grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border p-4 sm:grid-cols-4">
              <Fact label="City" value={current.city || "—"} icon={MapPin} />
              <Fact label="Age" value={formatAge(current.ageMonths)} />
              <Fact label="Gender" value={current.gender || "—"} />
              <Fact label="Size" value={current.size || "—"} />
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {current.vaccinated && (
                <div className="bg-black text-white rounded-md px-2 py-1 flex items-center gap-1">
                  <Syringe size={14} /> Vaccinated
                </div>
              )}
              {current.sterilized && (
                <div className="bg-black text-white rounded-md px-2 py-1 flex items-center gap-1">
                  <ShieldCheck size={14} /> Sterilized
                </div>
              )}
            </div>

            {/* Good with */}
            {goodWith.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-mutedForeground">
                  Good with:
                </span>
                {goodWith.map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <Card className="mt-6">
              <CardContent>
                <h2 className="text-xl font-semibold">About {current.name}</h2>
                <p className="mt-2 leading-relaxed text-mutedForeground">
                  {current.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Sticky actions + Owner contact (revealed on adopt) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-mutedForeground">
                      Ready to give {current.name} a loving home?
                    </div>
                    <button
                      onClick={handleAdopt}
                      className="w-full rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      Adopt this {current.species?.toLowerCase() || "pet"}
                    </button>
                  </div>

                  {/* quick recap */}
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <MiniStat label="Breed" value={current.breed || "—"} />
                    <MiniStat
                      label="Age"
                      value={formatAge(current.ageMonths)}
                    />
                    <MiniStat label="Gender" value={current.gender || "—"} />
                    <MiniStat label="City" value={current.city || "—"} />
                  </div>
                </CardContent>
              </Card>

              {/* Owner Contact shown after clicking Adopt */}
              {showOwnerCard && <OwnerContactCard pet={current} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Owner Contact Card ---------- */
function OwnerContactCard({ pet }) {
  const { ownerId, ownerName, ownerPhone, ownerAvatar } = getOwnerInfo(pet);
  const phoneDigits = digitsOnly(ownerPhone);

  const waLink = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
        `Hi ${ownerName || "there"}, I'm interested in adopting "${
          pet?.name
        }". Is it still available?`
      )}`
    : null;

  return (
    <Card className="mt-4">
      <CardContent>
        <h3 className="text-sm font-semibold">Owner contact</h3>

        <div className="mt-3 flex items-center gap-3">
          {ownerAvatar ? (
            <img
              src={ownerAvatar}
              alt={ownerName || "Owner"}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-200 dark:bg-gray-700">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
          )}

          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {ownerName || "Owner"}
            </div>
            <div className="truncate text-xs text-mutedForeground">
              {ownerId ? `ID: ${ownerId}` : "—"}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/10 ${
              phoneDigits ? "" : "pointer-events-none opacity-50"
            }`}
            href={phoneDigits ? `tel:${phoneDigits}` : undefined}
          >
            <Phone className="h-4 w-4" />
            Call
          </a>

          <a
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/10 ${
              waLink ? "" : "pointer-events-none opacity-50"
            }`}
            href={waLink || undefined}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>

        {!phoneDigits && (
          <p className="mt-2 text-xs text-amber-600">
            The owner hasn’t provided a phone number.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- small helpers ---------- */
function Fact({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-background/40 p-3">
      {Icon && <Icon className="h-4 w-4 text-mutedForeground" />}
      <div>
        <div className="text-xs text-mutedForeground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function TrustPill({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium shadow dark:bg-white/10">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-mutedForeground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
