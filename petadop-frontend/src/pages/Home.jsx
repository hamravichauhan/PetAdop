// src/pages/Home.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import PetCard from "../components/PetCard.jsx";
import { usePetsStore } from "../store/pets.js";
import SuccessStoryCard from "../components/SuccessStoryCard.jsx";

/** Animate numbers */
function useCountUp(value = 0, duration = 900) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    const from = 0;
    const delta = value - from;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(Math.round(from + delta * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

export default function Home() {
  const {
    featured,
    fetchFeatured,
    adopted,
    adoptedCount,
    fetchAdopted,
    // NEW (optional): if you've added these in the store
    waitingCount,
    fetchCounts,
  } = usePetsStore();

  React.useEffect(() => {
    fetchFeatured();
    fetchAdopted();
    if (typeof fetchCounts === "function") fetchCounts(); // safe if not defined yet
  }, [fetchFeatured, fetchAdopted, fetchCounts]);

  const animatedAdopted = useCountUp(adoptedCount ?? 0);
  const animatedWaiting = useCountUp(waitingCount ?? 0);
  const hasStories = Array.isArray(adopted) && adopted.length > 0;

  return (
    <div>
      {/* HERO — warm + empathic */}
      <section className="relative overflow-hidden">
        {/* subtle background texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/15 via-accent/10 to-transparent blur-3xl"
        />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent sm:text-5xl">
              Give a little love, change a whole life
              <span className="text-primary">.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-mutedForeground sm:text-lg">
              Every pet here has a story—some are waiting, some have healed, and
              all deserve a home. When you adopt, you don’t just rescue a
              pet—you gain a friend who believes in you forever.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} to="/pets" aria-label="Browse pets">
                Meet the pets
              </Button>
              <Button
                as={Link}
                to="/new"
                variant="outline"
                aria-label="List a pet"
              >
                List a pet
              </Button>
            </div>
            <div className="mt-4 text-sm text-mutedForeground">
              Your kindness becomes their safe place. 💙
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="relative"
          >
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-2xl"></div>
            <img
              src="https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?q=80&w=1200&auto=format&fit=crop"
              alt="A rescued pet being held"
              className="w-full rounded-[2rem] object-cover shadow-soft"
            />
          </motion.div>
        </div>
      </section>

      {/* ADOPTED COUNTER + STORIES */}
      <section className="mx-auto max-w-7xl px-4 py-10 lg:py-12">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Pets Adopted Till Now
          </h2>
          <p className="mt-1 text-sm text-mutedForeground">
            These happy endings happened because someone like you chose to open
            their heart.
          </p>
        </div>

        {/* NEW: Stats row (adopted + waiting) */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* Total adopted */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-gradient-to-tr from-primary/25 via-accent/10 to-transparent p-5 shadow-soft backdrop-blur-sm ring-1 ring-white/5"
          >
            <div className="text-sm text-mutedForeground/90">
              Total pets adopted
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {animatedAdopted}
            </div>
            <div className="mt-1 text-xs text-mutedForeground">
              All-time successful adoptions
            </div>
          </motion.div>

          {/* Waiting for adoption */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-gradient-to-tr from-primary/25 via-accent/10 to-transparent p-5 shadow-soft backdrop-blur-sm ring-1 ring-white/5"
          >
            <div className="text-sm text-mutedForeground/90">
              Pets waiting for adoption
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {animatedWaiting}
            </div>
            <div className="mt-1 text-xs text-mutedForeground">
              Currently available and looking for a home
            </div>
          </motion.div>
        </div>

        {hasStories ? (
          <>
            {/* Horizontal story strip with snap + soft edge fades */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />

              <div
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                aria-label="Adoption success stories"
              >
                {adopted.map((s) => (
                  <div key={s._id} className="min-w-[320px] snap-start">
                    <SuccessStoryCard story={s} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-mutedForeground">
              Your story could be next. Start with a visit—see who’s waiting for
              you.
            </div>
          </>
        ) : (
          /* Empathetic empty state (no account prompt) */
          <div className="rounded-3xl border border-white/10 bg-card/60 p-8 text-center shadow-soft">
            <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
              <span className="text-2xl">🐾</span>
            </div>

            <h3 className="text-xl font-semibold">
              Be the first to make a happy ending
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm text-mutedForeground">
              No adoptions recorded yet—your kindness could start the wave.
              Browse freely (no login needed). When you choose “Adopt”, we’ll
              guide you the rest of the way.
            </p>

            {/* Reassurance points */}
            <div className="mx-auto mt-4 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                <div className="text-sm font-semibold">Browse freely</div>
                <div className="mt-1 text-xs text-mutedForeground">
                  See all pets without signing in.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                <div className="text-sm font-semibold">Safe & caring</div>
                <div className="mt-1 text-xs text-mutedForeground">
                  Verified listings and helpful guidance.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                <div className="text-sm font-semibold">Adopt with support</div>
                <div className="mt-1 text-xs text-mutedForeground">
                  We’ll step in when you’re ready.
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button as={Link} to="/pets" size="lg">
                Meet the pets
              </Button>
              <Button as={Link} to="#how-it-works" variant="ghost">
                How adoption works
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="mx-auto my-4 h-px max-w-7xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* FEATURED — framed as “waiting now” */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Waiting for a home
            </h2>
            <p className="mt-1 text-sm text-mutedForeground">
              A few friends looking for their person—maybe that’s you.
            </p>
          </div>
          <Button
            as={Link}
            to="/pets"
            variant="ghost"
            aria-label="See all pets"
          >
            See all →
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PetCard key={p._id} pet={p} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto my-4 h-px max-w-7xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* HOW IT WORKS — friendly 3-step journey */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:pb-16">
        <div className="rounded-3xl border border-white/10 bg-card p-8 shadow-soft sm:p-10">
          <h3 className="mb-8 text-center text-2xl font-semibold tracking-tight">
            How adoption works
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/30">
                1
              </div>
              <h4 className="font-semibold">Browse pets</h4>
              <p className="mt-1 text-sm text-mutedForeground">
                Find a friend who speaks to your heart.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.28, delay: 0.05 }}
              className="text-center"
            >
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/30">
                2
              </div>
              <h4 className="font-semibold">Connect</h4>
              <p className="mt-1 text-sm text-mutedForeground">
                Ask questions, meet, and make sure it’s a match.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/30">
                3
              </div>
              <h4 className="font-semibold">Bring them home</h4>
              <p className="mt-1 text-sm text-mutedForeground">
                Start a new chapter filled with loyalty and love.
              </p>
            </motion.div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button as={Link} to="/pets" size="lg">
              Start browsing
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
