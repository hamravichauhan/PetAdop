import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Syringe,
  ShieldCheck,
  Heart,
  ImageOff,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

/** Build a browser-loadable URL for a stored photo value. */
function resolvePhoto(raw, apiOrigin) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Absolute or data URL
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;

  const base = (apiOrigin || "").replace(/\/+$/, "");
  if (s.startsWith("/api/uploads/")) return `${base}${s.replace(/^\/api/, "")}`;
  if (s.startsWith("/uploads/")) return `${base}${s}`;
  if (s.startsWith("uploads/")) return `${base}/${s}`;
  return `${base}/uploads/${s.replace(/^\/+/, "")}`;
}

function NoPhoto({ className = "" }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gray-800 ${className}`}
    >
      <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5">
        <ImageOff className="h-4 w-4 text-gray-300" />
        <span className="text-xs font-medium text-gray-300">No photo</span>
      </div>
    </div>
  );
}

export default function PetCard({ pet, to }) {
  const [liked, setLiked] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const API_ORIGIN = import.meta.env?.VITE_API_ORIGIN || "";

  const photo = React.useMemo(() => {
    const raw = pet?.photos?.[0];
    return resolvePhoto(raw, API_ORIGIN);
  }, [pet?.photos, API_ORIGIN]);

  React.useEffect(() => setImageError(false), [photo]);

  const ageText =
    pet?.ageYears || pet?.ageMonths
      ? [
          pet?.ageYears ? `${pet.ageYears}y` : null,
          pet?.ageMonths ? `${pet.ageMonths}m` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "—";

  const cardHref = to ?? `/pets/${pet?._id || pet?.id}`;

  // owner info
  const owner = pet?.owner || pet?.user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
    >
      <Link
        to={cardHref}
        className="group block overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 shadow-md transition hover:shadow-xl"
      >
        {/* 🧑 Owner info on top */}
        {owner && (
          <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-gray-900/70">
            {owner.avatar ? (
              <img
                src={resolvePhoto(owner.avatar, API_ORIGIN)}
                alt={owner.fullname || "User"}
                className="h-8 w-8 rounded-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                <User className="h-4 w-4 text-gray-300" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {owner.fullname || "Unknown user"}
              </span>
              {owner.email && (
                <span className="text-xs text-gray-400">{owner.email}</span>
              )}
            </div>
          </div>
        )}

        {/* photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {photo && !imageError ? (
            <img
              src={photo}
              alt={pet?.name || "Pet photo"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <NoPhoto />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* top badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-semibold text-white">
              {pet?.status?.toUpperCase?.() === "RESERVED"
                ? "Reserved"
                : pet?.status?.toUpperCase?.() === "ADOPTED"
                ? "Adopted"
                : "Available"}
            </span>
            {pet?.species && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-800">
                {pet.species}
              </span>
            )}
          </div>

          {/* heart/fav */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setLiked((v) => !v);
            }}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-700 shadow hover:bg-white"
            aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
            />
          </button>

          {/* bottom chips */}
          <div className="absolute bottom-3 left-3 flex gap-2 text-xs font-medium">
            {ageText !== "—" && (
              <span className="rounded-full bg-white/90 px-2 py-0.5">
                {ageText}
              </span>
            )}
            {pet?.gender && (
              <span className="rounded-full bg-white/90 px-2 py-0.5">
                {pet.gender}
              </span>
            )}
          </div>
        </div>

        {/* content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white">
            {pet?.name || "Lovely friend"}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-300">
            <MapPin className="h-4 w-4" /> {pet?.city || "Unknown"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {pet?.vaccinated && (
              <span className="flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-0.5 text-white">
                <Syringe className="h-3 w-3" /> Vaccinated
              </span>
            )}
            {pet?.sterilized && (
              <span className="flex items-center gap-1 rounded-full bg-purple-600/90 px-2 py-0.5 text-white">
                <ShieldCheck className="h-3 w-3" /> Sterilized
              </span>
            )}
          </div>

          <button
            className="mt-4 w-full rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            onClick={(e) => e.preventDefault()}
          >
            Adopt me
          </button>

          <p className="mt-2 text-xs text-gray-400">
            Posted{" "}
            {pet?.createdAt
              ? new Date(pet.createdAt).toLocaleDateString()
              : "recently"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
