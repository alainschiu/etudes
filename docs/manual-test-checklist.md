# Manual test checklist

The vitest harness covers the load-bearing pure functions. It does **not** catch
popup-blocked / gesture-context bugs, real-device sync races, iOS termination
flushes, or multi-device conflict behaviour. Those live here.

Run the **Standing sync / Drive ritual** before merging any PR that touches
`driveAuth.js`, `driveSync.js`, `useDriveSync.js`, the Connect button, the Sync
tab, or a sign-in flow. Each release below adds its own device pass; when a
release ships before its device pass is run, verify against production once the
deploy is live (the merge-then-verify-on-production cadence).

Status keys: `[ ]` pending · `[x]` passed · `[-]` not applicable.

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

## v0.99.0 — Sync honesty + operational (deferred; verify on production)

Merged `235c179`. Device pass deferred at merge; re-run against the live deploy.

- [ ] **Sign-in failures speak plainly** — bad password / unreachable backend show quiet house-voice lines, never raw `Failed to fetch` / `Invalid login credentials`.
- [ ] **Google preflight** — with the network offline (or backend unreachable), tap *Continue with Google*. The app says it can't reach the backend instead of stranding you on a browser error page.
- [ ] **Timer-only practice survives reload (clobber test)** — practise on Device A by the timer alone (no edits), let it push, then reload. Local practice time is not overwritten by a stale cloud copy. Cross-check the minute-heartbeat carries to a second device mid-session.
- [ ] **iOS termination flush (pagehide)** — practise, then swipe-kill the PWA. Reopen (same or other device): the session time is preserved.
- [ ] **Named backup/restore** — Export shows *Back up to file* / *Restore from file*; Sync shows *Back up to Drive* / *Restore from Drive*; a file backup confirms with a quiet *"Backup saved."*
- [ ] **UX batch** — acknowledgement dialogs have no meaningless Cancel; restore dates render in local time; the signed-out Sync tab points only at actions that exist; the create-account form is headed as such.

---

## v0.99.1 — Drive backup continuity (verify on production after merge)

Merged as the v0.99.1 release PR. No schema change (still v12).

- [ ] **Metadata-only journal** — connect, back up, confirm the Drive `journal.json` is now KBs (not hundreds of MB). The whole library no longer re-downloads on a pull-compare.
- [ ] **No re-upload on an unchanged library** — back up twice with nothing changed. The second push uploads nothing new.
- [ ] **Relaunch continuity** — with the connected marker set (i.e. after the one-time reconnect below), fully close and reopen the app. Either auto-backup resumes silently, or the Sync tab shows *"Backup paused since last app start"* + the account email + a one-tap **Resume**. Never a silent claim with a dead token.
- [ ] **One-time reconnect on upgrade (expected)** — an existing Drive user's first cold load of v0.99.1 shows *Connect Google Drive* once (no marker yet). One tap re-establishes it; every later launch shows the honest connected/paused state. Confirm this is a single occurrence, not repeating.
- [ ] **Reconnect without forced consent** — tap Connect/Resume for an account that already granted `drive.file`. Account chooser at most; no consent screen.
- [ ] **Restore inventory** — *Restore from Drive* lists item / routine / history / note / media counts + the backup date, then a destructive *Replace everything* confirm before anything is overwritten.
- [ ] **Legacy embedded-journal restore** — a pre-v0.99.1 backup whose journal still embeds blobs restores without error.
- [ ] **iOS Safari** — first-tap Connect opens the picker; pop-ups blocked → ~12 s spinner then the human message, button unlocks. (Subset of the standing ritual; re-confirm on the new build.)
- [ ] **Blob coverage after a dead token** — add a recording/PDF while Drive is disconnected/expired, then reconnect. The next backup catches the new file up to its per-file Drive folder (metadata-only push escalates to full).
