import React from 'react'
import { useParams } from 'react-router-dom'
import { usePetsStore } from '../store/pets.js'
import { Card, CardContent } from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'

function formatAge(months){
  if (months == null) return '—'
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y ? `${y} yr` : null, m ? `${m} mo` : null].filter(Boolean).join(' ')
}

export default function PetDetails(){
  const { id } = useParams()
  const { current, fetchOne } = usePetsStore()

  React.useEffect(()=>{ fetchOne(id) }, [id, fetchOne])

  if (!current) return <div className="mx-auto max-w-7xl px-4 py-8">Loading...</div>

  const photo = current?.photos?.[0] || `https://picsum.photos/seed/${current?._id || 'pet'}/960/640`

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <img src={photo} alt={current.name} className="w-full rounded-3xl object-cover shadow-soft" />
        <Card>
          <CardContent>
            <h1 className="text-3xl font-bold">{current.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-mutedForeground">
              <Badge color="blue" >{current.species}</Badge>
              {current.breed && <Badge>{current.breed}</Badge>}
              <Badge>{current.gender}</Badge>
              {current.size && <Badge>{current.size}</Badge>}
            </div>
            <div className="mt-4 space-y-1 text-mutedForeground">
              <p><strong className="text-foreground">City:</strong> {current.city || '—'}</p>
              <p><strong className="text-foreground">Age:</strong> {formatAge(current.ageMonths)}</p>
              <p><strong className="text-foreground">Health:</strong> {current.vaccinated ? 'Vaccinated' : 'Not vaccinated'} • {current.sterilized ? 'Sterilized' : 'Not sterilized'}</p>
              <p className="pt-2 text-foreground">{current.description || 'No description provided.'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
