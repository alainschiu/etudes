import {describe, it, expect} from 'vitest';
import {
  hasUnbackedBlobs,
  shouldSkipBlobUpload,
  namespacedKey,
  sha256Hex,
  withoutBlobHash,
} from './driveBlobPolicy.js';

describe('hasUnbackedBlobs (A1 coverage escalation)', () => {
  it('is false when every local blob key is in the index (refTracks also hashed)', () => {
    const keysByStore = {pdfs: ['a'], recordings: ['b'], pieceRecordings: [], refTracks: ['c']};
    const idx = {'pdfs:a': 'f1', 'recordings:b': 'f2', 'refTracks:c': 'f3'};
    expect(hasUnbackedBlobs(keysByStore, idx, {'refTracks:c': 'h3'})).toBe(false);
  });

  it('is true when any local blob key is missing from the index', () => {
    const keysByStore = {pdfs: ['a', 'new'], recordings: [], pieceRecordings: [], refTracks: []};
    const idx = {'pdfs:a': 'f1'};
    expect(hasUnbackedBlobs(keysByStore, idx)).toBe(true);
  });

  it('is true against an empty/undefined index when local blobs exist', () => {
    expect(hasUnbackedBlobs({pdfs: ['a']}, undefined)).toBe(true);
    expect(hasUnbackedBlobs({pdfs: ['a']}, {})).toBe(true);
  });

  it('is false when there are no local blobs at all', () => {
    expect(hasUnbackedBlobs({pdfs: [], recordings: [], pieceRecordings: [], refTracks: []}, {})).toBe(false);
  });

  it('coerces numeric keys the same way the index is written', () => {
    expect(hasUnbackedBlobs({recordings: [12]}, {'recordings:12': 'f'})).toBe(false);
  });

  // v0.99.2/A1 — refTracks reuse their key, so index presence alone is not proof
  // the Drive copy is current. uploadRefTrack clears the hash on write; a missing
  // hash therefore means "replaced since the last upload" and must escalate.
  it('treats an indexed refTrack with no stored hash as unbacked', () => {
    expect(hasUnbackedBlobs({refTracks: ['c']}, {'refTracks:c': 'f3'}, {})).toBe(true);
    expect(hasUnbackedBlobs({refTracks: ['c']}, {'refTracks:c': 'f3'}, undefined)).toBe(true);
  });

  it('treats an indexed refTrack with a stored hash as backed', () => {
    expect(hasUnbackedBlobs({refTracks: ['c']}, {'refTracks:c': 'f3'}, {'refTracks:c': 'h3'})).toBe(false);
  });

  it('leaves immutable-store behaviour unchanged when hashes are absent', () => {
    const idx = {'pdfs:a': 'f1', 'recordings:b': 'f2', 'pieceRecordings:c': 'f3'};
    const keys = {pdfs: ['a'], recordings: ['b'], pieceRecordings: ['c'], refTracks: []};
    expect(hasUnbackedBlobs(keys, idx)).toBe(false);
    expect(hasUnbackedBlobs(keys, idx, {})).toBe(false);
  });
});

describe('withoutBlobHash (A1 hash invalidation)', () => {
  it('clears only the target key', () => {
    const hashes = {'refTracks:i1': 'h1', 'refTracks:i2': 'h2', 'pdfs:p': 'hp'};
    expect(withoutBlobHash(hashes, 'refTracks', 'i1')).toEqual({'refTracks:i2': 'h2', 'pdfs:p': 'hp'});
  });

  it('does not mutate the input and tolerates an absent map', () => {
    const hashes = {'refTracks:i1': 'h1'};
    withoutBlobHash(hashes, 'refTracks', 'i1');
    expect(hashes).toEqual({'refTracks:i1': 'h1'});
    expect(withoutBlobHash(undefined, 'refTracks', 'i1')).toEqual({});
  });

  it('round-trips with hasUnbackedBlobs: clearing the hash forces escalation', () => {
    const idx = {'refTracks:i1': 'f1'};
    let hashes = {'refTracks:i1': 'h1'};
    expect(hasUnbackedBlobs({refTracks: ['i1']}, idx, hashes)).toBe(false);
    hashes = withoutBlobHash(hashes, 'refTracks', 'i1');
    expect(hasUnbackedBlobs({refTracks: ['i1']}, idx, hashes)).toBe(true);
  });
});

describe('shouldSkipBlobUpload (F2/A3 per-store policy)', () => {
  it('immutable stores skip when the file index already has the key', () => {
    for (const store of ['pdfs', 'recordings', 'pieceRecordings']) {
      const ns = namespacedKey(store, 'k');
      expect(shouldSkipBlobUpload({store, ns, fileIndex: {[ns]: 'f'}})).toBe(true);
      expect(shouldSkipBlobUpload({store, ns, fileIndex: {}})).toBe(false);
    }
  });

  it('refTracks skip only when the stored hash matches the current content hash', () => {
    const ns = namespacedKey('refTracks', 'item1');
    expect(shouldSkipBlobUpload({store: 'refTracks', ns, hashes: {[ns]: 'abc'}, contentHash: 'abc'})).toBe(true);
    expect(shouldSkipBlobUpload({store: 'refTracks', ns, hashes: {[ns]: 'abc'}, contentHash: 'zzz'})).toBe(false);
  });

  it('refTracks with no stored hash (legacy) does not skip — upload once, then hashed', () => {
    const ns = namespacedKey('refTracks', 'item1');
    expect(shouldSkipBlobUpload({store: 'refTracks', ns, hashes: {}, contentHash: 'abc'})).toBe(false);
    expect(shouldSkipBlobUpload({store: 'refTracks', ns, hashes: undefined, contentHash: 'abc'})).toBe(false);
  });

  it('immutable index-existence beats any hash consideration', () => {
    const ns = namespacedKey('pdfs', 'k');
    expect(shouldSkipBlobUpload({store: 'pdfs', ns, fileIndex: {[ns]: 'f'}, hashes: {}})).toBe(true);
  });
});

describe('sha256Hex', () => {
  it('hashes blob content deterministically and differs on content change', async () => {
    const a1 = await sha256Hex(new Blob(['hello']));
    const a2 = await sha256Hex(new Blob(['hello']));
    const b = await sha256Hex(new Blob(['world']));
    expect(a1).toMatch(/^[0-9a-f]{64}$/);
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });
});
