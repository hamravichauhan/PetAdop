import React from 'react'
import { twMerge } from 'tailwind-merge'
export default function Input({ className='', ...props }){
  return <input className={twMerge('w-full rounded-2xl bg-muted/60 border border-white/10 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary', className)} {...props}/>
}
