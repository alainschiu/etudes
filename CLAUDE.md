# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (http://localhost:5173/app/)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # run ESLint
```

There is no test suite.

## Architecture

Études is a single-page React + Vite app (base path `/app/`) for tracking music practice sessions.

### State management

All application state lives in one large custom hook: `src/state/useEtudesState.js`. It directly owns every piece of state and exposes all actions as functions. `App.jsx` calls this hook once, destructures everything, and passes props down to views — there is no context API or external state library.

Every persisted state slice has a dedicated `useEffect` that writes it to `localStorage` via `lsSet`. Reads happen in `useState` initializers via `lsGet`. Binary blobs (PDFs, audio recordings) go to IndexedDB via the helpers in `src/lib/storage.js`. The in-memory fallback (`memStore`) activates automatically when `localStorage` is unavailable.

`useEtudesState` composes four sub-hooks for isolated concerns:
- `useMetronome` — Web Audio API metronome with tap-tempo
- `useRecording` — MediaRecorder audio capture stored in IDB
- `useImportExport` — JSON backup/restore (IDB blobs serialized as base64) and Markdown/TXT log export
- `useKeyboardShortcuts` — global `keydown` handler (Space, R, M, T, L, D, N, ?, Escape, 1–4)

### Data model

**Items** are practice pieces/exercises. Each has a `type` (`tech`, `piece`, `play`, `study`) and a `stage` (`queued`, `learning`, `polishing`, `maintenance`, `retired`). Items can have `spots` (sub-sections for targeted practice), `performances` (upcoming dates), `pdfs`, BPM logs, and tags.

**Timer data** is stored flat in `itemTimes`: `{ [itemId]: seconds, [itemId:spotId]: seconds }`. `getItemTime(itemTimes, id)` in `src/lib/items.js` sums both the parent bucket and all spot buckets for a given item.

**Sessions** (`todaySessions`) are the four practice blocks in Today view, ordered by type. Each session holds optional `itemIds`, per-session and per-item targets, and an `isWarmup` flag.

**History** is an array of entries with `kind: 'day' | 'week' | 'month'`. Day entries snapshot item minutes and reflections when the day is closed. Day rollover is detected by comparing `localStorage` keys (`etudes-lastActiveDate`, `etudes-lastWeekStart`, `etudes-lastMonthKey`) against today's date on load.

**Routines** are saved session templates (list of sessions with intentions and item assignments) that can be loaded into Today view.

**Programs** group repertoire items into named collections.

### Schema migrations

`src/lib/migrations.js` exports `SCHEMA_VERSION` (currently 6) and both live migrations (applied on startup to data already in `localStorage`) and import migrations (applied to JSON backup files during restore). When adding fields to the item shape, add a runtime migration in `migrateItems` and an import migration entry in `IMPORT_MIGRATIONS`.

### Design system

All color tokens, border values, and font stacks are defined in `src/constants/theme.js` and imported as named constants (`BG`, `SURFACE`, `TEXT`, `MUTED`, `IKB`, etc.). IKB (International Klein Blue `#002FA7`) is the primary accent. Tailwind is used for layout and spacing utilities only; colors are always applied via inline `style` props using theme constants.

### Supabase sync (optional)

Sync is opt-in. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, users can sign in and their entire state blob is upserted to the `user_state` table on every change. On sign-in, if cloud data is newer than local, the user is prompted to restore. The Supabase client is initialized lazily in `src/lib/supabase.js`; if env vars are absent the module still exports a no-op client.

### Conventions

- Code is intentionally minified/dense (single-letter local variables, no line breaks in utility files). Match this style when editing `src/lib/` files.
- New items must go through `makeNewItem(type)` in `src/lib/items.js` to guarantee all required fields are present.
- `displayTitle(item)` handles the `collection / movement` display logic — use it everywhere a title is rendered.
- The `no-unused-vars` ESLint rule ignores names matching `^[A-Z_]` (uppercase constants are often imported for side-effects or passed through).
- Vite is configured with `base: '/app/'`; all asset paths must be relative to that base.
