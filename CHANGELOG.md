# Changelog

## v0.90.1 — 2026-04-25

### Cloud sync via Supabase

- Optional sign-in added to Réglages → Sync tab (email/password; no account required to use the app)
- Two-tier sync strategy: cold state (items, routines, programs, history, settings, reflections, notes) debounced 30 s; hot state (itemTimes, restToday) flushed only on session stop, day close, tab hide, or reconnect
- All 18 existing localStorage effects untouched — cloud sync is a purely additive layer
- First-run migration modal: on first sign-in, prompts to upload existing local data or start fresh
- Sync status indicator in the Sync tab (idle / syncing / synced / error)
- Automatic push on reconnect via `navigator.online` event
- Blob guards: PDFs and recordings are not synced in v1; items with attached media show "Attached on another device" / "Recording on another device" on devices that never had the file, rather than silently failing

### New files

- `src/lib/supabase.js` — Supabase client initialisation
- `src/lib/useSupabaseAuth.js` — composable auth sub-hook composed inside `useEtudesState`
- `src/lib/sync.js` — `loadFromCloud` / `syncToCloud`
- `supabase/migrations/001_user_state.sql` — `user_state` table + row-level security policy

---

## v0.9.0 — 2026-04-25

### Design system alignment

- Adopted the Études Design System across all UI primitives
- Updated color tokens to DS values: `--ink-050` app background, `--ivory-100` primary text, `--accent-500` IKB ultramarine, `--semantic-warn` brass
- Replaced old IKB `#2540D9` with true International Klein Blue `#002FA7`
- Removed all glow and drop-shadow effects (wordmark dot, active tab indicator, transport buttons, waveform peaks, Ring SVG, StageLabels, SpotRow)
- Added CSS custom properties for the full DS token set (colors, spacing, radii, type scale, motion easing) via `src/index.css`
- Updated Google Fonts import to load Cormorant Garamond, EB Garamond, Inter, and JetBrains Mono
- Exported `mono` (JetBrains Mono) and `serifText` (EB Garamond) font stacks from `src/constants/theme.js`
- Applied monospace font to all tabular numerics: header clock, footer timers, BPM display, drone Hz/cents readouts, tempo markings

---

## v0.88.1 — prior

See git log for earlier history.
