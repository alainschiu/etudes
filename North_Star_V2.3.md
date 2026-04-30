# Études — North Star AI Primer v2.3
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
Three faces, never mixed within a single element:
- Serif (Cormorant Garamond / EB Garamond) for anything expressive: headings, titles, composer names, journal prose, italic labels, routine names, intentions.
- Sans (Helvetica Neue / Inter) for interface chrome: tabs, metadata, small uppercase labels.
- Monospace tabular for numbers only: timer readouts, minutes, BPM, file sizes.

Display headings are large, light-weight, often italic, letter-spaced tight. They say one or two words. "Today." "This week." "Répertoire." Brevity is the point.

Eyebrow labels are small, sans, uppercase, widely letter-spaced, reduced opacity. They are architectural — they name sections the way chapter headers name chapters.

Body prose reads like a page in a book, not a screen in an app.

**French grace notes**  
French appears occasionally — *étude, journal du jour, en cours, réglages, aujourd'hui, métronome, tempi* — always in italic serif. Never as a substitute for a plainer English word. Never cute.

**Ornamental vocabulary**  
One IKB dot or logotype in the header. A thin IKB underline on the active nav tab. IKB glow on the active timer, own recording state, and progress rings. IKB intensity rails on calendar cells with practice. IKB color-shift when a target is met. Gold on the rest timer, warm-up session headers, locked recording rows (left border and tinted background), and the B-track waveform in A/B comparison. That is all. No icons-as-decoration. No emoji. No gradients. No rounded-card shadows.

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
BPM, time signature, subdivision, tap tempo, tempo name presets, and minimal click sounds. The footer visualizer shows beats and subdivisions as marks — a quiet oscilloscope, not a drumline. A single control marks the current tempo to the active item, building a sparse history over time. An accelerando mode ramps tempo automatically toward a target — step size and interval are set by the musician. Useful for systematic tempo development on a difficult passage; not a substitute for deliberate practice.

**4. It records sound.**  
A rolling archive of takes per piece. Stored locally, rendered as a waveform in IKB, playable inline. Takes can be locked to protect them from the FIFO rolling limit; locked rows carry gold — the color of preservation. Any two recordings — within the same piece or across two different pieces — can be placed in an A/B comparison: two waveforms side by side, one in IKB (the primary), one in gold (the comparator). A cross-piece comparison bar persists while navigating Répertoire. Reference recordings attached to a piece — a teacher's demo, a model performance — render in `--muted`, subordinate to the musician's own IKB takes. Études is not a player; reference recordings that are external URLs open in a new tab. This is how Études treats sound: as a stratum of the journal equal to the written reflection.

**5. It sustains a drone.**  
A configurable reference pitch for intonation work — three A= reference standards (440 Hz, 432 Hz, 415 Hz), three temperaments (Equal, Just, Meantone ¼-comma), selectable note and octave, adjustable volume. For the player working through a Bach partita in meantone, or a string player tuning open strings against a tonic pedal, this is the tool. No pitch detection is performed. The drone is a reference, not a judge.

**6. It holds a personal knowledge base.**  
Wiki-style markdown notes with internal linking. Notes connect pieces, sessions, reflections, and ideas into a musician's own private reference. A commonplace book that grows with practice.

**7. It lets you reflect.**  
A daily entry on Today. A weekly reflection. A monthly reflection. Reflections are never quantified or scored. The question is always "what did it mean," never "did you hit your number."

**8. It holds a program journal.**  
Named programs — private evenings, salon performances, recitals — with an ordered sequence of pieces, per-piece marginal annotations, a written intention before and a written reflection after, and free prose for program notes. The sequence is the argument. The evening as a whole is held as a statement, not disaggregated into its parts. Programs and Notes may cite each other through the wiki-link system: a program can link to a note built over months; a note can link back to the program it informed.

Everything else — the views, the rings, the calendar, the logs, the drawer — is a window onto these eight things at a different temporal scale.

---

## IX. Architecture — the temporal spine

Études is organized along a single spine: time scale.

**Today** — the active surface. Planning and doing. Session stack, active timer, rest toggle, daily recording, daily reflection. The only view with the Working on rail.

**Review** — a single temporal surface with a scale selector: Week and Month. At week scale: a 7-day bar chart, a ring to the weekly target, clickable days that open the log drawer, a two-field weekly reflection. At month scale: a calendar with IKB intensity rails per day, a ring to the monthly target, clickable days that open the log drawer, a two-field monthly reflection. The distinction that matters is not the tab — it is the scale. A future year view lives here, not in a new tab.

**Répertoire** — the atemporal view. The library of all items, with learning stages, accumulated time, spots, tags, notes, reference links, PDF scores, tempo histories, and deep editing. This is where pieces live between practice days.

**Routines** — named arrangements of sessions with pinned pieces, optional intentions, and optional targets. Composed deliberately. Loaded onto Today to prescribe a day.

**Logs** — the archive. A horizontal gallery of past sessions in three card types: daily (a single session), weekly (a dot row across seven days), and monthly (a mini calendar with a dot per practiced day). Meant to be scrolled like flipping pages; each card opens the log drawer. Searchable by piece, composer, or reflection text.

**Notes** — freeform, wiki-linked markdown writing. Separate from practice session reflections. A knowledge base for pedagogy, philosophy, quotes, ideas that don't belong to any single date. Searchable and internally linkable. May cite and be cited by Programs.

**Programs** — a private salon journal. Each program is a named evening with an ordered sequence of pieces, per-piece marginal annotations (*"attacca," "long silence before," "the pivot"*), a written intention, a written reflection, and free markdown for program notes. The only surface organized around performance time rather than practice time. The sequence is the argument.

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

**Item** — `{ id, type, title, composer, movement, collection, instrument, length, tags[], detail, referenceUrl, referenceAudioBlob?, stage, startedDate, bpmLog[], spots[] }`. The unit of practice. Stages: queued → learning → polishing → maintenance → retired. `movement` is the part name within a larger work (e.g. *I. Prélude*); `collection` is the containing work (e.g. *Suite Bergamasque*); `instrument` is the performing instrument; `length` is duration in decimal minutes, used by Programs for total duration. `referenceUrl` is an external link — opens in a new tab. `referenceAudioBlob` is an optional locally stored audio file (teacher's demo, model recording) rendered in `--muted`, stored in IndexedDB alongside practice takes. `spots` is an array of `{ id, name, note, tempoTarget, bpmLog[] }` — named passages within the piece, each independently timed and logged.

**ItemTime** — `{ itemId → seconds }`. Lifetime accumulated practice time per item.

**SectionTime** — `{ 'tech'|'piece'|'play'|'study' → seconds }`. Today's accumulated time per section.

**Session (Today)** — `{ id, type, itemIds | null, target | null, itemTargets: { itemId → minutes } }`.

**Routine** — `{ id, name, sessions: [{ type, intention, itemIds[], target, itemTargets }] }`.

**HistoryEntry** — `{ date, minutes, items: [{id, minutes}], reflection }`. Written at day rollover. Never retroactively altered.

**Reflection** — three scales: daily (string), weekly and monthly (two-field: notes, goals).

**Note** — `{ id, date, title, body, folder | null }`. Markdown, internally linkable, independent of sessions. `folder` groups notes in the sidebar; a note without a folder is uncategorized.

**RecordingMeta** — `{ itemId → [{ ts, peaks[], size, locked, r2Key? }] }` plus audio blobs in IndexedDB. Rolling ten unlocked takes per piece, FIFO; up to twenty locked takes per piece, exempt from FIFO and deletable only by explicit unlock. `r2Key` present for Pro subscribers with cloud sync.

**Program** — `{ id, name, performanceDate | null, venue | null, audience | null, itemIds[], itemNotes: { itemId → string }, intention | null, reflection | null, body | null }`. An ordered list of pieces with an authored argument. `itemIds` order is the program order. `audience` is a private plain-text field — a memory of who was there, displayed only within the program editor, never in any aggregate view. `body` is free markdown for program notes, quotes, and ideas belonging to this program's world.

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

**A third accent color.** IKB and gold are the complete vocabulary. Gold is not available for new uses beyond rest, warm-up, locked recordings, and A/B B-track. IKB is not available for states it does not currently describe. Do not introduce green, teal, purple, or any other color for any reason. When tempted, ask what the quieter solution is.

**Dense modal dialogs with tabs.** If a modal has tabs, it should be a view.

**Third-party embeds of any kind.** Reference recordings are external links — a URL, a new tab, nothing more. Études is not a player. No iframes, no embedded audio players, no YouTube embeds, anywhere.

**Multiple recordings per day in the daily journal slot.** The constraint is the feature. The Rolling Archive per piece is separate and additive.

**Intentions on Today's sessions.** Intentions live in Routines only. Today is for doing.

**Targets that fail loudly.** A missed target is indistinguishable from no target, by design.

**Programs as a filter, tag, or view within Répertoire.** A program is not a named subset of pieces. It is a curatorial act at a different temporal scale — an evening with an argument. Do not surface it as a chip, a dropdown, or a grouping in Répertoire. Do not dissolve it into the piece library. It deserves its own surface because it is the only surface organized around performance time.

When a user asks for one of these, ask what quieter underlying need they are expressing. Streaks usually means "help me see I'm being consistent" — which the Review tab's month calendar already does, quietly.

---

## XIII. Evolution principles — how Études should grow

**Prefer deepening to adding.** Before proposing a new view, ask whether an existing view can answer the question more honestly.

**Prefer the paper metaphor.** When uncertain how something should feel, ask: how would this work in a cloth-bound practice journal? A bound journal has no notifications. It has margins. It has a thickness that grows. It can be carried away as plain text. That last point is a commitment: Études exports the full journal in a form the musician can read without the app. The musician owns their practice in readable form at all times. A future print/PDF output — selecting a typeface, setting page margins, defining a drop cap for the first entry — belongs on the roadmap as a dedicated track. The markdown export is the foundation that makes it possible.

**Prefer removal to rearrangement.** If a surface feels crowded, something should leave, not shuffle.

**Prefer one good way over three adequate ways.** Études does not believe in "user preference" as a design value. A well-made tool has one well-made way of doing each thing. Do not add a theme picker. Do not add a "classic view" toggle.

**Prefer silence to instruction.** If a feature needs a tooltip, it probably needs to be simpler. Keyboard shortcuts are the one exception — silent by default, available behind a single help panel.

**Prefer craft to novelty.** A better serif rendering, a more honest reflection prompt, a quieter metronome sound, a smoother waveform render — these are the improvements that matter.

---

## XIV. Current state — v0.97

Seven views are implemented: Today, Week, Month, Répertoire, Routines, Logs, Notes. **In progress:** Week and Month are being consolidated into a single Review tab with a scale selector; Programs is being built as the seventh tab to replace them.

The session model is free-or-prescribed. Today defaults to free mode. Loading a routine prescribes sessions — ordered, named, with pinned pieces, optional intentions, and optional targets.

Targets are optional at three levels: daily (Settings), per-section, and per-item. They shift to IKB when met. They never fail loudly.

The timer works end-to-end. Single active item. Per-item, per-section, and total-today counters. Rest toggle counts breaks independently and renders in gold. Day rollover archives at midnight.

The metronome is substantial. BPM slider, tap tempo, beats-per-bar, note value, subdivision, three sound profiles, Italian tempo presets, footer visualizer, and accelerando mode. BPM history is manual-only, logged per item as a sparse sparkline in Répertoire.

The tuning and drone panel is accessible from the footer. A=440/432/415 Hz, three temperaments (Equal, Just, Meantone ¼), full chromatic note selection, cent offset display, adjustable volume. No pitch detection.

Audio recording is a Rolling Archive — up to ten unlocked takes per piece (FIFO), up to twenty locked takes per piece (exempt from FIFO), rendered in IKB. Locked rows carry gold. A/B comparison is available for any two recordings within or across pieces — the primary track in IKB, the comparator in gold. Reference audio attached to a piece renders in `--muted`. Stored in IndexedDB. Cross-device delivery path planned via Cloudflare R2 for Pro tier.

Notes are wiki-style markdown with internal linking and folder organization. A note can reference a piece, a log entry, another note, or a program. This is the knowledge layer — a musician's private commonplace book that connects across the entire journal.

Répertoire is the deepest view. Items have a five-stage arc (queued → learning → polishing → maintenance → retired), accumulated time, last-practiced date, tempo history sparkline, spots, notes, tags, PDF scores, reference recordings (external URL — opens in a new tab; reference audio — stored locally, rendered in `--muted`), and full editing. Collections group movements. Filtering by type, stage, composer, instrument, and tag.

Logs are a horizontal scroll gallery in three card types: daily, weekly, and monthly. Log drawer is the canonical day-review surface — opened from Review, or Logs — showing date, total minutes, recording waveform, items and spots by section, and full reflection.

Auth is email-based via Supabase. Google OAuth is live. Apple OAuth is deferred — required if the app is ever wrapped for App Store submission. Sync is optional metadata-to-Supabase; full audio and PDF cloud sync via Cloudflare R2 is planned for Pro tier.

Mobile PWA adaptation is in active development on a feature branch. Bottom tab navigation, responsive layouts, service worker offline cache, safe-area insets. The seven-view mental model is preserved.

**Three open items — resolve before beta:**

1. **Export format.** The long-stated commitment was a zip of Markdown files with YAML frontmatter. The current export is a single `.md` file. Replace with the ZIP format specified in the export track. Do not ship a paid tier before resolving this.

2. **Programs view.** The data model is implemented. The view is not. Programs requires its own tab in the primary navigation, built to the full shape specified in §XI. The Week/Month consolidation into a single Review tab (with scale selector) is the architectural change that keeps the nav at seven tabs while Programs takes its place. Complete this consolidation and build the Programs view together as a single piece of work.

3. **Design system consistency.** Heading scale, margin architecture, and token audit need a dedicated pass before the app is shown to new users. Inconsistencies between views are visible on close inspection.

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

*North Star AI Primer v2.3 — April 2026 — supersedes v2.2*
