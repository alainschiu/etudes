# Études — Claude Code Context

## What This Is

A single-user PWA practice journal for musicians. React 19 SPA deployed on Cloudflare Pages, with optional Supabase cloud sync. All data is localStorage + IndexedDB by default; Supabase is only used when the user signs in.

## Stack

- **React 19 + Vite 8** — no Next.js, no SSR, pure SPA
- **Tailwind CSS** — utility classes for layout/spacing; all colours and typography come from design tokens, not Tailwind colour classes
- **vite-plugin-pwa / Workbox** — service worker, offline precache, `clientsClaim: true`, `registerType: autoUpdate`
- **react-pdf / pdfjs-dist** — PDF rendering in `PdfViewer.jsx`; worker loaded from CDN
- **Supabase** — auth (email + Google + Apple OAuth) + PostgreSQL for cloud sync; completely optional
- **lucide-react** — icons imported individually from `lucide-react/dist/esm/icons/<name>` (never barrel import)

## Key Commands

```bash
npm install           # .npmrc sets legacy-peer-deps=true (vite-plugin-pwa peer dep conflict)
npm run dev           # Vite dev server, http://localhost:5173 — no SW in dev
npm run build         # production build to dist/; generates sw.js + workbox-*.js
npm run preview       # serve dist/ locally with SW active
```

## Design Tokens (`src/constants/theme.js`)

Never use raw colour values. Always use these:

| Token | Value | Use |
|-------|-------|-----|
| `IKB` | `#002FA7` | Active state, primary accent (International Klein Blue) |
| `IKB_SOFT` | `rgba(0,47,167,0.1)` | Active backgrounds |
| `WARM` | `#C97E4A` | B-slot in A/B comparison, warnings |
| `TEXT` | `#F4EEE3` | Ivory — primary text |
| `MUTED` | dimmer ivory | Secondary text |
| `FAINT` / `DIM` | even dimmer | Labels, hints |
| `BG` | near-black | Page background |
| `SURFACE` / `SURFACE2` | slightly lighter | Card backgrounds |
| `LINE` / `LINE_MED` / `LINE_STR` | border variants | |
| `serif` | Cormorant Garamond | Titles, italic labels |
| `sans` | system sans | UI labels, uppercase nav |
| `mono` | JetBrains Mono | Timers, BPM, code |

## Architecture

### State (`src/state/useEtudesState.js`)

Single central hook — owns everything. All views receive props from it via `App.jsx`. No React context, no Zustand. Pattern: `const s = useEtudesState(); <View {...s} />`.

Sub-hooks composed inside `useEtudesState`:
- `useMetronome` — BPM, tap tempo, accelerando, Web Audio click
- `useRecording` — daily WAV recording via MediaRecorder
- `useSupabaseAuth` — sign in/out, Google/Apple OAuth
- `useImportExport` — JSON backup, .md export
- `useKeyboardShortcuts` — global key bindings

### Storage layers

| Layer | What | Key pattern |
|-------|------|-------------|
| localStorage | All metadata (items, history, routines, settings…) | `etudes-*` |
| IndexedDB (`idbGet/idbSet` in `src/lib/storage.js`) | Audio blobs (daily + piece recordings, ref tracks), PDF blobs | `pieceRecordings`, `pdfs`, `refTracks` |
| Supabase PostgreSQL | Mirror of localStorage (JSON blob in `user_state` table) | synced on save + on sign-in |

**Audio and PDFs are device-local only** — they live in IndexedDB and are never synced. The app shows a "Recorded on another device" placeholder (dashed-stroke icons) when metadata exists but the local blob doesn't.

### Viewport / Mobile

`src/hooks/useViewport.js` — ResizeObserver on `documentElement`, returns `{isMobile}` (true when < 768 px). Used in:
- `App.jsx` — mobile header (44 px) vs desktop header (64 px); MobileBottomNav; hides working-on aside
- `Footer.jsx` — mobile bar (timer + 4 icon buttons) vs desktop bar
- `RepertoireView.jsx` — sidebar as full-screen overlay sheet on mobile
- `PdfDrawer.jsx` — edge-to-edge on mobile, sidebar stacks below PDF viewer

## File Map

```
src/
  App.jsx                     — root layout, tab routing, all state wiring
  constants/
    theme.js                  — ALL design tokens (colours, fonts) — import from here
    config.js                 — APP_VERSION, SCHEMA_VERSION, STAGES, TYPES, SECTION_CONFIG
  state/
    useEtudesState.js         — central state hook (1 file, ~800 lines)
  hooks/
    useViewport.js            — isMobile breakpoint (ResizeObserver)
    useMetronome.js           — Web Audio metronome
    useRecording.js           — MediaRecorder daily recording + FIFO piece recording
    useImportExport.js        — JSON/md export, JSON import, blob packing
    useKeyboardShortcuts.js   — global keyboard bindings
  lib/
    storage.js                — lsGet/lsSet (localStorage) + idbGet/idbSet (IndexedDB)
    sync.js                   — Supabase push/pull, measureSyncPayload
    auth.js                   — Supabase client init
    dates.js                  — todayDateStr, daysUntil, week/month helpers
    items.js                  — displayTitle, formatByline, getItemTime, mkSpotId…
    media.js                  — getEmbedInfo (YouTube/Spotify/Apple Music iframe src)
    music.js                  — toRoman, note/frequency helpers
    notifications.js          — requestNotificationPermission, checkAndSendReminder
  components/
    shared.jsx                — DisplayHeader, Waveform, StageLabels, SpotRow, MarkdownField…
    Footer.jsx                — desktop 64px bar + mobile 52px bar (isMobile conditional)
    MobileBottomNav.jsx       — 8-tab fixed bottom bar, 56px + safe-area-inset-bottom
    PdfDrawer.jsx             — full-screen PDF modal (overlay, not a sidebar drawer)
    PdfViewer.jsx             — react-pdf canvas renderer with bookmarks
    PieceRecordingsPanel.jsx  — per-piece recording FIFO (10 rolling, 20 lockable)
    modals.jsx                — SettingsModal, HelpModal, PromptModal, ConfirmModal
  views/
    TodayView.jsx             — session spine, drag-reorder, warmup, day close
    WeekView.jsx              — ring graph, weekly reflection, past-week nav
    MonthView.jsx             — monthly ring, reflection
    RepertoireView.jsx        — piece list with inline editor, sidebar facets, A/B bar
    ProgramsView.jsx          — named programs of pieces
    RoutinesView.jsx          — saved practice routines
    LogsView.jsx              — searchable history (daily/weekly/monthly cards)
    NotesView.jsx             — markdown free notes with wiki-links
docs/
  guide.html                  — user-facing guide (authoritative; index.html is a copy)
  index.html                  — synced copy of guide.html
public/
  _redirects                  — SPA fallback: `/* /index.html 200`
  site.webmanifest            — PWA manifest (vite.config.js sets manifest:false to use this)
supabase/
  migrations/001_user_state.sql
.npmrc                        — legacy-peer-deps=true (vite-plugin-pwa peer dep workaround)
```

## Versioning

Two places must be kept in sync when bumping version:
- `src/constants/config.js` — `APP_VERSION` (used by footer badge)
- `package.json` — `version` (used by Settings modal via `import appPkg from '../../package.json'`)

`SCHEMA_VERSION` in `config.js` — increment only when the shape of the persisted state changes (new fields on items, history entries, etc). Current: `9`.

## Deployment

- **Cloudflare Pages** — auto-deploys on push to `main`
- Build command: `npm run build` · Output: `dist`
- `.npmrc` in repo root ensures `npm clean-install` accepts the vite-plugin-pwa peer dep
- Service worker (`dist/sw.js`) is generated at build time by vite-plugin-pwa; `clientsClaim:true` ensures new SW takes over open tabs immediately on activation

## Coding Conventions

- **No barrel imports for lucide** — `import X from 'lucide-react/dist/esm/icons/x'`
- **No comments** unless the WHY is non-obvious
- **Mobile-first conditionals** — always `isMobile ? <mobile> : <desktop>`; desktop branch must be byte-for-byte identical to pre-mobile code
- **Inline styles for design tokens** — Tailwind for spacing/layout, inline `style={{}}` for colours/fonts
- **State always flows down as props** — no context providers, no global stores
