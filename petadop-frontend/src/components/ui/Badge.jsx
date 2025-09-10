import React from 'react'
export default function Badge({ children, color='slate' }){
  const palette = {
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blue: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    slate: 'bg-white/10 text-white/80 border-white/20'
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${palette[color]||palette.slate}`}>{children}</span>
}
