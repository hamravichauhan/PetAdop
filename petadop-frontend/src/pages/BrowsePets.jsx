import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PetFilters from "../components/PetFilters.jsx";
import PetCard from "../components/PetCard.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { usePetsStore } from "../store/pets.js";
import { Filter, Grid, List, ChevronDown, RotateCcw } from "lucide-react";

const SKELETON_COUNT = 9;
const PAGE_SIZE = 9;

export default function BrowsePets() {
  const { list, fetchList, loading, hasMore, error } = usePetsStore();
  const [filters, setFilters] = React.useState({});
  const [sort, setSort] = React.useState("newest"); // newest | ageAsc | ageDesc
  const [view, setView] = React.useState("grid"); // grid | list
  const [page, setPage] = React.useState(1);
  const [showFilters, setShowFilters] = React.useState(false);

  // fetch on mount + when filters/sort change
  React.useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        await fetchList({
          ...filters,
          sort,
          page: 1,
          limit: PAGE_SIZE,
          signal: controller.signal,
          replace: true, // tell store to replace results
        });
        setPage(1);
      } catch (e) {
        // no-op: store may already track error; this keeps UI resilient
      }
    })();
    return () => controller.abort();
  }, [fetchList, JSON.stringify(filters), sort]);

  const onApplyFilters = () => {
    // triggers useEffect (filters dependency)
    setFilters({ ...filters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({});
    setSort("newest");
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    try {
      await fetchList({
        ...filters,
        sort,
        page: next,
        limit: PAGE_SIZE,
        replace: false, // append
      });
      setPage(next);
    } catch (e) {}
  };

  const isEmpty = !loading && !error && list.length === 0;
  const hasActiveFilters = Object.keys(filters).length > 0 || sort !== "newest";

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-pink-800">
              Find Your Perfect Pet
            </h1>
            <p className="mt-1 text-pink-600/80">
              Browse through our adorable pets waiting for a loving home
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-pink-700 shadow-sm ring-1 ring-pink-200/50 hover:bg-pink-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs text-white">
                  !
                </span>
              )}
            </button>

            <div className="relative">
              <select
                className="h-10 rounded-xl border border-pink-200 bg-white px-3 pl-10 pr-8 text-sm text-pink-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300/50"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="ageAsc">Age: Low to High</option>
                <option value="ageDesc">Age: High to Low</option>
              </select>
              <ChevronDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-pink-400" />
            </div>

            <div className="inline-flex overflow-hidden rounded-xl border border-pink-200 shadow-sm">
              <button
                className={`flex h-10 w-10 items-center justify-center text-sm ${
                  view === "grid"
                    ? "bg-pink-100 text-pink-700"
                    : "bg-white text-pink-500 hover:bg-pink-50"
                } transition-colors`}
                onClick={() => setView("grid")}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                className={`flex h-10 w-10 items-center justify-center text-sm ${
                  view === "list"
                    ? "bg-pink-100 text-pink-700"
                    : "bg-white text-pink-500 hover:bg-pink-50"
                } transition-colors`}
                onClick={() => setView("list")}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-pink-200/30">
                <PetFilters
                  value={filters}
                  onChange={setFilters}
                  onSubmit={onApplyFilters}
                />
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-pink-600 hover:bg-pink-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Filters
                  </button>
                  <button
                    onClick={onApplyFilters}
                    className="rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-white shadow-md hover:from-pink-600 hover:to-rose-600"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-pink-100/50 px-4 py-2 text-sm text-pink-700">
            <Filter className="h-4 w-4" />
            <span>Filters applied</span>
            <button
              onClick={clearFilters}
              className="ml-2 text-pink-500 hover:text-pink-700"
            >
              Clear all
            </button>
          </div>
        )}

        {/* States */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            Couldn't load pets right now. Please try again.
          </motion.div>
        )}

        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 rounded-2xl border border-pink-200 bg-white p-10 text-center shadow-sm"
          >
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-pink-100 text-pink-600">
              <span className="text-2xl">🐾</span>
            </div>
            <p className="text-lg font-semibold text-pink-800">
              No pets match your filters
            </p>
            <p className="mt-1 text-sm text-pink-600">
              Try adjusting species, age, or location.
            </p>
            <button
              className="mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-white shadow-md hover:from-pink-600 hover:to-rose-600"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {/* List */}
        <div
          className={
            view === "grid"
              ? "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "mt-6 flex flex-col gap-5"
          }
        >
          {loading && list.length === 0 ? (
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <Skeleton
                key={i}
                className={
                  view === "grid" ? "h-80 rounded-2xl" : "h-40 rounded-2xl"
                }
              />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {list.map((p) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <PetCard pet={p} variant={view} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Load more */}
        {!loading && !isEmpty && hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 flex justify-center"
          >
            <button
              onClick={loadMore}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 text-white shadow-md hover:from-pink-600 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                <>Load More Pets</>
              )}
            </button>
          </motion.div>
        )}

        {/* End of results */}
        {!hasMore && list.length > 0 && (
          <div className="mt-10 text-center text-pink-600/70">
            <p>You've reached the end of our furry friends list! 🐾</p>
          </div>
        )}
      </div>
    </div>
  );
}
