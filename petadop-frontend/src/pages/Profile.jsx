import React from 'react'
import { useAuthStore } from '../store/auth.js'
import { usePetsStore } from '../store/pets.js'
import PetCard from '../components/PetCard.jsx'

export default function Profile(){
  const { user } = useAuthStore()
  const { myListings, fetchMyListings } = usePetsStore()

  React.useEffect(()=>{ fetchMyListings() }, [fetchMyListings])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Hello, {user?.fullname || user?.username || 'Friend'}</h1>
      <p className="mt-1 text-mutedForeground">{user?.email}</p>
      <h2 className="mt-8 text-2xl font-semibold">My listings</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {myListings.map(p => <PetCard key={p._id} pet={p} />)}
      </div>
    </div>
  )
}
