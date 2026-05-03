# Google Drive backup — Phase 3 onward (implementation plan)

This document assumes **Phase 0–2 are done and tested** (GIS + `drive.file`, `driveManifest.js`, `driveApi.js` with queue/backoff, `driveAuth.js`). It maps **Phase 3–6** onto the current Études codebase.

**Note:** As of this commit, `/workspace` may not yet contain `driveApi` / `driveAuth` / `driveManifest`; merge or land Phase 1–2 before implementing Phase 3 here, or re-home `driveSync` next to those modules when they appear.

---

## Phase 3 — `src/lib/driveSync.js` (orchestration)

### 3.1 Shared journal payload

**Goal:** One function builds the same logical backup as JSON export, without downloading a file.

- **Extract or mirror** the object built in `useImportExport.js` → `exportJson` (lines ~302–309): `app`, `appVersion`, `schemaVersion`, `exportedAt`, `state`, `blobs` (base64-encoded PDFs, recordings, pieceRecordings, refTracks with `{d,t}` for ref tracks).
- **Preferred:** Export a pure async helper e.g. `buildFullJournalPayload({ getStateSlice, todayKey })` from `useImportExport.js` (or new `src/lib/journalPayload.js` imported by both `useImportExport` and `driveSync`) so Drive and “Backup” stay in sync.
- **State slice** must include everything `exportJson` uses: items (strip `pdfUrl` like export), `itemTimes`, `warmupTimeToday`, `restToday`, `workingOn`, `todaySessions`, `loadedRoutineId`, `routines`, reflections, `settings`, `freeNotes`, `recordingMeta`, `pieceRecordingMeta`, `noteCategories`, `refTrackMeta`, `history`, `dayClosed`, rollover keys from `lsGet(ROLLOVER_KEY|WEEK_ROLLOVER_KEY|MONTH_ROLLOVER_KEY)`.
- **Blobs:** Same four IDB stores: `pdfs`, `recordings`, `pieceRecordings`, `refTracks` — keys as strings in the JSON blob maps (matches import).

### 3.2 Folder layout on Drive

Align with the product plan: root **`Études/`** (or agreed ASCII variant if API quirks), subfolders for each blob store, **`etudes-journal.json`** at root of backup tree. `driveManifest.js` already tracks `driveRootFolderId`, `driveFolderIds`, namespaced `driveFileIndex` — `driveSync` only consumes it.

### 3.3 `pushToDrive({ mode: 'json' | 'full' })`

1. `await driveAuth.getAccessToken()` (never Supabase).
2. Ensure folder hierarchy via `driveApi` (create-if-missing using manifest).
3. **Journal rollback:** If a remote `etudes-journal.json` exists, **`files.copy`** to `etudes-journal-prev.json` (or chained name), then upload the new JSON — not “download then upload as prev” without a copy on Drive.
4. **Upload** new `etudes-journal.json` (multipart as already implemented in `driveApi`).
5. **`mode === 'full'`** (or separate delta path): For each IDB key per store, compare to manifest’s namespaced keys (`pdfs:<id>`, `recordings:<id>`, …). Upload new/changed blobs; update `driveFileIndex` + `lastPushedAt` via `driveManifest` helpers.
6. **JSON-only mode:** Skip blob uploads; still refresh journal file + prev copy if product decision is to always version JSON on timer (recommended: yes, same prev chain).

All HTTP through **`driveApi`** only (retries/backoff stay centralized).

### 3.4 `pullJournalFromDrive()`

1. List/get `etudes-journal.json`; read `modifiedTime` from Drive metadata and/or `exportedAt` inside JSON.
2. Compare to local marker in manifest (`lastPulledAt` / `journalRemoteModifiedTime` / embedded timestamp strategy already in manifest types).
3. **Return shape** (keep stable for UI):

   `{ action: 'noop' | 'prompt' | 'apply', remoteState?: <parsed>, meta?: { remoteModified, localMarker, gapMs } }`

4. **Conflict (`prompt`):** If local journal is “newer” or edited and remote differs beyond threshold (**5 minutes** per original spec), do **not** auto-merge — let Phase 5 open **`DriveConflictModal`**.

### 3.5 `restoreBlobsFromDrive(restoredState, onProgress)`

After **journal JSON is applied** to app state (same as `applyImport` state path but sourced from Drive):

1. **Enumerate referenced blob keys** from `restoredState` (and nested meta), mirroring export rules:
   - **PDFs:** Keys in `blobs.pdfs` and/or items’ `pdfs[].libraryId` / attachment ids consistent with `exportJson`.
   - **Recordings:** Keys in `blobs.recordings` / `recordingMeta` session keys.
   - **Piece recordings:** From `blobs.pieceRecordings` and/or `pieceRecordingMeta` → each take’s `idbKey` or `` `${itemId}__${ts}` `` fallback (see `useRecording.js` / ZIP export).
   - **Ref tracks:** Keys in `blobs.refTracks` / `refTrackMeta` (IDB key is item id in `useEtudesState.uploadRefTrack`).
2. **For each namespaced key** (`pdfs:k`, etc.): if `idbGet(store, k)` **already has a blob**, **skip** (preserve local takes).
3. If missing: resolve Drive file id from `driveFileIndex` + folder layout; **download** via `driveApi`; `idbPut`; report progress `{ done, total }` or bytes (for Settings copy).
4. **RecordingMeta reconciliation:** After blob restore, consider the same pattern as `applyImport` (filter `recordingMeta` to keys that exist in IDB) to avoid ghost entries.

Implement queue **serially** or through `driveApi`’s single queue so restore storms stay within rate limits.

---

## Phase 4 — `src/hooks/useDriveSync.js` + thin wiring

### 4.1 Hook surface (suggested)

Expose: `driveStatus`, `lastDrivePushAt`, `connectDrive`, `disconnectDrive`, `backupNow`, `restoreFromDrive`, `maybePullOnOpen`, `driveBlobRestoreProgress`, and errors for Settings.

### 4.2 Push triggers (only these three)

| Trigger | Behavior |
|--------|----------|
| **`setInterval` 10 min** | If `settings.driveAutoBackup` and Drive connected → **`pushToDrive({ mode: 'json' })`** only. |
| **Debounced ~30 s** after blob write | **`pushToDrive` delta / `queueBlobPush`** when `recordings`, `pieceRecordings`, `pdfs`, or `refTracks` change. |
| **Manual “Backup now”** | Full push: JSON + pending blob deltas. |

**Do not add:** `beforeunload`, `visibilitychange`, `sendBeacon`, or sync `fetch` on tab close.

### 4.3 Wiring points (minimal invasions)

- **`useDriveSync`** subscribes to a **small callback** from state, or use **`CustomEvent`** / ref pattern — avoid bloating `useEtudesState.js` with timers; the hook can accept `onRegisterBlobFlush(cb)` called once from `useEtudesState` with a stable debounced notifier, or read `localDirty` flags if you add a single numeric `driveBlobEpoch` bumped on each `idbPut` to the four stores.
- **`useRecording.js`:** After successful `idbPut('recordings'|…)` notify blob flush.
- **`useEtudesState.js`:** After `idbPut('pdfs'|…)` and ref-track upload path, same notifier.
- **`useEtudesState`** remains responsible for **applying** restored journal (reuse `applyImport`’s state+blob path where possible: optional refactor to `applyJournalPayload(data, { blobMode: 'none'|'embedded'|'skipExisting' })` for Drive).

### 4.4 `maybePullOnOpen`

On Settings open or app init (product choice): **`pullJournalFromDrive`**; if `prompt`, set modal state; if `apply` with explicit user action only — avoid overwriting without confirmation.

---

## Phase 5 — UI

### 5.1 `DriveConflictModal` (new)

In `src/components/modals.jsx` (or colocated file): **Load from Drive** / **Keep local**; show timestamps; **no** “Merge” / cloud wording from `SyncConflictModal`. Wire from `App.jsx` like `SyncConflictModal`.

### 5.2 `SettingsModal` — Sync tab

- New block: **Google Drive** — Connect (GIS via hook), status, last push, **Backup now**, **Restore from Drive**, Disconnect, **auto-backup** toggle bound to `settings.driveAutoBackup` (new field; **SCHEMA_VERSION** only if migrations required — optional default in settings merge).
- Update copy currently stating recordings/PDFs stay local-only (`modals.jsx` ~101): clarify **Supabase = metadata**, **Drive = optional full backup** when connected.

### 5.3 `driveOAuthMessages.js` (if present)

Ensure `formatDriveOAuthError(raw)` coerces with `String(raw ?? '')` so non-string GIS errors never throw.

---

## Phase 6 — Docs

- **CHANGELOG.md**, **UPDATE_LOG.md**, **README.md**: Supabase vs Drive, GIS client-only tokens, three triggers, no flush-on-close, restore behavior (per-key missing blobs).
- **docs/guide.html** / **docs/index.html** only if product requires parity (North Star / UI audit).

---

## Suggested implementation order (single feature branch)

1. **`journalPayload` helper** + unit sanity (matches `exportJson` output shape).
2. **`driveSync.js`** — `pushToDrive`, `pullJournalFromDrive`, then **`restoreBlobsFromDrive`** (hardest; depends on correct enumeration).
3. **`useDriveSync.js`** — timers + debounce + manual; integrate `maybePullOnOpen`.
4. **Settings + `DriveConflictModal` + App wiring**.
5. **Docs pass**.

---

## Risk checklist

- **Large restores:** Rely on Phase 1 backoff + single queue; surface “Reconnect Google Drive” on typed 401 from `driveApi`.
- **Key collisions:** Always namespaced manifest keys across stores.
- **Partial restore:** Never delete local blobs on Drive restore unless product explicitly chooses “full replace” flow (plan says keep local if key exists).
