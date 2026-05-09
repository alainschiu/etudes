import {describe, it, expect} from 'vitest';
import {structurallyEqual} from './sync.js';

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
});
