import {describe, it, expect} from 'vitest';
import {
  structurallyEqual, mergeStates, stampCollectionDiff, stampHistoryDiff,
  pushTombstone, applyTombstones, computeDivergence,
  TOMBSTONE_MAX_AGE_MS, TOMBSTONE_MAX,
} from './sync.js';

describe('structurallyEqual', () => {
  it('handles primitives', () => {
    expect(structurallyEqual(1, 1)).toBe(true);
    expect(structurallyEqual('a', 'a')).toBe(true);
    expect(structurallyEqual(1, 2)).toBe(false);
    expect(structurallyEqual(null, null)).toBe(true);
    expect(structurallyEqual(null, undefined)).toBe(false);
    expect(structurallyEqual(0, false)).toBe(false);
    expect(structurallyEqual(undefined, undefined)).toBe(true);
  });

  it('returns true for objects with different key order — the JSONB round-trip case', () => {
    const a = {id: 'p1', composer: 'Bach', title: 'Prelude', stage: 'learning'};
    const b = {title: 'Prelude', stage: 'learning', composer: 'Bach', id: 'p1'};
    expect(structurallyEqual(a, b)).toBe(true);
  });

  it('treats undefined fields as missing', () => {
    expect(structurallyEqual({id: 'p1', note: undefined}, {id: 'p1'})).toBe(true);
    expect(structurallyEqual({id: 'p1'}, {id: 'p1', note: undefined})).toBe(true);
  });

  it('does not equate null to undefined', () => {
    expect(structurallyEqual({id: 'p1', note: null}, {id: 'p1'})).toBe(false);
  });

  it('compares arrays positionally', () => {
    expect(structurallyEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(structurallyEqual([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(structurallyEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('handles nested item-shaped objects with spots and bpmLog', () => {
    const a = {
      id: 'p1',
      title: 'Étude',
      spots: [{id: 's1', name: 'm. 24', tempoTarget: 88, bpmLog: [{ts: 1, bpm: 80}]}],
      tags: ['concert', 'memorize'],
    };
    const b = {
      tags: ['concert', 'memorize'],
      spots: [{tempoTarget: 88, bpmLog: [{bpm: 80, ts: 1}], name: 'm. 24', id: 's1'}],
      title: 'Étude',
      id: 'p1',
    };
    expect(structurallyEqual(a, b)).toBe(true);
  });

  it('detects real differences in nested fields', () => {
    const a = {id: 'p1', spots: [{id: 's1', tempoTarget: 88}]};
    const b = {id: 'p1', spots: [{id: 's1', tempoTarget: 92}]};
    expect(structurallyEqual(a, b)).toBe(false);
  });

  it('disagrees on type mismatch (array vs object)', () => {
    expect(structurallyEqual([], {})).toBe(false);
  });

  it('ignores updatedAt — a post-edit sync round-trip is not a conflict (schema v11)', () => {
    // Two notes with identical content but different updatedAt must compare equal,
    // else every save would false-flag a sync conflict.
    const a = {id: 'n1', title: 'On tone', body: 'core, not skim', date: '2026-04-17', updatedAt: 1000};
    const b = {id: 'n1', title: 'On tone', body: 'core, not skim', date: '2026-04-17', updatedAt: 9999};
    expect(structurallyEqual(a, b)).toBe(true);
    // updatedAt present on one side, absent on the other → still equal.
    expect(structurallyEqual(a, {id: 'n1', title: 'On tone', body: 'core, not skim', date: '2026-04-17'})).toBe(true);
    // Ignored inside arrays of notes too.
    expect(structurallyEqual([a], [b])).toBe(true);
    // A genuine content difference is still detected even with equal updatedAt.
    const c = {id: 'n1', title: 'On tone', body: 'different', date: '2026-04-17', updatedAt: 1000};
    expect(structurallyEqual(a, c)).toBe(false);
  });
});

// ── Schema v13: multi-device merge ─────────────────────────────────────────

const item = (id, title, updatedAt, extra = {}) => ({id, type: 'piece', title, updatedAt, ...extra});

describe('stampCollectionDiff (A6 stamping choke-point)', () => {
  it('stamps a changed entity and leaves an unchanged one alone', () => {
    const prev = [item('a', 'Sonata', 100), item('b', 'Etude', 100)];
    const next = [item('a', 'Sonata revised', 100), item('b', 'Etude', 100)];
    const {next: out} = stampCollectionDiff(prev, next, 500);
    expect(out.find(x => x.id === 'a').updatedAt).toBe(500);
    expect(out.find(x => x.id === 'b').updatedAt).toBe(100); // no drift
  });

  it('stamps a newly added entity', () => {
    const {next: out} = stampCollectionDiff([], [item('a', 'New', 0)], 500);
    expect(out[0].updatedAt).toBe(500);
  });

  it('does not re-stamp when only updatedAt differs (idempotent re-render)', () => {
    const prev = [item('a', 'Sonata', 100)];
    const next = [item('a', 'Sonata', 100)];
    const {next: out} = stampCollectionDiff(prev, next, 900);
    expect(out[0].updatedAt).toBe(100);
  });

  it('reports ids that vanished so the caller can tombstone them', () => {
    const {removed} = stampCollectionDiff([item('a', 'A', 1), item('b', 'B', 1)], [item('a', 'A', 1)], 500);
    expect(removed).toEqual(['b']);
  });

  it('stamps history by date key, not id', () => {
    const prev = [{kind: 'day', date: '2026-08-01', minutes: 30, updatedAt: 100}];
    const next = [{kind: 'day', date: '2026-08-01', minutes: 45, updatedAt: 100}];
    expect(stampHistoryDiff(prev, next, 700)[0].updatedAt).toBe(700);
    expect(stampHistoryDiff(prev, prev, 700)[0].updatedAt).toBe(100);
  });
});

describe('tombstones (A10 lifecycle)', () => {
  it('appends and keeps the newest deletedAt for a repeated key', () => {
    const out = pushTombstone([{type: 'item', id: 'a', deletedAt: 100}], [{type: 'item', id: 'a', deletedAt: 300}], 1000);
    expect(out).toHaveLength(1);
    expect(out[0].deletedAt).toBe(300);
  });

  it('prunes entries older than 90 days', () => {
    const now = 1_000_000_000_000;
    const out = pushTombstone([{type: 'item', id: 'old', deletedAt: now - TOMBSTONE_MAX_AGE_MS - 1}], [{type: 'item', id: 'new', deletedAt: now}], now);
    expect(out.map(t => t.id)).toEqual(['new']);
  });

  it('caps at 500, keeping the most recent', () => {
    const now = 1_000_000_000_000;
    const many = Array.from({length: 600}, (_, i) => ({type: 'item', id: `i${i}`, deletedAt: now - i * 1000}));
    const out = pushTombstone([], many, now);
    expect(out).toHaveLength(TOMBSTONE_MAX);
    expect(out.some(t => t.id === 'i0')).toBe(true);   // newest kept
    expect(out.some(t => t.id === 'i599')).toBe(false); // oldest dropped
  });

  it('removes an entity whose deletion is newer than its last edit', () => {
    const out = applyTombstones([item('a', 'A', 100)], [{type: 'item', id: 'a', deletedAt: 200}], 'item');
    expect(out).toEqual([]);
  });

  it('spares an entity edited after the deletion (deliberate resurrect)', () => {
    const out = applyTombstones([item('a', 'A', 300)], [{type: 'item', id: 'a', deletedAt: 200}], 'item');
    expect(out).toHaveLength(1);
  });

  it('only applies tombstones of the matching type', () => {
    const out = applyTombstones([item('a', 'A', 100)], [{type: 'note', id: 'a', deletedAt: 200}], 'item');
    expect(out).toHaveLength(1);
  });
});

describe('mergeStates — LWW (schema v13)', () => {
  const base = {items: [], routines: [], programs: [], freeNotes: [], history: [], settings: {updatedAt: 0}, deletions: [], reflectionMeta: {}};

  it('keeps the newer side of a shared entity, in both directions', () => {
    const local = {...base, items: [item('a', 'local newer', 300)]};
    const remote = {...base, items: [item('a', 'remote older', 100)]};
    expect(mergeStates(local, remote).items[0].title).toBe('local newer');
    expect(mergeStates(remote, local).items[0].title).toBe('local newer');
  });

  it('keeps local on an exact tie (stable)', () => {
    const local = {...base, items: [item('a', 'local', 100)]};
    const remote = {...base, items: [item('a', 'remote', 100)]};
    expect(mergeStates(local, remote).items[0].title).toBe('local');
  });

  it('lets a stamped edit beat un-stamped v12 data', () => {
    const local = {...base, items: [item('a', 'legacy', 0)]};
    const remote = {...base, items: [item('a', 'edited post-upgrade', 500)]};
    expect(mergeStates(local, remote).items[0].title).toBe('edited post-upgrade');
  });

  it('unions entities unique to each side', () => {
    const local = {...base, items: [item('a', 'A', 100)]};
    const remote = {...base, items: [item('b', 'B', 100)]};
    expect(mergeStates(local, remote).items.map(i => i.id).sort()).toEqual(['a', 'b']);
  });

  // `now` is passed explicitly so the 90-day tombstone prune is measured against
  // the test's own clock rather than the wall clock.
  it('a deletion on one side removes the stale copy held by the other', () => {
    const local = {...base, items: [], deletions: [{type: 'item', id: 'a', deletedAt: 300}]};
    const remote = {...base, items: [item('a', 'still here', 100)]};
    expect(mergeStates(local, remote, 1000).items).toEqual([]);
    expect(mergeStates(remote, local, 1000).items).toEqual([]); // symmetric
  });

  it('applies tombstones across every id-keyed collection', () => {
    const local = {...base, deletions: [
      {type: 'routine', id: 'r', deletedAt: 300},
      {type: 'program', id: 'p', deletedAt: 300},
      {type: 'note', id: 'n', deletedAt: 300},
    ]};
    const remote = {...base, routines: [{id: 'r', updatedAt: 100}], programs: [{id: 'p', updatedAt: 100}], freeNotes: [{id: 'n', updatedAt: 100}]};
    const m = mergeStates(local, remote, 1000);
    expect(m.routines).toEqual([]);
    expect(m.programs).toEqual([]);
    expect(m.freeNotes).toEqual([]);
  });

  it('merges history by date, keeping the newer entry', () => {
    const local = {...base, history: [{kind: 'day', date: '2026-08-01', minutes: 10, updatedAt: 100}]};
    const remote = {...base, history: [{kind: 'day', date: '2026-08-01', minutes: 99, updatedAt: 400}]};
    expect(mergeStates(local, remote).history[0].minutes).toBe(99);
  });

  it('settings merge whole-object by recency', () => {
    const local = {...base, settings: {dailyTarget: 60, updatedAt: 500}};
    const remote = {...base, settings: {dailyTarget: 120, updatedAt: 100}};
    expect(mergeStates(local, remote).settings.dailyTarget).toBe(60);
    expect(mergeStates(remote, local).settings.dailyTarget).toBe(60);
  });

  it('reflections merge per scale by recency', () => {
    const local = {...base, dailyReflection: 'local daily', monthReflection: 'local month',
      reflectionMeta: {daily: {updatedAt: 900}, month: {updatedAt: 10}}};
    const remote = {...base, dailyReflection: 'remote daily', monthReflection: 'remote month',
      reflectionMeta: {daily: {updatedAt: 100}, month: {updatedAt: 800}}};
    const m = mergeStates(local, remote);
    expect(m.dailyReflection).toBe('local daily');   // local newer
    expect(m.monthReflection).toBe('remote month');  // remote newer
    expect(m.reflectionMeta.daily.updatedAt).toBe(900);
  });

  // The silent-drop guard: a key missing from the merge result wipes that slice
  // on every sync. Enumerated deliberately so an omission fails loudly here.
  it('returns every key the state carries', () => {
    const full = {...base, itemTimes: {a: 1}, pieceRecordingMeta: {}, refTrackMeta: {}, workingOn: ['a'],
      noteCategories: [], recordingMeta: {}, todaySessions: [], dayClosed: false, loadedRoutineId: null,
      warmupTimeToday: 0, dailyReflection: '', weekReflection: {}, monthReflection: ''};
    const merged = mergeStates(full, full);
    for (const k of Object.keys(full)) expect(merged, `missing key: ${k}`).toHaveProperty(k);
  });

  it('survives a legacy non-array history without throwing', () => {
    const local = {...base, history: {0: {kind: 'day', date: '2026-08-01', updatedAt: 1}}};
    expect(() => mergeStates(local, base)).not.toThrow();
  });
});

describe('computeDivergence (informed conflict modal)', () => {
  const base = {items: [], routines: [], programs: [], freeNotes: []};

  it('is empty when shared entities are structurally equal', () => {
    const s = {...base, items: [item('a', 'A', 100)]};
    expect(computeDivergence(s, {...base, items: [item('a', 'A', 700)]})).toEqual([]);
  });

  it('is empty when nothing is shared', () => {
    expect(computeDivergence({...base, items: [item('a', 'A', 1)]}, {...base, items: [item('b', 'B', 1)]})).toEqual([]);
  });

  it('reports a real divergence as decidable when the stamps differ', () => {
    const d = computeDivergence({...base, items: [item('a', 'local', 100)]}, {...base, items: [item('a', 'remote', 300)]});
    expect(d).toHaveLength(1);
    expect(d[0].undecidable).toBe(false);
    expect(d[0].label).toBe('local');
  });

  it('marks an exact stamp tie undecidable', () => {
    const d = computeDivergence({...base, items: [item('a', 'local', 100)]}, {...base, items: [item('a', 'remote', 100)]});
    expect(d[0].undecidable).toBe(true);
  });

  it('marks un-stamped legacy data undecidable', () => {
    const d = computeDivergence({...base, items: [item('a', 'local', 0)]}, {...base, items: [item('a', 'remote', 300)]});
    expect(d[0].undecidable).toBe(true);
  });

  it('spans routines, programs and notes, not just items', () => {
    const local = {...base, routines: [{id: 'r', name: 'Morning', updatedAt: 1}], programs: [{id: 'p', name: 'Salon', updatedAt: 1}], freeNotes: [{id: 'n', title: 'Pedalling', updatedAt: 1}]};
    const remote = {...base, routines: [{id: 'r', name: 'Morning', extra: 1, updatedAt: 1}], programs: [{id: 'p', name: 'Salon', extra: 1, updatedAt: 1}], freeNotes: [{id: 'n', title: 'Pedalling', extra: 1, updatedAt: 1}]};
    expect(computeDivergence(local, remote).map(d => d.type).sort()).toEqual(['note', 'program', 'routine']);
  });
});
