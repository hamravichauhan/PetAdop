import React from 'react'
import { twMerge } from 'tailwind-merge'
export default function Button({ as:Comp='button', className='', variant='primary', size='md', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-2xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary text-primaryForeground hover:opacity-90',
    ghost: 'bg-transparent hover:bg-muted',
    outline: 'border border-white/10 hover:bg-muted',
    danger: 'bg-danger text-background hover:opacity-90'
  }
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-5 py-3 text-lg'
  }
  const cls = twMerge(base, variants[variant]||variants.primary, sizes[size]||sizes.md, className)
  return <Comp className={cls} {...props} />
}
