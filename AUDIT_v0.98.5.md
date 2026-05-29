# Études — Deep-Dive Audit Report

**App version:** v0.98.5
**Branch:** `claude/app-audit-deep-dive-ZAbrD`
**Date:** 2026-05-29
**Scope:** Full codebase — build/test health, sync-hardening invariants, security & privacy, design-token compliance, documentation drift.
**Method:** Read-only. Build, test suite, dependency audit, and static inspection of all of `src/`, plus the Supabase migration and `index.html`. No source files were modified.

---

## Verdict

The app is in genuinely good health. The v0.98.x sync-hardening invariants hold almost
perfectly, there is no telemetry, no committed secrets, no XSS surface, and row-level
security is correct. Build is green and the full test suite passes.

The real debt is concentrated in **design-token drift** — precisely the item the North
Star itself flags as an open pre-beta task (§XIV.2) — plus a few smaller
correctness and documentation items. Nothing alarming was found.

| Area | Status |
|---|---|
| Build / tests | ✅ Green — build ~1.3 s, 35/35 tests pass (~600 ms) |
| Sync hardening invariants | ✅ 8/8 hold (one doc/code mismatch, see §1) |
| Security & privacy | ✅ Clean — no findings above Info |
| Design-token compliance | ⚠️ Medium — drift; the North Star's named pre-beta blocker |
| Documentation accuracy | ⚠️ Low — stale version/test-count lines |
| Dependencies | ⚠️ Low — one moderate `ws` advisory in prod tree |

---

## 1. Sync hardening invariants — 8/8 effectively hold

All eight invariants documented in `CLAUDE.md` were verified against source:

| # | Invariant | Status | Evidence |
|---|---|---|---|
| 1 | Auth surface split (`prepareDriveAuth`/`isDriveAuthReady`/`requestDriveTokenInteractive` + silent `getDriveAccessToken`) | ✅ | `src/lib/driveAuth.js` |
| 2 | iOS synchronous popup from gesture, no `await` before popup | ✅ | `src/components/modals.jsx:135`; `src/App.jsx` fresh-device path |
| 3 | Conflict effect keyed on `signInEpoch`, not `user` | ✅ | `src/state/useEtudesState.js:639` |
| 4 | `structurallyEqual` for overlap detection, not `JSON.stringify` | ✅ | `useEtudesState.js:613`, `src/lib/sync.js:80` |
| 5 | `lastAttemptedAt` manifest write inside the try block | ✅ | `src/lib/driveSync.js:170` |
| 6 | Eager `prepareDriveAuth()` on app mount when configured | ✅ | `src/App.jsx:57` |
| 7 | `<link rel="preload">` for `accounts.google.com/gsi/client` | ✅ | `index.html` |
| 8 | Destructive confirms: Restore (`isDestructive:true`), Disconnect (non-destructive) | ✅ | `modals.jsx:163` (Restore), `modals.jsx:169` (Disconnect) |

### Caveat — Sign Out vs. its documented invariant

`CLAUDE.md` states: *"Restore from Drive and Sign Out both rely on
`setConfirmModal({ isDestructive: true, ... })`."* In reality, **Sign Out has no
confirmation at all** — `modals.jsx:93` calls `signOut` directly on click.

Whether this is a bug depends on intent. Supabase sign-out is reversible and local
journal data survives it, so it is arguably *not* destructive and the documentation is
simply wrong. But it is a one-tap action sitting immediately next to "Sync now," and the
invariant explicitly promised a guard.

**Recommendation:** reconcile the mismatch — either add an `isDestructive` confirm to
Sign Out, or correct the `CLAUDE.md` invariant to say Sign Out is intentionally
guard-free. This is the only place where code and the stated invariants disagree.

---

## 2. Security & privacy — clean

No findings above informational severity. This is a privacy-respecting, local-first app
that lives up to its brief.

- **No committed secrets.** Only `import.meta.env.VITE_*` references; no tracked `.env`
  files, no `AIza`/`sk-`/PEM material anywhere in `src/`, `public/`, or `index.html`.
  `src/lib/supabase.js` and `src/lib/driveAuth.js` read credentials from build-time env
  as documented.
- **No telemetry / phone-home.** The only outbound `fetch` in the entire app is
  `src/lib/driveApi.js:49` (Google Drive REST). No analytics, beacons, gtag, Sentry,
  PostHog, or similar. Fully consistent with the North Star non-negotiable.
- **Row-level security correct.** `supabase/migrations/001_user_state.sql` enables RLS
  with `auth.uid() = user_id` for both `using` and `with check`. The anon key is the
  correct client-side key.
- **No XSS surface.** Zero `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. Markdown
  renders via `react-markdown` (escapes by default). The custom `wikiUrlTransform`
  (`src/lib/markdownWikiLinks.js`) whitelists only the `wikilink://` scheme and defers
  everything else to react-markdown's `defaultUrlTransform`, which strips `javascript:` —
  so wiki-links cannot be used to inject script. External `<a>` renderers use
  `rel="noopener noreferrer"`.
- **No token/PII logging.** The only `console.log` is a dev-gated seed message
  (`useEtudesState.js:118`, behind `import.meta.env.DEV`).

---

## 3. Design-token compliance — Medium (the real debt)

This maps directly to North Star §XIV.2 ("Heading scale, margin architecture, and token
audit need a dedicated pass before the app is shown to new users"). The single source of
truth is `src/constants/theme.js`; the rule is no raw values in components.

> Note: an automated sub-scan over-reported here. `Footer.jsx` was flagged for raw
> `#A93226`, but it correctly imports and uses the `REC` token — those findings are
> false and excluded below. The items that follow were verified against source.

### Highest-value bug: two different golds

- **`#C97E4A` is a stale gold value.** The real token is `WARM = #B89668`. It appears in:
  - `src/views/LogsView.jsx:121` — `SECTION_COLORS.play`
  - `src/views/LogsView.jsx:33` and `:113` — the warm-up `Clock` icon and "warm-up" label
  - `src/components/modals.jsx:335` — dev "Seed all" button
  
  The practical consequence: **warm-up indicators in Logs render in a different gold than
  warm-up everywhere else in the app.** This is a visible inconsistency, not just hygiene.

### Other confirmed violations

- **`#c0392b`** (`src/components/PieceRecordingsPanel.jsx:88`) — recording dot that should
  be the `REC` token (`#A93226`). Two different reds for the same "recording" semantic.
- **`#B89668` + `rgba(184,150,104,…)`** hardcoded at `modals.jsx:96` — these are literally
  the `WARM` / `WARM_SOFT` token values; should import the tokens.
- **`rgba(169,50,38,0.08)` / `(…,0.10)`** in `Footer.jsx:657,751` — REC-derived but
  hardcoded; no `REC_SOFT` token exists to reference.
- **`PdfViewer.jsx`** — `#fff` (×4), `#141412` (panel background, also in
  `shared.jsx:485`), `#e57373` (error red, should be `WARN`).
- **`App.jsx:121`** — `#3D1A00` storage-full banner background plus
  `rgba(201,126,74,0.4)` border (another stray gold).
- **`#5a3a10`** — dev-button border (`modals.jsx:335`).

### Hardcoded fonts (should use the `mono` token)

- `'monospace'` — `src/components/shared.jsx:534`, `LogsView.jsx`,
  `MarkdownEditor.jsx:37`
- `'ui-monospace,monospace'` — `modals.jsx`, `NotesView.jsx` (×5), `RepertoireView.jsx` (×2)

### Clean

- No lucide-react barrel imports anywhere — all icons imported individually per the rule.
- No fourth type family; serif/sans/mono respected.

### Recommendation

Add `REC_SOFT`, an `OVERLAY`/scrim token, and a PDF-panel surface token to `theme.js`,
then sweep the above. The single highest-value fix is replacing every `#C97E4A` with
`WARM` (visible two-golds bug) and `#c0392b` with `REC`. A lint rule banning raw
hex/rgb in `src/components` and `src/views` would prevent regression.

---

## 4. Smaller items

- **Stale documentation (Low).** `CLAUDE.md` header says "app version v0.98.3" and North
  Star §XIV says "Current state — v0.97.11"; code is at **0.98.5**. The two operational
  version fields (`src/constants/config.js` and `package.json`) agree with each other,
  which is what matters at runtime. `CLAUDE.md` also says "28+ smoke tests"; actual is 35.
  Worth a one-line refresh.
- **`package-lock.json` version drift (Low).** The lockfile's `version` field reads
  `0.98.0` while `package.json` is `0.98.5`. Harmless (no dependency impact) and
  self-corrects on the next intentional `npm install`. The "two places kept in sync" rule
  in `CLAUDE.md` does not currently cover the lockfile.
- **`ws` moderate advisory (Low).** One moderate vulnerability (GHSA-58qx-3vcg-4xpx) in
  the production tree via a transitive `ws`. `npm audit fix` resolves it. Dev-only deps
  carry a few more but do not ship.
- **Bundle size (Info).** Main chunk 708 KB (176 KB gzipped). Build emits an
  `INEFFECTIVE_DYNAMIC_IMPORT` warning: `src/lib/notifications.js` is statically imported
  by `useEtudesState.js` and dynamically by `modals.jsx`, so the dynamic import does
  nothing. Harmless; picking one import style silences it.
- **Export format — North Star §XIV.1 (product, Med).** The doc says do not ship a paid
  tier until export is a ZIP of Markdown + YAML rather than a single `.md`. `jszip` is now
  a dependency and `buildZip` / `exportProgress` exist in state, so this appears resolved
  or in progress. Worth confirming the ZIP path is the default and updating the doc.

---

## Suggested order of operations

1. **Token sweep** — `#C97E4A` → `WARM`, `#c0392b` → `REC`, add the missing soft/overlay
   tokens, replace hardcoded fonts with `mono`. Addresses the North Star's named
   pre-beta blocker and a real visible bug.
2. **Reconcile Sign Out** vs. its documented invariant (a quick product decision).
3. **Docs refresh + `npm audit fix`** — version/test-count lines, lockfile version, and
   the moderate `ws` advisory, ideally in one housekeeping PR.

---

*Read-only audit. No code was changed; the working tree is clean.*
