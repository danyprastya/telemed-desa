# TeleMed Desa

Sistem Telemedicine Puskesmas Terpencil — menghubungkan perawat/bidan di Puskesmas dengan dokter di rumah sakit kota melalui konsultasi real-time dan monitoring tanda vital.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Database + Auth + Realtime | Supabase |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Validation | React Hook Form + Zod |
| PWA | next-pwa |
| API Docs | Swagger UI |

## Prerequisites

- Node.js 18+
- Supabase account (free tier)
- Vercel account (optional, for deployment)

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd telemed-desa
npm install
```

### 2. Environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (server only, never exposed)
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for development

### 3. Supabase setup

Run the SQL schema in the Supabase SQL Editor (see `CLAUDE.md` for the complete SQL).

### 4. Generate database types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

### 5. Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Features

- **Role-based access:** Admin, Nurse/Bidan, Doctor with middleware-enforced route protection
- **Patient management:** Register patients, view history, search
- **Vital sign recording:** Temperature, heart rate, SpO2, blood pressure with auto-flagging of critical values
- **Vital sign monitoring:** Real-time charts with Supabase Realtime WebSocket subscriptions
- **Telemedicine consultations:** Create consultations, real-time chat, auto-claim by doctors
- **Notifications:** In-app notifications with real-time delivery via Supabase Realtime
- **Audit logging:** All critical operations logged for traceability
- **PWA:** Installable on mobile home screen with offline support
- **API Documentation:** Embedded Swagger UI at `/admin/api-docs`

## Project Structure

```
telemed-desa/
├── app/                    # Next.js App Router pages and API routes
│   ├── (auth)/            # Auth pages (login)
│   ├── (dashboard)/       # Dashboard pages (admin, nurse, doctor)
│   └── api/               # REST API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Auth components
│   ├── consultations/    # Consultation and chat components
│   ├── layout/           # Layout components
│   ├── notifications/    # Notification components
│   ├── patients/         # Patient components
│   ├── shared/           # Shared reusable components
│   └── vitals/           # Vital sign components
├── hooks/                 # Custom React hooks
├── lib/                   # Library code
│   ├── constants/        # App constants
│   ├── supabase/         # Supabase clients
│   ├── utils/            # Utility functions
│   └── validations/      # Zod schemas
├── types/                 # TypeScript types
├── docs/                  # Documentation
│   └── openapi.yaml      # OpenAPI 3.0 spec
├── public/                # Static assets
│   ├── icons/            # PWA icons
│   └── manifest.json     # PWA manifest
└── middleware.ts          # Next.js middleware (session + RBAC)
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` — your Vercel deployment URL
4. In Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: your Vercel URL
   - Redirect URLs: your Vercel URL + `/auth/callback`
5. Deploy

## API Documentation

Full OpenAPI 3.0 specification available at `docs/openapi.yaml`.
Embedded Swagger UI accessible at `/admin/api-docs` (admin only).

## Supabase Free Tier Note

Supabase free tier projects pause after 7 days of inactivity. Before demos or presentations, log into Supabase Dashboard and resume the project if needed (~30 seconds).
