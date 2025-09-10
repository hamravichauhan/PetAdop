// src/components/StatsRow.jsx
import React from "react";
import { motion } from "framer-motion";

function StatCard({ label, value, hint }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex-1 rounded-2xl border border-white/10 bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent p-5 shadow-soft backdrop-blur-sm ring-1 ring-white/5"
    >
      <div className="text-sm text-mutedForeground/90">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-mutedForeground">{hint}</div>}
    </motion.div>
  );
}

export default function StatsRow({ adopted = 0, waiting = 0 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        label="Total pets adopted"
        value={adopted}
        hint="All-time successful adoptions"
      />
      <StatCard
        label="Pets waiting for adoption"
        value={waiting}
        hint="Currently available and looking for a home"
      />
    </div>
  );
}
