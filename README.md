# Études — v0.91

A practice journal for musicians. Track daily sessions, time focused work, organise repertoire, and review progress across week and month views.

## Features

- **Today** — session timer, spot-level timing, warmup and rest tracking, day close
- **Repertoire** — pieces with stage labels, performance dates, spots, PDF scores, recordings
- **Routines & Programs** — build and load practice routines; group pieces into programs
- **Week / Month** — ring graphs, reflections, streak tracking
- **Logs & Notes** — searchable history, free notes
- **Transport** — metronome (with tap tempo + accel), tuning drone, quick notes
- **Sync** — optional sign-in; data syncs across devices via Supabase

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS
- Supabase (auth + PostgreSQL, optional)
- lucide-react

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

## Sync setup (optional)

Create `.env` at the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run `supabase/migrations/001_user_state.sql` in the Supabase SQL editor and enable Email auth under Authentication → Providers.

## Project Structure

```
src/
  components/   shared UI, modals, footer, PDF drawer
  constants/    theme tokens, config
  hooks/        metronome, recording, import/export, keyboard shortcuts
  lib/          storage, sync, auth, date/item utilities
  state/        useEtudesState — central state hook
  views/        Today, Week, Month, Repertoire, Programs, Routines, Logs, Notes
supabase/
  migrations/   SQL migration files
public/
  _redirects    SPA fallback for Cloudflare Pages
```

## Deployment

Deployed via Cloudflare Pages. Production branch: `master`. Build command: `npm run build`. Output: `dist`.
