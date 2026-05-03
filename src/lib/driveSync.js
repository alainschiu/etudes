/**
 * Drive sync — probe/spike (Phase 0–2) plus journal push/pull/restore (Phase 3+).
 */

import {getDriveAccessToken} from './driveAuth.js';
import {
  driveFetchJson,
  driveListFiles,
  driveCreateFolder,
  driveGetFileMetadata,
  driveCopyFile,
  driveDeleteFile,
  driveMultipartCreate,
  driveMediaUpdate,
  driveDownloadBlob,
} from './driveApi.js';
import {readDriveManifest, writeDriveManifest} from './driveManifest.js';
import {buildFullJournalPayload, applyJournalPayload} from './journalPayload.js';
import {migrateImport} from './migrations.js';
import {collectJournalBlobRefs} from './driveBlobRefs.js';
import {idbGet, idbPut, idbAllKeys} from './storage.js';
import {lsGet} from './storage.js';

import {
  notifyDriveQueueOperationResult,
  getDriveQueueCircuitState,
  clearDriveQueueCircuitPause,
  assertDriveQueueNotPaused,
} from './driveQueueCircuit.js';

export {notifyDriveQueueOperationResult, getDriveQueueCircuitState, clearDriveQueueCircuitPause, assertDriveQueueNotPaused};

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const ROOT_NAME = 'Etudes';
const JOURNAL = 'etudes-journal.json';
const JOURNAL_PREV = 'etudes-journal-prev.json';
const MANIFEST_SNAPSHOT = 'etudes-drive-manifest.json';
const CONFLICT_MS = 5 * 60 * 1000;

/** IDB store name → manifest `driveFolderIds` key (stable per driveManifest.js). */
const STORE_TO_FOLDER_KEY = {
  pdfs: 'pdfs',
  recordings: 'recordings',
  pieceRecordings: 'piece-recordings',
  refTracks: 'ref-tracks',
};

let pushChain = Promise.resolve();
let coalesceFull = false;

function escapeQueryName(name) {
  return name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function namespacedKey(store, key) {
  return `${store}:${String(key)}`;
}

function manifestSnapshot(m) {
  return {
    driveRootFolderId: m.driveRootFolderId,
    driveFolderIds: m.driveFolderIds || {},
    driveFileIndex: m.driveFileIndex || {},
    lastPushedAt: m.lastPushedAt,
    journalRemoteModifiedTime: m.journalRemoteModifiedTime,
    lastJsonPushAt: m.lastJsonPushAt,
  };
}

/**
 * Verify Drive API access (uses current or silently renewed token).
 * @returns {Promise<{ ok: true, user?: { displayName?: string, emailAddress?: string } } | { ok: false, error: string }>}
 */
export async function probeDriveConnection() {
  try {
    const token = await getDriveAccessToken({interactive: false});
    const about = await driveFetchJson(token, '/about?fields=user');
    return {ok: true, user: about?.user || undefined};
  } catch (e) {
    try {
      const token = await getDriveAccessToken({interactive: true});
      const about = await driveFetchJson(token, '/about?fields=user');
      return {ok: true, user: about?.user || undefined};
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      return {ok: false, error: msg};
    }
  }
}

/**
 * Silent renewal spike: **no** interactive fallback.
 * @returns {Promise<{ ok: true, email?: string } | { ok: false, error: string }>}
 */
export async function spikeSilentDriveRenewal() {
  try {
    const token = await getDriveAccessToken({interactive: false});
    const about = await driveFetchJson(token, '/about?fields=user');
    const email = about?.user?.emailAddress;
    return {ok: true, email: email || undefined};
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {ok: false, error: msg};
  }
}

async function findChildFolderByName(token, parentId, name) {
  const q = `name = '${escapeQueryName(name)}' and mimeType = '${FOLDER_MIME}' and '${parentId}' in parents and trashed = false`;
  const data = await driveListFiles(token, q);
  const files = data?.files || [];
  return files.find((f) => f.mimeType === FOLDER_MIME)?.id || null;
}

async function ensureFolderHierarchy(token) {
  let m = readDriveManifest();
  if (m.driveRootFolderId) {
    try {
      await driveGetFileMetadata(token, m.driveRootFolderId, 'id');
      // ok
    } catch {
      m = writeDriveManifest({...m, driveRootFolderId: undefined, driveFolderIds: {}});
    }
  }
  let rootId = m.driveRootFolderId;
  if (!rootId) {
    rootId = await findChildFolderByName(token, 'root', ROOT_NAME);
    if (!rootId) {
      const created = await driveCreateFolder(token, ROOT_NAME, 'root');
      rootId = created?.id;
    }
    if (!rootId) throw new Error('Could not create Études folder on Drive');
    m = writeDriveManifest({...m, driveRootFolderId: rootId});
  }

  const folderIds = {...(m.driveFolderIds || {})};
  const sub = [
    {idb: 'pdfs', label: 'pdfs'},
    {idb: 'recordings', label: 'recordings'},
    {idb: 'pieceRecordings', label: 'piece-recordings'},
    {idb: 'refTracks', label: 'ref-tracks'},
  ];
  for (const {idb, label} of sub) {
    const key = STORE_TO_FOLDER_KEY[idb];
    if (folderIds[key]) continue;
    let fid = await findChildFolderByName(token, rootId, label);
    if (!fid) {
      const created = await driveCreateFolder(token, label, rootId);
      fid = created?.id;
    }
    if (!fid) throw new Error(`Could not create folder ${label}`);
    folderIds[key] = fid;
  }
  writeDriveManifest({driveFolderIds: folderIds});
  return rootId;
}

/**
 * @param {{ mode: 'json'|'full', getAccessToken: () => Promise<string>, slice: object, lsGet: function }} opts
 */
export function pushToDrive(opts) {
  const requested = opts?.mode === 'full' ? 'full' : 'json';
  if (requested === 'full') coalesceFull = true;

  const run = async () => {
    assertDriveQueueNotPaused();
    const mode = coalesceFull ? 'full' : 'json';
    coalesceFull = false;

    try {
    const token = await opts.getAccessToken();
    const rootId = await ensureFolderHierarchy(token);
    let m = readDriveManifest();

    const qJournal = `name = '${escapeQueryName(JOURNAL)}' and '${rootId}' in parents and trashed = false`;
    const journalList = await driveListFiles(token, qJournal);
    let journalId = journalList?.files?.[0]?.id || null;

    if (journalId) {
      const qPrev = `name = '${escapeQueryName(JOURNAL_PREV)}' and '${rootId}' in parents and trashed = false`;
      const prevList = await driveListFiles(token, qPrev);
      for (const f of prevList?.files || []) {
        await driveDeleteFile(token, f.id);
      }
      await driveCopyFile(token, journalId, {name: JOURNAL_PREV, parents: [rootId]});
    }

    const payload = await buildFullJournalPayload(opts.slice, opts.lsGet);
    const jsonBlob = new Blob([JSON.stringify(payload)], {type: 'application/json'});

    if (journalId) {
      await driveMediaUpdate(token, journalId, jsonBlob, 'application/json');
    } else {
      const created = await driveMultipartCreate(token, {name: JOURNAL, parents: [rootId]}, jsonBlob, 'application/json');
      journalId = created?.id;
    }

    const meta = await driveGetFileMetadata(token, journalId, 'modifiedTime');
    const remoteMod = meta?.modifiedTime || payload.exportedAt;

    let indexMutated = false;
    if (mode === 'full') {
      m = readDriveManifest();
      const idx = {...(m.driveFileIndex || {})};
      for (const store of ['pdfs', 'recordings', 'pieceRecordings', 'refTracks']) {
        const folderKey = STORE_TO_FOLDER_KEY[store];
        const folderId = m.driveFolderIds?.[folderKey] || rootId;
        const keys = await idbAllKeys(store);
        for (const key of keys) {
          const blob = await idbGet(store, key);
          if (!blob) continue;
          const ns = namespacedKey(store, String(key));
          let fileId = idx[ns];
          const ext = blob.type?.includes('pdf')
            ? 'pdf'
            : blob.type?.includes('mp4') || blob.type?.includes('m4a') || blob.type?.includes('aac')
              ? 'm4a'
              : 'webm';
          if (fileId) {
            try {
              await driveMediaUpdate(token, fileId, blob, blob.type || 'application/octet-stream');
            } catch (e) {
              const st = /** @type {{ status?: number }} */ (e)?.status;
              if (st === 404) fileId = null;
              else throw e;
            }
          }
          if (!fileId) {
            const created = await driveMultipartCreate(
              token,
              {name: `${String(key)}.${ext}`, parents: [folderId]},
              blob,
              blob.type || 'application/octet-stream',
            );
            idx[ns] = created.id;
            indexMutated = true;
          }
        }
      }
      writeDriveManifest({
        driveFileIndex: idx,
        lastPushedAt: new Date().toISOString(),
        journalRemoteModifiedTime: remoteMod,
        lastJsonPushAt: Date.now(),
      });
      indexMutated = true;
    } else {
      writeDriveManifest({
        lastPushedAt: new Date().toISOString(),
        journalRemoteModifiedTime: remoteMod,
        lastJsonPushAt: Date.now(),
      });
    }

    const mAfter = readDriveManifest();
    const snapBody = JSON.stringify(manifestSnapshot(mAfter));
    const snapBlob = new Blob([snapBody], {type: 'application/json'});
    const qSnap = `name = '${escapeQueryName(MANIFEST_SNAPSHOT)}' and '${rootId}' in parents and trashed = false`;
    const snapList = await driveListFiles(token, qSnap);
    if (snapList?.files?.[0]?.id) {
      await driveMediaUpdate(token, snapList.files[0].id, snapBlob, 'application/json');
    } else {
      await driveMultipartCreate(token, {name: MANIFEST_SNAPSHOT, parents: [rootId]}, snapBlob, 'application/json');
    }

    notifyDriveQueueOperationResult(null);
    return {ok: true, remoteModified: remoteMod};
    } catch (e) {
      notifyDriveQueueOperationResult(e);
      throw e;
    }
  };

  pushChain = pushChain.then(run, run);
  return pushChain;
}

export async function pullJournalFromDrive(getAccessToken) {
  const token = await getAccessToken();
  const m = readDriveManifest();
  const rootId = m.driveRootFolderId || (await ensureFolderHierarchy(token));
  const q = `name = '${escapeQueryName(JOURNAL)}' and '${rootId}' in parents and trashed = false`;
  const listed = await driveListFiles(token, q);
  const files = listed?.files || [];
  if (!files.length) return {action: 'noop', meta: null};
  const fileId = files[0].id;
  const fmeta = await driveGetFileMetadata(token, fileId, 'id,modifiedTime');
  const remoteModified = fmeta.modifiedTime;
  const localMarker = m.journalRemoteModifiedTime || null;
  const rawGap = localMarker ? Math.abs(Date.parse(remoteModified) - Date.parse(localMarker)) : Infinity;
  const gapMs = Number.isFinite(rawGap) ? rawGap : Infinity;
  const text = await (async () => {
    const blob = await driveDownloadBlob(token, fileId);
    return blob.text();
  })();
  const parsed = JSON.parse(text);
  if (parsed.app !== 'Etudes') throw new Error('Invalid journal on Drive.');
  const remoteState = migrateImport(parsed);
  const localDirtyAt = lsGet('etudes-localDirtyAt', 0);
  const lastJson =
    typeof m.lastJsonPushAt === 'number'
      ? m.lastJsonPushAt
      : m.lastJsonPushAt
        ? Date.parse(m.lastJsonPushAt) || 0
        : 0;
  const needsPrompt = remoteModified !== localMarker && localDirtyAt > lastJson && gapMs > CONFLICT_MS;
  if (needsPrompt) return {action: 'prompt', remoteState, meta: {remoteModified, localMarker, gapMs}};
  return {action: 'apply', remoteState, meta: {remoteModified, localMarker, gapMs}};
}

export async function restoreManifestFromDriveIfNeeded(getAccessToken, confirm) {
  const m0 = readDriveManifest();
  if (m0?.driveRootFolderId && m0?.driveFileIndex && Object.keys(m0.driveFileIndex).length) return m0;
  const token = await getAccessToken();
  const qRoot = `name = '${escapeQueryName(ROOT_NAME)}' and mimeType = '${FOLDER_MIME}' and 'root' in parents and trashed = false`;
  const listed = await driveListFiles(token, qRoot);
  const rootId = listed?.files?.[0]?.id;
  if (!rootId) throw new Error('No Études folder on Drive.');
  const qs = `name = '${escapeQueryName(MANIFEST_SNAPSHOT)}' and '${rootId}' in parents and trashed = false`;
  const snaps = await driveListFiles(token, qs);
  const snapId = snaps?.files?.[0]?.id;
  if (!snapId) throw new Error('No manifest snapshot on Drive.');
  const blob = await driveDownloadBlob(token, snapId);
  const snap = JSON.parse(await blob.text());
  // confirm=null → auto-proceed; only reached when local manifest is blank (no data loss risk)
  if (confirm && !(await confirm(snap))) return readDriveManifest();
  writeDriveManifest({
    driveRootFolderId: snap.driveRootFolderId || rootId,
    driveFolderIds: snap.driveFolderIds || {},
    driveFileIndex: snap.driveFileIndex || {},
    lastPushedAt: snap.lastPushedAt,
    journalRemoteModifiedTime: snap.journalRemoteModifiedTime,
  });
  return readDriveManifest();
}

export async function restoreBlobsFromDrive(remoteState, getAccessToken, onProgress) {
  const refs = collectJournalBlobRefs(remoteState);
  const token = await getAccessToken();
  const m = readDriveManifest();
  const idx = m.driveFileIndex || {};
  const failed = [];
  let done = 0;
  const total = refs.length;
  for (const {store, key, ns} of refs) {
    const existing = await idbGet(store, key);
    if (existing) {
      done++;
      onProgress?.({done, total});
      continue;
    }
    const fileId = idx[ns];
    if (!fileId) {
      done++;
      onProgress?.({done, total});
      continue;
    }
    try {
      const blob = await driveDownloadBlob(token, fileId);
      await idbPut(store, key, blob);
    } catch {
      failed.push({ns, store, key});
    }
    done++;
    onProgress?.({done, total});
  }
  return {failed};
}

export function formatDriveError(err) {
  return String(err?.message || err || 'Unknown error');
}
