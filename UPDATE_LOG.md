# Update Log

## v0.95.3 — 2026-04-28

- **Notes & Logging N1** — `MarkdownField` component: all text fields (detail, todayNote, daily/weekly/monthly reflections, spot notes, free notes, log entries) now have an Edit/Preview toggle; rendered Markdown uses a serif font
- **Notes & Logging N2** — deep-link support in Markdown preview: `obsidian://` and `x-devonthink-item://` links open via `window.open`; fields with custom links show a faint hint "Custom links open in the desktop app if installed."
- **Notes & Logging N3** — per-piece Log Book in Repertoire view: pinned `detail` note at top + scrollable dated session log (newest first); filter bar; manual entry (+ Add note); inline edit/delete per entry
- **Notes & Logging** — "Single Entry, Multiple Echo": on day rollover, each item's `todayNote` is pushed as a `{source:'session'}` entry into `item.noteLog`; the daily `reflection` becomes a composite Markdown string (free text → `---` → `### Piece Title` sections)
- **Notes & Logging** — composite daily reflection rendered as Markdown in Logs view `DayLogContent`
- **Notes Tab revamp** — left sidebar with standard categories (Daily Reflections, Repertoire Logs) and user-defined folders; `#tag` cloud with click-to-filter; `[[wiki-link]]` fuzzy resolution (slug-based, date / piece / spot); Note editor has pen/eye preview toggle + folder picker + tag display
- **Data model** — schema bumped to v8; `noteLog: []` added to all items; `noteCategories` state persisted to `localStorage`; new `src/lib/notes.js` (slugify, scoreMatch, resolveWikiLink, parseTagsFromBody, buildCompositeDailyReflection)

## v0.95.0-beta — 2026-04-27

- **PDF score viewer P1** — PDF upload and reference link extended to all four repertoire types (Technique, Pieces, Play, Study)
- **PDF score viewer P2** — named bookmarks: add, rename, delete, jump to page; bookmark indicator ribbon on pages; toolbar bookmark button opens a popover with full bookmark list + inline add form
- **PDF score viewer P3** — full viewer controls: single-page, two-page spread, continuous scroll; zoom in/out with % indicator; fit-to-width / fit-to-page; page indicator; hover-labelled toolbar
- **PDF score viewer P4** — sidebar resizable by dragging the handle; fullscreen expand/minimize toggle in header
- **PDF score viewer P5** — shared score library: one PDF can be attached to multiple items; each attachment has an independent page range; "From library" picker in tab bar; deleting an attachment only removes the blob when no other item references it
- **PDF score viewer P6** — spot ↔ bookmark link: select a bookmark in SpotEditor; when the spot is activated, PdfDrawer auto-switches to the correct attachment and jumps to the linked page
- **Data model** — schema bumped to v7; attachment shape changed to `{id, libraryId, name, startPage, endPage, bookmarks[]}`; spots gain `bookmarkId` and `pdfAttachmentId` fields; automatic migration of existing data on load

## v0.93.5 — 2026-04-27

- **Recording R1–R3** — replaced mic icon with playback button; elapsed recording time shown in footer and panel; context-aware record (piece vs. daily when piece timer is running); attach daily recording to a piece in the current routine (resets daily recording after attach)
- **Keyboard shortcuts K1** — hover tooltip on all shortcut-enabled buttons showing the assigned key (`Space`, `R`, `M`, `T`, `L`, `D`, `N`, `?`)
- **Tuning panel TU1/TU3/TU4** — D key now opens/closes the tuning panel directly; all controls (Play · Vol · Pitch · Temperament · Octave) consolidated on one line; note selector redesigned as a piano keyboard (white/black keys with correct layout)

## v0.93 — 2026-04-26

- Smooth SVG bezier waveform with drag-to-scrub (playhead follows mouse)
- Transport controls: Play · Pause · Rewind · Re-record in one row; live time counter
- Day recording moved into footer pull-up drawer (like metronome/tuner)
- Per-piece recording archive in Répertoire: date/BPM/stage tagged, compact scrubbable waveform per entry
- A/B comparison: two waveforms side-by-side, fully independent playback and scrub
- Mic button per item in Today view for quick piece recording
- Today's piece recording shown as scrubbable waveform inside expanded item drawer

## v0.91 — 2026-04-26

- Sync conflict modal on cross-device sign-in: Merge / Keep local / Keep cloud
- Réglages tabs reordered: Settings → Shortcuts → Sync → Export → About
- Storage indicator moved to Sync tab
- Number input overflow fixed; spinner arrows removed
- Signup confirmation message added
- Cloudflare Pages deployment fixed (base path, SPA redirect)

## v0.90.1 — 2026-04-25

- Cloud sync via Supabase (optional sign-in)
- Two-tier sync strategy; all localStorage effects preserved
- First-run migration modal
- Blob guards for PDFs and recordings on non-originating devices

## v0.9.0 — 2026-04-25

- Études Design System applied across all UI
- IKB, ivory, brass color tokens; Cormorant Garamond + JetBrains Mono typography
- All glow/shadow effects removed

## v0.88.1 — 2026-04-25

- About tab in Réglages with version number
- Today view editing restrictions (title/composer/tags locked, edit via Repertoire)
