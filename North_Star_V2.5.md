---
aliases: [Etudes-NorthStar]
---

# Études — North Star AI Primer v2.5
### Canonical brief for any AI writing copy, generating code, proposing features, or extending the product.
### Read this before touching anything. This document supersedes all prior versions.

---

## I. What Études is

Études is the quiet companion for a musical life.

It is the app a serious musician opens at the start of the day and closes at the end. Not a productivity tool. Not a tracker. Not a platform. A private, literate space — the kind bound in cloth, set in serif type, left open on a music stand — where musical work is taken seriously and the tool gets out of the way.

It answers three questions, in order, every day:

1. *What will I work on?* — **intention**
2. *What am I doing, right now?* — **attention**
3. *What did it mean?* — **reflection**

Everything else is decoration or distraction. If a proposed feature does not serve one of those three moments, it does not belong.

---

## II. The North Star

> A quiet, literate place where a musical life is taken seriously — and the tool gets out of the way.

Hold this phrase against every decision.

"Quiet" rules out notifications, streaks, confetti, and most color. "Literate" rules out startup voice, emoji, and marketing gloss. "Taken seriously" rules out gamification and trivializing metaphors. "Gets out of the way" rules out modals, wizards, onboarding carousels, and feature bloat.

When in doubt, remove something.

---

## III. Who Études is for

A musician — professional or seriously learning — who wants to live a musical life with intention. Someone who thinks about music when they are not playing it. Who keeps notes on what they hear. Who wants to know where their time has gone and what it meant.

Études does not serve the casual hobbyist. It serves the person for whom music is a practice in the oldest sense: a discipline returned to daily, for years.

---

## IV. The core tension

Every meaningful product has a tension it lives inside. Études has one:

**Measurement vs. meaning.**

A practice companion must count time (or it is just a notebook) and must let time mean something (or it is just a stopwatch). Études sits between these. The timer is present but never the point. The ring closes but does not celebrate. The log accumulates but does not rank.

Every feature decision is a vote on this tension. If a proposal pulls toward measurement — streaks, scores, leaderboards, analytics dashboards — reject or soften. If it pulls toward meaning — reflection prompts, per-piece notes, journal entries, stage markers, audio traces — strengthen. The balance is always held slightly toward meaning.

Numbers are present in monospace. Words are present in serif. That typographic hierarchy is the philosophical hierarchy.

---

## V. What Études holds

A musical life is more than practice sessions. Études holds all of it, organized across seven areas:

**Repertoire**  
A living database of every piece being worked on, studied, or remembered. Instrumentation, learning stage, catalog numbers, tempo targets, scores, reference recordings. The library a musician actually carries in their head, made legible and searchable.

**Practice**  
Timed sessions with intention set before and reflection captured after. Free mode and prescribed routines. The daily structure of serious work.

**Recording**  
A rolling archive of audio takes per piece — the ten most recent, with the ability to lock the ones that matter. Not performances. Documents. Traces of the work as it actually sounds on a given day.

**Knowledge**  
Wiki-style markdown notes with internal links. A note on a piece can link to the daily log from that session. A reflection can reference the score, the recording, the week. A personal knowledge base organized around a musician's own musical life — not imported from anywhere, not shared with anyone.

**Reflection**  
Daily, weekly, and monthly writing surfaces. The question asked every day is not "did you hit your targets" but "what did it mean." The log accumulates without ranking.

**Time**  
A complete record of how musical life has accumulated. Sessions, pieces, recordings, notes — a journal that grows quietly and does not judge.

**Programs**  
A private salon journal — the record of musical thought taking its most composed, most intentional public form, however intimate that public may be. A program is a curatorial act: an argument about which pieces belong together, in what order, for what reason, on a specific evening. The order is part of the meaning. The absence of certain pieces is part of the meaning. The audience of three friends in a living room is as valid as any concert hall — this is the oldest form of musical gathering: the salon, the Hausmusik, the Schubertiade. Programs holds intention (why these pieces, why this sequence), reflection (what the evening meant, what the room held), marginal notes on individual pieces, and free prose for program notes. It is the only surface in Études organized around performance time — the moment when private practice takes its most composed, outward form. It does not belong in Répertoire. It cannot be reduced to a tag.

These are not features. They are the seven things a serious musician actually needs a companion to hold.

---

## VI. Style — the visual system

Études has one coherent aesthetic. Do not invent new ones.

The exact design tokens — hex values, font sizes, spacing units — live in `src/constants/` and are the single source of truth. Do not hardcode values in components. Do not introduce new tokens without adding them there first. What follows are the principles those tokens express.

**Palette**  
Near-black backgrounds. Warm paper-colored text. One primary accent: International Klein Blue — used with a soft glow, used rarely, used only where it means something (active timer, active nav tab, targets met, own recordings, progress rings, calendar intensity). One secondary accent: warm gold (`--warm`) — used only where it means something (rest timer, warm-up sessions, locked recordings, A/B comparison B-track). No third accent. No semantic color set — no green for success, no red for error except a muted tone on destructive hover. Lines and separators carry the layout, not fills, not shadows, not cards.

**Two colors, two semantics, neither decorative.**  
IKB is the color of practice itself — active, in motion, counting, the musician's own work. Gold is the color of practice's edges — rest, preparation, preservation, the comparator. They describe different states and never compete. This is the complete color vocabulary. Do not extend it.

**Typography**  
Three faces, two roles:
- **Cormorant Garamond** (`--serif`) — display only: page headings, section headings, program names, piece titles in display context. `fontWeight: 400`, italic, letter-spaced tight. Never used for body prose at reading size.
- **EB Garamond** (`--serifText`) — reading prose only: journal reflections, intentions, note bodies, spot annotations, program body text, any text the musician reads rather than scans. `fontWeight: 400`, line-height 1.8. Never used for display headings.
- **Inter** (`--sans`) — interface chrome: tabs, metadata, eyebrow labels, small uppercase labels, button text. Never italic unless a deliberate grace note.
- **JetBrains Mono** (`--mono`) — numbers only: timer readouts, minutes, BPM, file sizes, waveform timestamps. Never used for prose.

The distinction between Cormorant Garamond and EB Garamond is not aesthetic preference — it is functional. Cormorant Garamond is a display face; it renders poorly at body size on screen. EB Garamond is a text face; it reads comfortably at 15–16px. Use them in their correct roles.

Display headings use `clamp(32px, 6vw, 56px)`. Section headings use `clamp(22px, 4.5vw, 36px)`. Both at `fontWeight: 400` — restrained weight, not bold, not thin. At 56px, 400 is book-weight. At 32px on mobile, 300 is too thin.

Eyebrow labels are small, sans, uppercase, widely letter-spaced (`0.28–0.32em`), reduced opacity. They are architectural — they name sections the way chapter headers name chapters.

**French grace notes**  
French appears occasionally — *étude, journal du jour, en cours, réglages, aujourd'hui, métronome, tempi* — always in italic serif. Never as a substitute for a plainer English word. Never cute.

**Ornamental vocabulary**  
One IKB dot or logotype in the header. A thin IKB underline on the active nav tab. IKB glow on the active timer, own recording state, and progress rings. IKB intensity rails on calendar cells with practice. IKB color-shift when a target is met. Gold on the rest timer, warm-up session headers, locked recording rows (left border and tinted background), and the B-track waveform in A/B comparison. That is all. No icons-as-decoration. No emoji. No gradients. No rounded-card shadows.

**Z-index stack**  
Every overlay component must slot into this defined stack. Do not invent z-values outside it.
- `50` — Drawer panel
- `49` — Drawer scrim
- `40` — Bottom sheets (metronome, note editor, filter panel)
- `20` — Footer (fixed)
- `10` — TopBar (fixed)
- `auto` — All other content

---

## VII. Voice — how Études speaks

Études speaks like a well-educated teacher who respects the student. Not a coach. Not a friend. Not a cheerleader.

It is quiet, specific, confident, and sparing. It uses the words a musician would use — piece, répertoire, reflection, study, stage, rubato, intention — and avoids the words a startup would use: dashboard, engagement, journey, crush, unlock, insights.

It does not address the user as "you" unless necessary. It omits possessives where it can. "A place to put today's practice" is better than "Your place to track your practice."

It never exclaims. It never hedges. It never apologizes. It never explains what it is doing — it simply does it.

Empty states say "Nothing here yet" or simply "—". Error states say "Something didn't load. Try again in a moment." Headings are 1–3 words. Body is 2–4 sentences per paragraph. Lists are rare, and only when prose will not do.

---

## VIII. Function — what Études does

**1. It holds the repertoire.**  
A full library of what is being worked on. Grouped into four kinds: technique (scales, exercises, warm-ups), pieces (composed repertoire with composer, catalog number, notes, optional PDF score, reference recording link, learning stage), play (tunes by ear, improvisation material), and study (score analysis, listening, mental work). Items have a title, tags, optional notes, a started date that sets itself on first practice, and — for pieces — a five-stage arc: queued → learning → polishing → maintenance → retired. Pieces may carry named spots — defined passages within a work (a difficult run, a transitional chord, a section by measure number) — each with its own practice log, tempo target, and persistent annotation. Spots are timed independently when active and appear in the log drawer beneath their parent piece.

**2. It times practice.**  
One item is active at a time. Pressing play on a different item moves the clock. Total-today, section totals, and per-item totals all accumulate. A separate rest timer counts breaks without contaminating practice totals — rendered in gold, not IKB, because rest is the edge of practice, not practice itself. The timer is a plain stopwatch. It does not set goals, pace, or congratulate — though it will quietly shift to IKB when an optional target is met.

**3. It keeps a metronome.**  
BPM, time signature, subdivision, tap tempo, tempo name presets, and minimal click sounds. Three sound profiles (click, wood, beep). The footer visualizer shows beats and subdivisions as lines — a quiet oscilloscope in two modes: bars (vertical lines, one per beat) and pulse (single rectangle, flash per beat). A look-ahead scheduler runs on a 25ms `setInterval`, scheduling Web Audio events up to 250ms ahead for timing precision independent of JavaScript's event loop jitter. Visual beat updates are driven by a separate `requestAnimationFrame` loop reading the scheduled queue — audio and visual clocks are fully decoupled. Parameter changes (beats, subdivision, sound, compound) take effect on the next scheduled step without restarting the engine or resetting phase. An accelerando mode ramps BPM toward a target across a set number of bars or beats. For compound meters (6/8, 9/8, 12/8), BPM is dotted-quarter tempo; use Beats=2, Sub=3 for 6/8.

**4. It records sound.**  
A rolling archive of takes per piece. Stored locally, rendered as a waveform in IKB, playable inline. MIME type is negotiated at record time (webm/opus → mp4 → fallback) so recordings play correctly on all platforms including iOS. Takes can be locked to protect them from the FIFO rolling limit; locked rows carry gold. Any two recordings — within the same piece or across two different pieces — can be placed in an A/B comparison: two waveforms side by side, one in IKB (the primary), one in gold (the comparator). Reference audio attached to a piece renders in `--muted`, subordinate to the musician's own IKB takes. Études is not a player; reference recordings that are external URLs open in a new tab. Only one recording session can be active at a time — starting a new recording while another is in progress prompts a quiet inline confirmation, no modal.

**5. It sustains a drone.**  
A configurable reference pitch labeled "Tuning" — three A= reference standards (440 Hz, 432 Hz, 415 Hz), three temperaments (Equal, Just, Meantone ¼-comma), full chromatic note and octave selection, adjustable volume, cent offset display. No pitch detection is performed. The drone is a reference, not a judge.

**6. It holds a personal knowledge base.**  
Wiki-style markdown notes with internal linking and folder organization. Notes connect pieces, sessions, reflections, programs, and ideas into a musician's own private reference. A commonplace book that grows with practice.

**7. It lets you reflect.**  
A daily entry on Today. A weekly reflection. A monthly reflection at Review scale. Reflections are never quantified or scored. The question is always "what did it mean," never "did you hit your number."

**8. It holds a program journal.**  
Named programs — private evenings, salon performances, recitals — with an ordered sequence of pieces, per-piece marginal annotations, a written intention before and a written reflection after, and free prose for program notes. The sequence is the argument. The evening as a whole is held as a statement, not disaggregated into its parts. Programs and Notes may cite each other through the wiki-link system: a program can link to a note built over months; a note can link back to the program it informed.

**9. It exports the journal.**  
A complete ZIP archive: per-entity markdown files with YAML frontmatter, audio blobs in their original format (webm or mp4), PDF scores, and a machine-readable `_data.json`. Delivered via platform-appropriate mechanism — a download on desktop and Android, a share sheet (AirDrop, Files) on iOS PWA. The musician owns their practice in readable form at all times. The markdown files are readable in any text editor, markdown viewer, or Obsidian vault without the app.

Everything else — the views, the rings, the calendar, the logs, the drawer — is a window onto these nine things at a different temporal scale.

---

## IX. Architecture — the temporal spine and platform layout

Études is organized along a single spine: time scale.

**Today** — the active surface. Planning and doing. Session stack, active timer, rest toggle, daily recording, daily reflection. The only view with the Working on rail. On mobile, sessions collapse into accordion sections — one open at a time, expanding to reveal items, a target progress bar, and a collapsible reflection block.

**Review** — a single temporal surface with a scale selector: Week and Month. At week scale: a 7-day bar chart, a ring to the weekly target, clickable days that open the log drawer, a two-field weekly reflection. At month scale: a calendar with IKB intensity rails per day, a ring to the monthly target, clickable days that open the log drawer, a two-field monthly reflection. A future year view lives here, not in a new tab.

**Répertoire** — the atemporal view. The library of all items, with learning stages, accumulated time, spots, tags, notes, reference links, PDF scores, tempo histories, and deep editing. This is where pieces live between practice days. On mobile, tapping a piece navigates to a dedicated detail screen with four tabs: Spots, Info, Recordings, Score.

**Routines** — named arrangements of sessions with pinned pieces, optional intentions, and optional targets. Composed deliberately. Loaded onto Today to prescribe a day.

**Logs** — the archive. On desktop: a horizontal gallery of past sessions in three card types (daily, weekly, monthly). On mobile: a vertical day list with date, total, a 2px section color bar, and a reflection excerpt. Each entry opens the log drawer showing date, total minutes, recording waveform, items by section, and full reflection.

**Notes** — freeform, wiki-linked markdown writing. Separate from practice session reflections. A knowledge base for pedagogy, philosophy, quotes, ideas that don't belong to any single date. Searchable and internally linkable. On mobile: single-column list with folder chips, expand-in-place preview, and a bottom-sheet editor.

**Programs** — a private salon journal. Each program is a named evening with an ordered sequence of pieces, per-piece marginal annotations (*"attacca," "long silence before," "the pivot"*), a written intention, a written reflection, and free markdown for program notes. The only surface organized around performance time rather than practice time. The sequence is the argument.

**Navigation — desktop and tablet (≥ 768px)**  
Persistent left sidebar with seven tabs. Active tab: IKB underline. The desktop layout is canonical. Tablet (≥ 768px) uses the full desktop layout without modification — at that width it holds comfortably.

**Navigation — mobile (< 768px)**  
A hamburger button in the TopBar opens a slide-in drawer from the left. The drawer organizes the seven surfaces into two tiers that reflect actual usage frequency:

*Primary* (icon + label + eyebrow, Inter 15px weight 500):
- Today — *Aujourd'hui*
- Répertoire — *Pieces · technique · study*
- Programs — *Salon journal*
- Logs — *Practice history*
- Notes — *Reference & ideas*

*Secondary* (Inter 10px caps, no eyebrow):
- Review
- Routines

*Utilities* (same style, trigger actions not navigation):
- Export
- Réglages

The drawer does not use serif for navigation labels. Labels are interface chrome — Inter only. The wordmark at the top of the drawer (*Études*) is the only serif element inside it.

A persistent footer at the bottom of every mobile view holds the transport controls in three rows: a readout row (active item + elapsed time, visible only when a session is active), a transport row (play/pause, metronome widget, record, quick-add), and a status row (today total and rest toggle). The footer's rendered height is published as `--footer-height` via a ResizeObserver so views can apply correct bottom padding dynamically.

The navigation is the product's mental model. Seven tabs. Do not add an eighth without removing another. Do not rename them without strong reason.

---

## X. The session model — free mode and prescribed routines

A single concept governs Today: the **session stack**.

A day is an ordered list of sessions. Each session is one of the four types — technique, pieces, play, study — and contains items to work on. Sessions can be reordered, hidden, and re-added. A session carries an optional target in minutes. Individual items within a session may also carry their own optional target. Targets shift to IKB when met. No alarms, no completion states, no confetti.

**Free mode** is the default. Each session shows every repertoire item of its type. The musician picks what to work on in the moment.

**Prescribed mode** activates when a routine is loaded. The session stack is replaced with that routine's arrangement. An IKB-underlined italic routine name appears at the top. A Free mode reset button returns to default at any time. Pieces pinned by the routine can be removed for today; more can be added for today. Editing Today never alters the saved routine. The routine is the score; the day is the performance.

The distinction matters: free mode is for responsive practice; routines are for structured practice. Both are first-class. Neither is better.

---

## XI. Data model — the shape of the journal

Ten primary shapes, nothing more:

**Item** — `{ id, type, title, composer, movement, collection, instrument, length, tags[], detail, referenceUrl, referenceAudioBlob?, stage, startedDate, bpmLog[], spots[] }`. The unit of practice. Stages: queued → learning → polishing → maintenance → retired. `movement` is the part name within a larger work; `collection` is the containing work; `instrument` is the performing instrument; `length` is duration in decimal minutes, used by Programs for total duration. `referenceUrl` is an external link — opens in a new tab. `referenceAudioBlob` is an optional locally stored audio file rendered in `--muted`. `spots` is an array of `{ id, name, note, tempoTarget, bpmLog[] }`.

**ItemTime** — `{ itemId → seconds }`. Lifetime accumulated practice time per item.

**SectionTime** — `{ 'tech'|'piece'|'play'|'study' → seconds }`. Today's accumulated time per section.

**Session (Today)** — `{ id, type, itemIds | null, target | null, itemTargets: { itemId → minutes } }`.

**Routine** — `{ id, name, sessions: [{ type, intention, itemIds[], target, itemTargets }] }`.

**HistoryEntry** — `{ date, minutes, items: [{id, minutes}], reflection }`. Written at day rollover. Never retroactively altered.

**Reflection** — three scales: daily (string), weekly and monthly (two-field: notes, goals).

**Note** — `{ id, date, title, body, folder | null }`. Markdown, internally linkable, independent of sessions.

**RecordingMeta** — `{ itemId → [{ ts, peaks[], size, locked, mimeType, idbKey, r2Key? }] }` plus audio blobs in IndexedDB. Rolling ten unlocked takes per piece, FIFO; up to twenty locked takes per piece, exempt from FIFO. `mimeType` is detected at record time and stored for correct playback. `idbKey` is stored in each metadata entry — never re-derived — to prevent key collisions when re-recording on the same day. `r2Key` present for Pro subscribers with cloud sync.

**Program** — `{ id, name, performanceDate | null, venue | null, audience | null, itemIds[], itemNotes: { itemId → string }, intention | null, reflection | null, body | null }`. An ordered list of pieces with an authored argument. `itemIds` order is the program order. `audience` is a private plain-text field — displayed only within the program editor, never in any aggregate view or export.

Plus interaction state: workingOn, restToday, loadedRoutineId, and settings.

Do not add without deliberation: difficulty scores, ratings, mood enums, XP, badges, social fields, per-minute annotations. Each compromises the data model's quiet.

---

## XII. What not to build

**Streaks that celebrate.** The streak counter has been removed. It does not return in any form — no glyph, no number, no setting. The Review tab's month calendar shows consistency quietly. That is enough.

**Gamification of any kind** — points, levels, badges, XP, achievements.

**Social features** — sharing, feeds, following, comments, public profiles.

**Pushy notifications or reminders.** Études does not nag. A daily reminder, if offered, is opt-in, off by default, non-streak framed, and buried in Settings.

**AI-generated practice plans.** Practice is the musician's to design.

**Sentiment analysis** of journal entries or recordings. The journal is private thought.

**Pitch detection or automatic tempo extraction** from recordings. The recording is a trace, not a data source.

**Analytics dashboards.** The calendar intensity rails and the tempo sparkline are the limit of visualization.

**Comparative metrics.** No "you practiced more than 60% of pianists this week."

**Onboarding carousels, feature tours, empty-state cartoons.**

**A third accent color.** IKB and gold are the complete vocabulary. Do not introduce green, teal, purple, or any other color for any reason. When tempted, ask what the quieter solution is.

**A light mode implemented as a CSS invert or filter.** The near-black palette is a design argument, not a default. If a light mode is ever added, it requires a full parallel token system — a deliberate product decision, not a setting.

**Dense modal dialogs with tabs.** If a modal has tabs, it should be a view.

**Third-party embeds of any kind.** Reference recordings are external links — a URL, a new tab, nothing more. Études is not a player.

**Multiple recordings per day in the daily journal slot.** The constraint is the feature. The Rolling Archive per piece is separate and additive.

**Intentions on Today's sessions.** Intentions live in Routines only. Today is for doing.

**Targets that fail loudly.** A missed target is indistinguishable from no target, by design.

**Programs as a filter, tag, or view within Répertoire.** A program is not a named subset of pieces. It is a curatorial act at a different temporal scale — an evening with an argument. Do not surface it as a chip, a dropdown, or a grouping in Répertoire.

**Serif labels in the mobile drawer navigation.** Nav labels are interface chrome — Inter only. The wordmark is the only exception.

When a user asks for one of these, ask what quieter underlying need they are expressing. Streaks usually means "help me see I'm being consistent" — which the Review tab's month calendar already does, quietly.

---

## XIII. Evolution principles — how Études should grow

**Prefer deepening to adding.** Before proposing a new view, ask whether an existing view can answer the question more honestly.

**Prefer the paper metaphor.** When uncertain how something should feel, ask: how would this work in a cloth-bound practice journal? A bound journal has no notifications. It has margins. It has a thickness that grows. It can be carried away as plain text. That last point is a commitment: Études exports the full journal in a form the musician can read without the app. The musician owns their practice in readable form at all times. A future print/PDF output — selecting a typeface, setting page margins, defining a drop cap for the first entry — belongs on the roadmap as a dedicated track. The markdown export is the foundation that makes it possible.

**Prefer removal to rearrangement.** If a surface feels crowded, something should leave, not shuffle.

**Prefer one good way over three adequate ways.** Études does not believe in "user preference" as a design value. A well-made tool has one well-made way of doing each thing. Do not add a theme picker. Do not add a "classic view" toggle.

**Prefer silence to instruction.** If a feature needs a tooltip, it probably needs to be simpler. Keyboard shortcuts are the one exception — silent by default, available behind a single help panel.

**Prefer craft to novelty.** A better serif rendering, a more honest reflection prompt, a quieter metronome sound, a smoother waveform render — these are the improvements that matter.

**Platform-native interaction patterns are adaptations, not additions.** Push navigation within a view, bottom sheets, expand-in-place, accordion sections — these are permitted on mobile when they serve attention without adding cognitive overhead. They are not new features; they are the same features rendered appropriately for the screen. Desktop code paths must be preserved byte-for-byte.

**Accessibility is not in tension with quiet.** Font size scaling and alternative reading faces are expressly permitted — they serve the musician without changing what the product looks like for everyone else. A text size setting (three steps: default, large, larger) and an optional alternative reading font (such as OpenDyslexic, for the prose faces only) belong in Settings. They do not belong anywhere prominent.

---

## XIV. Current state — v0.98

**Navigation:** Seven views implemented: Today, Review, Répertoire, Routines, Logs, Notes, Programs. Week and Month consolidated into Review with a scale selector. Programs view is complete — list view, full editor (intention, piece list with drag reorder, per-piece annotations, reflection, body markdown), wiki-link integration in both directions with Notes.

**Session model:** Free-or-prescribed. Today defaults to free mode. Accordion sessions on mobile. Per-item recording buttons permanently visible on mobile item rows.

**Targets:** Optional at three levels: daily (Settings), per-section, per-item. IKB when met. Never fail loudly.

**Timer:** Single active item. Per-item, per-section, and total-today counters. Rest toggle in gold. Day rollover archives at midnight.

**Metronome:** Look-ahead scheduler (25ms `setInterval` + `requestAnimationFrame` visual loop). Audio and visual clocks fully decoupled. Parameter changes (beats, subdivision, sound, compound) take effect on the next step without phase reset. Three sound profiles. Bars and Pulse visualizer modes. Accelerando. Compound meter presets (6/8: beats=2, sub=3, group=3; BPM = dotted-quarter tempo). BPM history logged per item as a sparse sparkline in Répertoire.

**Tuning:** Labeled "Tuning" throughout. A=440/432/415 Hz. Three temperaments (Equal, Just, Meantone ¼). Full chromatic selection. Cent offset display. Volume. Mobile redesign with full chromatic keyboard (64px tall), stacked control rows, collapsible cent offset table. No pitch detection.

**Recording:** Rolling Archive — ten unlocked takes per piece (FIFO), twenty locked (exempt). MIME type negotiated at record time (webm/opus → mp4 → fallback). `idbKey` stored in metadata — key collisions on same-day re-recording resolved. A/B comparison across pieces. IKB for own takes, gold for locked rows and B-track comparator, `--muted` for reference audio. Recording mutex: only one active MediaRecorder at a time; conflict prompts a quiet inline confirmation.

**Export:** ZIP archive — per-entity markdown files with YAML frontmatter, audio blobs in original format, PDF scores, `_data.json`. Platform-aware delivery (download on desktop/Android, share sheet on iOS PWA). `--footer-height` CSS custom property set dynamically by ResizeObserver for correct mobile bottom padding.

**Notes:** Wiki-style markdown, folder organization, internal linking. Mobile: folder chip strip, expand-in-place preview, bottom-sheet editor with full wiki autocomplete.

**Répertoire:** Five-stage arc (queued → learning → polishing → maintenance → retired). Spots. Tempo sparkline. PDF scores. Reference recordings. Collections. Mobile: piece detail screen with four tabs (Spots, Info, Recordings, Score); all fields editable as full-width stacked inputs.

**Logs:** Desktop — horizontal gallery (daily, weekly, monthly card types). Mobile — vertical day list with section color bar (IKB/gold/ivory) and reflection excerpt.

**Auth:** Email via Supabase. Google OAuth live. Apple OAuth deferred. Sync: metadata to Supabase; audio and PDF sync via Cloudflare R2 planned for Pro tier.

**Mobile PWA:** Drawer navigation. TopBar (hamburger, wordmark, settings). Three-row footer transport. Safe-area insets. `--footer-height` dynamic property. Metronome bottom sheet. Z-index stack documented in `src/constants/theme.js`. Offline cache via service worker.

**Design system:** Tokens in `src/constants/`. Display headings at `fontWeight: 400` and `clamp(32px, 6vw, 56px)`. EB Garamond for reading prose (`--serifText`), Cormorant Garamond for display (`--serif`). Margins owned by layout containers, not components. `--warm` scoped to four surfaces with inline comment. Z-index stack documented.

**Open items:**

1. **Google Drive backup.** Mechanism identified: `drive.file` scope on existing Google OAuth, `provider_token` passed to Google REST API, ZIP reuses `buildZip`. Implementation ready to build.

2. **Print / PDF output.** Deferred to a dedicated track. The markdown export is the foundation. When built: `@react-pdf/renderer` with embedded fonts, three template styles (Manuscript, Archive, Program), `fontWeight: 400` Cormorant Garamond for display, EB Garamond for body.

3. **Obsidian sync.** Not buildable as true bilateral sync across platforms. Resolved as: Google Drive backup (covers Drive-synced vaults natively) + a "Save to Obsidian vault" export path on desktop Chrome (File System Access API, one-way, one day of work).

4. **`noteValue` → beat duration.** Deferred until North Star defines BPM semantics (quarter-note tempo vs. notated beat tempo). Currently BPM means pulses per minute for whatever grid is configured with beats + subdivision + compoundGroup. Document the semantics before building.

5. **Accessibility settings.** Text size scaling (three steps) and alternative reading font are permitted and planned for Settings. Not yet built.

---

## XV. When generating code, copy, or proposals

Before writing anything for Études, ask, in order:

1. Does this serve intention, attention, or reflection?
2. Does it sit on the side of meaning, not pure measurement?
3. Is it quieter than what already exists — or at least as quiet?
4. Does it fit one of the seven existing views — or does it genuinely require an eighth?
5. Does it respect the free-mode / prescribed-routine distinction?
6. Does it respect the visual system and voice as specified — and use `src/constants/` for any tokens?
7. Would a cloth-bound practice journal do something like this, in spirit?
8. Is there something that could be removed instead of added to achieve the same end?

If the answer to any of these is no, stop and reconsider. If the answer to all is yes, proceed — and write it in serif, in short sentences, with IKB for practice and gold for its edges, and nothing else.

---

*Études is a small product that intends to last. Build accordingly.*

---

*North Star AI Primer v2.5 — May 2026 — supersedes v2.3*
