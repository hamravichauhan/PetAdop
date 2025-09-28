// src/pages/EditPet.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input.jsx";
import Textarea from "../components/ui/Textarea.jsx";
import Button from "../components/ui/Button.jsx";
import api from "../utils/api.js"; // axios with baseURL=/api
import { ImageOff } from "lucide-react";

/* ---------- helpers ---------- */
function resolvePhoto(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;

  // Derive server origin from /api baseURL
  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  if (s.startsWith("/api/uploads/")) return `${base}${s.replace(/^\/api/, "")}`;
  if (s.startsWith("/uploads/")) return `${base}${s}`;
  if (s.startsWith("uploads/")) return `${base}/${s}`;
  return `${base}/uploads/${s.replace(/^\/+/, "")}`;
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
export default function EditPet() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [deletedMsg, setDeletedMsg] = React.useState("");

  const [data, setData] = React.useState({
    name: "",
    species: "dog",
    breed: "",
    gender: "male",
    ageMonths: "",
    size: "",
    city: "",
    vaccinated: false,
    dewormed: false,
    sterilized: false,
    description: "",
  });

  // existing photos (strings from API)
  const [existingPhotos, setExistingPhotos] = React.useState([]);
  // new files to upload
  const [files, setFiles] = React.useState([]);

  const update = (k, v) => setData((s) => ({ ...s, [k]: v }));

  // Helper: get newest existing photo (treat end of array as newest)
  const newestExistingPhoto = React.useMemo(() => {
    if (!Array.isArray(existingPhotos) || existingPhotos.length === 0)
      return null;
    return existingPhotos[existingPhotos.length - 1];
  }, [existingPhotos]);

  // Helper: build a primary preview — prefer first selected new file, else newest existing
  const primaryPreview = React.useMemo(() => {
    if (files.length > 0) {
      const f = files[0];
      try {
        return URL.createObjectURL(f);
      } catch {
        return null;
      }
    }
    return resolvePhoto(newestExistingPhoto);
  }, [files, newestExistingPhoto]);

  // load current pet
  const loadPet = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pets/${id}`);
      // API returns { success, data }
      const p = res?.data?.data;
      if (!p) {
        setError("Couldn’t load this pet.");
        setLoading(false);
        return;
      }

      setData({
        name: p.name || "",
        species: p.species || "dog",
        breed: p.breed || "",
        gender: p.gender || "male",
        ageMonths:
          typeof p.ageMonths === "number"
            ? String(p.ageMonths)
            : p.ageMonths || "",
        size: p.size || "",
        city: p.city || "",
        vaccinated: !!p.vaccinated,
        dewormed: !!p.dewormed,
        sterilized: !!p.sterilized,
        description: p.description || "",
      });

      // Keep array as-is; UI will show newest first via reverse() when rendering
      const arr = Array.isArray(p.photos) ? p.photos.slice() : [];
      setExistingPhotos(arr);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Couldn’t load this pet.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      await loadPet();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [loadPet]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const fd = new FormData();
      // scalar fields
      Object.entries({
        name: data.name,
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        ageMonths: data.ageMonths === "" ? "" : Number(data.ageMonths),
        size: data.size,
        city: data.city,
        vaccinated: data.vaccinated,
        dewormed: data.dewormed,
        sterilized: data.sterilized,
        description: data.description,
      }).forEach(([k, v]) => fd.append(k, v));

      // Only append new files if any (backend field name: "photos")
      for (const f of files) fd.append("photos", f);

      await api.patch(`/pets/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Re-fetch to get the updated photo list (includes newly uploaded)
      await loadPet();
      setFiles([]);
      setSaved(true);

      // Navigate back after a short moment so user sees success state
      setTimeout(() => nav(-1), 600);
    } catch (e) {
      console.error(e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  /* Mark as adopted = delete the listing */
  const markAsAdopted = async () => {
    if (deleting || saving || loading) return;
    const yes = window.confirm(
      "Are you sure this pet has been adopted? This will remove the listing."
    );
    if (!yes) return;

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/pets/${id}`); // backend: DELETE /pets/:id
      setDeletedMsg("Listing deleted. Marked as adopted.");
      // short delay so user sees the message, then go to My Listings
      setTimeout(() => nav("/my-listings", { replace: true }), 600);
    } catch (e) {
      console.error(e);
      setError("Couldn’t delete the listing. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Edit pet</h1>

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center text-sm text-mutedForeground">
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {/* Primary preview */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Primary photo (latest)
            </label>
            <div className="h-48 w-full overflow-hidden rounded-2xl border">
              {primaryPreview ? (
                <img
                  src={primaryPreview}
                  alt="Primary preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.replaceWith(
                      Object.assign(document.createElement("div"), {
                        className:
                          "flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800",
                        innerHTML:
                          '<div class="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full bg-black/10 dark:bg-white/10">No photo</div>',
                      })
                    );
                  }}
                />
              ) : (
                <NoPhoto className="h-full w-full" />
              )}
            </div>
            <p className="mt-1 text-xs text-mutedForeground">
              When you add new photos, the latest becomes the primary image.
            </p>
          </div>

          {/* fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              placeholder="Name"
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />

            <select
              className="rounded-2xl bg-muted/60 px-4 py-2.5"
              value={data.species}
              onChange={(e) => update("species", e.target.value)}
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="rabbit">Rabbit</option>
              <option value="other">Other</option>
            </select>

            <Input
              placeholder="Breed"
              value={data.breed}
              onChange={(e) => update("breed", e.target.value)}
            />

            <select
              className="rounded-2xl bg-muted/60 px-4 py-2.5"
              value={data.gender}
              onChange={(e) => update("gender", e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <Input
              placeholder="Age in months"
              type="number"
              min="0"
              value={data.ageMonths}
              onChange={(e) => update("ageMonths", e.target.value)}
            />

            <select
              className="rounded-2xl bg-muted/60 px-4 py-2.5"
              value={data.size}
              onChange={(e) => update("size", e.target.value)}
            >
              <option value="">Size</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>

            <Input
              placeholder="City"
              value={data.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.vaccinated}
                onChange={(e) => update("vaccinated", e.target.checked)}
              />
              Vaccinated
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.dewormed}
                onChange={(e) => update("dewormed", e.target.checked)}
              />
              Dewormed
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.sterilized}
                onChange={(e) => update("sterilized", e.target.checked)}
              />
              Sterilized
            </label>
          </div>

          <Textarea
            placeholder="Description"
            rows={5}
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
          />

          {/* existing photos (newest first in UI) */}
          <div>
            <label className="mb-2 block text-sm">
              Existing photos (newest first)
            </label>
            {existingPhotos.length === 0 ? (
              <div className="h-40 w-full overflow-hidden rounded-2xl">
                <NoPhoto className="h-full w-full" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {[...existingPhotos].reverse().map((p, i) => {
                  const src = resolvePhoto(p);
                  return (
                    <div
                      key={`${p}-${i}`}
                      className="h-24 w-32 overflow-hidden rounded-xl border"
                      title={p}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={`Photo ${i + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.replaceWith(
                              Object.assign(document.createElement("div"), {
                                className:
                                  "flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800",
                                innerHTML:
                                  '<div class="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full bg-black/10 dark:bg-white/10">No photo</div>',
                              })
                            );
                          }}
                        />
                      ) : (
                        <NoPhoto />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* add more photos */}
          <div>
            <label className="mb-2 block text-sm">Add more photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
              <div className="mt-2 text-xs text-mutedForeground">
                {files.length} file(s) selected — newest will be primary after
                save
              </div>
            )}
          </div>

          {saved && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
              Saved! Using your latest image as primary…
            </div>
          )}

          {deletedMsg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
              {deletedMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={saving || deleting}>
              {saving ? "Saving…" : "Save changes"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => nav(-1)}
              disabled={saving || deleting}
            >
              Cancel
            </Button>

            {/* Mark as adopted (delete) */}
            <button
              type="button"
              onClick={markAsAdopted}
              disabled={saving || deleting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              title="Remove the listing (pet adopted)"
            >
              {deleting ? "Deleting…" : "Mark as adopted"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
