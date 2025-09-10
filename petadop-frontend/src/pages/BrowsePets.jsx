import React from 'react'
import PetFilters from '../components/PetFilters.jsx'
import PetCard from '../components/PetCard.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { usePetsStore } from '../store/pets.js'

export default function BrowsePets(){
  const { list, fetchList, loading } = usePetsStore()
  const [filters, setFilters] = React.useState({})

  React.useEffect(()=>{ fetchList({}) }, [fetchList])

  const apply = () => fetchList(filters)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Browse pets</h1>
      <PetFilters value={filters} onChange={setFilters} onSubmit={apply} />
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({length:6}).map((_,i)=>(
          <Skeleton key={i} className="h-72" />
        )) : list.map(p => <PetCard key={p._id} pet={p} />)}
      </div>
    </div>
  )
}
