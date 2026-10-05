# Umuhuza Online

Your trusted partner in finding the perfect property in Rwanda's dynamic real estate market.

Full marketplace MVP with:

- **Buyers/renters** — browse, filter, favorite, send inquiries
- **Agents** — create listings, upload photos, submit for approval
- **Admins** — approve/reject listings, manage user roles

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Mobile | React Native (Expo Router), TypeScript, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT in httpOnly cookie + bcrypt |

## Project structure

```
umuhuzaonline/
  frontend/   # Next.js app (port 3000)
  mobile/     # Expo React Native app (iOS, Android, Expo Go)
  backend/    # Express API (port 4000)
```

## Prerequisites

- Node.js 20+
- PostgreSQL running locally
- npm

## Setup

### 1. Database

```bash
createdb umuhuza
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL if your Postgres user/password differ
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

API: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### 4. Mobile (React Native)

Keep the backend running, then:

```bash
cd mobile
npm install
npm start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS). The app talks to the same API on port 4000 and auto-detects your computer's LAN IP.

- On the iOS Simulator, `localhost` works.
- On a physical phone, your phone and computer must be on the same Wi-Fi.
- Optional override: create `mobile/.env` with `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000/api/v1`

Tabs: Home · Explore · Saved · Account. You can browse listings, filter, favorite, inquire, and (as an agent) create listings with photos.

## Seed accounts

All seeded users use password `password123`:

| Role | Email |
|------|-------|
| Admin | admin@umuhuza.rw |
| Agent | claire@umuhuza.rw |
| Agent | jean@umuhuza.rw |
| Buyer | buyer@umuhuza.rw |

## Progressive Web App (PWA)

The frontend is installable as a full-screen app:

```bash
cd frontend
npm run build
npm start
```

Then open the site in Chrome/Edge (or iOS Safari → Share → Add to Home Screen).

- Manifest: `frontend/public/manifest.webmanifest`
- Icons: `frontend/public/icons/`
- Offline fallback: `/offline`
- Mobile bottom nav: Home · Explore · Saved · Account


- `/` — brand landing
- `/about` — About Umuhuza
- `/properties` — search & filter
- `/properties/[id]` — detail, favorites, inquiry
- `/login`, `/register`
- `/dashboard` — role home
- `/dashboard/favorites`
- `/dashboard/inquiries`
- `/dashboard/listings` — agent listings
- `/admin` — approval queue & users

## Environment

**Backend (`.env`)**

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — signing secret
- `PORT` — default `4000`
- `CLIENT_URL` — frontend origin (`http://localhost:3000`)
- `UPLOAD_DIR` — local image folder (`uploads`)

**Frontend (`.env.local`)**

**Mobile (`mobile/.env`)**

- `EXPO_PUBLIC_API_URL` — optional; defaults to `http://<your-lan-ip>:4000/api/v1`
- `EXPO_PUBLIC_UPLOAD_URL` — optional; defaults to `http://<your-lan-ip>:4000`
