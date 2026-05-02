# Études

Before doing anything, read `North_Star_V2.3.md`. It is the authoritative
product document and supersedes all other instructions.

Current version: v2.3
Current app version: v0.97.7

---

## Stack

- **React 19 + Vite 8** — SPA, no SSR
- **Tailwind CSS** — layout and spacing only; all colour/typography via design tokens
- **vite-plugin-pwa / Workbox** — service worker, `clientsClaim: true`, `registerType: autoUpdate`
- **react-pdf / pdfjs-dist** — PDF rendering in `PdfViewer.jsx`
- **Supabase** — auth (email + Google + Apple OAuth) + PostgreSQL sync; optional
- **lucide-react** — icons imported individually: `import X from 'lucide-react/dist/esm/icons/x'` (never barrel import)

## Key Commands

```bash
npm install           # .npmrc sets legacy-peer-deps=true (vite-plugin-pwa/Vite 8 conflict)
npm run dev           # Vite dev server — http://localhost:5173 — no SW in dev
npm run build         # production build → dist/; generates sw.js + workbox-*.js
npm run preview       # serve dist/ locally with SW active
```

## Design Tokens — exact values (`src/constants/theme.js`)

Never use raw values in components. Always import from `src/constants/theme.js`.

| Token | Value | Meaning |
|-------|-------|---------|
| `IKB` | `#002FA7` | Active state, practice accent (International Klein Blue) |
| `IKB_SOFT` | `rgba(0,47,167,0.1)` | Active backgrounds |
| `WARM` | `#C97E4A` | Rest, warm-up, locked recordings, A/B B-track (gold) |
| `WARM_SOFT` | `rgba(201,126,74,0.08)` | Gold tinted backgrounds |
| `TEXT` | `#F4EEE3` | Ivory — primary text |
| `MUTED` | dimmer ivory | Secondary text |
| `FAINT` / `DIM` | even dimmer | Labels, hints |
| `BG` | near-black | Page background |
| `SURFACE` / `SURFACE2` | slightly lighter | Elevated backgrounds |
| `LINE` / `LINE_MED` / `LINE_STR` | border variants | Separators |
| `serif` | Cormorant Garamond | Titles, composer names, prose, italic labels |
| `sans` | system sans | Tab labels, metadata, uppercase chrome |
| `mono` | JetBrains Mono | Timers, BPM, file sizes — numbers only |

## Storage Layers

| Layer | What | Key pattern |
|-------|------|-------------|
| `localStorage` | All metadata (items, history, routines, settings…) | `etudes-*` |
| IndexedDB (`src/lib/storage.js` — `idbGet`/`idbSet`) | Audio blobs, PDF blobs, ref tracks | `pieceRecordings`, `pdfs`, `refTracks` |
| Supabase PostgreSQL | Mirror of localStorage (JSON blob in `user_state`) | synced on save + sign-in |

Audio and PDFs are **device-local only** — never synced. Dashed-stroke icon = metadata exists but blob is on another device.

## Viewport / Mobile

`src/hooks/useViewport.js` returns `{isMobile}` (true when < 768 px) via ResizeObserver. Every mobile conditional must preserve the original desktop code path byte-for-byte in the `else` branch.

## State Architecture

Single central hook: `src/state/useEtudesState.js`. All views receive props from it via `App.jsx`. No React context, no global store. Pattern: `const s = useEtudesState(); <View {...s} />`.

## Versioning — two places, always kept in sync

- `src/constants/config.js` → `APP_VERSION` (footer badge)
- `package.json` → `version` (Settings modal reads `appPkg.version` directly)

`SCHEMA_VERSION` in `config.js` — increment only when the persisted state shape changes. Current: `9`.

## File Map

```
src/
  App.jsx                     root layout, tab routing, all state wiring
  constants/
    theme.js                  ALL design tokens — the single source of truth
    config.js                 APP_VERSION, SCHEMA_VERSION, STAGES, TYPES, SECTION_CONFIG
  state/
    useEtudesState.js         central state hook
  hooks/
    useViewport.js            isMobile breakpoint (ResizeObserver, <768px)
    useMetronome.js           Web Audio metronome
    useRecording.js           MediaRecorder + FIFO piece recording archive
    useImportExport.js        JSON/md export, JSON import, blob packing
    useKeyboardShortcuts.js   global key bindings
  lib/
    storage.js                lsGet/lsSet (localStorage) + idbGet/idbSet (IndexedDB)
    sync.js                   Supabase push/pull, measureSyncPayload
    auth.js                   Supabase client init
    dates.js                  todayDateStr, daysUntil, week/month helpers
    items.js                  displayTitle, formatByline, getItemTime, mkSpotId…
    media.js                  getEmbedInfo (YouTube/Spotify/Apple Music)
    music.js                  toRoman, note/frequency helpers
    notifications.js          requestNotificationPermission, checkAndSendReminder
  components/
    shared.jsx                DisplayHeader, Waveform, StageLabels, SpotRow, MarkdownField…
    Footer.jsx                desktop 64px bar + mobile 52px bar
    MobileBottomNav.jsx       8-tab fixed bottom bar, 56px + safe-area-inset-bottom
    PdfDrawer.jsx             full-screen PDF modal
    PdfViewer.jsx             react-pdf canvas renderer with bookmarks
    PieceRecordingsPanel.jsx  FIFO rolling archive (10 unlocked, 20 locked)
    modals.jsx                SettingsModal, HelpModal, PromptModal, ConfirmModal
  views/
    TodayView.jsx             session spine, drag-reorder, warmup, day close
    WeekView.jsx              ring graph, weekly reflection, past-week nav
    MonthView.jsx             monthly ring, reflection
    RepertoireView.jsx        piece list, inline editor, sidebar facets, A/B bar
    ProgramsView.jsx          named programs of pieces
    RoutinesView.jsx          saved practice routines
    LogsView.jsx              searchable history (daily/weekly/monthly cards)
    NotesView.jsx             markdown free notes with wiki-links
docs/
  guide.html                  user-facing guide (authoritative; index.html is a copy)
  index.html                  synced copy of guide.html
public/
  _redirects                  SPA fallback: /* /index.html 200
  site.webmanifest            PWA manifest (vite.config.js: manifest:false)
supabase/
  migrations/001_user_state.sql
.npmrc                        legacy-peer-deps=true (vite-plugin-pwa/Vite 8 workaround)
```

## Deployment

- **Cloudflare Pages** — auto-deploys on push to `main`
- Build command: `npm run build` · Output: `dist`
- `.npmrc` ensures `npm clean-install` accepts the vite-plugin-pwa peer dep without manual flags
