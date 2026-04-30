# Études — v0.96.0

A practice journal for musicians. Track daily sessions, time focused work, organise repertoire, and review progress across week and month views. Works offline as a PWA — install from the browser on any device.

## Features

- **Today** — session timer, spot-level timing, warmup and rest tracking, day close
- **Repertoire** — pieces, technique, play, and study items with stage labels, performance dates, spots, tempo history, reference links, embeds (YouTube / Spotify / Apple Music), and PDF scores
- **PDF score viewer** — upload scores to any repertoire item; shared score library (one PDF, multiple items with independent page ranges); named bookmarks with jump-to-page; spot ↔ bookmark link (viewer auto-jumps to that page when the spot is activated); two-page / single-page / continuous scroll; zoom, fit-to-width/page; resizable sidebar; fullscreen modal
- **Audio recording** — per-day and per-piece recordings with scrubbable SVG waveforms, A/B comparison (same piece or cross-piece); FIFO rolling archive (10 slots, lockable); context-aware record button routes to active piece or daily log; attach daily recordings to a routine piece; cross-device placeholder shown when audio exists on another device only
- **Reference tracks** — upload a reference audio file per piece; varispeed playback (25–100%); pull-up bar in Today view; inline player in Répertoire
- **Routines & Programs** — build and load practice routines; group pieces into programs; save changes back to loaded routine
- **Week / Month** — ring graphs, reflections, streak tracking, temporal navigation (past weeks/months)
- **Logs & Notes** — searchable practice history (daily, weekly, monthly); free reference notes with wiki-links and markdown
- **Metronome** — tap tempo, BPM scrub drag, accelerando, compound meter (6/8 etc.), click volume
- **Tuning drone** — piano-keyboard note picker, pitch reference; open with `D`
- **Keyboard shortcuts** — `Space` stop · `R` rest · `M` metronome · `T` tap · `L` log BPM · `D` tuning · `N` note · `?` settings
- **Sync** — optional sign-in (Google, Apple, or email); data syncs across devices via Supabase; payload size warning when backup exceeds 500 KB
- **Daily reminder** — optional push notification at a chosen time (requires notification permission)
- **Mobile PWA** — bottom tab navigation, compact header, mobile-optimised footer bar (timer + Rest / Record / Metronome / Drone icons), Répertoire sidebar as full-screen overlay sheet, PDF drawer full-screen on mobile; installable from any browser

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS
- vite-plugin-pwa / Workbox (service worker, offline caching)
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

Run `supabase/migrations/001_user_state.sql` in the Supabase SQL editor and enable Email, Google, and Apple auth under Authentication → Providers.

## Project Structure

```
src/
  components/   shared UI, modals, footer, mobile bottom nav, PDF drawer
  constants/    theme tokens, config
  hooks/        metronome, recording, viewport, import/export, keyboard shortcuts
  lib/          storage, sync, auth, notifications, date/item/media utilities
  state/        useEtudesState — central state hook
  views/        Today, Week, Month, Repertoire, Programs, Routines, Logs, Notes
docs/
  guide.html    user guide
supabase/
  migrations/   SQL migration files
public/
  _redirects    SPA fallback for Cloudflare Pages
  site.webmanifest
```

## Deployment

Deployed via Cloudflare Pages. Production branch: `main`. Build command: `npm run build`. Output: `dist`.
