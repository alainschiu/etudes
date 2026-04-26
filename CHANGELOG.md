# Changelog

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
