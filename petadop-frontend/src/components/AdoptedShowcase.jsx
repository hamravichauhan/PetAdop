// src/components/AdoptedShowcase.jsx
import React from "react";
import { motion, useAnimation } from "framer-motion";
import SuccessStoryCard from "./SuccessStoryCard.jsx";
import Button from "./ui/Button.jsx";
import { Link } from "react-router-dom";

function useCountUp(value = 0, duration = 0.9) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    const from = 0;
    const diff = value - from;
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      setDisplay(Math.round(from + diff * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

export default function AdoptedShowcase({ adopted = [], adoptedCount = 0 }) {
  const count = useCountUp(adoptedCount);
  const hasData = adopted && adopted.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pets Adopted Till Now</h2>
          <p className="mt-1 text-sm text-mutedForeground">
            These happy endings happened because someone like you chose to open
            their heart.
          </p>
        </div>

        {/* Gradient stat pill */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/10 bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent px-5 py-2 text-sm shadow-soft"
        >
          <span className="opacity-80">Total adoptions:&nbsp;</span>
          <span className="font-semibold tabular-nums">{count}</span>
        </motion.div>
      </div>

      {/* Content */}
      {hasData ? (
        <>
          {/* Horizontal story strip */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"></div>

            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pr-2">
              {adopted.map((s) => (
                <div key={s._id} className="min-w-[320px] snap-start">
                  <SuccessStoryCard story={s} />
                </div>
              ))}
            </div>
          </div>

          {/* Soft nudge */}
          <p className="mt-6 text-center text-sm text-mutedForeground">
            Your story could be next. Start with a visit—see who’s waiting for
            you.
          </p>
        </>
      ) : (
        /* Empty state */
        <div className="rounded-3xl border border-white/10 bg-card/60 p-8 text-center shadow-soft">
          <div className="mx-auto mb-3 size-16 rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 grid place-items-center">
            <span className="text-2xl">🐾</span>
          </div>
          <h3 className="text-xl font-semibold">
            Be the first to make a happy ending
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-mutedForeground">
            No adoptions recorded yet—your kindness could start the wave. Meet a
            pet and change a life today.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button as={Link} to="/pets">
              Meet the pets
            </Button>
            <Button as={Link} to="/register" variant="outline">
              Create account
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
