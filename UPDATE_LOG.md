# Update Log

## v0.96.0 — 2026-04-30

- **Works offline** — the app installs as a PWA and caches all assets; loads instantly on repeat visits with no network connection needed
- **Mobile bottom navigation** — on phones, a fixed bottom tab bar replaces the desktop header tabs; eight tabs with icons; respects iPhone home indicator
- **Mobile header** — compact 44px bar with logotype and settings icon on small screens; full desktop header unchanged
- **Mobile footer** — on phones, the footer shows a live session timer and icon buttons for Rest, Record, Metronome, and Drone
- **Répertoire on mobile** — the Composers/Instruments filter panel slides in as a full-screen overlay instead of pushing the layout
- **PDF viewer on mobile** — score viewer fills the full screen; spots and bookmarks panel slides below the PDF
- **Apple Sign-In** — sign in with Apple alongside Google and email

## v0.95.7 — 2026-04-28

- **Google Sign-In** — one-click OAuth via Google alongside email/password
- **Embeds** — paste a YouTube, Spotify, or Apple Music link into Répertoire's Reference field and an inline player appears below it; also works in Today view
- **Daily reminder** — optional push notification at a chosen time; toggle and time picker in Settings → Settings
- **Export as primary action** — Export .md is now a full-width button in Settings → Export; secondary formats remain
- **Intention in Today** — when a routine is loaded, each session shows its practice intention in dim italic below the section header
- **Recording archive** — piece recordings use a FIFO rolling archive (10 slots); soft warning at 7, hard warning at 9; recordings can be locked to exempt them from the rolling limit (max 20 locked)
- **Cross-device placeholder** — when a recording or PDF exists on another device, the entry shows a dashed-stroke placeholder instead of an empty gap
- **Sync payload warning** — a banner in Settings → Sync appears when the cloud backup exceeds 500 KB, suggesting an export before the limit is reached

## v0.95.6 — 2026-04-28

- **Logs view** — unified card shell across Daily / Weekly / Monthly: identical border, padding, background, and hover state; 2px top accent as the sole type differentiator (IKB / DIM / LINE_STR); date promoted to 52px italic serif hero; minutes demoted to right-aligned mono badge; eyebrow labels unified to FAINT 10px uppercase

## v0.95.5 — 2026-04-28

- **Reference track — Today pull-up bar** — slide-up panel above the Footer when a ref track is active; green-tinted background, piece title header, full-width scrubbable waveform, varispeed 25–100% at 1% granularity; ♪ button per Today item activates/deactivates the bar
- **Reference track — Repertoire** — `RefTrackPlayer` restyled as a recording-style card with drag-and-drop file replace, full waveform, speed slider, Replace and Delete actions; varispeed 25–100% at 5% steps
- **Notes view** — sidebar starts level with note list; note list bounded to viewport height with independent scroll; sidebar collapse toggle; wiki links clickable in preview mode; Ctrl/Cmd+Click opens external links from editor; "Filter" button restores collapsed sidebar
- **Repertoire view** — "Facets" sidebar toggle renamed to "Filter"

## v0.95.4 — 2026-04-28

- **Week navigation** — back/forward chevrons in Week view; past-week ring and bar chart recomputed from history; reflection fields hidden for past weeks
- **Month navigation** — same pattern in Month view; "Now" button restores current period
- **Bar chart hover** — day column brightens to IKB blue tint in Week view; calendar cell fills with blue wash in Month view; 0.12s transitions
- **Routines view** — collapsed row: title at 1.4rem italic serif; session type labels 9px DIM; tightened padding
- **Notes view** — collapsible sidebar sections; dynamic h1 title; search bar hairline only; note list IKB hover tint + active left border; "Delete note" footer link; Preview/Edit toggle with ReactMarkdown GFM; vertical divider between list and editor

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
