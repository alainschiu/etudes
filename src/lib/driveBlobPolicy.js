/**
 * Pure blob-upload policy helpers for the Drive push path.
 *
 * These are separated from driveSync.js so they carry no network/GIS imports
 * and can be unit-tested directly.
 */

/** The four IndexedDB blob stores backed up to Drive. */
export const BLOB_STORES = ['pdfs', 'recordings', 'pieceRecordings', 'refTracks'];

/**
 * Stores whose keys are immutable — new content always gets a new key
 * (pdfs/recordings/pieceRecordings). refTracks is the one store that
 * overwrites the same key (`uploadRefTrack` keys by itemId), so it is not
 * immutable and must be content-hashed instead of index-existence skipped.
 */
export const IMMUTABLE_BLOB_STORES = ['pdfs', 'recordings', 'pieceRecordings'];

/** `store:key` — the driveFileIndex / driveBlobHashes namespacing scheme. */
export function namespacedKey(store, key) {
  return `${store}:${String(key)}`;
}

/**
 * A1 — blob-coverage detection for metadata-only ('json') pushes.
 * Returns true when ANY local blob key is absent from the Drive file index,
 * i.e. a blob was written to IDB while its file never reached Drive (the
 * common token-was-dead case). Such a push must escalate to 'full' so the
 * metadata-only journal is not the user's only blob backup. Key-set
 * difference only — no hashing.
 *
 * v0.99.2/A1: key presence is the right test only for the immutable stores,
 * where new content always means a new key. `refTracks` overwrites the same key
 * (`uploadRefTrack` keys by itemId), so a replaced track keeps an index entry
 * that now points at stale Drive content. For that store a key also counts as
 * unbacked when it carries no content hash — `uploadRefTrack` clears the hash on
 * write, so "no hash" means "content changed since the last upload". Still pure
 * and cheap: no hashing here, the hash is computed in the full push where
 * `shouldSkipBlobUpload` already needs it.
 *
 * @param {Record<string, Array<string|number>>} keysByStore store → IDB keys
 * @param {Record<string, string>|undefined} fileIndex manifest.driveFileIndex
 * @param {Record<string, string>|undefined} [hashes] manifest.driveBlobHashes
 */
export function hasUnbackedBlobs(keysByStore, fileIndex, hashes) {
  const idx = fileIndex || {};
  const hsh = hashes || {};
  for (const store of BLOB_STORES) {
    for (const key of keysByStore[store] || []) {
      const ns = namespacedKey(store, key);
      if (!idx[ns]) return true;
      // Mutable store: an indexed key with no recorded hash is stale content.
      if (!IMMUTABLE_BLOB_STORES.includes(store) && !hsh[ns]) return true;
    }
  }
  return false;
}

/**
 * F2 / A3 — per-store skip decision for a single blob during a full push.
 * - immutable stores: skip when the file index already has this key (the
 *   file on Drive is byte-identical because the key never changes).
 * - refTracks: skip only when the stored content hash matches the current
 *   blob's hash (the key is reused, so content can change under it).
 * Any other/legacy case: do not skip (upload, then record).
 *
 * @param {{ store: string, ns: string, fileIndex?: Record<string,string>, hashes?: Record<string,string>, contentHash?: string }} args
 * @returns {boolean}
 */
export function shouldSkipBlobUpload({store, ns, fileIndex, hashes, contentHash}) {
  const idx = fileIndex || {};
  if (IMMUTABLE_BLOB_STORES.includes(store)) return !!idx[ns];
  if (store === 'refTracks') {
    const stored = hashes?.[ns];
    return !!(stored && contentHash && stored === contentHash);
  }
  return false;
}

/**
 * v0.99.2/A1 — drop a stored content hash. Called when a mutable-store blob is
 * overwritten (`uploadRefTrack`): the recorded hash no longer describes the blob
 * under that key, and leaving it there would let `hasUnbackedBlobs` believe the
 * stale Drive file is current. Pure; returns a new map.
 */
export function withoutBlobHash(hashes, store, key) {
  const next = {...(hashes || {})};
  delete next[namespacedKey(store, key)];
  return next;
}

/** SHA-256 of a Blob as lowercase hex. Sequential caller keeps one blob in memory. */
export async function sha256Hex(blob) {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
