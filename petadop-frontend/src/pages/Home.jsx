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
    waitingCount,
    fetchCounts,
  } = usePetsStore();

  React.useEffect(() => {
    fetchFeatured();
    fetchAdopted();
    if (typeof fetchCounts === "function") fetchCounts();
  }, [fetchFeatured, fetchAdopted, fetchCounts]);

  const animatedAdopted = useCountUp(adoptedCount ?? 0);
  const animatedWaiting = useCountUp(waitingCount ?? 0);
  const hasStories = Array.isArray(adopted) && adopted.length > 0;

  return (
    <div className="bg-gradient-to-b from-pink-50/60 to-white min-h-screen">
      {/* Floating hearts decoration */}
      <div className="fixed top-10 left-5 text-pink-300/40 text-2xl animate-bounce">
        ❤️
      </div>
      <div className="fixed top-1/4 right-8 text-pink-200/50 text-xl animate-pulse">
        ❤️
      </div>
      <div className="fixed bottom-20 left-10 text-pink-300/30 text-3xl animate-ping">
        ❤️
      </div>

      {/* HERO — warm + empathic */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-100 to-rose-100/50 py-16">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-pink-200/40 blur-xl"></div>
        <div className="absolute bottom-10 -left-10 h-40 w-40 rounded-full bg-rose-300/30 blur-2xl"></div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <h1 className="bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent sm:text-5xl">
              Find Your Furry Soulmate
              <span className="text-rose-500">.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-pink-800/80 sm:text-lg">
              Every pet here has a story—some are waiting, some have healed, and
              all deserve a home. When you adopt, you don't just rescue a
              pet—you gain a friend who will love you unconditionally.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                as={Link}
                to="/pets"
                aria-label="Browse pets"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                💖 Meet the pets
              </Button>
              <Button
                as={Link}
                to="/new"
                variant="outline"
                aria-label="List a pet"
                className="border-pink-400 text-pink-600 hover:bg-pink-50 hover:shadow-md"
              >
                🐾 List a pet
              </Button>
            </div>
            <div className="mt-4 flex items-center text-sm text-pink-700/80">
              <span className="mr-2 text-lg">✨</span> Your love becomes their
              forever home
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="relative"
          >
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-pink-200/40 via-rose-200/30 to-transparent blur-2xl"></div>
            <div className="overflow-hidden rounded-[2.5rem] shadow-lg ring-2 ring-pink-200/50">
              <img
                src="https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?q=80&w=1200&auto=format&fit=crop"
                alt="A rescued pet being held"
                className="w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 text-pink-700 font-medium text-sm">
                🐶 Meet Bella
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ADOPTED COUNTER + STORIES */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-pink-800">
            Happy Tails & Success Stories
          </h2>
          <p className="mt-2 text-pink-600/80">
            These happy endings happened because someone like you chose to open
            their heart.
          </p>
        </div>

        {/* Stats row (adopted + waiting) */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {/* Total adopted */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-br from-pink-100 to-rose-50 p-6 shadow-md ring-1 ring-pink-200/50"
          >
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-pink-500/20 p-3">
                <span className="text-2xl text-pink-700">🏡</span>
              </div>
              <div>
                <div className="text-sm text-pink-700/80">
                  Total pets adopted
                </div>
                <div className="mt-1 text-3xl font-bold text-pink-800 tabular-nums">
                  {animatedAdopted}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Waiting for adoption */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-br from-pink-100 to-rose-50 p-6 shadow-md ring-1 ring-pink-200/50"
          >
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-rose-500/20 p-3">
                <span className="text-2xl text-rose-700">❤️</span>
              </div>
              <div>
                <div className="text-sm text-pink-700/80">
                  Pets waiting for adoption
                </div>
                <div className="mt-1 text-3xl font-bold text-pink-800 tabular-nums">
                  {animatedWaiting}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {hasStories ? (
          <>
            {/* Horizontal story strip with snap + soft edge fades */}
            <div className="relative mb-8">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" />

              <div
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                aria-label="Adoption success stories"
              >
                {adopted.map((s) => (
                  <div key={s._id} className="min-w-[320px] snap-start">
                    <SuccessStoryCard story={s} />
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-pink-700/80">
              <span className="mr-2">✨</span> Your story could be next. Start
              with a visit—see who's waiting for you.
            </div>
          </>
        ) : (
          /* Empathetic empty state (no account prompt) */
          <div className="rounded-3xl bg-gradient-to-br from-pink-100 to-rose-50 p-8 text-center shadow-md ring-1 ring-pink-200/50">
            <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-pink-200/50 text-pink-700">
              <span className="text-3xl">🐾</span>
            </div>

            <h3 className="text-xl font-semibold text-pink-800">
              Be the first to make a happy ending
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-pink-700/80">
              No adoptions recorded yet—your kindness could start the wave.
              Browse freely (no login needed). When you choose "Adopt", we'll
              guide you the rest of the way.
            </p>

            {/* Reassurance points */}
            <div className="mx-auto mt-6 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
              <div className="rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-pink-200/30">
                <div className="flex items-center">
                  <span className="mr-2 text-pink-600">👀</span>
                  <div className="text-sm font-semibold text-pink-800">
                    Browse freely
                  </div>
                </div>
                <div className="mt-1 text-xs text-pink-700/70">
                  See all pets without signing in.
                </div>
              </div>
              <div className="rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-pink-200/30">
                <div className="flex items-center">
                  <span className="mr-2 text-pink-600">🛡️</span>
                  <div className="text-sm font-semibold text-pink-800">
                    Safe & caring
                  </div>
                </div>
                <div className="mt-1 text-xs text-pink-700/70">
                  Verified listings and helpful guidance.
                </div>
              </div>
              <div className="rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-pink-200/30">
                <div className="flex items-center">
                  <span className="mr-2 text-pink-600">🤝</span>
                  <div className="text-sm font-semibold text-pink-800">
                    Adopt with support
                  </div>
                </div>
                <div className="mt-1 text-xs text-pink-700/70">
                  We'll step in when you're ready.
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <Button
                as={Link}
                to="/pets"
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 text-white shadow-md hover:shadow-lg transition-all"
              >
                Meet the pets
              </Button>
              <Button
                as={Link}
                to="#how-it-works"
                variant="ghost"
                className="text-pink-700 hover:bg-pink-100"
              >
                How adoption works
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* FEATURED — framed as "waiting now" */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16 bg-white rounded-3xl m-4 shadow-sm">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-pink-800">
            Pets Waiting for a Home
          </h2>
          <p className="mt-2 text-pink-600/80">
            These sweethearts are looking for their person—maybe that's you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {featured.map((p) => (
            <PetCard key={p._id} pet={p} />
          ))}
        </div>

        <div className="text-center">
          <Button
            as={Link}
            to="/pets"
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 text-white shadow-md hover:shadow-lg transition-all"
            aria-label="See all pets"
          >
            💕 See All Cuties
          </Button>
        </div>
      </section>

      {/* HOW IT WORKS — friendly 3-step journey */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-12 lg:py-16"
      >
        <div className="rounded-3xl bg-gradient-to-br from-pink-100 to-rose-50 p-8 shadow-md sm:p-10 ring-1 ring-pink-200/30">
          <div className="mb-10 text-center">
            <h3 className="text-3xl font-bold text-pink-800">
              How Adoption Works
            </h3>
            <p className="mt-2 text-pink-700/80">
              Simple steps to find your perfect companion
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-md text-pink-700 ring-1 ring-pink-200/50">
                <span className="text-2xl">1</span>
              </div>
              <h4 className="font-semibold text-pink-800">Browse pets</h4>
              <p className="mt-2 text-pink-700/80">
                Find a friend who speaks to your heart.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.05 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-md text-pink-700 ring-1 ring-pink-200/50">
                <span className="text-2xl">2</span>
              </div>
              <h4 className="font-semibold text-pink-800">Connect</h4>
              <p className="mt-2 text-pink-700/80">
                Ask questions, meet, and make sure it's a match.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-md text-pink-700 ring-1 ring-pink-200/50">
                <span className="text-2xl">3</span>
              </div>
              <h4 className="font-semibold text-pink-800">Bring them home</h4>
              <p className="mt-2 text-pink-700/80">
                Start a new chapter filled with loyalty and love.
              </p>
            </motion.div>
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              as={Link}
              to="/pets"
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 text-white shadow-md hover:shadow-lg transition-all"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="rounded-3xl bg-gradient-to-r from-pink-500 to-rose-500 p-10 text-center text-white shadow-lg relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-pink-400/30 blur-xl"></div>
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-rose-400/30 blur-2xl"></div>

          <h3 className="text-3xl font-bold relative z-10">
            Ready to Make a Difference?
          </h3>
          <p className="mt-2 text-pink-100 relative z-10">
            Open your heart and home to a pet in need today
          </p>
          <div className="mt-6 flex justify-center gap-4 relative z-10">
            <Button
              as={Link}
              to="/pets"
              size="lg"
              className="bg-white text-pink-700 hover:bg-pink-50 border-0 shadow-md hover:shadow-lg transition-all"
            >
              Browse Pets
            </Button>
            <Button
              as={Link}
              to="/new"
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white/10 hover:shadow-md"
            >
              List a Pet
            </Button>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="text-center text-pink-400 text-sm pb-6">
        Made with ❤️ for pets in need
      </div>
    </div>
  );
}
