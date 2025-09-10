import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Syringe, ShieldCheck, Dog, Cat, Rabbit } from 'lucide-react'
import Badge from './ui/Badge.jsx'
import { Link } from 'react-router-dom'
import { Card, CardContent } from './ui/Card.jsx'

const speciesIcon = (sp) => ({
  dog: <Dog className="h-4 w-4"/>,
  cat: <Cat className="h-4 w-4"/>,
  rabbit: <Rabbit className="h-4 w-4"/>,
}[sp?.toLowerCase()] || <Dog className="h-4 w-4" />)

export default function PetCard({ pet }){
  const photo = pet?.photos?.[0] || `https://picsum.photos/seed/${pet?._id || Math.random()}/600/400`
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .25 }}>
      <Link to={`/pets/${pet._id}`}>
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl">
            <img src={photo} alt={pet.name} className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]" loading="lazy"/>
          </div>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm text-mutedForeground">
                  {speciesIcon(pet.species)}
                  <span className="capitalize">{pet.species}</span>
                </div>
                <h3 className="text-lg font-semibold">{pet.name}</h3>
              </div>
              <Badge color="blue">{pet.gender || '—'}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-mutedForeground">
              <MapPin className="h-4 w-4" /><span>{pet.city || 'Unknown'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pet.vaccinated && <Badge><Syringe className="mr-1 h-3.5 w-3.5"/>Vaccinated</Badge>}
              {pet.sterilized && <Badge><ShieldCheck className="mr-1 h-3.5 w-3.5"/>Sterilized</Badge>}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
