# Update Log

## v0.97.37 — 2026-05-07

- **Mobile UI sticks in landscape** — rotating a phone to landscape used to flip the app into the desktop layout (because the breakpoint was width-only, < 768 px). Now any touch-primary device keeps the mobile transport bar, mobile drone panel, mobile metronome sheet, and slide-in drawer regardless of width / orientation. Note: tablets (iPad etc.) will also use the mobile UI.

## v0.97.36 — 2026-05-07

- **Tuner keyboard — silent while drone is on** — tapping a key still selects the drone note, but the piano sample no longer plays while the drone is running, so the two voices don't fight. Stop the drone to use the keyboard as a piano again.

## v0.97.35 — 2026-05-07

- **Tuner keyboard — better piano tone** — replaced the FM bell tap sound with a proper piano-ish voice: short hammer-click, triangle fundamental, three slightly inharmonic sine partials each with their own decay, gently filtered. Brief sustain (~0.6 s).
- **Drone — shimmer removed** — the chooser now offers **sine** (default), **triangle**, **organ**.

## v0.97.34 — 2026-05-07

- **Tuner keyboard — bell tone** — replaces the previous piano emulation with a cleaner FM-bell (Rhodes-ish) one-shot when you tap a key. Same behaviour: tap selects the drone note and plays a short tone at the current octave, pitch ref, and temperament.
- **Drone — sound chooser** — desktop and mobile tuner now have a **Sound** row (between Temperament and Volume) with four timbres: **sine** (default), **triangle**, **shimmer** (two sines at ±6 ¢ for chorus), **organ** (Hammond-style sine drawbars 1× / 2× / 3×). Cycle while the drone is running — the timbre cross-fades cleanly.

## v0.97.33 — 2026-05-07

- **Tuner keyboard — playable** — tapping a key on the tuner's piano keyboard now plays a short, slightly sustained piano-ish tone at the current octave / pitch reference / temperament. Works on desktop and mobile, and on white keys and sharps. The drone is unchanged: keys still set the drone note as before; the sound is purely an add-on for note-finding.

## v0.97.32 — 2026-05-07

- **Mobile tuner — drag-along close** — the tuner panel now follows your finger as you swipe it down (matches the metronome sheet) and snaps closed past the threshold; springs back if you release short
- **Mobile tuner — handle dash** — added the small horizontal handle at the top of the panel so the swipe affordance is visible (same as the metronome sheet)

## v0.97.31 — 2026-05-07

- **Mobile metronome — swipe down to close** — drag the sheet (or its handle) downwards to dismiss; the chevron-down button still works
- **Mobile tuner — swipe down to close** — drag anywhere on the tuning panel downwards to dismiss; the close affordance is now a chevron-down (matches the metronome)

## v0.97.29 — 2026-05-07

- **Desktop footer — clearer beat indicator** — the mini beat strip on the always-visible bar is replaced with the same big, accent-aware beat bars used on mobile, so it's easy to read the pulse at a glance
- **Desktop footer — bigger time signature** — the `{beats}/{note}` label that opens the metronome panel is now a much more legible stacked button (BPM above the time signature)
- **Desktop footer — straighter alignment** — the `Aujourd'hui` total no longer drifts down when the day is closed with rest accumulated; it sits on the same line as the `Section` and `Status` totals at all times
- **Desktop footer — calmer chrome** — Rest / Record / Tuning buttons no longer show idle boxes; their borders only appear when the action is active. Their widths are locked, so the cluster stops shifting when state text changes (Record / REC / Piece / Rec piece, Tuning / A4)

## v0.97.11 — 2026-05-03

- **Google Drive — more reliable conflict detection** — a rare edge case where corrupted timestamps could silently skip the "newer backup found" prompt is now fixed; the prompt always appears when remote and local journals differ
- **Google Drive — rate-limit pause survives reload** — if Drive sync is paused because Google is throttling requests, the pause now persists across page reloads so the cooldown is honoured instead of immediately retrying
- **Google Drive — restore failures reported** — if one or more recordings or scores can't be downloaded during a Drive restore, a note appears in Settings after the restore finishes instead of silently continuing

## v0.97.10 — 2026-05-03

- **Google Drive — full backup flow** — after connecting Drive, you can **Backup now**, **Restore from Drive**, and turn on **auto-backup** (journal every 10 minutes, new recordings/PDFs debounced). A small manifest file on Drive helps recover file links if this device’s storage is cleared. Conflicts with a newer Drive journal show **Load from Drive** or **Keep local**.
- **Google Drive (dev tools)** — if you use Drive backup in development, you can run a **silent renewal** check from Settings → Sync (short-lived token + test button) so background sync is safe to build on
- **Drive rate limits** — groundwork for pausing bulk upload when Google throttles, instead of retrying silently for a long time

## v0.97.9 — 2026-05-03

- **Google Drive (early)** — Settings → Sync includes **Connect Google Drive** using Google’s sign-in (separate from your Supabase account). Full backup to Drive is still being built; this release wires the first step so we can verify your OAuth client.
- **Apple sign-in removed** — Sign in is email or Google only.

## v0.97.8 — 2026-05-02

- **PWA — offline in the header** — on mobile, the top bar shows a small **Offline** indicator when the device has no network (so you know why sync or uploads may not work, even though the app shell can still run from cache)
- **PWA — gentler updates** — when a new version is published, a small bar at the bottom offers **Reload** or **Later** instead of the tab switching over without warning
- **PWA — offline PDF worker** — the score viewer’s worker file is cached with the rest of the app so PDFs are more likely to open after you have used the app online once, then go offline
- **PWA — install card** — the web manifest now includes a short description and explicit scope/language fields for clearer install / store-style listings where the browser shows them

## v0.97.7 — 2026-05-02

- **Metronome — tempo matches the “Note” you pick** — BPM now follows the beat unit (e.g. eighth vs quarter), including in compound time, so the click spacing matches what you expect on the score
- **Metronome — steadier when you tweak settings** — changing BPM, beats, subdivision, or sound while the metronome runs no longer resets the whole pulse; compound 6/8-style setups apply subdivisions as soon as you use **Auto** without restarting
- **Metronome — clearer clicks** — click sound is shorter and more percussive (less like a held pitch)
- **Metronome — optional accent pattern** — in the metronome drawer (and the desktop Réglages metronome panel), when you have more than two beats per bar, you can tap beats to mark which ones get a stronger accent; **Reset** returns to automatic accents
- **Metronome — Auto for compound** — turning **Auto** **On** folds 6 / 9 / 12 / 15 beats (with one subdivision per beat and Group Off) into a triple-compound layout; leaving **Auto** off keeps six equal beats if that is what you want; changing the **Note** value alone does not trigger that fold
- **Metronome sheet** — subdivision row shows plain **1 2 3 4** (plus dotted option) for readability; preset meter chips removed in favour of Auto + manual controls

## v0.97.6 — 2026-05-01

- **Metronome widget (mobile)** — beat bars are now the dominant visual element; whole left zone (bars + BPM/time sig) is a single touch target that toggles the metronome; time signature rendered larger; chevron opens the sheet as before
- **Pulse mode** — new visual mode for the metronome widget: the entire box flashes briefly on each beat instead of showing bars. Beat 1 fires in IKB with a glow; other beats flash at reduced opacity. Toggle between Bars and Pulse in the metronome drawer.
- **Metronome sheet (mobile)** — all control rows (Beats, Note, Sub, Sound, Vol, Accel) now share a consistent left-aligned label column; accelerando section exposes the Step and Every inputs so the ramp is actually configurable on mobile
- **Today view items (mobile)** — tapping anywhere on an item row opens the inline edit panel (no longer requires the chevron); PDF icon appears inline next to the title and opens the score directly; expand panel shows Reference track, today's recording, today's note, and persistent notes in that order
- **Tuning panel (mobile)** — dedicated `MobileDronePanel` layout: full-width 64 px piano keyboard, stacked A=/Oct/Temperament rows, collapsible root + offset table; desktop panel unchanged
- **Audio — iOS playback fixes** — `AudioContext.resume()` called on user gesture for metronome, drone, and waveform playback (fixes silent audio on first tap on iOS); MIME type negotiation (`webm;codecs=opus → mp4 → fallback`) for `MediaRecorder` so recordings are playable on all platforms
- **Audio — recording key collision** — piece recording IDB keys now include a timestamp suffix (`itemId__date__ts`) so same-day re-records no longer silently overwrite each other
- **Audio — drone note change** — frequency transitions use an exponential ramp (30 ms) instead of an instant set, eliminating the audible click on note change
- **Audio — waveform context limit** — `computePeaks` reuses a single module-level `AudioContext` instead of creating a new one per call (was hitting the 4-context iOS limit after a few recordings)
- **Waveform display** — removed the redundant second smoothing pass in the display component (peaks are already smoothed twice in `computePeaks`); waveforms are slightly crisper
- **Wiki links (mobile)** — `[[wiki-link]]` taps in the CodeMirror editor now use a direct non-passive `touchstart` DOM listener so `preventDefault` is called before iOS initiates navigation; read-only markdown links also intercept `touchstart` to prevent the SPA reload that was jumping back to Today
- **Recording soft mutex** — starting a new recording while one is already running shows an inline "Stop current and start new?" confirmation banner above the footer instead of silently failing or using a modal

## v0.97.5 — 2026-05-01

- **Mobile navigation** — hamburger drawer replaces the bottom tab bar; primary views (Today, Répertoire, Programs, Logs, Notes) show icon + label + eyebrow; Review and Routines as secondary items; Export and Réglages as utility actions
- **Today on mobile** — accordion sections, target progress bar, item rows with pulse dot when active, collapsible reflection, close-the-day pill
- **Footer on mobile** — three-row transport: readout strip (active item + elapsed), Play/Pause · metronome widget · Record · Plus, status strip with today total and rest toggle; metronome opens a full bottom sheet
- **Répertoire on mobile** — list view with filter sheet; tap a piece to open a full detail screen with Spots, Info, Recordings, and Score tabs
- **Notes on mobile** — folder chip strip, search, expand-in-place, edit bottom sheet
- **Logs on mobile** — vertical day list grouped by month, 2px section bar per day, reflection excerpt; taps open the existing log drawer
- **Programs, Routines, Review on mobile** — reduced padding, minimum 44px touch targets throughout
- **Typography (all screens)** — display headings weight 400; Répertoire and Today item titles in EB Garamond italic; reading prose (reflections, notes, spot annotations) in EB Garamond
- **PWA** — iOS home screen meta tags; manifest theme colour aligned to app background; icon `any maskable`

## v0.97.0 — 2026-05-01

- **Calmer copy** — placeholders and Settings text tightened across Today, Review (week/month), Routines, Répertoire, Logs search, and the footer quick-note bar; empty lists that used different phrases now say **Nothing here yet.** in one voice
- **Réglages** — shorter reminder and sync explainers; sync conflict choices renamed to **Keep this device** and **Keep cloud version**; shortcut help text simplified in Settings and Help
- **Daily reminder** — notification wording is inviting instead of implying you failed to practice
- **User guide** — conflict-resolution terms updated to match the new sync buttons

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
