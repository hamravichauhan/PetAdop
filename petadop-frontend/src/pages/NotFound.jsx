import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
export default function NotFound(){
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-2 text-mutedForeground">Oops, the page you're looking for doesn't exist.</p>
      <Button as={Link} to="/" className="mt-6">Go home</Button>
    </div>
  )
}
