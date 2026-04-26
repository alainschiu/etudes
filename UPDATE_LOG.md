# Update Log

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
