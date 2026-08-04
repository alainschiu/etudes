import {describe, it, expect, vi, beforeEach} from 'vitest';

// idbGet/idbAllKeys/blobToBase64 are only reached in the includeBlobs=true path;
// stub the storage + media modules so the pure payload-shape tests need no IDB.
const store = {
  pdfs: {a: 'pdf-blob'},
  recordings: {},
  pieceRecordings: {},
  refTracks: {},
};

vi.mock('./storage.js', () => ({
  idbGet: vi.fn(async (s, k) => store[s]?.[k] ?? null),
  idbAllKeys: vi.fn(async (s) => Object.keys(store[s] || {})),
}));

vi.mock('./media.js', () => ({
  blobToBase64: vi.fn(async (b) => `b64:${b}`),
  base64ToBlob: vi.fn((d) => (d ? {__blob: d} : null)),
}));

import {buildFullJournalPayload, applyJournalPayload} from './journalPayload.js';

const slice = {
  items: [{id: 'i1', title: 'Etude', pdfUrl: 'blob:should-be-stripped'}],
  itemTimes: {i1: 120},
  routines: [{id: 'r1'}],
  freeNotes: [{id: 'n1'}],
  history: [{kind: 'day', date: '2026-07-01'}],
  settings: {dailyTarget: 90},
};
const lsGet = (_k, d) => d;

describe('buildFullJournalPayload — includeBlobs', () => {
  it('omits the blobs key entirely when includeBlobs is false', async () => {
    const p = await buildFullJournalPayload(slice, lsGet, {includeBlobs: false});
    expect('blobs' in p).toBe(false);
    expect(p.app).toBe('Etudes');
    expect(p.state.items[0].pdfUrl).toBeUndefined(); // stripped
    expect(p.state.itemTimes).toEqual({i1: 120});
  });

  it('includes the blobs key by default (embedded, file export)', async () => {
    const p = await buildFullJournalPayload(slice, lsGet);
    expect('blobs' in p).toBe(true);
    expect(p.blobs.pdfs.a).toBe('b64:pdf-blob');
    expect(p.blobs.recordings).toEqual({});
  });

  it('includeBlobs:true is the explicit equivalent of the default', async () => {
    const p = await buildFullJournalPayload(slice, lsGet, {includeBlobs: true});
    expect('blobs' in p).toBe(true);
  });
});

// A minimal applyJournalPayload deps harness — every setter is a spy, IDB is
// the in-memory `store` above. Verifies a blob-less journal round-trips and a
// legacy embedded journal still restores.
function makeDeps() {
  const idb = {pdfs: {}, recordings: {}, pieceRecordings: {}, refTracks: {}};
  const calls = {};
  const setter = (name) => vi.fn((v) => {calls[name] = v;});
  return {
    calls,
    idb,
    deps: {
      idbPut: vi.fn(async (s, k, b) => {idb[s][k] = b; return true;}),
      idbDel: vi.fn(async (s, k) => {delete idb[s][k];}),
      idbGet: vi.fn(async (s, k) => idb[s]?.[k] ?? null),
      idbAllKeys: vi.fn(async (s) => Object.keys(idb[s] || {})),
      lsSet: vi.fn(),
      pdfUrlMap: {},
      setItems: setter('items'),
      setItemTimes: setter('itemTimes'),
      setWarmupTimeToday: setter('warmup'),
      setRestToday: setter('rest'),
      setWorkingOn: setter('workingOn'),
      setTodaySessions: setter('sessions'),
      setLoadedRoutineId: setter('loadedRoutineId'),
      setRoutines: setter('routines'),
      setPrograms: setter('programs'),
      setDailyReflection: setter('daily'),
      setWeekReflection: setter('week'),
      setMonthReflection: setter('month'),
      setSettings: setter('settings'),
      setFreeNotes: setter('freeNotes'),
      setRecordingMeta: setter('recMeta'),
      setHistory: setter('history'),
      setDayClosed: setter('dayClosed'),
      setPdfUrlMap: setter('pdfUrlMap'),
      setPieceRecordingMeta: setter('pieceRecMeta'),
      setNoteCategories: setter('noteCats'),
      setRefTrackMeta: setter('refTrackMeta'),
      setDeletions: setter('deletions'),
      setReflectionMeta: setter('reflectionMeta'),
      setLocalPieceRecordingIds: setter('localPieceIds'),
      setLocalRefTrackIds: setter('localRefIds'),
      setActiveItemId: vi.fn(),
      setActiveSpotId: vi.fn(),
      setActiveSessionId: vi.fn(),
      setIsResting: vi.fn(),
      setExpandedItemId: vi.fn(),
      setPdfDrawerItemId: vi.fn(),
    },
  };
}

describe('applyJournalPayload — blob-less vs legacy embedded', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('a metadata-only journal (blobMode none) no-ops the embedded blob loops', async () => {
    const journal = {state: {items: [{id: 'i1'}], itemTimes: {i1: 5}, recordingMeta: {}}};
    const {deps, calls} = makeDeps();
    const {failed} = await applyJournalPayload(journal, {blobMode: 'none'}, deps);
    expect(failed).toEqual([]); // none mode never writes blobs
    expect(calls.items.map((i) => i.id)).toEqual(['i1']); // migrated, id preserved
    expect(calls.itemTimes).toEqual({i1: 5});
  });

  it('a legacy embedded journal restores its blobs', async () => {
    const journal = {
      state: {items: [], recordingMeta: {rec1: {t: 1}}},
      blobs: {
        pdfs: {p1: 'AAA'},
        recordings: {rec1: 'BBB'},
        pieceRecordings: {},
        refTracks: {},
      },
    };
    const {deps, idb} = makeDeps();
    const {failed} = await applyJournalPayload(journal, {blobMode: 'embedded'}, deps);
    expect(failed).toEqual([]);
    expect(idb.pdfs.p1).toEqual({__blob: 'AAA'});
    expect(idb.recordings.rec1).toEqual({__blob: 'BBB'});
  });
});

// A7-ii — the completeness guard. A v13 key that reaches the payload but never
// makes it back through the apply path (or vice versa) silently wipes that slice
// on every restore. This asserts the whole round trip rather than either half.
describe('schema v13 keys survive the payload round trip', () => {
  const v13Slice = {
    ...slice,
    deletions: [{type: 'item', id: 'gone', deletedAt: 1770000000000}],
    reflectionMeta: {daily: {updatedAt: 1770000000001}},
  };

  it('carries deletions and reflectionMeta in both payload modes', async () => {
    for (const opts of [{includeBlobs: false}, {includeBlobs: true}]) {
      const p = await buildFullJournalPayload(v13Slice, lsGet, opts);
      expect(p.state.deletions).toEqual(v13Slice.deletions);
      expect(p.state.reflectionMeta).toEqual(v13Slice.reflectionMeta);
    }
  });

  it('restores them through applyJournalPayload', async () => {
    const {deps, calls} = makeDeps();
    const journal = await buildFullJournalPayload(v13Slice, lsGet, {includeBlobs: false});
    await applyJournalPayload(journal, {blobMode: 'none'}, deps);
    expect(calls.deletions).toEqual(v13Slice.deletions);
    expect(calls.reflectionMeta).toEqual(v13Slice.reflectionMeta);
  });

  it('defaults them safely when restoring a pre-v13 journal', async () => {
    const {deps, calls} = makeDeps();
    const journal = await buildFullJournalPayload(slice, lsGet, {includeBlobs: false});
    delete journal.state.deletions;
    delete journal.state.reflectionMeta;
    await applyJournalPayload(journal, {blobMode: 'none'}, deps);
    expect(calls.deletions).toEqual([]);
    expect(calls.reflectionMeta).toEqual({});
  });
});
