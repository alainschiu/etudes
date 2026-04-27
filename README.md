# Études — v0.95.3

A practice journal for musicians. Track daily sessions, time focused work, organise repertoire, and review progress across week and month views.

## Features

- **Today** — session timer, spot-level timing, warmup and rest tracking, day close
- **Repertoire** — pieces, technique, play, and study items with stage labels, performance dates, spots, reference links, and PDF scores
- **PDF score viewer** — upload scores to any repertoire type; shared score library (one PDF, multiple items with independent page ranges); named bookmarks with jump-to-page; two-page spread / single-page / continuous scroll modes; zoom, fit-to-width/page; resizable sidebar; expandable fullscreen modal
- **Spot ↔ bookmark link** — link a practice spot to a PDF bookmark; viewer auto-jumps to that page when the spot is activated
- **Audio recording** — per-day and per-piece recordings with scrubbable SVG waveforms, A/B comparison; context-aware record button routes to active piece or daily log; attach daily recordings to a routine piece
- **Routines & Programs** — build and load practice routines; group pieces into programs; save changes back to loaded routine
- **Week / Month** — ring graphs, reflections, streak tracking
- **Logs & Notes** — searchable practice history (daily, weekly, monthly); free reference notes
- **Metronome** — tap tempo, BPM scrub drag, accelerando, compound meter (6/8 etc.), click volume
- **Tuning drone** — piano-keyboard note picker, pitch reference, temperament offsets; open with `D`
- **Keyboard shortcuts** — `Space` stop · `R` rest · `M` metronome · `T` tap · `L` log BPM · `D` tuning · `N` note · `?` settings; shortcut shown in tooltip on hover
- **Sync** — optional sign-in; data syncs across devices via Supabase

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS
- react-pdf / pdfjs-dist (PDF rendering)
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
