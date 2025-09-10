import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.js'

export default function ProtectedRoute({ children }){
  const { isAuthed } = useAuthStore()
  const location = useLocation()
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
