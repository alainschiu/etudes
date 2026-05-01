# Études — UI text audit (search bars, placeholders, prepopulated content)

This document extends the full app copy audit with **search inputs**, **placeholders**, **Settings (Réglages) modal copy**, and **prepopulated or seeded default text** (including dev-only and debug seed flows).

User-generated titles, reflections, and dates are omitted except where the app supplies a **fixed default** (e.g. `Untitled`). **Dynamic** strings (e.g. Supabase `authError`, `exportProgress` from import/export) are noted where the surrounding label is fixed.

---

## 1. Search bars

| Location | Placeholder / behavior | File |
|----------|------------------------|------|
| Practice logs | `Search logs…` | `src/views/LogsView.jsx` |
| Répertoire (main library) | `Search…` | `src/views/RepertoireView.jsx` |
| Répertoire — log book filter | `Filter log entries…` | `src/views/RepertoireView.jsx` |
| Notes — main search | `Search or #tag…` (typing `#` filters by tag) | `src/views/NotesView.jsx` |
| Notes — repertoire logs sidebar | `Filter by piece…` | `src/views/NotesView.jsx` |
| Programs — piece picker | `Search pieces…` | `src/views/ProgramsView.jsx` |

**Clear actions:** Logs and Notes use a **Clear** button label when a query is active; Répertoire search rows use **✕** to clear.

---

## 2. Settings modal — Réglages (`src/components/modals.jsx` → `SettingsModal`)

Chrome: **Configuration** (eyebrow) · **Réglages** (title) · close control (icon only).

### Tab strip

| Tab label |
|-----------|
| Settings |
| Shortcuts |
| Sync |
| Export |
| About |

### Settings tab (`tab === 'settings'`)

| Kind | Text |
|------|------|
| Section | Targets |
| Row labels | Daily · Weekly · Monthly |
| Hint (under each target) | minutes · warm-up excluded |
| Section | Daily reminder |
| Row label | Reminder |
| Hint | no streaks · no consequences · opt-in |
| Toggle | On / Off |
| Row label (if reminder on) | Time |
| Footnote | Appears once on days you haven't opened Études. Requires notification permission. Resets each day. |

### Sync tab (`tab === 'sync'`)

| Kind | Text |
|------|------|
| Section | Storage |
| Status line | saved locally on this device · *or* · storage unavailable |
| Badge | ● local · *or* · ○ memory |

**When signed in (`user` present):**

| Kind | Text |
|------|------|
| Section | Account |
| Dynamic | user email (not fixed copy) |
| Status line (if `lastSyncedAt > 0`) | **Last cloud sync** + locale time (e.g. `Last cloud sync 03:45 PM`) — prefix is fixed; time is formatted by the browser |
| Primary button (by `syncStatus`) | **Syncing…** · **Sync error** · **Sync now** |
| Button | Sign out |
| Warning (if `syncPayloadWarning`) | Your journal is large. Export a backup to protect your data. |
| Explainer | **What syncs:** repertoire, practice history, notes, settings, and recording metadata. |
| Explainer | **Local only:** audio recordings and PDF scores. Use Export to back them up. |

**After email sign-up (`signupSent`):**

| Kind | Text |
|------|------|
| Section | Check your inbox |
| Body | A confirmation link was sent to **{email}**. Follow it to activate, then return here to sign in. |
| Link-style button | Back to sign in |

**Sign-in / sign-up form (not signed in, not `signupSent`):**

| Kind | Text |
|------|------|
| Section | Continue with |
| Button | Google |
| Divider | or |
| Section | Sign in with email |
| Placeholders | Email · Password |
| Dynamic | Supabase / auth error message (italic, when present) |
| Submit (by mode) | Sign in · Create account |
| Toggle link | No account — create one · Already have an account — sign in |
| Footnote | Sync covers repertoire, history, notes, and settings. Recordings and PDFs stay on this device — use Export to back them up. |

### Export tab (`tab === 'export'`)

| Kind | Text |
|------|------|
| Section | Journal export |
| Button | Export journal |
| Helper (idle) | Includes notes, logs, recordings, and scores. Audio files may be large. |
| Dynamic | `exportProgress` string while export runs (from `useImportExport.js`; not a single fixed sentence) |
| Section | Backup & restore |
| Paragraph | Full backup of all data, PDFs, and recordings in one file. |
| Buttons | Backup · Restore |

### Shortcuts tab (`tab === 'shortcuts'`)

Rows from `SHORTCUTS` (key → description):

| Key | Description |
|-----|-------------|
| Space | Start or pause |
| R | Toggle rest timer |
| M | Toggle metronome |
| D | Toggle tuning drone |
| T | Tap tempo |
| L | Log BPM |
| N | Quick note |
| 1 – 4 | Jump to section |
| ? | Open Réglages |
| Esc | Close |

Footer note: **Shortcuts are disabled while typing in a field.**

### About tab (`tab === 'about'`)

| Kind | Text |
|------|------|
| Row | Version *current build* (uppercase “Version” + italic “current build”) |
| Value | `v` + app version from `package.json` (e.g. `v0.97`) |
| Row | User Guide |
| Link label | etudes.me/guide → |

### Modal footer (all tabs)

| Button |
|--------|
| Done |

### Related modals in the same file

- **`HelpModal`:** eyebrow **Reference** · title **Shortcuts** · shortcut rows aligned with Settings tab (D uses “Toggle tuning drone”; **?** still includes “(includes shortcuts)”) · same footnote about shortcuts disabled while typing.
- **`SyncConflictModal`:** heading **Sync — both devices have data** · body with piece counts · overlap note (two variants) · footer about audio/PDFs · buttons **Merge — keep everything**, **Keep this device**, **Keep cloud version**.
- **`ConfirmModal` / `PromptModal`:** generic **Cancel**, **Confirm**, **Save**; body/title from callers (see other sections).

---

## 3. Prompt modals (title + input placeholder)

| Title | Placeholder | File |
|-------|-------------|------|
| `New routine` | `Name` | `src/views/RoutinesView.jsx` |
| `Save current arrangement as routine` | `Name` | `src/views/RoutinesView.jsx`, `src/views/TodayView.jsx` |

`PromptModal` is defined in `src/components/modals.jsx`; the input uses the caller’s `placeholder`.

---

## 4. Placeholders by screen (non-search fields)

### Auth — Settings Sync tab (`src/components/modals.jsx`)

- `Email`, `Password`

### Footer quick note (`src/components/Footer.jsx`)

- `A note for this session…`

### Today (`src/views/TodayView.jsx`)

- Quick add: `Title`, `Composer`
- Markdown: `What happened.`, `Long-running notes…`, `How today felt. What surprised you.`

### Week / Month (`src/views/WeekView.jsx`, `src/views/MonthView.jsx`)

- Week notes field: `What you noticed. What held you back.`
- Week goals field: `What you intend for next week.`
- Month notes field: `What the month held.`
- Month goals field: `What you intend for next month.`

### Routines (`src/views/RoutinesView.jsx`)

- `What you intend for this session.`
- `Session target (min)`
- Per-piece time inputs use `min` (inline, same pattern as Today targets)

### Programs (`src/views/ProgramsView.jsx`)

- `Untitled program`, `Where`, `Who was there`
- `Why these pieces. Why this order. What you want to say.`
- `A note on this piece — attacca, long pause before, the pivot`
- `What the evening meant. What the room held. Whether the argument landed.`
- `Program notes, quotes, ideas — anything belonging to this program's world.`

### Répertoire (`src/views/RepertoireView.jsx`)

- Work: `Untitled` · Movement: `I. Prélude` · Collection: `Suite Bergamasque` · Catalog: `Op. 110`
- Composer: `Composer` · Author / Arranger: `—`
- Instrument: `Instrument`
- Tempo: `— bpm`
- Reference: `Link`
- Performances: `recital, lesson, audition…`
- Tags: `add + enter`
- Persistent notes (spot / piece context): `Fingerings, tempi, interpretive ideas…`
- Log book new note: `A note on this session.`
- Length: `—` (hint text separate: `e.g. 3:45 or 4 (minutes)`)

### PDF drawer / viewer (`src/components/PdfDrawer.jsx`, `src/components/PdfViewer.jsx`)

- Page range: `Start`, `End`
- Notes: `Today's notes…`, `Long-running notes…`
- Bookmarks: `Bookmark name`, dynamic `p.{n}` for page on add-bookmark input

### Shared (`src/components/shared.jsx`)

- Target editor: `min`
- `MarkdownField` empty read-only fallback: `Nothing here yet.` (when no `placeholder` passed)
- Deep-link hint (when `showDeepLinkHint`): `Custom links open in the installed app.`

### Notes editor (`src/views/NotesView.jsx`)

- Folder: `Folder name…`
- Body (markdown): multi-line placeholder beginning `Write freely…` with tips for bold, italic, headings, `[[` links, `#tag`

### Piece recordings (`src/components/PieceRecordingsPanel.jsx`)

- Reference attach: `add reference · mp3 wav flac m4a` (helper line, not a native `placeholder`)

---

## 5. Prepopulated defaults (runtime / persisted shape)

### New items (`src/lib/items.js`)

- `makeNewItem`: new pieces use **`Untitled`** as `title`, empty strings for most text fields, `stage: 'queued'`.

### Migrations (`src/lib/migrations.js`)

- Spots missing a label get **`Untitled spot`**.

### Config labels used as UI defaults (`src/constants/config.js`)

- **Stages:** Queued, Learning, Polishing, Maintenance, Retired  
- **Session sections:** Technique, Pieces, Play, Study (with roman I–IV in Répertoire)  
- **`DEFAULT_SESSIONS`:** four empty sessions (ids `s-tech`, `s-piece`, `s-play`, `s-study`) — no visible labels in the constant itself; labels come from `SECTION_CONFIG`.

---

## 6. Debug: “+ Seed test notes” (`src/state/useEtudesState.js`)

Shown only when `seedTestNotes` is passed (dev wiring). Inserts **sample free notes**, **history** (daily / weekly / monthly markdown), and **per-item `detail` + `noteLog`** entries.

**Free note titles (examples):**  
On Intonation — Chromatic Scale Work; Pedaling Philosophy Notes; Memory Strategy — Structural Mapping; Masterclass Notes — Prof. Lehmann; Scale Practice Log — Week 17; The "Singing Tone" Problem; Rhythm Accuracy — Subdivisions; Audition Prep — Program Notes Draft; Double Stop Tuning — 3rds and 6ths; Quick Idea — Practicing in Reverse; Weekly Reflection — Week 17; Bow Distribution Exercise.

**Free note categories used:** Practice Journal, Theory Analysis, Masterclass Notes, Audition Prep (and similar).

**History / logs:** Long markdown bodies for fake days, weeks, and months (session notes, reflections, goals).  
**Repertoire noteLog templates** (rotated): session-style entries with headings like `# Session Notes`, `## Intonation Check`, `# Breakthrough Moment`, etc., plus tags such as `#technique`, `#progress`, `#manual` vs `#session` source.

**Detail templates** (per item index): markdown starting with `# {title} — Practice Notes`, `# {title}`, or `# About This Piece` with sections for context, difficulties, interpretation.

---

## 7. Dev-only: Seed All (`src/dev/DevToolsBar.jsx`, `import.meta.env.DEV`)

**Button / status strings:** `dev`, `Seed All`, `Clear All` / `Sure?`, `starting…`, `seeding repertoire…`, `seeding history…`, `seeding notes, routines, programs…`, `seeding recordings & ref tracks…`, success/error status lines.

**Seeded repertoire (50 pieces):** Titles like `{Form} in {Key}` (e.g. *Prelude in D minor*), composers from a fixed list (Bach, Mozart, Chopin, …), catalogs like `Op. {n} No. {n}`, collections like `{form}s`, movements like `I. / II. / III.` + capitalized mood, `detail` lines like `{era} style — articulation and phrase pacing.`, instruments from `piano, violin, cello, flute, guitar, clarinet`, optional YouTube URLs from a small list.

**Seeded history:** `pieceNotes`, `techNotes`, `reflections` arrays drive per-day text (short English practice descriptions and markdown reflections).

**Seeded free notes (50):** Categories `Practice Journal`, `Theory Analysis`, `Masterclass Notes`, `Audition Prep`, `Repertoire Research`; bodies chosen from templates (e.g. `# Intonation Focus`, `# Session Notes`, `# Phrasing Work`, `# Technical Focus`, `# Memory Strategy`, `# Scale Log`, `# Masterclass Notes`, `# Repertoire Research`, `# Pre-Performance Notes`, `# Weekly Review`) with randomized tags and BPM tables.

**Seeded routines (8 names):** Morning Fundamentals; Deep Work Session; Maintenance Run; Pre-Performance Warmup; Technique Focus; Repertoire Polish; New Material; Sunday Full Practice. **Intentions** pool: e.g. `Focus on tone quality throughout`, `Slow practice — no rushing`, `Intonation priority`, …

**Seeded programs (5 names):** Spring Recital 2026; Audition Program; Studio Class; Informal House Concert; Competition Round 1 — with `notes` like `Notes for {name}.`

**YouTube links:** Five fixed `youtube.com` / `youtu.be` URLs assigned to random pieces.

---

## 8. Notifications (`src/lib/notifications.js`)

- Notification **title:** `Études`  
- **Body:** `Your practice journal is waiting.`

---

## 9. Related: empty / helper copy tied to inputs

| Text | Role |
|------|------|
| `Nothing here yet.` | Programs piece search empty, log book filter empty, log book with no entries, `ItemPickerPopup` (`shared.jsx`) — unified empty string |

---

*Generated for copy review and localization. App version and schema: see `src/constants/config.js`.*
