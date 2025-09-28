// src/components/PetCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuthStore } from "../store/auth.js";

/** Turn a photo value into a browser-loadable URL. */
function resolvePhoto(raw, apiOrigin) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;

  // Normalize to "/uploads/..."
  const path = s.startsWith("/uploads/")
    ? s
    : s.startsWith("uploads/")
    ? `/${s}`
    : s;

  const base = (apiOrigin || "").replace(/\/+$/, "");
  if (path.startsWith("/uploads/")) return `${base}${path}`;
  return `${base}/uploads/${path.replace(/^\/+/, "")}`;
}

export default function PetCard({ pet }) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);

  const API_ORIGIN = import.meta.env?.VITE_API_ORIGIN || "";

  const id = pet?._id || pet?.id;
  const myId = me?._id || me?.id || null;

  // Owner detection handles several shapes
  const ownerId =
    pet?.ownerId ??
    pet?.owner?._id ??
    pet?.owner?.id ??
    pet?.listedBy?._id ??
    pet?.listedBy?.id ??
    (typeof pet?.listedBy === "string" ? pet.listedBy : null);

  const isMine = !!myId && !!ownerId && String(ownerId) === String(myId);

  // NEWEST photo (last), fallback to picsum
  const photo = React.useMemo(() => {
    const arr = Array.isArray(pet?.photos) ? pet.photos : [];
    const raw = arr.length > 0 ? arr[arr.length - 1] : null;
    const resolved = resolvePhoto(raw, API_ORIGIN);
    return (
      resolved ||
      (id
        ? `https://picsum.photos/seed/${id}/600/400`
        : "https://picsum.photos/600/400")
    );
  }, [id, pet?.photos, API_ORIGIN]);

  const onOpen = () => {
    if (!id) return;
    navigate(isMine ? `/pets/${id}/edit` : `/pets/${id}`);
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 shadow-md">
      {/* image (not clickable) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={photo}
          alt={pet?.name || "Pet photo"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallbackApplied === "true") return;
            img.dataset.fallbackApplied = "true";
            img.src = id
              ? `https://picsum.photos/seed/${id}/600/400`
              : "https://picsum.photos/600/400";
          }}
        />
      </div>

      {/* content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white">
          {pet?.name || "Lovely friend"}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-300">
          <MapPin className="h-4 w-4" /> {pet?.city || "Unknown"}
        </p>

        {/* Only this button navigates */}
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 w-full rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          {isMine ? "Edit listing" : "View details"}
        </button>
      </div>
    </div>
  );
}
