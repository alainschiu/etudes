import {describe, it, expect, vi} from 'vitest';

// storage.js reads `localStorage` at import time (boot probe) and `window` at call
// time. The test env is 'node' (no DOM), so we install a controllable mock and use
// vi.resetModules() + dynamic import so the probe runs against a fresh mock per test.
// No jsdom dependency — keeps the harness fast and dep-free.
function makeLocalStorage({failKey=null}={}){
  const store=new Map();
  return {
    get length(){return store.size;},
    key(i){return Array.from(store.keys())[i]??null;},
    getItem(k){return store.has(k)?store.get(k):null;},
    setItem(k,v){if(failKey&&failKey(k)){const e=new Error('QuotaExceededError');e.name='QuotaExceededError';throw e;}store.set(k,String(v));},
    removeItem(k){store.delete(k);},
    clear(){store.clear();},
    _keys(){return Array.from(store.keys());},
    _has(k){return store.has(k);},
  };
}

async function load({failKey=null}={}){
  vi.resetModules();
  globalThis.localStorage=makeLocalStorage({failKey});
  globalThis.window={dispatchEvent(){return true;},addEventListener(){},removeEventListener(){}};
  globalThis.CustomEvent=class{constructor(type,opts){this.type=type;Object.assign(this,opts);}};
  const ns=await import('./notesStorage.js');
  return ns;
}

// Seed the legacy single-blob layout (pre-v0.98.6) directly.
function seedLegacy(notes){localStorage.setItem('etudes-freeNotes',JSON.stringify(notes));}

const NOTE=(id,extra={})=>({id,date:'2026-04-20',title:`Note ${id}`,body:`body ${id}`,category:'',tags:[],...extra});

describe('per-note notes storage layout (W1)', () => {
  describe('migration from the legacy etudes-freeNotes blob', () => {
    it('splits losslessly into per-note keys + ordered index, retires legacy, marks layout', async () => {
      const {loadFreeNotes, INDEX_KEY, LAYOUT_KEY, LEGACY_KEY} = await load();
      seedLegacy([NOTE('n1'), NOTE('n2'), NOTE('n3')]);
      const notes = loadFreeNotes();
      expect(notes.map(n=>n.id)).toEqual(['n1','n2','n3']);
      // Per-note keys exist; index lists ids in order; legacy retired; marker set.
      expect(localStorage._has('etudes-note-n1')).toBe(true);
      expect(localStorage._has('etudes-note-n3')).toBe(true);
      expect(JSON.parse(localStorage.getItem(INDEX_KEY))).toEqual(['n1','n2','n3']);
      expect(localStorage.getItem(LEGACY_KEY)).toBe(null);
      expect(JSON.parse(localStorage.getItem(LAYOUT_KEY))).toBe(2);
    });

    it('adds updatedAt = creation date when absent (schema v11), preserves an existing one', async () => {
      const {loadFreeNotes} = await load();
      seedLegacy([NOTE('n1', {date:'2026-01-02'}), NOTE('n2', {date:'2026-03-04', updatedAt: 555})]);
      const notes = loadFreeNotes();
      expect(notes.find(n=>n.id==='n1').updatedAt).toBe('2026-01-02');
      expect(notes.find(n=>n.id==='n2').updatedAt).toBe(555);
    });

    it('is idempotent — a second load reads per-note keys and leaves layout/legacy alone', async () => {
      const {loadFreeNotes, LEGACY_KEY} = await load();
      seedLegacy([NOTE('n1'), NOTE('n2')]);
      const first = loadFreeNotes();
      const second = loadFreeNotes();
      expect(second.map(n=>n.id)).toEqual(first.map(n=>n.id));
      expect(localStorage.getItem(LEGACY_KEY)).toBe(null);
    });

    it('handles a no-notes / fresh state — adopts the layout with an empty array', async () => {
      const {loadFreeNotes, LAYOUT_KEY} = await load();
      expect(loadFreeNotes()).toEqual([]);
      expect(JSON.parse(localStorage.getItem(LAYOUT_KEY))).toBe(2);
    });

    it('handles an empty legacy blob', async () => {
      const {loadFreeNotes} = await load();
      seedLegacy([]);
      expect(loadFreeNotes()).toEqual([]);
    });
  });

  describe('losslessness on a mid-migration write failure', () => {
    it('keeps the legacy blob, rolls back partial keys, leaves layout unmarked, retries cleanly', async () => {
      // First load: writing etudes-note-n2 fails (quota). Split must abort losslessly.
      const failing = await load({failKey:(k)=>k==='etudes-note-n2'});
      seedLegacy([NOTE('n1'), NOTE('n2'), NOTE('n3')]);
      const notes = failing.loadFreeNotes();
      // In-memory notes are still complete (migrated), so the session isn't broken.
      expect(notes.map(n=>n.id)).toEqual(['n1','n2','n3']);
      // Legacy blob is the source of truth and remains; layout NOT flipped; the
      // partially-written n1 key was rolled back so the retry starts clean.
      expect(failing.LEGACY_KEY && localStorage.getItem('etudes-freeNotes')).not.toBe(null);
      expect(localStorage.getItem('etudes-notes-layout')).toBe(null);
      expect(localStorage._has('etudes-note-n1')).toBe(false);
      expect(localStorage._has('etudes-note-index')).toBe(false);
    });
  });

  describe('persist diffs against the previous array', () => {
    it('writes a changed note key and rewrites the index on add; removes the key on delete', async () => {
      const {loadFreeNotes, persistFreeNotes} = await load();
      seedLegacy([NOTE('n1'), NOTE('n2')]);
      const notes = loadFreeNotes();
      // Edit n1.
      const edited = [{...notes[0], body:'changed'}, notes[1]];
      persistFreeNotes(edited, notes);
      expect(JSON.parse(localStorage.getItem('etudes-note-n1')).body).toBe('changed');
      // Add n3.
      const added = [...edited, NOTE('n3')];
      persistFreeNotes(added, edited);
      expect(localStorage._has('etudes-note-n3')).toBe(true);
      expect(JSON.parse(localStorage.getItem('etudes-note-index'))).toEqual(['n1','n2','n3']);
      // Delete n2 — index rewritten without it, then the key removed.
      const deleted = added.filter(n=>n.id!=='n2');
      persistFreeNotes(deleted, added);
      expect(localStorage._has('etudes-note-n2')).toBe(false);
      expect(JSON.parse(localStorage.getItem('etudes-note-index'))).toEqual(['n1','n3']);
    });
  });

  describe('tolerant loader (crash-safety + index fallback)', () => {
    it('skips a dangling index pointer (key missing) without dropping the rest', async () => {
      const {loadFreeNotes, readPerNoteNotes} = await load();
      seedLegacy([NOTE('n1'), NOTE('n2')]);
      loadFreeNotes();
      // Simulate a dangling pointer: index references n2 but its key is gone.
      localStorage.removeItem('etudes-note-n2');
      const notes = readPerNoteNotes();
      expect(notes.map(n=>n.id)).toEqual(['n1']);
    });

    it('recovers a note whose key exists but is missing from the index (corrupt index)', async () => {
      const {loadFreeNotes, readPerNoteNotes} = await load();
      seedLegacy([NOTE('n1'), NOTE('n2')]);
      loadFreeNotes();
      // Index lists only n1; n2 key still exists as an orphan.
      localStorage.setItem('etudes-note-index', JSON.stringify(['n1']));
      const ids = readPerNoteNotes().map(n=>n.id).sort();
      expect(ids).toEqual(['n1','n2']);
    });

    it('reconstructs all notes by scanning keys when the index is unparseable', async () => {
      const {loadFreeNotes, readPerNoteNotes} = await load();
      seedLegacy([NOTE('n1'), NOTE('n2'), NOTE('n3')]);
      loadFreeNotes();
      localStorage.setItem('etudes-note-index', 'not json{');
      const ids = readPerNoteNotes().map(n=>n.id).sort();
      expect(ids).toEqual(['n1','n2','n3']);
    });
  });
});
