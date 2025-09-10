import React from 'react'
import Input from './ui/Input.jsx'
import Button from './ui/Button.jsx'

export default function PetFilters({ value, onChange, onSubmit }){
  const update = (key, v) => onChange({ ...value, [key]: v })
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit?.()}} className="grid grid-cols-2 gap-3 md:grid-cols-6">
      <Input placeholder="City" value={value.city||''} onChange={e=>update('city', e.target.value)} />
      <select className="rounded-2xl bg-muted/60 px-4 py-2.5" value={value.species||''} onChange={e=>update('species', e.target.value)}>
        <option value="">Species</option>
        <option value="dog">Dog</option>
        <option value="cat">Cat</option>
        <option value="rabbit">Rabbit</option>
        <option value="other">Other</option>
      </select>
      <select className="rounded-2xl bg-muted/60 px-4 py-2.5" value={value.gender||''} onChange={e=>update('gender', e.target.value)}>
        <option value="">Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <select className="rounded-2xl bg-muted/60 px-4 py-2.5" value={value.vaccinated||''} onChange={e=>update('vaccinated', e.target.value)}>
        <option value="">Vaccinated?</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
      <select className="rounded-2xl bg-muted/60 px-4 py-2.5" value={value.size||''} onChange={e=>update('size', e.target.value)}>
        <option value="">Size</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
      <Button type="submit">Apply</Button>
    </form>
  )
}
