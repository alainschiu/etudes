# Études

Before doing anything, read `North_Star_V2.5.md`. It is the authoritative
product document and supersedes all other instructions.

Current version: v2.5
Current app version: v0.99.2

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
npm test              # vitest harness — fast; 136 tests: sync/merge/drive/migration/error-map helpers
```

## Testing

Vitest harness covers the load-bearing pure functions:

- `structurallyEqual` in `src/lib/sync.js`
- `mergeStates`, `stampCollectionDiff`, `pushTombstone` / `applyTombstones`, `computeDivergence` in `src/lib/sync.js` (schema v13 merge)
- `migrateMergeMeta` + the v12→v13 import migration in `src/lib/migrations.js`
- `deriveDriveStatus`, `formatRelative`, `formatResumeIn` in `src/lib/driveStatus.js`
- `driveAuth` surface shape (export presence)

Two of these are deliberate tripwires rather than ordinary coverage: `mergeStates`
“returns every key the state carries” fails loudly if a key is dropped from the
merge (which would wipe that slice on every sync), and the `journalPayload`
round-trip asserts each v13 key survives export *and* re-import (the A7-ii
completeness trap). Keep both in step when the state shape changes.

Adding sync/drive logic? Add a test. The harness is fast enough to run in the dev loop without friction.

For UI/integration that the harness can’t cover (iOS Safari popup behavior, real-device gestures, multi-device sync conflicts), the running manual-test checklist lives in `docs/manual-test-checklist.md` — the standing sync/Drive ritual (origin: PR #15) plus a per-release device pass. Future contributors touching `driveAuth.js`, the Connect button, or the conflict-modal flow should re-run the standing ritual before merge, and add a device-pass section for their release.

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

## Writing surfaces — the journal filesystem

Every writing surface persists to one of these `etudes-*` localStorage keys (audio and PDFs live in IndexedDB, out of scope here). All are markdown.

| #  | Surface                      | Field                          | Stored in                |
|----|------------------------------|--------------------------------|--------------------------|
| 1  | Daily reflection (today)     | `dailyReflection`              | `etudes-dailyReflection` |
| 2  | Daily reflection (archived)  | `history[i].reflection`        | `etudes-history`         |
| 3  | Weekly reflection (current)  | `weekReflection.{notes,goals}` | `etudes-weekReflection`  |
| 4  | Weekly reflection (archived) | `history[i].notes`, `.goals`   | `etudes-history`         |
| 5  | Monthly reflection (current) | `monthReflection.{notes,goals}`| `etudes-monthReflection` |
| 6  | Monthly reflection (archived)| `history[i].notes`, `.goals`   | `etudes-history`         |
| 7  | Per-piece pinned notes       | `item.detail`                  | `etudes-items`           |
| 8  | Per-piece today note         | `item.todayNote`               | `etudes-items`           |
| 9  | Per-piece log entry          | `item.noteLog[i].text`         | `etudes-items`           |
| 10 | Free note                    | `freeNote.body`                | `etudes-freeNotes`       |
| 11 | Program intention            | `program.intention`            | `etudes-programs`        |
| 12 | Program reflection           | `program.reflection`           | `etudes-programs`        |
| 13 | Program body / notes         | `program.body`                 | `etudes-programs`        |

Two `etudes-*` keys carry no writing but are load-bearing for sync (schema v13):
`etudes-deletions` (tombstones — `{type,id,deletedAt}`, pruned at 90 days / 500
entries) and `etudes-reflectionMeta` (per-scale `updatedAt` for the three
reflection singletons, which have no id to stamp).

### Wiki-link grammar

`[[…]]` is recognised in every markdown surface; the resolver is `resolveWikiLink` in `src/lib/notes.js`, which returns one of five target types: `day`, `item`, `spot`, `program`, `note`.

| Syntax                      | Resolves to                       |
|-----------------------------|-----------------------------------|
| `[[YYYY-MM-DD]]`            | day log entry (`type:'day'`)      |
| `[[Piece Name]]`           | item (`type:'item'`)              |
| `[[Piece Name #SpotLabel]]`| spot inside an item (`type:'spot'`)|
| `[[Program Name]]`         | program (`type:'program'`)        |
| `[[Note Title]]`           | free note (`type:'note'`)         |

Piece/program/note titles are matched fuzzily (`scoreMatch` over `slugify`d text) and scored **globally**, so an exact note-title match beats a weak word-overlap with a piece title. Autocomplete (`createWikiCompletion` in `src/components/MarkdownEditor.jsx`) offers items (with spots), recent days, programs, and notes.

> Week (`[[YYYY-Www]]`) and month (`[[YYYY-MM]]`) wiki-links are **not** supported by the current resolver, even though weekly/monthly reflection surfaces exist (rows 3–6). Link targets are days, pieces, spots, programs, and notes only.

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
- **`structurallyEqual` (in `sync.js`), not `JSON.stringify`, for sync overlap detection.** Postgres JSONB does not preserve key order on round-trip; JSON.stringify equality false-positives constantly. It ignores `updatedAt` at every depth, which is what keeps a post-edit round-trip from reading as a conflict — don’t remove that from `IGNORED_EQUALITY_KEYS`.
- **Stamping is a diff in the wrapped setters, never per call site (v13/A6).** `useEtudesState` exposes *wrapped* `setItems` / `setRoutines` / `setPrograms` / `setFreeNotes` / `setHistory` / `setSettings` / the three reflection setters; each compares outgoing against incoming and stamps only genuine content changes, and vanished ids become tombstones. The views mutate these collections from dozens of places, so call-site stamping would silently miss some. Don’t “simplify” this back into the reducers.
- **Restore / import / cloud-apply use the RAW setters.** `driveApplyDeps`, the `useImportExport` deps, and `applyCloudStateRef` all pass `set*Raw`. Routing any of them through a wrapped setter re-stamps every entity (so the restoring device wins every later merge) and tombstones everything the payload omits.
- **Every new state key must reach all seven surfaces.** `coldState`, `applyCloudStateRef`, `syncStateRef`, `buildFullJournalPayload`, `applyJournalPayload` (both paths), the migration, and the `useImportExport` export slice + import deps. A key in one but not the other is a silent data wipe; the two tripwire tests above exist to catch it.
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

`SCHEMA_VERSION` in `config.js` — increment only when the persisted state shape changes. Current: `13` (v11 added notes `updatedAt`; v12 unified spot score links into `spot.scoreLink` + bookmark `note`; v13 added per-entity `updatedAt`, `deletions` tombstones, `reflectionMeta`, `settings.updatedAt` for multi-device merge).

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

The full running checklist lives in `docs/manual-test-checklist.md` (standing ritual + per-release device passes). Re-run the standing ritual after any sync/drive change.
