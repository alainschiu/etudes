import {describe, it, expect} from 'vitest';
import {describeJournalInventory} from './journalInventory.js';

const embedded = {
  exportedAt: '2026-07-01T09:00:00.000Z',
  schemaVersion: 12,
  state: {
    items: [
      {id: 'i1', title: 'A', pdfs: [{libraryId: 'p1'}]},
      {id: 'i2', title: 'B'},
    ],
    routines: [{id: 'r1'}],
    freeNotes: [{id: 'n1'}, {id: 'n2'}],
    history: [
      {kind: 'day', date: '2026-06-01'},
      {kind: 'day', date: '2026-06-02'},
      {kind: 'week'},
      {kind: 'month'},
      {date: '2026-06-03'}, // legacy day entry (no kind)
    ],
    recordingMeta: {rec1: {}},
    refTrackMeta: {i1: {}},
    pieceRecordingMeta: {i1: {'2026-06-01': {idbKey: 'i1__100'}}},
  },
  blobs: {
    pdfs: {p1: 'AAA'},
    recordings: {rec1: 'BBB'},
    pieceRecordings: {i1__100: 'CCC'},
    refTracks: {i1: {d: 'DDD', t: 'audio/mpeg'}},
  },
};

// Same journal with blobs stripped (metadata-only Drive journal).
const metadataOnly = {...embedded};
delete metadataOnly.blobs;

describe('describeJournalInventory', () => {
  it('counts entities and reflections', () => {
    const inv = describeJournalInventory(embedded);
    expect(inv.items).toBe(2);
    expect(inv.routines).toBe(1);
    expect(inv.days).toBe(3); // two kind:day + one legacy no-kind
    expect(inv.weeks).toBe(1);
    expect(inv.months).toBe(1);
    expect(inv.notes).toBe(2);
  });

  it('counts blobs from refs (pdfs/recordings/pieceRecordings/refTracks)', () => {
    const inv = describeJournalInventory(embedded);
    expect(inv.pdfs).toBe(1);
    expect(inv.recordings).toBe(1);
    expect(inv.pieceRecordings).toBe(1);
    expect(inv.refTracks).toBe(1);
  });

  it('gives identical counts for embedded vs metadata-only journals', () => {
    const a = describeJournalInventory(embedded);
    const b = describeJournalInventory(metadataOnly);
    const strip = ({lines, ...rest}) => rest; // eslint-disable-line no-unused-vars
    expect(strip(b)).toEqual(strip(a));
  });

  it('renders a local-formatted export date and schema version', () => {
    const inv = describeJournalInventory(embedded);
    expect(inv.schemaVersion).toBe(12);
    expect(inv.exportedDateLocal).not.toBe('unknown');
    expect(inv.lines[inv.lines.length - 1]).toContain('schema v12');
  });

  it('handles an empty / missing payload without throwing', () => {
    const inv = describeJournalInventory({});
    expect(inv.items).toBe(0);
    expect(inv.exportedDateLocal).toBe('unknown');
    expect(inv.lines.length).toBeGreaterThan(0);
  });

  it('singular vs plural in the rendered lines', () => {
    const inv = describeJournalInventory({state: {items: [{id: 'i1'}], routines: []}});
    expect(inv.lines[0]).toBe('1 repertoire item');
    expect(inv.lines[1]).toBe('0 routines');
  });
});
