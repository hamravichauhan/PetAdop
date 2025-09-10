import React from 'react'
import { twMerge } from 'tailwind-merge'
export function Card({ className='', ...props }){
  return <div className={twMerge('rounded-3xl bg-card text-cardForeground p-5 shadow-soft card-hover', className)} {...props} />
}
export function CardHeader({ className='', ...props }) {
  return <div className={twMerge('mb-3 flex items-center justify-between', className)} {...props} />
}
export function CardTitle({ className='', ...props }){
  return <h3 className={twMerge('text-xl font-semibold', className)} {...props} />
}
export function CardContent({ className='', ...props }){
  return <div className={twMerge('space-y-3', className)} {...props} />
}
