import React from "react";
import { motion } from "framer-motion";
import { MapPin, Syringe, ShieldCheck, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function PetCard({ pet }) {
  const [liked, setLiked] = React.useState(false);
  const photo =
    pet?.photos?.[0] || `https://picsum.photos/seed/${pet?._id}/600/400`;
  const ageText =
    pet?.ageYears || pet?.ageMonths
      ? [
          pet.ageYears ? `${pet.ageYears}y` : null,
          pet.ageMonths ? `${pet.ageMonths}m` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
    >
      <Link
        to={`/pets/${pet._id}`}
        className="group block overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 shadow-md transition hover:shadow-xl"
      >
        {/* photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={photo}
            alt={pet?.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* top badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-semibold text-white">
              Available
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

          {/* vaccinated/sterilized */}
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

          {/* CTA */}
          <button className="mt-4 w-full rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
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
