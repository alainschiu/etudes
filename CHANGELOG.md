# Changelog

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
