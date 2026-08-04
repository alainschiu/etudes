import {describe, it, expect} from 'vitest';
import {migrateItems, migrateImport, deriveScoreLink, migrateMergeMeta} from './migrations.js';

// F1 (schema v12): spot.bookmarkId+pdfAttachmentId and any surviving spot.pdfPage
// unify into spot.scoreLink = null | {attId,bookmarkId,page}. Migration triad per
// the v0.98.8 spec: fresh / v0.98.7-with-bookmark-links / no-PDF states.

describe('migrateItems — scoreLink unification (schema v12)', () => {
  it('fresh state: item with no pdfs and no spots migrates cleanly', () => {
    const items = [{id: 1, type: 'piece', title: 'Etude', spots: []}];
    const [migrated] = migrateItems(items);
    expect(migrated.pdfs).toEqual([]);
    expect(migrated.spots).toEqual([]);
  });

  it('v0.98.7-with-bookmark-links: bookmarkId+pdfAttachmentId becomes scoreLink, bookmark gains note', () => {
    const items = [{
      id: 1, type: 'piece', title: 'Sonata',
      defaultPdfId: 'att1',
      pdfs: [{id: 'att1', libraryId: 'lib1', name: 'Score', startPage: null, endPage: null,
        bookmarks: [{id: 'bm1', name: 'Development', page: 12}]}],
      spots: [{id: 'spot1', label: 'Tricky run', bookmarkId: 'bm1', pdfAttachmentId: 'att1'}],
    }];
    const [migrated] = migrateItems(items);
    expect(migrated.spots[0].scoreLink).toEqual({attId: 'att1', bookmarkId: 'bm1', page: null});
    expect(migrated.spots[0].bookmarkId).toBeUndefined();
    expect(migrated.spots[0].pdfAttachmentId).toBeUndefined();
    expect(migrated.pdfs[0].bookmarks[0].note).toBe('');
  });

  it('preserves an existing bookmark note rather than overwriting it', () => {
    const items = [{
      id: 1, type: 'piece', title: 'Sonata', defaultPdfId: 'att1',
      pdfs: [{id: 'att1', libraryId: 'lib1', name: 'Score',
        bookmarks: [{id: 'bm1', name: 'Development', page: 12, note: 'slow down here'}]}],
      spots: [],
    }];
    const [migrated] = migrateItems(items);
    expect(migrated.pdfs[0].bookmarks[0].note).toBe('slow down here');
  });

  it('no-PDF state: a stray spot.pdfPage with no attachments drops the link (dead weight)', () => {
    const items = [{
      id: 1, type: 'piece', title: 'Unaccompanied', pdfs: [], defaultPdfId: null,
      spots: [{id: 'spot1', label: 'Cadenza', pdfPage: 4}],
    }];
    const [migrated] = migrateItems(items);
    expect(migrated.spots[0].scoreLink).toBeNull();
    expect(migrated.spots[0].pdfPage).toBeUndefined();
  });

  it('a surviving spot.pdfPage with an attachment resolves via defaultPdfId', () => {
    const items = [{
      id: 1, type: 'piece', title: 'Concerto', defaultPdfId: 'att1',
      pdfs: [{id: 'att1', libraryId: 'lib1', name: 'Score', bookmarks: []},
        {id: 'att2', libraryId: 'lib2', name: 'Orchestra reduction', bookmarks: []}],
      spots: [{id: 'spot1', label: 'Cadenza', pdfPage: 7}],
    }];
    const [migrated] = migrateItems(items);
    expect(migrated.spots[0].scoreLink).toEqual({attId: 'att1', bookmarkId: null, page: 7});
  });

  it('a surviving spot.pdfPage with attachments but no defaultPdfId falls back to the first attachment', () => {
    const items = [{
      id: 1, type: 'piece', title: 'Concerto', defaultPdfId: null,
      pdfs: [{id: 'att1', libraryId: 'lib1', name: 'Score', bookmarks: []}],
      spots: [{id: 'spot1', label: 'Cadenza', pdfPage: 7}],
    }];
    const [migrated] = migrateItems(items);
    expect(migrated.spots[0].scoreLink).toEqual({attId: 'att1', bookmarkId: null, page: 7});
  });

  it('is idempotent: running migrateItems twice yields identical output', () => {
    const items = [{
      id: 1, type: 'piece', title: 'Sonata', defaultPdfId: 'att1',
      pdfs: [{id: 'att1', libraryId: 'lib1', name: 'Score',
        bookmarks: [{id: 'bm1', name: 'Development', page: 12}]}],
      spots: [
        {id: 'spot1', label: 'Tricky run', bookmarkId: 'bm1', pdfAttachmentId: 'att1'},
        {id: 'spot2', label: 'Cadenza', pdfPage: 7},
      ],
    }];
    const once = migrateItems(items);
    const twice = migrateItems(once);
    expect(twice).toEqual(once);
  });

  it('re-validates an existing scoreLink and drops it if the attachment no longer exists', () => {
    const items = [{
      id: 1, type: 'piece', title: 'Sonata', defaultPdfId: null,
      pdfs: [],
      spots: [{id: 'spot1', label: 'Tricky run', scoreLink: {attId: 'gone', bookmarkId: null, page: 5}}],
    }];
    const [migrated] = migrateItems(items);
    expect(migrated.spots[0].scoreLink).toBeNull();
  });
});

describe('deriveScoreLink', () => {
  it('returns null for a spot with no link data', () => {
    expect(deriveScoreLink({}, [], null)).toBeNull();
  });
});

describe('migrateImport — 11 -> 12 (scoreLink unification for import payloads)', () => {
  it('bumps schemaVersion and unifies bookmark links the same way as the live loader', () => {
    const payload = {
      schemaVersion: 11,
      state: {
        items: [{
          id: 1, type: 'piece', title: 'Sonata', defaultPdfId: 'att1',
          pdfs: [{id: 'att1', libraryId: 'lib1', name: 'Score',
            bookmarks: [{id: 'bm1', name: 'Development', page: 12}]}],
          spots: [{id: 'spot1', label: 'Tricky run', bookmarkId: 'bm1', pdfAttachmentId: 'att1'}],
        }],
        freeNotes: [],
      },
    };
    const migrated = migrateImport(payload);
    expect(migrated.schemaVersion).toBe(13);
    expect(migrated.state.items[0].spots[0].scoreLink).toEqual({attId: 'att1', bookmarkId: 'bm1', page: null});
    expect(migrated.state.items[0].pdfs[0].bookmarks[0].note).toBe('');
  });

  it('runs the full migration chain from schemaVersion 1 through 13', () => {
    const payload = {
      schemaVersion: 1,
      state: {
        items: [{
          id: 1, type: 'piece', title: 'Sonata',
          pdfs: [{id: 'lib1', name: 'Score'}],
          spots: [{id: 'spot1', label: 'Tricky run', pdfPage: 3}],
        }],
      },
    };
    const migrated = migrateImport(payload);
    expect(migrated.schemaVersion).toBe(13);
    // pdfs migrated to attachment shape (6->7) before scoreLink derivation (11->12) runs.
    expect(migrated.state.items[0].pdfs[0].libraryId).toBe('lib1');
    const link = migrated.state.items[0].spots[0].scoreLink;
    expect(link.attId).toBe(migrated.state.items[0].pdfs[0].id);
    expect(link.page).toBe(3);
  });
});

// ── Schema v13 migration triad ─────────────────────────────────────────────
// Fresh install / a real pre-v13 backup / empty state, each migrating correctly
// and idempotently on a second pass.
describe('migrateMergeMeta — schema v13 (merge metadata)', () => {
  it('defaults a pre-v13 entity to updatedAt 0, not migration time', () => {
    const out = migrateMergeMeta({
      items: [{id: 'i1', title: 'Sonata'}],
      routines: [{id: 'r1'}],
      programs: [{id: 'p1'}],
      history: [{kind: 'day', date: '2026-07-01'}],
    });
    // 0 means "oldest / unknown": two devices upgrading independently do not tie,
    // and the first real post-upgrade edit wins deterministically.
    expect(out.items[0].updatedAt).toBe(0);
    expect(out.routines[0].updatedAt).toBe(0);
    expect(out.programs[0].updatedAt).toBe(0);
    expect(out.history[0].updatedAt).toBe(0);
    expect(out.settings.updatedAt).toBe(0);
  });

  it('adds the new top-level keys with safe defaults', () => {
    const out = migrateMergeMeta({});
    expect(out.deletions).toEqual([]);
    expect(out.reflectionMeta).toEqual({});
  });

  it('preserves an existing updatedAt rather than resetting it', () => {
    const out = migrateMergeMeta({items: [{id: 'i1', updatedAt: 1770000000000}]});
    expect(out.items[0].updatedAt).toBe(1770000000000);
  });

  it('is idempotent — a second pass changes nothing', () => {
    const once = migrateMergeMeta({items: [{id: 'i1', updatedAt: 42}], deletions: [{type: 'item', id: 'x', deletedAt: 7}]});
    expect(migrateMergeMeta(once)).toEqual(once);
  });

  it('tolerates empty state and corrupt non-array/object fields', () => {
    expect(() => migrateMergeMeta(undefined)).not.toThrow();
    const out = migrateMergeMeta({deletions: 'nonsense', reflectionMeta: 'nonsense'});
    expect(out.deletions).toEqual([]);
    expect(out.reflectionMeta).toEqual({});
  });
});

describe('migrateImport — 12 -> 13', () => {
  it('bumps a real pre-v13 backup and stamps its entities', () => {
    const payload = {
      schemaVersion: 12,
      state: {
        items: [{id: 'i1', type: 'piece', title: 'Sonata', pdfs: [], spots: []}],
        freeNotes: [{id: 'n1', title: 'Note', updatedAt: 1770000000000}],
        settings: {dailyTarget: 90},
      },
    };
    const m = migrateImport(payload);
    expect(m.schemaVersion).toBe(13);
    expect(m.state.items[0].updatedAt).toBe(0);
    expect(m.state.freeNotes[0].updatedAt).toBe(1770000000000); // v11 stamp preserved
    expect(m.state.deletions).toEqual([]);
    expect(m.state.reflectionMeta).toEqual({});
  });

  it('is idempotent — re-importing an already-v13 payload is a no-op', () => {
    const once = migrateImport({schemaVersion: 12, state: {items: [{id: 'i1', pdfs: [], spots: []}]}});
    expect(migrateImport(once)).toEqual(once);
  });

  it('migrates an empty v12 payload without throwing', () => {
    const m = migrateImport({schemaVersion: 12, state: {}});
    expect(m.schemaVersion).toBe(13);
    expect(m.state.items).toEqual([]);
    expect(m.state.deletions).toEqual([]);
  });
});
