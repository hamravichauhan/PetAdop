# PetAdop Frontend (React + Vite + Tailwind)

Dark, modern, animated frontend for your PetAdop backend.

## Quickstart

```bash
# 1) Extract and enter
unzip petadop-frontend.zip && cd petadop-frontend

# 2) Install deps
npm i

# 3) Configure API
cp .env.example .env
# Edit VITE_API_BASE_URL to point to your backend (default: http://127.0.0.1:3000)

# 4) Dev
npm run dev

# 5) Build
npm run build && npm run preview
```

## Notes

- Authentication expects your backend to expose:
  - `POST /api/auth/register` → returns `{ accessToken }` or `{ token }`
  - `POST /api/auth/login` → returns `{ accessToken }` or `{ token }`
  - `GET /api/users/me` → returns current user
- Pets:
  - `GET /api/pets` with filters (species, city, vaccinated, size, gender)
  - `GET /api/pets/:id`
  - `POST /api/pets` with `multipart/form-data` (fields + `photos` files)

### Styling

- Tailwind dark theme by default
- Framer Motion page transitions & reveals
- Custom minimal UI components in `src/components/ui`
