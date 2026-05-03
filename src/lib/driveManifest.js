import {lsGet, lsSet} from './storage.js';

export const DRIVE_MANIFEST_KEY = 'etudes-driveManifest';

/** @typedef {{ driveRootFolderId?: string, driveFolderIds?: Record<string,string>, driveFileIndex?: Record<string,string>, lastPushedAt?: string, lastPulledAt?: string, journalRemoteModifiedTime?: string }} DriveManifest */

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
