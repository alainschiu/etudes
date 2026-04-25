# Changelog

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
