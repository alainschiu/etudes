import {lsGet, lsSet} from './storage.js';

export const DRIVE_MANIFEST_KEY = 'etudes-driveManifest';

/**
 * Persisted object in localStorage under `etudes-driveManifest`.
 *
 * Invariants:
 * - `driveFileIndex` keys MUST be namespaced so stores never collide, e.g.
 *   `recordings:<idbKey>`, `pieceRecordings:<idbKey>`, `refTracks:<idbKey>`, `pdfs:<idbKey>`.
 * - `driveFolderIds` maps logical names → Drive folder id: `recordings`, `piece-recordings`,
 *   `ref-tracks`, `pdfs` (or the exact keys driveSync will use — keep stable once shipped).
 * - `schemaVersion` (optional): increment when the manifest JSON shape changes for migrations.
 * - `journalRemoteModifiedTime`: RFC3339 from Drive `modifiedTime` on `etudes-journal.json`,
 *   updated after every successful journal push (not local clock).
 *
 * @typedef {{
 *   schemaVersion?: number,
 *   driveRootFolderId?: string,
 *   driveFolderIds?: Record<string,string>,
 *   driveFileIndex?: Record<string,string>,
 *   lastPushedAt?: string,
 *   lastPulledAt?: string,
 *   journalRemoteModifiedTime?: string,
 * }} DriveManifest
 */

/** @returns {DriveManifest} */
export function readDriveManifest() {
  const raw = lsGet(DRIVE_MANIFEST_KEY, null);
  if (!raw || typeof raw !== 'object') return {};
  return {...raw};
}

/** @param {Partial<DriveManifest>} patch */
export function writeDriveManifest(patch) {
  const next = {...readDriveManifest(), ...patch};
  lsSet(DRIVE_MANIFEST_KEY, next);
  return next;
}

export function clearDriveManifest() {
  lsSet(DRIVE_MANIFEST_KEY, {});
}
