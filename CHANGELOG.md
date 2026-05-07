# Changelog

## v0.97.32 — 2026-05-07

### Mobile tuner: drag-along swipe + handle dash

`Footer.jsx · MobileDronePanel` now mirrors the metronome sheet's
swipe gesture.

- Touch-drag follows the finger via `translateY`; on release past
  60 px (with vertical travel dominating horizontal) the panel
  closes, otherwise it springs back with a 200 ms ease.
- Added the same 42×3 px `LINE_STR` handle dash at the top of the
  panel for a visible swipe affordance.
- Interactive controls (buttons, inputs, sliders, V1 keyboard
  keys) still capture their own gestures unchanged.

## v0.97.31 — 2026-05-07

### Swipe-down-to-close on mobile metronome and tuner

Both bottom-anchored mobile panels now dismiss with a downward
swipe in addition to their close button. Pure UX; no behaviour
changes to either tool.

#### Metronome (`MetronomeSheet.jsx`)

- Touch-drag on the top handle / chevron region translates the
  sheet downward in real time and fades the backdrop. Releasing
  past 80 px snaps closed; otherwise the sheet springs back.
- Chevron-down close button retained.

#### Tuner (`Footer.jsx · MobileDronePanel`)

- Touch-drag anywhere on the panel (excluding interactive
  controls — buttons, sliders, the V1 keyboard) closes the panel
  on release if vertical travel exceeds 60 px and dominates
  horizontal travel.
- Close affordance changed from `X` to `ChevronDown` to match
  the metronome sheet.

## v0.97.29 — 2026-05-07

### Always-visible desktop footer polish

Visual-only pass on the always-visible 64 px desktop footer
(`Footer.jsx`). No behaviour changes; same handlers, same shortcuts.

#### Metronome cluster

- Replaced the hard-to-read 22 px multi-bar mini-strip with the
  mobile widget's beat-bars visualiser (40 px row, accent-aware,
  subdivision sub-bars between beats, IKB on active beat). Lifted
  into a shared `MetroBars` helper used by both desktop chrome and
  the mobile metronome widget.
- The 13 px italic time-sig trigger is now a stacked button — BPM
  in mono 16 px above `{beats}/{noteValue}` in serif italic 18 px
  (matches the mobile widget). Larger click target, much more
  legible. ⚡ icon for accel still sits beside the stack.
- Cluster items (stack, play square, bars, slider + readout) now
  share a horizontal centerline.

#### Stat grid (Aujourd'hui · Section · Status)

- Replaced `justifyContent:space-between` with explicit `gap:6`
  per column and a fixed-height value row. The `Aujourd'hui` mono
  total now stays on the same y-coordinate as the `Section` and
  `Status` totals regardless of optional sub-content (`w/ rest`
  sub-line, `Stop` / `note` buttons). Fixes a long-standing
  left-timer alignment drift.
- Dividers now have symmetric `margin:0 16px` so columns sit
  evenly between separators.

#### Middle cluster (Rest / Record / Tuning)

- Locked label widths so the cluster no longer reflows when state
  text flips (`Record` ↔ `REC` ↔ `Piece` ↔ `Rec piece`,
  `Tuning` ↔ `A4`).
- Shared 32 px height across all three buttons.
- Borders only render on active state — no boxes around idle
  buttons.

## v0.97.28 — 2026-05-06

### Pass 5 V1 — Metronome & Tuner polish (round 2)

Layout and contrast pass on top of the V1 redesign. No behaviour
changes; visual refinements only.

#### Desktop metronome bar

- Background → `BG` (was `SURFACE`) so it reads as part of the page.
- BPM hero vertically centred against the time-signature flip card.
- Tempo / Volume sliders pulled tighter; Italian zone labels
  (Larghetto … Presto) sit closer to the slider track.
- `Pulse` is now a `ModeToggle` (matches the mobile sheet) instead
  of static dots.
- Subdivision chooser restored: segmented `1/4 · 1/8 · 1/16 · triplet`,
  bound to `metronome.subdivision`.
- `auto` / `accel` toggles moved onto the sound row so they line up
  with `click / wood / beep`; col 4 now holds only the transport + tap.
- When `accel` is enabled, its detail panel right-aligns under the
  toggles instead of stretching across the full width under BPM.
- Transport bumped 64 → 70 and right-aligned in its column to match
  the tuner play button.

#### Desktop tuner / drone panel

- Background → `BG`.
- Keyboard hero capped at 520 px wide; vertically stretches from
  the `NOTE` eyebrow to the Volume fader (height: 100 %).
- Play button right-aligned in its column to share an edge with the
  metronome transport.

#### Mobile metronome sheet

- BPM hero vertically centred against the time-signature flip
  (matches desktop).
- Subdivision chooser added (`1/4 · 1/8 · 1/16 · triplet`).
- Pulse / Sub / Accents share a single 14 px vertical rhythm.

#### Mobile tuner / drone panel

- Background → `BG`.

#### Mobile transport row

- Mic / Tuner / Note buttons grouped into a tight cluster (gap 2 px,
  size 30 × 30) so the metronome bar absorbs the freed horizontal
  space.

#### Atom changes

- `SoundChips` accepts a `gap` prop (default 10).
- `AccentToggles` accepts a `gap` prop (default 9).
- `Keyboard` accepts a non-numeric `height` (e.g. `'100%'`); the
  sharps row falls back to `62 %` of parent height in that case.
- Removed dead `PulseDots` / `SubStepper` imports and the unused
  `subOpt` / `noteValOpts` locals from `Footer.jsx`.

## v0.97.27 — 2026-05-04

### Hotfix — RepertoireView mobile detail crash

- **`ReferenceError: confirmDeleteRefTrack is not defined`** when
  rendering `PieceDetailScreen` (mobile Repertoire detail) on a piece
  with a reference track. Same shape as the v0.97.26 bug:
  `confirmDeleteRefTrack` is defined inside the main `RepertoireView`
  body, but `PieceDetailScreen` is a separate function. The wrapper
  was already passed correctly as the `deleteRefTrack` prop at the
  call site (line 309); the bug was inside the body of
  `PieceDetailScreen` (line 895) where `<Waveform>` was passed
  `confirmDeleteRefTrack` directly instead of using the destructured
  `deleteRefTrack` prop. One-line fix.

## v0.97.26 — 2026-05-04

### Hotfix — TodayMobile expand crash

- **`ReferenceError: p is not defined`** when expanding any item in
  TodayView on mobile. Introduced in v0.97.23: I added
  `setConfirmModal={p.setConfirmModal}` to the `SpotsBlock` call inside
  `MobileItemRow`, but `MobileItemRow` is a separate function that
  destructures specific props — `p` is the first parameter of
  `TodayView` only. Threaded `setConfirmModal` properly: added to
  `MobileItemRow`'s destructure, switched the prop value to the
  destructured variable, passed it from `TodayMobile` at the call site.

## v0.97.25 — 2026-05-04

### P2.16, P2.18, P2.20 – P2.23 — small UX papercuts

- **P2.16 — Tab-accept on composer / instrument autocomplete.** Native
  `<datalist>` only commits a highlighted suggestion on Enter; pressing
  Tab loses it. `DebouncedField` accepts a new optional `suggestions`
  prop. On `Tab` (no shift) without an exact match, if exactly one
  suggestion strict-prefix-matches the current draft, the field
  expands to it and commits — the user Tabs again to move on. Wired
  to the Composer and Instrument fields in `RepertoireView`.
- **P2.18 — Folder picker shows the active folder.** `NoteEditor`'s
  category dropdown now renders an IKB `Check` icon next to the
  selected folder (and "No folder"). Tapping a folder still selects
  and closes — but now the active state is unambiguous.
- **P2.20 — Programs piece title `line-clamp-2`.** Long titles like
  *"Liebestod from Tristan und Isolde, arr. for solo piano…"* used to
  flow indefinitely. Capped at two lines with ellipsis.
- **P2.21 — *"From Today"* → *"Save today as routine…"*.** The label
  read like "load today" not "save current arrangement as a new
  routine." Renamed (mobile *"Save today"*, desktop full label) and
  the prompt-modal title shortened to *"Save today as routine."*
- **P2.22 — Past / à venir chip in the program list.** A small italic
  serif chip — `(past)` or `(à venir)` — sits next to the date so the
  list communicates state without a click into the detail view.
- **P2.23 — *"Locked after performance date."* explanation.** When the
  intention textarea swaps to read-only static text, an italic FAINT
  line below now explains why. Previously the field just silently
  stopped accepting input.

P2.19 (mobile sheet/keyboard collision in the Notes editor) deferred —
needs reproduction on a real iPhone before it can be fixed.

## v0.97.24 — 2026-05-04

### SpotEditor — inline PDF page button, fix overflow

- **Trash overflow.** Once N6's `(hover: none)` rule made the
  `target-hover-reveal` cluster always-visible on touch, the desktop
  `SpotEditor` row was clipping the trash icon on narrow column widths
  (no `min-w-0` on the spot-label input meant it never shrank). Added
  `min-w-0` on the input + the main flex row + outer wrapper; tightened
  gap from `gap-3` to `gap-2`.
- **Inline PDF page button.** Added between the time-edit pencil and
  the move arrows — same pattern `SpotRow` uses. Tap an unset spot's
  `📄` icon → 48 px inline number input. Tap a set spot's `📄 N` chip
  to edit; Enter / blur commits, Esc cancels. Removed the redundant
  separate "→ page" row that was below the textarea.

## v0.97.23 — 2026-05-04

### Resilience batch — destructive confirms, mobile editors, hover-reveal on touch

- **N2 — every destructive delete now confirms.** New
  `confirmDestructive(setConfirmModal, message, action)` helper in
  `shared.jsx` (safe to call without `setConfirmModal` — falls through).
  Wraps: note delete, folder delete, spot delete, performance delete,
  tempo log entry delete, reference track delete, routine delete,
  routine session/item delete, program piece remove, PDF bookmark
  delete. Plumbed via `commonProps` (covers spread views) and
  explicitly to ProgramsView/RoutinesView. Tier-2 piece deletion still
  uses the trash + undo flow (now with a visible countdown — see P2.15).
- **N1 — Notes folder management on mobile.** Filter sheet header gains
  an **Edit folders** toggle. In edit mode each user folder shows a
  pencil + WARN-toned trash; reserved folders (All notes / Daily /
  Repertoire) stay read-only. Renaming uses an inline input with
  Enter / Esc; an **+ Add folder** tile appears below.
- **N6 — hover-revealed controls visible on touch.** New
  `@media (hover: none)` rule in `index.css` forces `.target-hover-reveal`
  and `.group .opacity-0` to opacity 1. Covers SpotEditor / SpotRow /
  TargetEdit / PdfDrawer / bookmark controls. The
  `PieceRecordingsPanel` trash specifically had its hover wrapper
  removed so the catch-22 (touch users could only delete locked
  recordings, but locked recordings can't be deleted) is gone.
- **P2.3 + N5 — Mobile editors debounced.** PieceDetailScreen's title,
  movement, collection, composer, catalog, instrument, length, and
  tempo inputs now use `DebouncedField` (400 ms commit, 1.5 s "saved"
  cue). NotesMobile title input too. Markdown bodies were already
  buffered by CodeMirror.
- **P2.14 — UpdatePrompt copy.** *"A new version is ready."* →
  *"Update available."* in italic serif.
- **P2.15 — UndoToast countdown.** A 1.5 px IKB underline at the bottom
  of the toast shrinks from 100 % to 0 % over 8 s, matching the actual
  trash auto-purge timeout. New `@keyframes undo-shrink` in App.jsx's
  inline `<style>` block.

## v0.97.22 — 2026-05-04

### TodayMobile section header — restore Add section, tighten ⋮ spacing

- Restored the **+ Add section** button (with sub-popover listing hidden
  default section types) at the bottom of the mobile session list.
- Dropped the hairline `borderLeft` between the time and `⋮` button on
  each section header; tightened the toggle-button right padding
  (20 → 4 px) and `⋮` `minWidth` (44 → 40 px) so practice time sits
  ~4 px from the icon, no internal divider.

## v0.97.20 — 2026-05-04

### P1.4 — the real fix (in `TodayMobile`, not the dead-code popover below the early return)

- Earlier "P1.4" commits put the `⋮` popover in `TodayView`'s desktop
  branch, below `if(isMobile){return <TodayMobile/>}`, where it never
  rendered on a phone. The popover is now in `TodayMobile`'s own
  section header — toggle button + `⋮` button in a flex row (no nested
  buttons). New `overflowSessionId` state. Popover lists Mark warm-up,
  Move up, Move down, Hide section, Set target. *Set target* opens the
  existing `PromptModal` for minutes. The five missing handlers
  (`moveSession`, `hideSession`, `toggleSessionWarmup`, `setSessionTarget`,
  `addSessionType`) are now actually destructured from `p` — they were
  passed via `{...p}` but never used.
- **P1.5 — `WARN` token usage.** Replaced 11 hardcoded `#E07A7A`
  literals with the `WARN` token. `Footer.jsx` (8 sites in the drone
  cents-offset indicators) and `modals.jsx` (storage warning, sync
  error, auth error).
- **N4 — early-return signposts.** Added a *"Desktop branch — mobile
  fixes belong in [Component]Mobile above"* comment at the four
  early-return sites (TodayView:107, NotesView:254, RepertoireView:252,
  LogsView:26).

## v0.97.19 — 2026-05-04

### Wiki link click no longer reloads the page

- React-markdown v10's default `urlTransform` strips schemes outside its
  allow-list (http/https/mailto/tel/ircs/irc/gopher). Our custom
  `wiki://` / `etudes://` / `wikilink://` were getting blanked to `""`,
  the fallback branch in our custom `<a>` rendered `<a href="">`, and
  clicking that reloads the current page (which lands on the default
  `view='today'`). New `wikiUrlTransform` helper in three files lets
  custom schemes pass through and falls back to `defaultUrlTransform`
  for everything else. Applied to NotesView desktop preview
  (`wiki://`), NotesView mobile preview (`etudes://`), ProgramsView
  body preview (`wiki://`), and `shared.jsx MarkdownField` readOnly
  path (`wikilink://` — used by every TodayView / Repertoire / Review
  reflection field).

## v0.97.18 — 2026-05-04

### A/B trash + PDF page link from spots

- **A/B trash no longer collapses the editor.** `RepertoireView`'s and
  `TodayView`'s click-outside `mousedown` handlers were firing for
  clicks on overlay modals above them (because `ConfirmModal` lives in
  a `fixed z-50` portal-style layer outside the editor's DOM).
  Confirming a destructive action like *delete recording* therefore
  looked like a click outside the editor and collapsed it. Both
  handlers now early-return when the click target is inside any
  `.fixed.inset-0.z-50` modal layer. The A/B bar still clears via the
  P2.8 cleanup `useEffect`, but the editor stays open.
- **Link a spot to a PDF page from outside the PDF drawer.** `SpotRow`
  accepts `onPdfPageSet`. When set, the row shows a small
  `FileText` icon: tap → inline page input → Enter / blur to commit,
  Esc to cancel. If a page is already set, the chip displays it; tap
  jumps if `onPdfPageJump` is wired (PDF drawer), otherwise opens the
  editor inline. `SpotsBlock` (TodayView) and `SpotEditor` (Repertoire
  + mobile detail) both wired through.

## v0.97.17 — 2026-05-04

### Wiki link, day rollover, Programs/Routines list reorder

- **P2.4 — day-rollover banner now fires unconditionally.** Dropped
  the `hadActive` guard. The "New day — timer reset" message in the
  footer status row appears on every midnight rollover, regardless of
  whether an item was active. Smoke test reduces to "set
  `etudes-lastActiveDate` to yesterday + reload".
- **P2.7 — broken wiki links unmistakably plain text.** Unresolved
  links now render as italic FAINT prose — no underline, no border,
  default cursor. Reads as the phrase the user typed, not a click
  affordance. Tooltip *"no match"* kept. Applied across all three
  render paths (`shared.jsx MarkdownComponents` / NotesView desktop /
  NotesView mobile / ProgramsView body).
- **NEW — drag-to-reorder Programs list.** `ProgramsList` drops the
  auto-sort by date and renders programs in array order. Desktop:
  drag any row to reorder; grip appears on hover. Mobile: paired ↑↓
  chevron cluster at the right of each row.
- **NEW — drag-to-reorder Routines list.** Same mechanism. Desktop:
  drag the entire row (disabled while expanded or being renamed).
  Mobile: ↑↓ buttons next to the LOAD button.

## v0.97.16 — 2026-05-04

### Wiki resolve everywhere, mobile deep-link, drop Esc-revert, settings tabs

- **P2.3 follow-up — drop Esc-to-revert in `DebouncedField`.** 400 ms
  debounce was faster than reaction time and Esc has no analogue on
  touch. Browser-level undo still works on the in-flight draft. Saved
  indicator + debounced commit kept.
- **P2.7 follow-up — three render paths, not two.** `MarkdownComponents`
  in `shared.jsx` now resolves `wikilink://` at render using
  `completionData`; unresolved → MUTED + dotted. Covers every
  `MarkdownField` callsite — TodayView Today/Notes, Repertoire item
  notes, Review reflections. NotesView mobile `etudes://` pre-processor
  was missing `encodeURIComponent`, breaking links with spaces; fixed.
  `NotesMobile handleMobileWikiClick` was passing the resolved object
  up to App's handler that expects a raw string — silent fail on every
  mobile wiki click. Fixed.
- **P2.7 deep-link routing.** `RepertoireView`'s `expandedItemId` effect
  now reactive; on mobile it sets `mobileDetailId` so a wiki-link click
  lands the user in the piece editor, not the list.
- **P2.6 follow-up — destructive tone visible on mobile.**
  `ConfirmModal` destructive variant: WARN tone always-on (touch has no
  hover); hover deepens the background with WARN_SOFT. Repertoire
  *Delete* buttons (desktop + mobile detail) styled WARN. Dev *Clear
  all data* button is WARN-toned.
- **Settings tab strip.** Tighter `px-8` → 16 px and `mr-5` → 14 px so
  all 5 tabs fit on a 360 px modal. `overflow-x-auto` retained as
  fallback.

## v0.97.15 — 2026-05-04

### Resilience & input-feedback batch (X3, P2.2–P2.9)

- **X3 — global error boundary.** New `src/components/ErrorBoundary.jsx`
  wraps the view router in `App.jsx`. Catches render-time throws and
  offers **Reload** + **Export backup** so users still have a recovery
  path if a view crashes.
- **P2.2 — `--footer-height` first-paint flash.** `index.css` now sets
  the var at `:root` (116 px desktop, 96 px mobile via media query).
  Removes the 160 px phantom bottom padding before Footer's
  ResizeObserver fires.
- **P2.3 — Repertoire inline edits.** New `DebouncedField` helper in
  `shared.jsx` (later refined in 0.97.16): 400 ms debounce, "saved"
  cue. Applied to title, movement, collection, catalog, composer,
  author, instrument, arranger.
- **P2.4 — day rollover signal.** New `dayJustRolled` flag in the state
  hook; consumed by Footer's status row, which shows
  *"New day — timer reset"* in place of the missing item label.
- **P2.5 — dev panel `window.confirm`.** Settings → Debug → *Clear all
  data* now uses a destructive `ConfirmModal` instead of native confirm.
- **P2.6 — `ConfirmModal` `isDestructive`.** New `WARN`/`WARN_SOFT`
  tokens (`#E07A7A`). Applied to: replace today's recording (daily +
  per-piece), delete recording (daily + per-piece), Replace everything
  on import, Remove PDF, Clear all data.
- **P2.7 — broken wiki-links resolve at render.** First pass:
  `NotesView` desktop and `ProgramsView` markdown previews resolve
  `wiki://` and apply unresolved styling.
- **P2.8 — A/B comparison cleanup.** New `useEffect` in
  `RepertoireView` watches `items` + `pieceRecordingMeta` against
  `globalAbA` / `globalAbB` and nullifies any slot whose referent is
  gone.
- **P2.9 — PdfViewer page input.** Switched `type="text"` → `type="number"`
  with explicit `min`/`max` (`clampStart`…`effectiveEnd`); parsed value
  clamped on Enter / blur. Typing 999 in a 10-page PDF now jumps to
  page 10 instead of going blank.

## v0.97.14 — 2026-05-04

### Two long-standing mobile overflow bugs

Both predate the audit branch (blame: 2026-04-29) but became more
visible after `?` started routing through Settings.

- **Settings tab strip clipped ABOUT.** Five `shrink-0` tabs at ~340 px
  total + 64 px modal padding overflowed a 360 px phone modal. Added
  `overflow-x-auto etudes-scroll` to the strip.
- **Recording panel "Lock oldest" pushed page off-screen.** When the
  rack hit 10/10 the warning text + Lock-oldest button (both
  `shrink-0`) overflowed the viewport, making the whole page
  horizontally draggable. Switched the row to `flex-wrap`.

## v0.97.13 — 2026-05-04

### Mobile composer/instrument filter + visibility boost

- **`P1.12` follow-up — composer filter no-op on mobile.** The mobile
  sidebar facets at `RepertoireView.jsx:672–673` had
  `onSelect={(v)=>{}}` and the matching setters were never passed down.
  Wired `setFilterComposer` / `setFilterInstrument` through
  `MobileRepertoireList` → `SidebarFacet`.
- **P1.4 / P1.2 follow-up — make mobile editing controls clearly
  visible.** TodayView ⋮ trigger and Programs reorder buttons went from
  `color: FAINT` (too subtle on near-black) to `MUTED` with an
  explicit border. Larger glyph (16 → 20 px). *(Note: the TodayView
  popover was still in dead code below the early return — fully fixed
  in 0.97.20.)*

## v0.97.12 — 2026-05-03

### Mobile & wiki-link improvements

- **`[[wiki-links]]` clickable everywhere** — `MarkdownField` (read-only and edit modes) and `MarkdownEditor` now fire navigation on tap/click in every view: Today notes, daily/weekly/monthly reflections, Répertoire pinned notes and log entries, Programs body. In read-only mode `[[text]]` is preprocessed to a tappable inline link; in edit mode the CodeMirror `touchstart` handler fires on iOS. Navigation resolves the link and jumps to the correct view (day → Logs, item/spot → Répertoire, program → Programs, note → Notes).
- **Wiki-link autocomplete fixed** — `MarkdownField` now forwards `completionData` (`items`, `history`, `programs`, `notes`) to the CodeMirror autocomplete source. `App.jsx` builds `wikiCompletionData` once and passes it through `commonProps` so all views receive it automatically — no per-call-site data fetching needed.
- **Obsidian-style autocomplete filtering** — `scoreMatch` rewritten with word-prefix scoring so typing `[[2` surfaces dates and titles whose words start with `2`; `filter: false` on the `CompletionResult` prevents CodeMirror's own fuzzy pass from overriding the results.
- **"Edit in Répertoire" on mobile today** — Expanded item row in Today (mobile) now has an action footer matching the desktop: **Edit in Répertoire** button (navigates to Répertoire with the item pre-expanded) and **Pin / ★ En cours** toggle.
- **Recordings tab default** — Mobile piece detail screen (Répertoire) opens on the **Recordings** tab instead of Spots; the recordings accordion inside `PieceRecordingsPanel` also defaults to open.
- **Tap title to scroll to top** — Tapping the "Études" wordmark in the mobile TopBar smooth-scrolls the current view back to the top, matching the native iOS/Android title-bar convention.
- **Scroll drift fixed** — `html` and `body` now carry `overflow: hidden; overscroll-behavior: none` and the main scroll container uses `overscroll-behavior: contain`, eliminating the iOS rubber-band body bleed-through that caused the page to drift when scrolling in Répertoire and other long lists.

## v0.97.11 — 2026-05-03

### Google Drive — sync layer hardening

- **Conflict detection NaN guard** — `pullJournalFromDrive`: `Date.parse()` result on remote/local timestamps validated with `Number.isFinite`; malformed RFC3339 strings no longer silently suppress the conflict prompt (treated as `Infinity` gap, always prompts).
- **Circuit breaker persistence** ([`driveQueueCircuit.js`](src/lib/driveQueueCircuit.js)) — `pausedUntil` and `pauseMessage` written to `localStorage` (`etudes-driveCircuit`) when a rate-limit cooldown is set; restored on the first `getDriveQueueCircuitState()` call after a page reload; cleared by `clearDriveQueueCircuitPause()`. Previously the 5-minute pause was lost on reload.
- **Blob restore failure visibility** — `restoreBlobsFromDrive` ([`driveSync.js`](src/lib/driveSync.js)) now returns `{ failed: [{ns, store, key}] }` instead of `void`; `useDriveSync` tracks the count and surfaces it in Settings → Sync as a quiet italic note after restore completes (*"N files could not be restored from Drive."*). Partial restores are still accepted; this makes failures visible.
- **`null` confirmFn documented** ([`driveSync.js`](src/lib/driveSync.js) `restoreManifestFromDriveIfNeeded`) — inline comment clarifies that passing `null` auto-proceeds without user confirmation, which is safe because the function only runs past its early-return guard when the local manifest is blank.

## v0.97.10 — 2026-05-03

### Google Drive — Phase 3+ (journal push/pull/restore)

- **`journalPayload.js`** — `buildFullJournalPayload` / `applyJournalPayload` shared by JSON backup and Drive; JSON export includes `programs`.
- **`driveApi.js`** — metadata, multipart create, media update, binary download helpers (still using `driveFetchRaw` backoff).
- **`driveSync.js`** — `pushToDrive` (single-flight, `full` coalescing), `pullJournalFromDrive`, `restoreBlobsFromDrive`, manifest snapshot on Drive; integrates **`notifyDriveQueueOperationResult`** on push completion/failure.
- **`useDriveSync.js`** — 10 min JSON + 30 s debounced blob push, `driveBackgroundError`, restore path; **`useEtudesState`** + **`useRecording`** / PDF / ref-track `notifyBlobWrite`.
- **UI** — **`DriveConflictModal`**; Sync tab: backup/restore/auto-backup, `onSyncTabVisible` pull check; `formatDriveOAuthError` coerces non-string errors.

### Google Drive — pre–Phase 3 hardening

- **Silent renewal spike (dev)** — [`driveAuth.js`](src/lib/driveAuth.js): optional `VITE_DRIVE_TOKEN_TTL_SEC` (dev only) shortens cached token lifetime; [`spikeSilentDriveRenewal`](src/lib/driveSync.js) exercises **only** `getDriveAccessToken({ interactive: false })` + Drive `about`. Settings → Sync (dev): **Test silent renewal** / **Force expire token**. README documents the merge gate.
- **Queue circuit breaker (scaffold)** — [`driveQueueCircuit.js`](src/lib/driveQueueCircuit.js): after **3** consecutive [`DriveRateLimitExhausted`](src/lib/driveApi.js) outcomes, pause **5 minutes** with user-facing message; re-exported from [`driveSync.js`](src/lib/driveSync.js). Phase 3 bulk queue must call `notifyDriveQueueOperationResult` per operation.
- **`DriveRateLimitExhausted`** — thrown when per-request backoff exhausts on rate-limit 403s ([`driveApi.js`](src/lib/driveApi.js)).
- **OAuth copy** — [`driveOAuthMessages.js`](src/lib/driveOAuthMessages.js) maps common GIS errors to plain English for Settings.
- **Manifest invariants** — JSDoc on [`driveManifest.js`](src/lib/driveManifest.js): namespaced `driveFileIndex` keys, `schemaVersion`, `journalRemoteModifiedTime` semantics.

## v0.97.9 — 2026-05-03

### Google Drive backup (foundation)

- **GIS + Drive API** — [`driveAuth.js`](src/lib/driveAuth.js): Google Identity Services token client, `drive.file` scope, in-memory access token, silent renewal via empty `prompt` when a token already exists; [`driveApi.js`](src/lib/driveApi.js): centralized `fetch` with **401** handling and **exponential backoff + jitter** on **403** `rateLimitExceeded` / `userRateLimitExceeded`.
- **Manifest + probe** — [`driveManifest.js`](src/lib/driveManifest.js) (`etudes-driveManifest`); [`driveSync.js`](src/lib/driveSync.js) `probeDriveConnection()` (Drive `about` user).
- **Settings → Sync** — “Google Drive backup” block: **Connect Google Drive** / **Disconnect** when `VITE_GOOGLE_CLIENT_ID` is set (placeholder copy until full push/restore ships).
- **Env** — [`src/vite-env.d.ts`](src/vite-env.d.ts) documents `VITE_GOOGLE_CLIENT_ID`.

### Auth

- **Apple Sign-In removed** — Supabase Apple OAuth button and `signInWithApple` removed from [`useSupabaseAuth.js`](src/lib/useSupabaseAuth.js) and [`useEtudesState.js`](src/state/useEtudesState.js).

## v0.97.8 — 2026-05-02

### PWA / service worker

- **Mobile TopBar — offline** — [`TopBar.jsx`](src/components/TopBar.jsx) listens to `window` `online` / `offline` and shows a compact **Offline** chip (wifi-off + label) to the left of settings when there is no network (installed PWA and flaky connections).
- **Update UX** — `registerType: 'prompt'`, `injectRegister: false`, `workbox.skipWaiting: false` in [`vite.config.js`](vite.config.js); single registration via `useRegisterSW` from `virtual:pwa-register/react` in new [`UpdatePrompt.jsx`](src/components/UpdatePrompt.jsx) (mounted in [`App.jsx`](src/App.jsx)): bottom bar when a new worker is waiting, **Reload** / **Later**.
- **Precache** — `globPatterns` extended with `mjs` so `pdf.worker.min.*.mjs` is included in the Workbox precache for offline PDF viewing.
- **Web manifest** — [`public/site.webmanifest`](public/site.webmanifest): `id`, `scope`, `lang`, `description` (icon `purpose` unchanged pending Android QA).

## v0.97.7 — 2026-05-02

### Metronome — timing, audio, and UI

- **BPM and note value** — `calcSubMs` uses `beatInQuarters` from `noteValue` so BPM follows the selected denominator (quarter / eighth / half / sixteenth) and compound mode uses the dotted beat unit (`compoundGroup > 1`).
- **Scheduler stability** — metronome `useEffect` depends only on `running`; beats, subdivision, sound, compound, accel, and note value sync through refs so changing controls does not tear down the look-ahead loop or reset phase.
- **Live grid after auto-compound** — `schedule()` reads `subRef` / `compoundRef` (and nested `calcSubMs`) each tick so subdivisions apply immediately after the sheet folds 6/9/12/15 into triple compound without stop/start.
- **RAF dedupe** — `lastShownBeatTimeRef` so `setCurrentBeat` fires once per scheduled event, not every animation frame.
- **Click sound** — shorter gain envelope (12 ms); **click** timbre mixes a short white-noise burst with the oscillator to reduce pitched “note” bleed; wood/beep keep oscillator-only with the shorter decay.
- **Accent pattern** — optional `accentPattern` (beat indices for medium accents); **Accent** row in mobile sheet and desktop footer metronome panel when `beats > 2`; shared [`MetronomeAccentEditor.jsx`](src/components/MetronomeAccentEditor.jsx); pattern trimmed when beat count drops; scheduler and mobile footer bar heights follow custom accents when set.
- **Compound auto** — fold to triple compound (beats ÷ 3, sub 3, group 3) runs **only when turning Auto from Off to On** while beats are 6/9/12/15, Sub 1, and Group Off; changing beats to 6 with Auto already on no longer forces 6 → 2.
- **Note value vs fold** — changing **Note** (e.g. to 8) alone never auto-collapses beats; no passive `useEffect` on `noteValue` for compound fold (QA: beats 6 + Sub 1 + Group 0, then change note — count stays 6 until **Auto On**).
- **Auto toggle** — correct on/off handling and optional expand of a prior auto-fold when turning Auto off then on again.
- **Metronome sheet (mobile)** — numeric subdivision labels (1–4 + dotted); copy for Auto; BPM/tap/handle hierarchy tweaks; **meter preset buttons removed** in favour of Auto + manual Beats/Sub/Group.
- **Footer (mobile)** — beat visualiser uses thicker vertical bars and taller downbeats; compound grouping heights preserved when not using a custom accent pattern; desktop sheet Sub labels match; desktop expanded panel includes accent editor when `beats > 2`.

## v0.97.6 — 2026-05-01

### Mobile — Sprint Patch

#### Metronome
- **Widget redesign** — zones 1+2 merged into one `<button>`: beat bars fill the left region (`flex:1`), BPM + time sig (`16px serif`) sit in a fixed 46 px right column, chevron remains for sheet access. Single touch anywhere left of the chevron toggles on/off.
- **Pulse mode** — `metronome.visualMode: 'bars' | 'pulse'` (new field, not persisted). In pulse mode the entire left zone flashes IKB on beat 1 and a dimmer blue on other beats; flash duration is 90 ms with a 200 ms ease-out decay. Toggle row `[Bars] [Pulse]` in `MetronomeSheet`.
- **Sheet alignment** — shared `<Label>` component (`minWidth: 56px`) applied to every row in `MetronomeSheet`. Accel section now includes `stepBpm`, `every`, and `unit` controls so the ramp is configurable.

#### Today view — item rows
- **Tap to expand** — clicking the title area or chevron toggles the inline panel; previously only the chevron worked.
- **PDF icon inline** — `FileText` icon rendered next to the title if PDFs are present; tapping it opens `PdfDrawer` directly without opening the expand panel.
- **Expand panel order** — Reference track button → today's recording waveform → today's note (`MarkdownField`, editable) → persistent notes (`MarkdownField`, editable).

#### Tuning
- **`MobileDronePanel`** — separate component from desktop `DronePanel`. Full-width 64 px piano keyboard, stacked A=/Oct/Temperament rows (not flex-wrap), collapsible root selector + cent offset table. Desktop `DronePanel` unchanged.
- **Label** — `aria-label` on mobile drone toggle: `"Tuner"` → `"Tuning"`.

#### Recording
- **Soft mutex** — `handleStartRecording(type, itemId)` in `App.jsx`: same recording → stop; conflict → `mutexPrompt` inline banner above footer with Confirm/Cancel; idle → start. No modal.
- **MIME negotiation (15a)** — `preferredMime()` tries `audio/webm;codecs=opus → audio/mp4 → ''`; passed to `MediaRecorder` and `Blob`. `mimeType` stored in recording metadata.
- **Key collision fix (15g)** — piece recording IDB key: `${itemId}__${date}` → `${itemId}__${date}__${Date.now()}`. Stored as `idbKey` in metadata. All consumer call sites (`deletePieceRecording`, `applyFifo`, `attachDailyToPiece`, `PieceRecordingsPanel`, `RepertoireView`, `TodayView`) use `entry.idbKey ?? fallback`.

#### Audio — iOS fixes
- **15b** — `wactxRef.current?.resume()` added synchronously before `await ensure()` in `Waveform.play()`. Web Audio graph and gain ramp kept intact.
- **15c** — `audioCtxRef.current?.resume()` at top of metronome running branch and inside `toggleDrone`.
- **15d** — `computePeaks` (`media.js`) reuses a module-level `_peaksCtx` singleton instead of `new AudioContext()` per call; avoids hitting the 4-context iOS limit.
- **15e** — Drone frequency change uses `setValueAtTime` anchor + `exponentialRampToValueAtTime(freq, t+0.03)` to eliminate audible click on note change.

#### Waveform display
- **15f** — Removed second 2-pass smoothing in `Waveform` display component. `computePeaks` already smooths twice; the third pass was over-smoothing and flattening the shape.

#### Wiki links
- **CodeMirror editor** — direct DOM `addEventListener('touchstart', handler, {passive:false})` attached to the editor wrapper via `useEffect`. CodeMirror's `eventHandlers` cannot register non-passive listeners; this is the only mechanism that allows `preventDefault` to cancel iOS navigation.
- **Read-only markdown** — `MarkdownComponents <a>` already calls `e.preventDefault()` unconditionally; `onTouchStart` handler added with same logic.
- **`NotesMobile`** — plain `<a target="_blank">` links now also intercept `touchstart`.

## v0.97.5 — 2026-05-01

### Mobile adaptation (Tracks 1–9)

See UPDATE_LOG for user-facing summary. Full technical detail in the sprint branch.

---

## v0.97.0 — 2026-04-30

### Track 1 — Architecture & Navigation

- **Streak counter removed** — `calcStreak`, the flame glyph, and all streak state removed from every surface (Week, Month, footer, settings). The month calendar already shows consistency quietly; no replacement.
- **Review tab** — Week and Month views merged into a single Review tab. A scale selector at the top of the view switches between Week and Month; the last-used scale persists as `etudes-reviewScale`. Active scale carries a thin IKB underline; no pill, no border.
- **Seven-tab nav** — nav reduced from eight tabs to seven: Today · Review · Répertoire · Routines · Logs · Notes · Programs. Programs is last (after Notes), consistent with its role as a writing/reflection surface.
- **Mobile bottom nav updated** — week/month entries replaced with a single review entry.

### Track 2 — Programs View

- **Schema migration** — Programs records gain `venue`, `audience`, `itemNotes`, `intention`, `reflection`, and `body` fields. Migration runs unconditionally on every app load (idempotent via spread). `SCHEMA_VERSION` bumped to 10.
- **Programs list view** — sorted by `performanceDate` descending, undated last. Each row shows name, date, venue, piece count, and total duration. Empty state: *Nothing here yet.*
- **Program editor** — full editor with: name (inline edit, italic serif 32–36px); date, venue, and audience fields (audience is never exported and never displayed outside this editor); intention field (read-only once performance date is past — writable on the day itself); piece list with drag reorder and per-piece marginal annotations; reflection field (shows `—` for future dates, writable once date has passed or if null); free markdown Notes field with Edit/Preview toggle.
- **`selectedProgramId` lifted to `App.jsx`** — not local state in ProgramsView, so wiki-link navigation from Notes can reach it.
- **Wiki-link integration** — `resolveWikiLink` extended to resolve `program` and `note` types. `[[Program Name]]` from Notes navigates to the program editor. `[[Note Title]]` from Programs body navigates to Notes.

### Track 3 — Export

- **jszip installed** — ~100 KB bundle increase.
- **`src/lib/slug.js`** — `toSlug()` + `uniqueSlug()` with collision handling via `_2`, `_3` suffix.
- **ZIP export** — `Export journal` in Settings produces `études-export-YYYY-MM-DD.zip` containing: `journal/` (one `.md` per daily log, one per weekly/monthly reflection), `notes/`, `repertoire/`, `programs/`, `recordings/` (audio blobs with format-detected extension and `_locked` suffix), `scores/` (PDF blobs), `README.md`, and `_data.json`. Every `.md` file has YAML frontmatter and a human-readable body.
- **Audience privacy** — the `audience` field on program records is stripped from every exported file and from `_data.json` at serialisation time.
- **Platform-aware delivery** — uses `navigator.canShare` on iOS/Android (share sheet); falls back to direct download on desktop. `AbortError` (share sheet dismissed) is silently ignored.
- **Header `.md` chip removed** — one export path: the ZIP. `exportLog()` and drag handlers removed.
- **`exportJson()` and `importJsonFile()` preserved** — JSON backup/restore flow unchanged.

### Track 4 — Design System

- **`LINK` token annotated** in `src/constants/theme.js` — permitted use: docs HTML files only.
- **`WARM` token annotated** — permitted surfaces: rest timer, warm-up sessions, locked recording rows, A/B B-track waveform.
- **`REC = '#A93226'` added** — muted destructive for active recording state only.
- **All green eliminated** — `REF_COLOR = '#6B8F71'` and all `rgba(107,143,113,…)` replaced with `MUTED`; ref bar background (`#1a211a`) replaced with `SURFACE`; ref bar border replaced with `LINE_MED`; `--semantic-rest: #7A8F6A` removed from `index.css`.
- **Reference audio waveform** — `accentColor` changed to `MUTED` across `shared.jsx`, `App.jsx`, ref bar; no glow.
- **Display heading scale** — all seven view page headings now use `clamp(32px, 6vw, 56px)` — fixed in `DisplayHeader` (shared component), `WeekView`, `MonthView`, `LogsView`, `NotesView`.
- **Répertoire empty state** — corrected to *Nothing here yet.*

### Track 5 — Quality & Polish

- **Help modal** — shortcut list updated to reflect current state.
- **Docs** — `docs/guide.html` and `docs/index.html` updated: Review tab section replaces separate Week/Month sections; Programs section rewritten (salon journal framing, intention lock, reflection, wiki-links, audience privacy); Export section rewritten (ZIP structure, audio formats, platform delivery, privacy); "Recording on another device" placeholder removed and replaced with a factual statement.

### Track 6 — Copy & voice (May 2026)

- **Search placeholders** — Logs `Search logs…`; Répertoire main search `Search…`.
- **Réglages (Settings modal)** — Shorter daily-reminder footnote; tighter sync warning, Local only explainer, post-signup email copy, sign-in footnote; shorter full-backup sentence; **Shortcuts** tab descriptions shortened (e.g. Space → “Start or pause”, Esc → “Close”); **Sync conflict** buttons → `Keep this device` / `Keep cloud version` (less alarming). **HelpModal** shortcut text aligned with Settings where it mirrors the tab.
- **Today / Week / Month / Routines / Footer** — Placeholders shifted to declarative, calmer register (e.g. Today session note `What happened.`; reflection `How today felt. What surprised you.`).
- **Répertoire** — Single-example placeholders for collection/catalog; `Composer` / `Instrument` / `Link` field hints; log-book new-note placeholder `A note on this session.`; empty filtered log / empty log / piece-picker-adjacent empty → unified **`Nothing here yet.`**
- **Programs** — Empty piece-picker search → `Nothing here yet.` (same string as elsewhere).
- **Markdown deep-link hint** — `Custom links open in the installed app.`
- **Daily reminder notification** — Body → `Your practice journal is waiting.` (inviting, non-accusatory).
- **Dev / seed** — `seedTestNotes` sample titles: Prof. Lehmann; *Practicing* in Reverse; related seed bodies use Lehmann; DevTools seeded program notes → `Notes for {name}.`
- **Docs** — `docs/UI_TEXT_AUDIT.md` synced; guide/index sync conflict glossary terms match new button labels.

---

## v0.96.0 — 2026-04-30 (patch fixes)

- **`package.json` version sync** — Settings modal reads `appPkg.version` from `package.json` directly (not from `constants/config.js`); `package.json` was still at `0.95.7` while the footer badge showed `0.96.0` — both now read `0.96.0`
- **PWA `clientsClaim`** — added `clientsClaim: true` to Workbox config so the newly activated service worker immediately takes control of all open tabs; without it the new SW was installed in the background but waited for a full tab close/reopen before serving updated assets
- **Cloudflare CI fix (`.npmrc`)** — `vite-plugin-pwa@1.2.0` peer-depends on Vite ≤ 7 but the project uses Vite 8; Cloudflare's `npm clean-install` (strict mode) was rejecting this and failing every build since `9a11483`; `.npmrc` with `legacy-peer-deps=true` fixes it for both local installs and CI without touching the build command

## v0.96.0 — 2026-04-30

### Phase 2 — Mobile PWA Redesign

- **Service worker** (`vite-plugin-pwa`) — Workbox generates `sw.js` on every build; NetworkFirst for Supabase API calls, CacheFirst (1 year) for Google Fonts, full static asset precache; `registerType: autoUpdate`
- **`useViewport` hook** — ResizeObserver on `documentElement`; returns `{isMobile}` (true when viewport width < 768 px); replaces any `window.innerWidth` one-liners
- **Mobile bottom navigation** — fixed 8-tab bar (Today, Week, Month, Répertoire, Programs, Routines, Logs, Notes); 56 px + `env(safe-area-inset-bottom)` for iPhone home indicator; IKB active state with 2 px top border; min 44 px touch targets
- **Compact mobile header** — 44 px bar with 20 px italic logotype and a Settings icon; desktop 64 px header (clock, .md chip, Réglages, tab nav) unchanged
- **Mobile footer bar** — 52 px bar with live session timer + Stop button on the left; Rest / Record / Metronome / Drone icon buttons (44 px each) on the right; desktop footer bar unchanged
- **Répertoire on mobile** — Composers/Instruments sidebar renders as a full-screen overlay sheet (backdrop dismiss) instead of an inline aside; content uses `px-4 py-8`; A/B comparison bar adds `padding-bottom: 56 px` to clear the bottom nav
- **PDF score drawer on mobile** — edge-to-edge (no 24 px window inset); spots/bookmarks panel stacks below the PDF viewer as a 240 px panel instead of a side column

### Phase 1 — UX & documentation (completed)

- **Apple Sign-In button** — re-added alongside Google in the auth modal; renders conditionally when `signInWithApple` prop is provided
- **`docs/guide.html` fixes** — §03 nav ceiling clarified ("Programs is an eighth view, deliberately outside it"); §24 cross-device audio section expanded with explicit "Recording on another device" placeholder explanation
- **`docs/index.html`** — synced to match `guide.html` (was 18 lines behind)

## v0.95.6 — 2026-04-28

### Logs view — unified card layout & visual differentiation

- **Unified card shell** — all three card types (Daily / Weekly / Monthly) now share identical border (`1px solid LINE`), padding (`p-6`), background (`transparent`), and hover state (`background → SURFACE`, `120ms` transition); no more three different border weights
- **2 px top accent** — sole visual differentiator per type: Daily = `IKB` blue, Weekly = `DIM` neutral, Monthly = `LINE_STR` near-invisible — subtle enough not to dominate
- **Date as hero** — all cards promote their primary date/period to `52px` italic serif with a unified structure:
  - Daily: month name as `13px MUTED italic` prefix line + day number at `52px`
  - Weekly: month context prefix line + day-range hero (`21 — 27`); cross-month weeks show abbreviated months as prefix (`Mar — Apr`)
  - Monthly: month name at `52px`
- **Minutes demoted** — daily card's `36px IKB` minutes block and its divider removed; replaced by a right-aligned `11px mono MUTED` badge in the eyebrow row
- **Eyebrow consistency** — all type labels (`DAILY`, `WEEKLY REFLECTION`, `MONTHLY REFLECTION`) now use `FAINT 10px uppercase 0.28em` tracking; no more `IKB` on eyebrow labels

## v0.95.5 — 2026-04-28

### Reference track — Today view pull-up bar

- **T3 pull-up bar** — a slide-up panel (matching the Recording panel layout) appears above the Footer when a reference track is active; `SURFACE`-equivalent green-tinted background (`#1a211a`) clearly distinguishes it from the warm Recording panel
- **"REFERENCE FOR · piece title"** header with the piece name inline, mirroring the Recording panel's label + detail pattern; × close button top-right
- **Full-width waveform** — `Waveform` rendered at full panel width with Play / Pause / Rewind controls; speed slider integrated flush with the Rewind button as an `actions` row element
- **Varispeed: 25–100%, 1% granularity** — slider width 140 px, `step=0.01`; speed resets to 100% on each new item activation
- **Pull-up animation** — `max-height` + `translateY` CSS transition combo gives a true bottom-sheet slide-in without covering the Footer; state lifted to `useEtudesState` so App.jsx owns the bar position in the normal document flow (above Footer, never overlapping it)
- **Music note trigger** — compact ♪ button in each Today item row activates/deactivates the bar for that item; tinted green when active

### Reference track — Repertoire view (PieceRecordingsPanel)

- **Recording-style card** — `RefTrackPlayer` restyled with `border: 1px solid LINE_STR`, `padding: 12px 14px 14px`, transparent background; matches the recording preview section layout
- **Header row** — `REF` label in green mono + filename in MUTED mono (mirrors `PREVIEW` + date in recording cards)
- **Controls** — full `Waveform` (non-compact, 40 px) replaces the previous compact inline version; speed slider + Replace + Delete buttons rendered as `actions` in the Waveform button row, flush with Rewind
- **Drag-and-drop upload** — border shifts to dashed green on file drag; "drop to replace" hint appears inline; audio formats: mp3, wav, flac, m4a
- **Varispeed: 25–100%, 5% steps** in the Repertoire inline player; 1% steps in the Today pull-up bar

### Notes view — layout fixes & sidebar improvements

- **Sidebar alignment** — categories sidebar now starts level with the note list (below the search bar); the header ("NOTES" eyebrow + italic `h1`) is lifted above the two-column flex row and offset to align with the content column
- **Note list scroll** — note list is now bounded to the viewport height (`calc(100vh - 310px)`) with its own `overflow-y-auto` scrollbar; sidebar and note list bottom edges align
- **Sidebar collapse toggle** — sidebar can now be collapsed via a "Collapse" chevron button (top-right of sidebar); a **Filter** button appears in the search bar to restore it; mirrors the Repertoire view pattern
- **Collapse affordance** — the collapse chevron (`w-3.5`) shows "Collapse" label on hover with `120ms` fade

### Repertoire view — sidebar collapse affordance

- Collapse chevron enlarged to `w-3.5`; "Collapse" label fades in on hover, matching Notes view

### Notes view — link fixes

- **Wiki links in preview mode** — `[[title]]` links are now clickable in preview (ReactMarkdown) mode: body is pre-processed to convert `[[text]]` → `[text](wiki://text)`, intercepted in the custom `a` renderer and routed through `handleWikiClick`
- **External links in edit mode** — **Ctrl/Cmd+Click** on any markdown link `[text](url)` or bare `https://` URL in the CodeMirror editor now opens it in a new tab; trailing punctuation stripped from captured URLs
- **External link protocol guard** — links written without a protocol (e.g. `google.com`) auto-prepend `https://` in preview mode

### Repertoire view — button rename

- "Facets" sidebar toggle renamed to **"Filter"** for clarity

## v0.95.4 — 2026-04-28

### Week & Month views — temporal navigation

- **W1 — Week navigation** — back / forward chevrons inline with the eyebrow date range in Week view; navigates to any past week; title switches from *"This week"* to the specific range (`Apr 20 — 26`; cross-month: `Mar 30 — Apr 5`); weekly Ring uses live `weekActualSeconds` for the current week and sums from `history` for past weeks; reflection fields hidden for past weeks
- **W2 — Month navigation** — same pattern in Month view; monthly Ring recomputed from history for past months; reflection fields hidden for past months; "Now" button restores current period
- **W3 — Bar chart hover** — hovering a day column in Week view brightens the bar to IKB blue tint, lifts minute label and weekday label to IKB; `0.12s` transitions
- **W4 — Calendar cell hover** — hovering a day cell in Month view fills with `rgba(0,47,167,0.08)` blue wash, turns day number and minute label IKB, strengthens the left-edge activity bar; `0.12s` transitions

### Routines view — collapsed row styling

- Routine title promoted to `1.4rem` italic serif with `TEXT` color as the dominant element
- Session type labels reduced to `9px DIM uppercase`; counts at `opacity:0.6`; separators at `opacity:0.5`
- Collapsed row padding tightened to `py-4` with `items-center` alignment

### Notes view — UI/UX cleanup (design system alignment)

- **Collapsible sidebar** — Archives, Folders, and Tags sections are now independently collapsible with ChevronUp/Down toggles matching the RepertoireView `SidebarFacet` pattern; folder count badge shown in section header; "New folder" input moved inside the expanded Folders section; redundant "Notes" section label removed
- **Dynamic title** — the 56px italic serif `h1` now reflects the active context: *Notes*, *Daily Reflections*, *Repertoire Logs*, folder name, or `#tag`; static "NOTES" eyebrow provides section context
- **Search bar** — `borderTop` removed; single `borderBottom` hairline only, matching design system `.input` pattern
- **New button placement** — moved from the page header into the top of the note list column alongside a note count label
- **Note list** — per-item `#tag` chips removed; body snippet font changed from italic serif to `sans FAINT`; subtle IKB blue hover tint (`rgba(0,47,167,0.04)`); active row uses `IKB_SOFT` background with `2px IKB` left border
- **Note editor** — `Trash2` delete icon removed from the title row; "Delete note" text link added at the bottom of the editor below a hairline separator, following the Repertoire expanded-panel pattern
- **Preview / Edit toggle** — `Eye` / `Pencil` button right-aligned in the meta row; preview mode renders body through `ReactMarkdown` with full GFM (headings, bold, italic, lists, blockquotes, code, links); title becomes a static heading; folder picker collapses to a plain label; delete footer hidden in preview
- **Vertical divider** — hairline `1px LINE` rule between the note list and editor columns
- **Button alignment** — tag pills and "New folder" button aligned to design system hairline button style (`LINE_MED` border, `3px` radius, `0.14em` tracking)

## v0.95.3 — 2026-04-28

### Notes & Logging Architecture ("Single Entry, Multiple Echo")

- **N1 — Markdown everywhere** — all text fields (pinned notes, session notes, daily/weekly/monthly reflections, spot notes, free notes, log book entries) now have an Edit / Preview toggle. Preview renders Markdown in a serif font with full GFM support (bold, italic, headings, lists, code, tables, horizontal rules).
- **N2 — Deep-link support** — standard `https://` links open in a new tab; `obsidian://` and `x-devonthink-item://` deep links open via `window.open`. Fields that contain custom links display a faint one-line hint: *"Custom links open in the desktop app if installed."*
- **N3 — Per-piece Log Book** — in Repertoire view, the plain `detail` textarea is replaced by a two-section panel: a pinned **Pinned notes** field (the existing `detail`, now a `MarkdownField`) and a scrollable **Log Book** showing all dated session notes for that piece, newest first. Features: inline edit, delete, text filter bar, and a manual "+ Add note" form for retrospective entries.
- **Composite daily lock** — on day rollover, each item's `todayNote` is pushed as a timestamped `{source: 'session'}` entry into `item.noteLog`. The day's `history[].reflection` is now a composite Markdown string: user's free reflection → `---` separator → `### Piece Title` sections for each item that had a note.
- **Composite reflection rendered in Logs** — the `DayLogContent` drawer in Logs view renders the composite reflection as Markdown (supports headings, horizontal rules, links).

### Notes Tab revamp

- **Category sidebar** — persistent left sidebar with standard read-only categories (Daily Reflections, Repertoire Logs) and user-defined folders. Folders can be created, renamed, and deleted inline. Notes get a `category` field; changing folder is a one-click dropdown in the note editor.
- **Tag system** — `#tag` syntax parsed from note bodies at save time. A tag cloud in the sidebar shows all tags with counts; clicking a tag filters the note list. Tags are also rendered as inline clickable chips in preview mode.
- **`[[wiki-link]]` fuzzy resolution** — type `[[Chopin Waterfall]]` and it resolves to the best matching repertoire item using slug-based fuzzy matching (strips punctuation, scores by exact slug / all words / any word). `[[2026-04-28]]` opens the Log Drawer for that date. `[[Piece #Spot]]` resolves to a specific spot. Unresolved links render as faint italic `[[text]]?` with a tooltip. Clicking a resolved link navigates to Repertoire or opens the Log Drawer.
- **Daily Reflections view** — shows the last 30 daily history entries rendered as Markdown, newest first.
- **Repertoire Logs view** — shows all `noteLog` entries across all items, filterable by piece name.

### Data model

- Schema version bumped 7 → 8; migration adds `noteLog: []` to all existing items.
- New `noteCategories` state (array of strings) persisted to `localStorage` under `etudes-noteCategories`.
- New `src/lib/notes.js` — exports: `slugify`, `scoreMatch`, `resolveWikiLink`, `parseTagsFromBody`, `buildCompositeDailyReflection`.
- `freeNotes` entries gain `category` (string) and `tags` (string[]) fields, parsed automatically on save.

## v0.95.0-beta — 2026-04-27

### PDF Score System (P1–P6)

- **P1 — All repertoire types** — PDF upload, reference link, and the "Add score" button are no longer restricted to Pieces; all four types (Technique, Pieces, Play, Study) now support scores
- **P2 — Bookmarks** — add named bookmarks at any page within a PDF attachment; bookmarks appear as a ribbon overlay on the page in all view modes; a dedicated toolbar button shows a popover with the full bookmark list (jump to any), current-page bookmarks highlighted, and an inline add form (name + current page, press Enter or +)
- **P3 — Viewer controls** — replaced the `<iframe>` with a full `react-pdf` viewer; toolbar includes: fit-to-width, fit-to-page, zoom in/out with % indicator, single-page mode, two-page spread mode (shows current page + next side-by-side), continuous scroll mode; page indicator shows current page / total; all toolbar icons have hover labels via portal tooltip (works through overflow clipping)
- **P4 — Resizable sidebar** — drag the handle between the viewer and sidebar to resize (220–520 px range); expand/minimize button in header toggles edge-to-edge fullscreen
- **P5 — Shared score library** — uploading a PDF creates a library entry (`libraryId`); the same file can be attached to multiple items via "From library" in the tab bar, each with its own page range (`startPage`, `endPage`); deleting an attachment only removes the blob from storage when no other item still references that `libraryId`
- **P6 — Spot ↔ bookmark link** — in SpotEditor (Repertoire), a "→ bookmark" dropdown lists all bookmarks across the item's attachments; selecting one stores `bookmarkId` + `pdfAttachmentId` on the spot; when a linked spot becomes active while PdfDrawer is open, it auto-switches to the correct attachment tab and jumps to the bookmark's page

### Data model

- Schema version bumped from 6 → 7; existing attachment `{id, name}` shape automatically migrated to `{id, libraryId, name, startPage, endPage, bookmarks: []}` on first load
- Spots gain optional `bookmarkId` and `pdfAttachmentId` fields (null by default, backward-compatible)
- New `pdfLibrary` global state (persisted to `localStorage`) tracks all uploaded PDF blobs independent of which items reference them

## v0.93.5 — 2026-04-27

### Recording

- **R1** — Replaced the mic icon next to the RECORD label in the footer with a playback (▶) button that opens the recording panel
- **R2** — Elapsed recording time displayed in red mono font in the footer bar and as a pulsing counter in the pull-up panel while recording is active
- **R3 — Context-aware recording** — pressing Record while a piece timer is running records directly into that piece; otherwise records to the daily session log. Footer button label changes to "Rec piece" when a piece is active
- **Attach daily recording to piece** — in the recording panel, a dropdown lists all pieces in the current routine; selecting one and clicking Attach moves the daily recording into that piece's archive and resets the daily recording

### Keyboard shortcuts

- **K1** — All shortcut-enabled UI elements now show the assigned key in a styled tooltip on hover: `Space` (Stop timer), `R` (Rest), `M` (Metronome), `T` (Tap tempo), `L` (Log BPM), `D` (Tuning), `N` (Quick note), `?` (Réglages)

### Tuning panel

- **TU1** — `D` keyboard shortcut now opens/closes the tuning panel directly (was: toggle drone audio)
- **TU3** — Play · Vol · Pitch reference · Temperament · Octave all consolidated onto a single controls line, reducing panel height significantly
- **TU4** — Note selector redesigned as a piano keyboard: 7 white keys and 5 black keys in correct piano layout; selected note highlighted in IKB; temperament offset dots on affected keys; note names at the bottom of each key

---

## v0.93 — 2026-04-26

### Audio recording — waveform scrubbing & per-piece archive

#### Waveform scrubbing
- Replaced static bar-chart waveform with smooth SVG bezier curve using cubic interpolation
- Real drag-to-scrub: playhead follows mouse during drag; audio seeks on mouseup and resumes if was playing
- Transport controls redesigned as standard **Play · Pause · Rewind** row above the waveform
- Live time counter (`0:13 / 4:50`) right-aligned in the transport row, updates during scrub
- Re-record button moved into the transport row (alongside Play/Pause/Rewind)
- Peak extraction upgraded: 120 buckets (was 60), RMS per bucket (was peak-max), 2-pass weighted smoothing — smoother, perceptually accurate waveform
- Day recording drawer moved to footer pull-up panel (same pattern as metronome/tuner)

#### Per-piece recording archive
- New `pieceRecordings` IndexedDB store (DB version bumped to 2); metadata persisted to localStorage as `etudes-pieceRecordingMeta`
- Each recording keyed `{itemId}__{date}`, tagged with BPM (from metronome at record time) and stage
- **Recordings panel** in Répertoire expanded view: reverse-chronological list with compact scrubbable waveform per entry, date/BPM/stage badges, delete
- **A/B comparison**: select any two recordings as A and B — side-by-side full waveforms with independent play/pause/rewind/scrub; no forced sync
- **Mic button per item** in Today view (next to play button) — records directly to the piece archive; dims when another recording is active
- Today's recording for a piece appears as a compact scrubbable waveform inside the item's expanded drawer (Today section), not on the collapsed row

---

## v0.91 — 2026-04-26

### Fixes & polish

- **Sync reliability** — debounce reduced from 30 s to 5 s; all sync paths (stop, close day, tab hide, reconnect) now update the status indicator correctly
- **Sync Now button** — manual sync trigger in Réglages → Sync; doubles as status indicator (Syncing… / Sync error); last synced time shown inline under the account email
- **Sync conflict resolution** — signing in on a device with unsynced local data now shows a three-option modal: Merge (union by ID), Keep local, or Keep cloud. Prevents pieces being silently overwritten on first cross-device sign-in
- **Réglages layout** — tab order changed to Settings → Shortcuts → Sync → Export → About; Storage indicator moved from Settings into Sync tab
- **Input overflow** — number inputs (target fields) no longer escape modal boundary; browser spinner arrows removed globally
- **Signup confirmation** — after account creation, shows "Check your inbox" state with email address instead of blank form
- **Deployment** — removed Vite `base: '/app/'`; added `_redirects` SPA fallback; app now serves correctly from domain root on Cloudflare Pages

---

## v0.90.1 — 2026-04-25

### Cloud sync via Supabase

- Optional sign-in in Réglages → Sync (email/password; no account required to use the app)
- Two-tier sync: cold state debounced 30 s; hot state (timers) flushed only on stop, day close, tab hide, or reconnect
- All 18 localStorage effects untouched — cloud sync is purely additive
- First-run migration modal on first sign-in
- Sync status indicator (idle / syncing / synced / error)
- Blob guards: PDFs and recordings show "Attached on another device" rather than silently failing

---

## v0.9.0 — 2026-04-25

### Design system

- Études Design System tokens across all UI: color, type, spacing
- True IKB `#002FA7`, correct ivory text, brass warm accent
- All glow and drop-shadow effects removed
- Cormorant Garamond, EB Garamond, Inter, JetBrains Mono loaded via Google Fonts
- Monospace font applied to all tabular numerics

---

## v0.88.1 — prior

See git log for earlier history.
