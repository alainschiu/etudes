# Manual test checklist — the single device-pass authority

The vitest harness covers the load-bearing pure functions. It does **not** catch
popup-blocked / gesture-context bugs, real-device sync races, iOS termination
flushes, or multi-device conflict behaviour. Those live here.

> **This file is the one authority.** It merges the repo checklist with the vault's
> pre-beta device-pass tracker (2026-08-05, Alain's instruction: *"whichever is more
> comprehensive, either way, merge them"*). The vault copy
> (`Reference/Plans/Device-Pass_Pre-Beta_2026-07-26.md`) is now a pointer to this file
> and keeps only the workflow decision behind it. Nothing was dropped from either.

## Cadence — how the two rules fit together

They were recorded separately and read as a conflict; they are not.

1. **Standing ritual — pre-merge.** Run the *Standing sync / Drive ritual* before merging
   any PR touching `driveAuth.js`, `driveSync.js`, `useDriveSync.js`, the Connect button,
   the Sync tab, or a sign-in flow. This one is a gate.
2. **Per-release items — accrete, then batch.** Each release appends its own items below.
   They are executed together in **one intensive week immediately before the beta invite
   wave** (Alain's decision, 26 Jul — per-release device passes retired).
3. **Shipped-before-verified — verify on production when convenient.** When a release
   merges before its items are run (the actual pattern for v0.99.0 and v0.99.1), verify
   against the live deploy opportunistically; anything still outstanding rolls into the
   pre-beta week. Nothing is dropped, nothing blocks on a device that isn't in hand.

Status keys: `[ ]` pending · `[x]` passed · `[-]` not applicable.

## Preconditions

| Needed | For | Status |
|---|---|---|
| A real **iPad** | Lane B in full | **Not yet acquired** — the standing blocker behind every deferred iPad item |
| **iPhone**, installed to home screen (real PWA, not a Safari tab) | Lanes A, D | Available |
| **Mac** (desktop Chrome + Safari) | Lanes C, D | Available |
| A build with `VITE_GOOGLE_CLIENT_ID` | every Drive item | Production has it; previews need it set |
| A **pre-v0.99.1** Drive journal (embedded blobs) kept aside | legacy-restore item | Capture before it ages out |
| A **200-page PDF** | virtualization item | Source before the week |
| A **two-PDF item** + a piece with linked spots and bookmark notes | export + linking items | Set up in the test account |

**Build under test:** production, with the service worker actually updated (in-app
*Update available → Reload*, or DevTools → Application → Service Workers → Unregister +
hard reload). Confirm the footer version first — a stale SW invalidates the whole pass.

**Account:** the dedicated **test account**, never the real journal. Isolation is
**per-account, not per-URL** — preview builds share the production Supabase project, so
account separation is the only real boundary. Take a file backup of the real journal first.

**Recording results:** mark items inline. Failures go to the vault's `Beta-Bug-UI-Log`
with the item's line, then route to a fix cycle.

---

## Standing sync / Drive ritual

Re-run in full before merging Drive-auth / Sync-tab / sign-in work. Origin: PR #15.

### iOS Safari — real iPhone, hard reload

- [ ] **Cold start, fast tap** — hard-reload `etudes.me`, sign in, Settings → Sync → tap *Connect Google Drive* immediately. Account picker opens on the first tap.
- [ ] **Pre-ready tap** — hard-reload, tap Connect before the page finishes painting (throttle to 3G to widen the window). Shows *"Drive auth still loading. Try again in a moment."*; a second tap succeeds.
- [ ] **Spinner never locks** — block pop-ups in Safari settings, tap Connect. ~12 s spinner, then *"No response from Google sign-in. The pop-up may have been blocked…"*; button unlocks.
- [ ] **Sign-out + reload** — after a successful Connect, sign out, hard-reload, sign in, Connect again. First-tap success.

### iOS Safari — real iPhone, soft reload

- [ ] **In-app re-entry** — without hard-reloading: sign out, sign in, Settings → Sync → Connect. Works on the first tap.

### Desktop Chrome / Safari

- [ ] **No regression** — Connect opens the popup, completes auth, returns to Settings.
- [ ] **Long session** — leave the tab open 60+ min after Connect. Silent renewal holds; no re-prompt; auto-backup keeps working.

### Sync conflict modal

- [ ] **Token refresh is quiet** — sign in, edit a piece, leave the tab 60+ min (Supabase refreshes ~50 min). No conflict modal.
- [ ] **Mid-practice reload** — edit a piece, reload mid-practice. No modal when cloud items match local structurally.
- [ ] **Genuine conflict** — edit the same piece differently on two devices, sync each, then sign in on a third holding Device A's state. Conflict modal appears.
- [ ] **JSONB key-order** — two devices with identical libraries do not conflict on round-trip key-order differences.
- [ ] **Asymmetric counts** — Device A 67 pieces, Device B 68 (one new, no shared edits). Silent merge to 68 either way.

### Destructive confirms

- [ ] **Restore opens a confirm** — WARN-toned *Replace*; Cancel is a no-op; Confirm runs the restore.
- [ ] **Disconnect opens a confirm** — quiet (non-destructive) variant; Cancel is a no-op; Confirm disconnects.

### Voice & visuals

- [ ] No exclamation marks, no emoji in any new copy.
- [ ] Confirm-modal copy stays declarative, at most two sentences.

---

## v0.99.0 — Sync honesty + operational (merged `235c179`; verify on production)

- [ ] **Sign-in failures speak plainly** — bad password / unreachable backend show quiet house-voice lines, never raw `Failed to fetch` / `Invalid login credentials`.
- [ ] **Google preflight** — with the network offline (or backend unreachable), tap *Continue with Google*. The app says it can't reach the backend instead of stranding you on a browser error page.
- [ ] **Timer-only practice survives reload (clobber test)** — practise on Device A by the timer alone (no edits), let it push, then reload. Local practice time is not overwritten by a stale cloud copy. Cross-check the minute-heartbeat carries to a second device mid-session.
- [ ] **iOS termination flush (pagehide)** — practise, then swipe-kill the PWA mid-run *without stopping the timer*. Reopen: the minutes are intact (the 60 s dirty heartbeat did its job).
- [ ] **Named backup/restore** — Export shows *Back up to file* / *Restore from file*; Sync shows *Back up to Drive* / *Restore from Drive*; a file backup confirms with a quiet *"Backup saved."*
- [ ] **UX batch** — acknowledgement dialogs have no meaningless Cancel; restore dates render in local time; the signed-out Sync tab points only at actions that exist; the create-account form is headed as such.

## v0.99.1 — Drive backup continuity (merged; no schema change, still v12)

- [ ] **Metadata-only journal** — connect, back up, confirm the Drive `journal.json` is now KBs (not hundreds of MB). The whole library no longer re-downloads on a pull-compare.
- [ ] **No re-upload on an unchanged library** — back up twice with nothing changed. The second push uploads nothing new.
- [ ] **Relaunch continuity** — with the connected marker set, fully close and reopen the app. Either auto-backup resumes silently, or the Sync tab shows *"Backup paused since last app start"* + the account email + a one-tap **Resume**. Never a silent claim with a dead token.
- [ ] **One-time reconnect on upgrade (expected)** — an existing Drive user's first cold load of v0.99.1 shows *Connect Google Drive* once (no marker yet). One tap re-establishes it; every later launch shows the honest connected/paused state. Confirm it is a single occurrence, not repeating.
- [ ] **Reconnect without forced consent** — tap Connect/Resume for an account that already granted `drive.file`. Account chooser at most; no consent screen.
- [ ] **Restore inventory** — *Restore from Drive* lists item / routine / history / note / media counts + the backup date, then a destructive *Replace everything* confirm before anything is overwritten.
- [ ] **Legacy embedded-journal restore** — a pre-v0.99.1 backup whose journal still embeds blobs restores without error.
- [ ] **iOS Safari** — first-tap Connect opens the picker; pop-ups blocked → ~12 s spinner then the human message, button unlocks.
- [ ] **Blob coverage after a dead token** — add a recording/PDF while Drive is disconnected/expired, then reconnect. The next backup catches the new file up to its per-file Drive folder (metadata-only push escalates to full).
- [ ] **Replaced reference track backs up** *(added by the v0.99.2 refTrack fix)* — replace an existing reference track while Drive is disconnected, reconnect, let a scheduled backup run. The **new** content reaches Drive, not the old file.

## v0.99.2 — Multi-device merge (schema v13) · run the ★ items within ~1 hour of merge

★ = pulled forward out of the pre-beta week by decision (2026-08-05): this is the only
one-way migration before beta, so these three run right after merge rather than weeks later.
**Take a file backup immediately before the v0.99.2 deploy.**

- [ ] ★ **Newest edit wins, both directions** — edit the same piece on A then B, and on B then A. The later edit survives each time.
- [ ] ★ **Deletions stay deleted** — delete a piece on A, make an unrelated edit on B, sync both. It does not resurrect.
- [ ] ★ **Stamps don't drift** — sync twice with no edits. `updatedAt` values stay stable (nothing re-stamps on cloud apply).
- [ ] **Edit-after-delete resurrects (intended)** — delete on A, then edit that piece on B *after* the deletion. It comes back; that is deliberate.
- [ ] **Reflections merge by recency** — edit today's reflection on both devices; the newer one survives.
- [ ] **Informed conflict modal** — when it appears, it shows each side's last-edit time and a summary of what differs, before you choose.
- [ ] **Migration triad** — fresh install / a real pre-v13 backup / empty state each migrate correctly, and idempotently on a second load.
- [ ] **Tombstones survive a file round trip** — delete a piece, back up to file, restore that file on a second device: the piece does not come back. (Implementation note: `deletions` and `reflectionMeta` had to be threaded through the export slice *and* the import deps separately from the Drive path — this check covers the file path specifically.)
- [ ] **A restore does not mass-delete** — restore a backup that omits pieces the device currently has, then sync. The omitted pieces are not tombstoned by the restore itself.
- [ ] **Legacy links survive** — a v0.98.7-era backup restores with spot→score links intact and bookmarks carrying notes.
- [ ] **Settings and log entries merge by recency too** — change the daily target on both devices, and edit the same day's log entry on both. The later change wins in each case (settings merge whole-object; history merges per entry by date). *(Architect review: covered by tests, never yet seen on glass.)*
- [ ] **First sync after both devices upgrade — a prompt here is EXPECTED, not a bug.** Entities created before v13 carry no timestamp (`updatedAt: 0`, deliberately — stamping them at migration time would make two upgraded devices tie on everything). So the first time two upgraded devices meet on a genuinely divergent entity, recency cannot decide and the conflict modal appears **by design**. Confirm it names what differs, that choosing resolves it, and that it does **not** keep reappearing for the same item afterwards.

---

## Lane B — iPad, **portrait** (blocked on hardware; deferred since v0.98.8)

Portrait is the music-stand orientation and the audit's flagged worst case — it gets the
most stripped viewer, which is backwards for practice.

- [ ] **Fullscreen enter/exit** works on the score viewer. `[v0.98.8]`
- [ ] **The fullscreen/modal rule** — from *inside* fullscreen, trigger a destructive confirm → the modal is visible. (A failure here reads as a frozen app.) `[v0.98.8]`
- [ ] **Spread is offered** in portrait (container-gated ≥ ~700 px), and the odd/even **seam offset** puts openings on the correct seam. `[v0.98.9]`
- [ ] **Drawer resize by touch** works in both orientations. `[v0.98.9]`
- [ ] **Fit-to-page** available in portrait. `[v0.98.8]`
- [ ] **Reading prefs persist** (zoom / fit mode / view mode) across close and reopen. `[v0.98.9]`
- [ ] **A 200-page score** scrolls in continuous mode without a memory spike or crash. `[v0.98.9]`
- [ ] **Scroll inside a zoomed page** scrolls the page and flips only at the edges. `[v0.98.9]`
- [ ] **Page turns** show no white flash in single *and* spread; zoom preserved. `[v0.98.8]`
- [ ] **Drive + auth items** re-run on iPad — element fullscreen and the OAuth popup behave differently from iPhone. `[v0.99.1]`
- [ ] **Writing surfaces on touch** — hover-only spot controls reachable, keyboard avoidance, update-bar z-stack, autocomplete above the keyboard. Detail in the vault's hardening notes. `[Gate A hardening]`

## Lane C — Desktop (Mac)

- [ ] **No regression from v0.98.8** in the score viewer — desktop behaviour as before the container-gating work. `[v0.98.9]`
- [ ] **Export ZIP** — an item with **two PDFs** produces both files (no overwrite), and each item's `.md` shows score links **and bookmark notes** readably, with absolute page numbers. `[v0.98.9]`
- [ ] **Full export/import round-trip** including media. `[v0.98.8]`

## Lane A extras — iPhone (score + storage, from the trilogy)

- [ ] **Score linking (the differentiator)** — with the score **closed**, tap a linked spot's badge on Today → the score opens on the right attachment (multi-PDF item) at the right page, including on a cold load. Reload → the link persists. Edit a bookmark's page → the linked spot follows. `[v0.98.8]`
- [ ] **Fit-to-page** available on iPhone. `[v0.98.8]`
- [ ] **Page turns** show no white flash; zoom preserved. `[v0.98.8]`
- [ ] **Storage honesty** — force a storage failure on upload → the house-voice refusal appears, no ghost attachment survives a reload; a JSON restore under failure reports an honest partial message, never a false success. `[v0.98.8]`
- [ ] **`navigator.storage.persist()`** requested; the Sync tab shows the honest status line. `[v0.98.8]`
- [ ] **Fresh-device restore** — sign in on a device with an empty journal → full restore including media from Drive. `[v0.99.1]`

## Data hygiene before the invite wave

- [ ] **Seeded demo data purged** — the April daily logs and the five 3-July programs (confirmed seeded). See the vault's `Beta-Bug-UI-Log` data tasks.

---

**Sign-off:** beta invitations go out when every lane is signed off, or each open item is a
conscious, recorded waiver. A failed item is not automatically a blocker — it is a routing
decision: fix now, fix post-beta, or accept and document.
