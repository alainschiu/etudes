# Études — v0.97.8

A practice journal for musicians. Seven views: Today, Review, Répertoire, Routines, Logs, Notes, Programs. Works offline as a PWA — install from the browser on any device.

## Features

- **Today** — session timer, spot-level timing, warmup and rest tracking, day close
- **Review** — Week and Month scales in one tab; IKB ring graphs, reflections, temporal navigation; scale selector persists last-used choice
- **Répertoire** — pieces, technique, play, and study items with stage labels, performance dates, spots, tempo history, reference links, and PDF scores
- **PDF score viewer** — upload scores to any repertoire item; shared score library (one PDF, multiple items with independent page ranges); named bookmarks with jump-to-page; spot ↔ bookmark link; two-page / single-page / continuous scroll; zoom, fit-to-width/page; resizable sidebar; fullscreen modal
- **Audio recording** — per-day and per-piece recordings with scrubbable SVG waveforms, A/B comparison (same piece or cross-piece); FIFO rolling archive (10 slots, lockable); context-aware record button routes to active piece or daily log; attach daily recordings to a routine piece
- **Reference tracks** — upload a reference audio file per piece; varispeed playback (25–100%); pull-up bar in Today view; inline player in Répertoire; waveform renders in `--muted`
- **Routines** — build and load practice routines with pinned pieces and optional targets; save changes back to loaded routine
- **Programs** — private salon journal: named programs with an ordered sequence of pieces, per-piece marginal annotations, intention (writable before, locked after), reflection (unlocks after), and free markdown notes. Wiki-links connect Programs ↔ Notes. The `audience` field is private and never exported.
- **Logs** — searchable practice history (daily, weekly, monthly cards); log drawer
- **Notes** — free reference notes with wiki-links, markdown, folder organisation, and tag filtering; links resolve to repertoire items, log dates, and programs
- **Export** — `Export journal` in Settings produces a dated ZIP: per-entity markdown files with YAML frontmatter, audio blobs (format-detected), PDF scores, README, and `_data.json`. Separate JSON backup/restore for full data migration.
- **Metronome** — tap tempo, BPM scrub drag, accelerando; BPM respects the **Note** (denominator) and compound grouping; look-ahead scheduler stays stable while editing; optional per-beat **accent** pattern in the mobile sheet; **Auto** folds 6/9/12/15 beats into triple compound when you turn it on (Sub 1, Group Off); shorter percussive **click** sound with noise burst
- **Tuning drone** — piano-keyboard note picker, pitch reference; open with `D`
- **Keyboard shortcuts** — `Space` start or pause · `R` rest · `M` metronome · `T` tap · `L` log BPM · `D` tuning · `N` quick note · `?` Réglages · `1–4` jump to section on Today
- **Sync** — optional sign-in (Google, Apple, or email); data syncs across devices via Supabase; payload size warning when backup exceeds 500 KB
- **Daily reminder** — optional push notification at a chosen time (requires notification permission)
- **Mobile PWA** — bottom tab navigation (7 tabs), compact header, mobile-optimised footer bar, Répertoire sidebar as full-screen overlay sheet, PDF drawer full-screen on mobile; installable from any browser

## PWA / offline

- **Install & shell** — [`public/site.webmanifest`](public/site.webmanifest) (linked from [`index.html`](index.html)) defines name, theme, `start_url`, `scope`, `id`, `lang`, and icons for Add to Home Screen.
- **Service worker** — production builds emit `sw.js` + Workbox via **vite-plugin-pwa**; the app shell and static assets are precached. The **pdfjs worker** (`.mjs` chunk) is included in the precache glob so the PDF viewer can load after one online visit.
- **Updates** — `registerType: 'prompt'` with an in-app **Update available → Reload** bar ([`UpdatePrompt.jsx`](src/components/UpdatePrompt.jsx), `useRegisterSW` from `virtual:pwa-register/react`) so a new deploy does not silently take over the tab until you confirm.
- **Preview** — `npm run preview` serves `dist/` with the service worker active (unlike `npm run dev`).

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS
- vite-plugin-pwa / Workbox (service worker, offline precache, runtime caches for Supabase + fonts; in-app update prompt)
- react-pdf / pdfjs-dist (PDF rendering)
- JSZip (ZIP export)
- Supabase (auth + PostgreSQL, optional)
- lucide-react

## Development

```bash
npm install           # uses .npmrc legacy-peer-deps=true automatically
npm run dev           # http://localhost:5173
npm run build
npm run preview
```

> **Note:** `vite-plugin-pwa@1.2.0` has a peer dependency on Vite ≤ 7; the project uses Vite 8. `.npmrc` sets `legacy-peer-deps=true` to resolve this for both local installs and CI (`npm clean-install`).

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
  views/        Today, Review, Repertoire, Programs, Routines, Logs, Notes
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

The `.npmrc` at the project root ensures `npm clean-install` (used by Cloudflare) accepts the `vite-plugin-pwa` peer dependency without `--legacy-peer-deps` needing to be set manually in the dashboard.
