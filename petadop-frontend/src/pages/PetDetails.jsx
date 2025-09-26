// src/pages/PetDetails.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePetsStore } from "../store/pets.js";
import { Card, CardContent } from "../components/ui/Card.jsx";
import { useAuthStore } from "../store/auth.js";
import Badge from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import api from "../utils/api.js"; // ✅ already has baseURL=/api
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
} from "lucide-react";

/* ---------- utils ---------- */
function formatAge(months) {
  if (months == null) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr` : null, m ? `${m} mo` : null].filter(Boolean).join(" ");
}

function safePhoto(src, seed = "pet", w = 960, h = 640) {
  return src && String(src).trim()
    ? src
    : `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

// ✅ new: build full URL for uploaded photos
function buildPhotoUrl(filename) {
  if (!filename) return null;
  // if api.defaults.baseURL = http://localhost:5000/api
  const base = api.defaults.baseURL.replace(/\/api$/, "");
  return `${base}/uploads/${filename}`;
}

const digitsOnly = (v) => (v == null ? "" : String(v).replace(/\D/g, ""));

/* ---------- page ---------- */
export default function PetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { current, fetchOne, loading, error } = usePetsStore();

  React.useEffect(() => {
    fetchOne(id);
  }, [id, fetchOne]);

  const [copied, setCopied] = React.useState(false);
  const [mainIdx, setMainIdx] = React.useState(0);

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
    } catch {}
  };

  // 👉 Adopt
  const handleAdopt = () => {
    if (!user) {
      navigate(`/login?redirect=/pets/${id}`);
      return;
    }

    const ownerId = current.ownerId; // Ensure this is available
    if (!ownerId) {
      console.error("Owner ID not found for this pet.");
      return;
    }

    navigate(`/owners/${ownerId}`);
  };

  // 👉 Message Owner (WhatsApp deep-link)
  const handleMessageOwner = () => {
    if (!current) return;
    const rawPhone =
      current.contactPhone ||
      current?.listedBy?.phone ||
      current?.ownerPhone ||
      "";
    const phone = digitsOnly(rawPhone);
    if (!phone) {
      alert("Owner has not provided a phone number.");
      return;
    }
    const ownerName =
      current?.listedBy?.fullname || current?.ownerName || "there";
    const message = `Hi ${ownerName}, I'm interested in adopting "${current.name}". Is it still available?`;
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, "_blank");
  };

  /* ---------- states ---------- */
  if (loading && !current) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-[360px] rounded-3xl" />
          <Skeleton className="h-[360px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Couldn’t load this pet right now. Please try again.
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-mutedForeground">
        Pet not found.
      </div>
    );
  }

  /* ---------- data ---------- */
  const photos = (
    current.photos && current.photos.length ? current.photos : [null]
  ).map((p, i) => buildPhotoUrl(p) || safePhoto(p, current?._id || `pet-${i}`));

  const mainPhoto = photos[Math.min(mainIdx, photos.length - 1)] || photos[0];
  const posted = current?.createdAt
    ? new Date(current.createdAt).toLocaleDateString()
    : "recently";

  const goodWith = [
    current?.goodWithKids ? { label: "Kids", icon: Baby } : null,
    current?.goodWithDogs ? { label: "Dogs", icon: Dog } : null,
    current?.goodWithCats ? { label: "Cats", icon: Cat } : null,
  ].filter(Boolean);

  /* ---------- render ---------- */
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT: Media + details */}
        <div className="lg:col-span-2">
          {/* main image */}
          <div className="relative overflow-hidden rounded-3xl shadow-soft">
            <div className="relative aspect-[3/2] w-full bg-gray-100 dark:bg-gray-800">
              <img
                src={mainPhoto}
                alt={current.name || "Adoptable pet"}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = safePhoto(null, "fallback");
                }}
              />
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
                {photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setMainIdx(i)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border ${
                      mainIdx === i
                        ? "ring-2 ring-emerald-500"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    aria-label={`Show photo ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`Thumbnail ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = safePhoto(
                          null,
                          "thumb-fallback",
                          280,
                          200
                        );
                      }}
                    />
                  </button>
                ))}
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
              <TrustPill icon={Syringe} text="Vaccinated" />
            )}
            {current.sterilized && (
              <TrustPill icon={ShieldCheck} text="Sterilized" />
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

        {/* RIGHT: Sticky actions */}
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
                  <MiniStat label="Age" value={formatAge(current.ageMonths)} />
                  <MiniStat label="Gender" value={current.gender || "—"} />
                  <MiniStat label="City" value={current.city || "—"} />
                </div>
              </CardContent>
            </Card>

            {(current.shelterName || current.ownerName) && (
              <Card className="mt-4">
                <CardContent>
                  <h3 className="text-sm font-semibold">Posted by</h3>
                  <div className="mt-1 text-sm text-mutedForeground">
                    {current.shelterName || current.ownerName}
                  </div>
                  {current.shelterPhone && (
                    <a
                      href={`tel:${digitsOnly(current.shelterPhone)}`}
                      className="mt-3 block rounded-xl border px-3 py-2 text-center text-sm hover:bg-gray-50 dark:hover:bg-white/10"
                    >
                      Call
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
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
