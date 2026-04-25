# Changelog

## v0.91 — 2026-04-26

### Fixes & polish

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
