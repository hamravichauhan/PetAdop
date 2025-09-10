// src/components/SuccessStoryCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/Card.jsx";
import Badge from "./ui/Badge.jsx";

export default function SuccessStoryCard({ story }) {
  const img =
    story?.afterPhoto ||
    story?.photos?.[0] ||
    `https://picsum.photos/seed/${story?._id || Math.random()}/800/600`;
  const name = story?.name || "A friend";
  const city = story?.city || "Somewhere";
  const quote = story?.quote || "“We found each other at the right time.”";
  const adopter = story?.adopterName || "A loving family";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <img
            src={img}
            alt={`${name} adopted`}
            className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{name}</h3>
            <Badge color="green">Adopted</Badge>
          </div>
          <p className="mt-2 text-sm text-mutedForeground">{quote}</p>
          <p className="mt-2 text-xs text-mutedForeground">
            Adopted by <span className="text-foreground/90">{adopter}</span> •{" "}
            {city}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
