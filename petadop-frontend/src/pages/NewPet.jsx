import React from "react";
import Input from "../components/ui/Input.jsx";
import Textarea from "../components/ui/Textarea.jsx";
import Button from "../components/ui/Button.jsx";
import { usePetsStore } from "../store/pets.js";
import { useNavigate } from "react-router-dom";

export default function NewPet() {
  const nav = useNavigate();
  const { create } = usePetsStore();
  const [data, setData] = React.useState({
    name: "",
    species: "dog",
    breed: "",
    gender: "male",
    ageMonths: "",
    size: "",
    city: "",
    vaccinated: false,
    dewormed: false,
    sterilized: false,
    description: "",
  });
  const [files, setFiles] = React.useState([]);
  const update = (k, v) => setData((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const ok = await create({ ...data, photos: files });
    if (ok) nav("/pets");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">List a pet for adoption</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            placeholder="Name"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
          <select
            className="rounded-2xl bg-muted/60 px-4 py-2.5"
            value={data.species}
            onChange={(e) => update("species", e.target.value)}
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="rabbit">Rabbit</option>
            <option value="other">Other</option>
          </select>
          <Input
            placeholder="Breed"
            value={data.breed}
            onChange={(e) => update("breed", e.target.value)}
          />
          <select
            className="rounded-2xl bg-muted/60 px-4 py-2.5"
            value={data.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <Input
            placeholder="Age in months"
            type="number"
            min="0"
            value={data.ageMonths}
            onChange={(e) => update("ageMonths", e.target.value)}
          />
          <select
            className="rounded-2xl bg-muted/60 px-4 py-2.5"
            value={data.size}
            onChange={(e) => update("size", e.target.value)}
          >
            <option value="">Size</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <Input
            placeholder="City"
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.vaccinated}
              onChange={(e) => update("vaccinated", e.target.checked)}
            />
            Vaccinated
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.dewormed}
              onChange={(e) => update("dewormed", e.target.checked)}
            />
            Dewormed
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.sterilized}
              onChange={(e) => update("sterilized", e.target.checked)}
            />
            Sterilized
          </label>
        </div>
        <Textarea
          placeholder="Description"
          rows={5}
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <div>
          <label className="mb-2 block text-sm">Photos</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
        </div>
        <Button type="submit" size="lg">
          Publish
        </Button>
      </form>
    </div>
  );
}
