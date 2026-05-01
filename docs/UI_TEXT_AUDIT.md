# Études — UI text audit (search bars, placeholders, prepopulated content)

This document extends the full app copy audit with **search inputs**, **placeholders**, and **prepopulated or seeded default text** (including dev-only and debug seed flows).

User-generated titles, reflections, and dates are omitted except where the app supplies a **fixed default** (e.g. `Untitled`).

---

## 1. Search bars

| Location | Placeholder / behavior | File |
|----------|------------------------|------|
| Practice logs | `Search reflections, pieces, composers, spots, notes…` | `src/views/LogsView.jsx` |
| Répertoire (main library) | `Search pieces, composers, tags…` | `src/views/RepertoireView.jsx` |
| Répertoire — log book filter | `Filter log entries…` | `src/views/RepertoireView.jsx` |
| Notes — main search | `Search or #tag…` (typing `#` filters by tag) | `src/views/NotesView.jsx` |
| Notes — repertoire logs sidebar | `Filter by piece…` | `src/views/NotesView.jsx` |
| Programs — piece picker | `Search pieces…` | `src/views/ProgramsView.jsx` |

**Clear actions:** Logs and Notes use a **Clear** button label when a query is active; Répertoire search rows use **✕** to clear.

---

## 2. Prompt modals (title + input placeholder)

| Title | Placeholder | File |
|-------|-------------|------|
| `New routine` | `Name` | `src/views/RoutinesView.jsx` |
| `Save current arrangement as routine` | `Name` | `src/views/RoutinesView.jsx`, `src/views/TodayView.jsx` |

`PromptModal` is defined in `src/components/modals.jsx`; the input uses the caller’s `placeholder`.

---

## 3. Placeholders by screen (non-search fields)

### Auth (`src/components/modals.jsx`)

- `Email`, `Password`

### Footer quick note (`src/components/Footer.jsx`)

- `Jot a quick note for this session…`

### Today (`src/views/TodayView.jsx`)

- Quick add: `Title`, `Composer`
- Markdown: `What happened in this session?`, `Long-running notes…`, `How did today feel? What surprised you?`

### Week / Month (`src/views/WeekView.jsx`, `src/views/MonthView.jsx`)

- Week notes field: `What went well? What was difficult?`
- Week goals field: `What do you want to achieve next week?`
- Month notes field: `Highlights, breakthroughs, struggles…`
- Month goals field: `Monthly goals and intentions…`

### Routines (`src/views/RoutinesView.jsx`)

- `Intention for this session…`
- `Session target (min)`
- Per-piece time inputs use `min` (inline, same pattern as Today targets)

### Programs (`src/views/ProgramsView.jsx`)

- `Untitled program`, `Where`, `Who was there`
- `Why these pieces. Why this order. What you want to say.`
- `A note on this piece — attacca, long pause before, the pivot`
- `What the evening meant. What the room held. Whether the argument landed.`
- `Program notes, quotes, ideas — anything belonging to this program's world.`

### Répertoire (`src/views/RepertoireView.jsx`)

- Work: `Untitled`, `I. Prélude`, `Suite Bergamasque, WTC I…`, `Op. 110, BWV 846…`
- Composer / Author / Arranger: `—`
- Instrument: `piano, violin…`
- Tempo: `— bpm`
- Reference: `paste a link`
- Performances: `recital, lesson, audition…`
- Tags: `add + enter`
- Persistent notes (spot / piece context): `Fingerings, tempi, interpretive ideas…`
- Log book new note: `Write a retrospective note…`
- Length: `—` (hint text separate: `e.g. 3:45 or 4 (minutes)`)

### PDF drawer / viewer (`src/components/PdfDrawer.jsx`, `src/components/PdfViewer.jsx`)

- Page range: `Start`, `End`
- Notes: `Today's notes…`, `Long-running notes…`
- Bookmarks: `Bookmark name`, dynamic `p.{n}` for page on add-bookmark input

### Shared (`src/components/shared.jsx`)

- Target editor: `min`
- `MarkdownField` empty read-only fallback: `Nothing here yet.` (when no `placeholder` passed)
- Deep-link hint (when `showDeepLinkHint`): `Custom links open in the desktop app if installed.`

### Notes editor (`src/views/NotesView.jsx`)

- Folder: `Folder name…`
- Body (markdown): multi-line placeholder beginning `Write freely…` with tips for bold, italic, headings, `[[` links, `#tag`

### Piece recordings (`src/components/PieceRecordingsPanel.jsx`)

- Reference attach: `add reference · mp3 wav flac m4a` (helper line, not a native `placeholder`)

---

## 4. Prepopulated defaults (runtime / persisted shape)

### New items (`src/lib/items.js`)

- `makeNewItem`: new pieces use **`Untitled`** as `title`, empty strings for most text fields, `stage: 'queued'`.

### Migrations (`src/lib/migrations.js`)

- Spots missing a label get **`Untitled spot`**.

### Config labels used as UI defaults (`src/constants/config.js`)

- **Stages:** Queued, Learning, Polishing, Maintenance, Retired  
- **Session sections:** Technique, Pieces, Play, Study (with roman I–IV in Répertoire)  
- **`DEFAULT_SESSIONS`:** four empty sessions (ids `s-tech`, `s-piece`, `s-play`, `s-study`) — no visible labels in the constant itself; labels come from `SECTION_CONFIG`.

---

## 5. Debug: “+ Seed test notes” (`src/state/useEtudesState.js`)

Shown only when `seedTestNotes` is passed (dev wiring). Inserts **sample free notes**, **history** (daily / weekly / monthly markdown), and **per-item `detail` + `noteLog`** entries.

**Free note titles (examples):**  
On Intonation — Chromatic Scale Work; Pedaling Philosophy Notes; Memory Strategy — Structural Mapping; Masterclass Notes — Prof. Chen; Scale Practice Log — Week 17; The "Singing Tone" Problem; Rhythm Accuracy — Subdivisions; Audition Prep — Program Notes Draft; Double Stop Tuning — 3rds and 6ths; Quick Idea — Practising in Reverse; Weekly Reflection — Week 17; Bow Distribution Exercise.

**Free note categories used:** Practice Journal, Theory Analysis, Masterclass Notes, Audition Prep (and similar).

**History / logs:** Long markdown bodies for fake days, weeks, and months (session notes, reflections, goals).  
**Repertoire noteLog templates** (rotated): session-style entries with headings like `# Session Notes`, `## Intonation Check`, `# Breakthrough Moment`, etc., plus tags such as `#technique`, `#progress`, `#manual` vs `#session` source.

**Detail templates** (per item index): markdown starting with `# {title} — Practice Notes`, `# {title}`, or `# About This Piece` with sections for context, difficulties, interpretation.

---

## 6. Dev-only: Seed All (`src/dev/DevToolsBar.jsx`, `import.meta.env.DEV`)

**Button / status strings:** `dev`, `Seed All`, `Clear All` / `Sure?`, `starting…`, `seeding repertoire…`, `seeding history…`, `seeding notes, routines, programs…`, `seeding recordings & ref tracks…`, success/error status lines.

**Seeded repertoire (50 pieces):** Titles like `{Form} in {Key}` (e.g. *Prelude in D minor*), composers from a fixed list (Bach, Mozart, Chopin, …), catalogs like `Op. {n} No. {n}`, collections like `{form}s`, movements like `I. / II. / III.` + capitalized mood, `detail` lines like `{era} style — articulation and phrase pacing.`, instruments from `piano, violin, cello, flute, guitar, clarinet`, optional YouTube URLs from a small list.

**Seeded history:** `pieceNotes`, `techNotes`, `reflections` arrays drive per-day text (short English practice descriptions and markdown reflections).

**Seeded free notes (50):** Categories `Practice Journal`, `Theory Analysis`, `Masterclass Notes`, `Audition Prep`, `Repertoire Research`; bodies chosen from templates (e.g. `# Intonation Focus`, `# Session Notes`, `# Phrasing Work`, `# Technical Focus`, `# Memory Strategy`, `# Scale Log`, `# Masterclass Notes`, `# Repertoire Research`, `# Pre-Performance Notes`, `# Weekly Review`) with randomized tags and BPM tables.

**Seeded routines (8 names):** Morning Fundamentals; Deep Work Session; Maintenance Run; Pre-Performance Warmup; Technique Focus; Repertoire Polish; New Material; Sunday Full Practice. **Intentions** pool: e.g. `Focus on tone quality throughout`, `Slow practice — no rushing`, `Intonation priority`, …

**Seeded programs (5 names):** Spring Recital 2026; Audition Program; Studio Class; Informal House Concert; Competition Round 1 — with `notes` like `Program notes for {name}. Focus on musical continuity between pieces.`

**YouTube links:** Five fixed `youtube.com` / `youtu.be` URLs assigned to random pieces.

---

## 7. Notifications (`src/lib/notifications.js`)

- Notification **title:** `Études`  
- **Body:** `You haven't practiced today yet.`

---

## 8. Related: empty / helper copy tied to inputs

| Text | Role |
|------|------|
| `No matching pieces.` | Programs piece search empty |
| `No entries match.` | Log book filter empty |
| `No session notes yet. Notes from Today view are added here after day rollover.` | Log book empty |
| `No items available.` | `ItemPickerPopup` (`shared.jsx`) |

---

*Generated for copy review and localization. App version and schema: see `src/constants/config.js`.*
