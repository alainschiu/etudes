import {describe, it, expect} from 'vitest';
import {migrateItems, migrateImport, deriveScoreLink} from './migrations.js';

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
    expect(migrated.schemaVersion).toBe(12);
    expect(migrated.state.items[0].spots[0].scoreLink).toEqual({attId: 'att1', bookmarkId: 'bm1', page: null});
    expect(migrated.state.items[0].pdfs[0].bookmarks[0].note).toBe('');
  });

  it('runs the full migration chain from schemaVersion 1 through 12', () => {
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
    expect(migrated.schemaVersion).toBe(12);
    // pdfs migrated to attachment shape (6->7) before scoreLink derivation (11->12) runs.
    expect(migrated.state.items[0].pdfs[0].libraryId).toBe('lib1');
    const link = migrated.state.items[0].spots[0].scoreLink;
    expect(link.attId).toBe(migrated.state.items[0].pdfs[0].id);
    expect(link.page).toBe(3);
  });
});
