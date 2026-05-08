# Études

Before doing anything, read `North_Star_V2.4.md`. It is the authoritative
product document and supersedes all other instructions.

Current version: v2.4
Current app version: v0.98.0

---

## Stack

- **React 19 + Vite 8** — SPA, no SSR
- **Tailwind CSS** — layout and spacing only; all colour/typography via design tokens
- **vite-plugin-pwa / Workbox** — service worker, `clientsClaim: true`, `registerType: prompt`, `injectRegister: false` (registration via `useRegisterSW` / `UpdatePrompt.jsx`), `skipWaiting: false` until user reloads; precache glob includes `mjs` (PDF worker)
- **react-pdf / pdfjs-dist** — PDF rendering in `PdfViewer.jsx`
- **Supabase** — auth (email + Google OAuth) + PostgreSQL sync; optional
- **Google Drive (WIP)** — GIS + `drive.file` in [`src/lib/driveAuth.js`](src/lib/driveAuth.js) / [`driveApi.js`](src/lib/driveApi.js); decoupled from Supabase session; `VITE_GOOGLE_CLIENT_ID`
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

## Writing surfaces — the journal filesystem

Every writing surface persists to one of these `etudes-*` localStorage keys.
Audio and PDFs live in IndexedDB and are out of scope here.

| # | Surface | Field | Format | Origin? | Target? | Stored in |
|---|---------|-------|--------|---------|---------|-----------|
| 1 | Daily reflection (today) | `dailyReflection` | markdown | yes | — | `etudes-dailyReflection` |
| 2 | Daily reflection (archived) | `history[i].reflection` | markdown | yes | day | `etudes-history` |
| 3 | Weekly reflection (current) | `weekReflection.{notes,goals}` | markdown | yes | — | `etudes-weekReflection` |
| 4 | Weekly reflection (archived) | `history[i].notes`, `.goals` | markdown | yes | week | `etudes-history` |
| 5 | Monthly reflection (current) | `monthReflection.{notes,goals}` | markdown | yes | — | `etudes-monthReflection` |
| 6 | Monthly reflection (archived) | `history[i].notes`, `.goals` | markdown | yes | month | `etudes-history` |
| 7 | Per-piece pinned notes | `item.detail` | markdown | yes | item | `etudes-items` |
| 8 | Per-piece today note | `item.todayNote` | markdown | yes | — | `etudes-items` |
| 9 | Per-piece log entry | `item.noteLog[i].text` | markdown | yes | item-log | `etudes-items` |
| 10 | Free note | `freeNote.body` | markdown | yes | note | `etudes-freeNotes` |
| 11 | Program intention | `program.intention` | markdown | yes | program-intention | `etudes-programs` |
| 12 | Program reflection | `program.reflection` | markdown | yes | program-reflection | `etudes-programs` |
| 13 | Program body / notes | `program.body` | markdown | yes | program | `etudes-programs` |

### Wiki-link grammar

`[[…]]` is recognised in every markdown surface; the resolver lives in
`src/lib/notes.js` (`resolveWikiLink`).

| Syntax | Resolves to |
|--------|-------------|
| `[[YYYY-MM-DD]]` | day log entry |
| `[[YYYY-Www]]` (e.g. `2026-W19`) | weekly reflection |
| `[[YYYY-MM]]` (e.g. `2026-05`) | monthly reflection |
| `[[Piece Name]]` | item |
| `[[Piece Name #SpotLabel]]` | spot inside an item |
| `[[Program Name]]` | program |
| `[[Note Title]]` | free note |

Autocomplete in the markdown editor (`src/components/MarkdownEditor.jsx`)
offers items, recent days, recent weeks, recent months, programs, and
notes.

## Storage Layers

| Layer | What | Key pattern |
|-------|------|-------------|
| `localStorage` | All metadata (items, history, routines, settings…) | `etudes-*` |
| IndexedDB (`src/lib/storage.js` — `idbGet`/`idbSet`) | Audio blobs, PDF blobs, ref tracks | `pieceRecordings`, `pdfs`, `refTracks` |
| Supabase PostgreSQL | Mirror of localStorage (JSON blob in `user_state`) | synced on save + sign-in |

Audio and PDFs are **device-local only** — never synced. Dashed-stroke icon = metadata exists but blob is on another device.

## Viewport / Mobile

`src/hooks/useViewport.js` returns `{isMobile}`. Rule: non-touch devices use mobile when `width < 768`; touch devices use mobile if the short edge is < 768 (phone) or in portrait orientation (tablet). iPad in landscape → desktop, iPad in portrait → mobile, any iPhone → mobile. Updated via ResizeObserver + `(pointer: coarse)` and `(orientation: landscape)` `matchMedia` listeners. Every mobile conditional must preserve the original desktop code path byte-for-byte in the `else` branch.

## State Architecture

Single central hook: `src/state/useEtudesState.js`. All views receive props from it via `App.jsx`. No React context, no global store. Pattern: `const s = useEtudesState(); <View {...s} />`.

## Versioning — two places, always kept in sync

- `src/constants/config.js` → `APP_VERSION` (footer badge)
- `package.json` → `version` (Settings modal reads `appPkg.version` directly)

`SCHEMA_VERSION` in `config.js` — increment only when the persisted state shape changes. Current: `10`.

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
    Drawer.jsx                mobile slide-in nav (replaced the old bottom bar)
    PdfDrawer.jsx             full-screen PDF modal
    PdfViewer.jsx             react-pdf canvas renderer with bookmarks
    PieceRecordingsPanel.jsx  FIFO rolling archive (10 unlocked, 20 locked)
    modals.jsx                SettingsModal, PromptModal, ConfirmModal
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
