# Études

Before doing anything, read `North_Star_V2.4.md`. It is the authoritative
product document and supersedes all other instructions.

Current version: v2.4
Current app version: v0.98.3

-----

## Stack

- **React 19 + Vite 8** — SPA, no SSR
- **Tailwind CSS** — layout and spacing only; all colour/typography via design tokens
- **vite-plugin-pwa / Workbox** — service worker, `clientsClaim: true`, `registerType: prompt`, `injectRegister: false` (registration via `useRegisterSW` / `UpdatePrompt.jsx`), `skipWaiting: false` until user reloads; precache glob includes `mjs` (PDF worker)
- **react-pdf / pdfjs-dist** — PDF rendering in `PdfViewer.jsx`
- **Supabase** — auth (email + Google OAuth) + PostgreSQL sync. The auth hook (`src/lib/useSupabaseAuth.js`) exposes `signInEpoch` alongside `user`; the conflict-check effect depends on `signInEpoch`, not `user`, so token refreshes don’t retrigger conflict resolution. See *Sync hardening invariants* below.
- **Google Drive** — GIS + `drive.file` in `src/lib/driveAuth.js` / `driveApi.js`. Decoupled from Supabase session; `VITE_GOOGLE_CLIENT_ID` in build env. Manifest carries `lastAttemptedAt` / `lastFailureAt` / `lastFailureMessage` / `consecutiveFailures` for the Sync tab status block; derived in `src/lib/driveStatus.js`. The interactive token path is split into `prepareDriveAuth()` (async, called eagerly at app boot from `App.jsx`), `isDriveAuthReady()` (synchronous boolean), and `requestDriveTokenInteractive()` (synchronous, fires popup from user gesture; wraps a 12 s timeout to detect silently-blocked popups). iOS Safari requires this split.
- **lucide-react** — icons imported individually: `import X from 'lucide-react/dist/esm/icons/x'` (never barrel import)

## Key Commands

```bash
npm install           # .npmrc sets legacy-peer-deps=true (vite-plugin-pwa/Vite 8 conflict)
npm run dev           # Vite dev server — http://localhost:5173 — no SW in dev
npm run build         # production build → dist/; generates sw.js + workbox-*.js
npm run preview       # serve dist/ locally with SW active
npm test              # vitest harness — ~400 ms, 28+ smoke tests; sync/drive helpers
```

## Testing

Vitest harness covers the load-bearing pure functions:

- `structurallyEqual` in `src/lib/sync.js`
- `deriveDriveStatus`, `formatRelative`, `formatResumeIn` in `src/lib/driveStatus.js`
- `driveAuth` surface shape (export presence)

Adding sync/drive logic? Add a test. The harness is fast enough to run in the dev loop without friction.

For UI/integration that the harness can’t cover (iOS Safari popup behavior, real-device gestures, multi-device sync conflicts), there is a 14-item manual-test checklist on PR #15. Future contributors touching `driveAuth.js`, the Connect button, or the conflict-modal flow should re-run it before merge. Consider extracting into `docs/manual-test-checklist.md` if it gets referenced often.

## Design Tokens — exact values (`src/constants/theme.js`)

Never use raw values in components. Always import from `src/constants/theme.js`.

|Token                           |Value                  |Meaning                                                                 |
|--------------------------------|-----------------------|------------------------------------------------------------------------|
|`IKB`                           |`#002FA7`              |Active state, practice accent (International Klein Blue)                |
|`IKB_SOFT`                      |`rgba(0,47,167,0.1)`   |Active backgrounds                                                      |
|`WARM`                          |`#C97E4A`              |Rest, warm-up, locked recordings, A/B B-track (gold)                    |
|`WARM_SOFT`                     |`rgba(201,126,74,0.08)`|Gold tinted backgrounds                                                 |
|`TEXT`                          |`#F4EEE3`              |Ivory — primary text                                                    |
|`MUTED`                         |dimmer ivory           |Secondary text                                                          |
|`FAINT` / `DIM`                 |even dimmer            |Labels, hints                                                           |
|`BG`                            |near-black             |Page background                                                         |
|`SURFACE` / `SURFACE2`          |slightly lighter       |Elevated backgrounds                                                    |
|`LINE` / `LINE_MED` / `LINE_STR`|border variants        |Separators                                                              |
|`WARN` / `WARN_SOFT`            |red-family             |Error states, destructive confirms, save failures                       |
|`LINK`                          |hyperlink blue         |External links only (mailto, View backup folder); not for in-app actions|
|`serif`                         |Cormorant Garamond     |Titles, composer names, prose, italic labels                            |
|`sans`                          |system sans            |Tab labels, metadata, uppercase chrome                                  |
|`mono`                          |JetBrains Mono         |Timers, BPM, file sizes — numbers only                                  |

## Storage Layers

|Layer                                               |What                                                              |Key pattern                           |
|----------------------------------------------------|------------------------------------------------------------------|--------------------------------------|
|`localStorage`                                      |All metadata (items, history, routines, settings, drive manifest…)|`etudes-*`                            |
|IndexedDB (`src/lib/storage.js` — `idbGet`/`idbSet`)|Audio blobs, PDF blobs, ref tracks                                |`pieceRecordings`, `pdfs`, `refTracks`|
|Supabase PostgreSQL                                 |Mirror of localStorage (JSON blob in `user_state`)                |synced on save + sign-in              |
|Google Drive                                        |Backup of audio + PDFs + journal snapshot                         |`drive.file` scope only               |

Audio and PDFs are **device-local** in IndexedDB; Drive is an optional backup, not a sync layer. Dashed-stroke icon = metadata exists but blob is on another device (or needs Drive restore).

When `localStorage.setItem` throws (quota, Safari private browsing), `storage.js` dispatches an `etudes-storage-full` window event. `useEtudesState.js` listens and surfaces a WARN block at the top of the Sync tab.

## Viewport / Mobile

`src/hooks/useViewport.js` returns `{isMobile}`. Rule: non-touch devices use mobile when `width < 768`; touch devices use mobile if the short edge is < 768 (phone) or in portrait orientation (tablet). iPad in landscape → desktop, iPad in portrait → mobile, any iPhone → mobile. Updated via ResizeObserver + `(pointer: coarse)` and `(orientation: landscape)` `matchMedia` listeners. Every mobile conditional must preserve the original desktop code path byte-for-byte in the `else` branch.

## State Architecture

Single central hook: `src/state/useEtudesState.js`. All views receive props from it via `App.jsx`. No React context, no global store. Pattern: `const s = useEtudesState(); <View {...s} />`.

The conflict-check effect MUST depend on `signInEpoch`, not `user`. The `user` reference changes on every Supabase auth event (including silent token refreshes every ~50 min); `signInEpoch` only bumps on actual SIGNED_IN / SIGNED_OUT transitions. Depending on `user` will cause the SyncConflictModal to fire on every token refresh.

## Sync hardening invariants

Established by the v0.98.x trilogy. Do not undo these without explicit need:

- **Auth surface is split.** `driveAuth.js` exports `prepareDriveAuth` / `isDriveAuthReady` / `requestDriveTokenInteractive` for the interactive path. `getDriveAccessToken({interactive: false})` remains the silent renewal path; do not change its behavior.
- **iOS Safari requires synchronous popup trigger.** Any code path that opens a Drive OAuth popup must call `requestDriveTokenInteractive()` synchronously from a user gesture (click, confirm modal onConfirm). No `await` between the gesture and the popup. Even an immediately-resolved await breaks iOS.
- **`signInEpoch` gates the sync-conflict effect.** Don’t change the dependency back to `[user]`.
- **`structurallyEqual` (in `sync.js`), not `JSON.stringify`, for sync overlap detection.** Postgres JSONB does not preserve key order on round-trip; JSON.stringify equality false-positives constantly.
- **`lastAttemptedAt` manifest write lives inside the try block** in `driveSync.js`’s push function. Moving it outside re-introduces the silent-failure-on-quota-error class.
- **`prepareDriveAuth()` is called eagerly on app mount** in `App.jsx` when `isDriveConfigured()`. Don’t lazy-load GIS on first click.
- **`<link rel="preload">` for `accounts.google.com/gsi/client`** lives in `index.html`. Removing it re-introduces the iOS gesture race.
- **Destructive actions use `setConfirmModal({ isDestructive: true, ... })`.** Restore from Drive and Sign Out both rely on this. Disconnect Drive uses the non-destructive confirm variant (reversible action).
- **The fresh-device flow’s restore bypass is intentional.** The destructive confirm on Restore is skipped only in the post-sign-in fresh-device path where local was empty. Don’t apply the bypass elsewhere.

## Established UI patterns

These conventions are in force across the app:

- **Sync tab structure** — eyebrow (uppercase letterspaced 10 px) + content + control. CLOUD ACCOUNT / DRIVE BACKUP / AUTO-BACKUP sections are peers separated by ~24 px whitespace (not divider lines). Status sub-lines in italic serif, FAINT color.
- **Voice** — no exclaim, no apologize, no emoji. Match the reference strings: *“Last cloud sync 3:45 PM”*, *“Audio recordings and PDF scores stay on this device”*, *“Drive auth still loading. Try again in a moment.”*
- **Confirm modal copy** — declarative, brief, no marketing voice. Maximum two sentences. The action being confirmed is always the verb in the title-case button label.
- **External link styling** — `LINK` token with hairline underline (`borderBottom: 1px solid LINK + '55'`, `textDecoration: 'none'`). Used for mailto and external destinations only. Internal navigation uses `IKB`.
- **Status surface pattern** — surface state via pure derivation function (e.g., `deriveDriveStatus(manifest)`). Helpers in `src/lib/*Status.js`; components consume the derived state, never the raw fields.

## Versioning — two places, always kept in sync

- `src/constants/config.js` → `APP_VERSION` (footer badge)
- `package.json` → `version` (Settings modal reads `appPkg.version` directly)

`SCHEMA_VERSION` in `config.js` — increment only when the persisted state shape changes. Current: `10`.

Drive manifest fields are not part of `SCHEMA_VERSION`; the manifest has its own forward-compatible field-addition policy in `driveManifest.js` (additive only, defaults preserved).

## File Map

```
src/
  App.jsx                     root layout, tab routing, all state wiring;
                              eagerly calls prepareDriveAuth() when configured
  constants/
    theme.js                  ALL design tokens — the single source of truth
    config.js                 APP_VERSION, SCHEMA_VERSION, STAGES, TYPES, SECTION_CONFIG
  state/
    useEtudesState.js         central state hook; sync conflict-check uses signInEpoch
  hooks/
    useViewport.js            isMobile breakpoint (ResizeObserver, <768px)
    useMetronome.js           Web Audio metronome
    useRecording.js           MediaRecorder + FIFO piece recording archive
    useImportExport.js        JSON/md export, JSON import, blob packing
    useKeyboardShortcuts.js   global key bindings
    useDriveSync.js           Drive auto-backup orchestration
  lib/
    storage.js                lsGet/lsSet (localStorage) + idbGet/idbSet (IndexedDB);
                              dispatches etudes-storage-full on quota error
    sync.js                   Supabase push/pull, mergeStates, structurallyEqual,
                              measureSyncPayload
    useSupabaseAuth.js        Supabase auth hook; exposes signInEpoch
    auth.js                   Supabase client init
    driveAuth.js              GIS init + interactive/silent token paths
    driveApi.js               Drive REST wrapper
    driveSync.js              push queue, manifest writes, circuit breaker
    driveStatus.js            pure helpers: deriveDriveStatus, formatRelative, formatResumeIn
    driveManifest.js          manifest read/write, field defaults
    dates.js                  todayDateStr, daysUntil, week/month helpers
    items.js                  displayTitle, formatByline, getItemTime, mkSpotId…
    media.js                  getEmbedInfo (YouTube/Spotify/Apple Music)
    music.js                  toRoman, note/frequency helpers
    notifications.js          requestNotificationPermission, checkAndSendReminder
  components/
    shared.jsx                DisplayHeader, Waveform, StageLabels, SpotRow, MarkdownField…
    Footer.jsx                desktop 64px bar + mobile 52px bar
    Drawer.jsx                mobile slide-in nav
    PdfDrawer.jsx             full-screen PDF modal
    PdfViewer.jsx             react-pdf canvas renderer with bookmarks
    PieceRecordingsPanel.jsx  FIFO rolling archive (10 unlocked, 20 locked)
    modals.jsx                SettingsModal (Settings/Shortcuts/Sync/Export/About tabs),
                              PromptModal, ConfirmModal (supports isDestructive)
  views/
    TodayView.jsx             session spine, drag-reorder, warmup, day close
    WeekView.jsx              ring graph, weekly reflection, past-week nav
    MonthView.jsx             monthly ring, reflection
    RepertoireView.jsx        piece list, inline editor, sidebar facets, A/B bar
    ProgramsView.jsx          named programs of pieces
    RoutinesView.jsx          saved practice routines
    LogsView.jsx              searchable history (daily/weekly/monthly cards)
    NotesView.jsx             markdown free notes with wiki-links
test/
  *.test.js                   vitest harness for sync/drive helpers (~400 ms)
docs/
  guide.html                  user-facing guide (authoritative; index.html is a copy)
  index.html                  synced copy of guide.html
public/
  _redirects                  SPA fallback: /* /index.html 200
  site.webmanifest            PWA manifest (vite.config.js: manifest:false)
index.html                    contains <link rel="preconnect"> + <link rel="preload">
                              for accounts.google.com/gsi/client — required for iOS
supabase/
  migrations/001_user_state.sql
.npmrc                        legacy-peer-deps=true (vite-plugin-pwa/Vite 8 workaround)
```

## Deployment

- **Cloudflare Pages** — auto-deploys on push to `main`
- Build command: `npm run build` · Output: `dist`
- `.npmrc` ensures `npm clean-install` accepts the vite-plugin-pwa peer dep without manual flags
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`. All Plaintext under Production. After adding a new env var, retrigger a deployment — env vars are baked at build time via `import.meta.env`, not read at runtime.
- Service worker caches aggressively. After deploy, verify changes on production via DevTools → Application → Service Workers → Unregister, then hard-reload. Required for testing build-time env var changes.

## Manual verification ritual

Before merging any PR that touches Drive auth, the Sync tab, or sign-in flows:

1. iOS Safari, real iPhone — tap *Connect Google Drive* on cold load. Account picker should open on first tap.
1. iOS Safari with popups blocked in Settings — tap *Connect*. Expected: ~12 s spinner, then human error message; button unlocks.
1. Multi-device test — leave two tabs open for 60+ min, edit on both. Token refresh should NOT trigger the conflict modal. Edit the same piece differently on both → modal SHOULD appear.
1. Destructive confirms — *Restore* and *Sign Out* both open `isDestructive` confirms; *Disconnect Drive* opens non-destructive.

The full 14-item checklist lives in PR #15’s description. Re-run it after any sync/drive change.
