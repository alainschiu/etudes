import {lsGet,lsSet,lsRemove,lsKeys} from './storage.js';
import {migrateFreeNotes} from './migrations.js';

// ── Per-note storage layout (v0.98.6, W1) ───────────────────────────────────
// Free notes persist one key per note (etudes-note-<id>) with an ordered index
// (etudes-note-index), so one oversized note can only fail its own write — never
// sink the whole journal. A storage-LAYOUT marker (etudes-notes-layout) gates the
// one-time split; it is distinct from SCHEMA_VERSION (which versions state SHAPE,
// not the persistence layout). These keys are LOCAL ONLY — cloud sync, Drive
// backup, and export continue to operate on the whole freeNotes array.

export const LAYOUT_KEY='etudes-notes-layout';
export const INDEX_KEY='etudes-note-index';
export const LEGACY_KEY='etudes-freeNotes';
const NOTE_PREFIX='etudes-note-';
const LAYOUT_PERNOTE=2;

const noteKey=(id)=>NOTE_PREFIX+id;
const isNote=(n)=>!!n&&typeof n==='object'&&!Array.isArray(n);
// etudes-note-index shares the etudes-note- prefix; exclude it when scanning notes.
const noteIdsFromKeys=()=>lsKeys(NOTE_PREFIX).filter(k=>k!==INDEX_KEY).map(k=>k.slice(NOTE_PREFIX.length));

// Reconstruct the notes array from per-note keys. Tolerant by design:
//  - skip index entries whose key is missing/unparseable (never render a broken
//    note from a dangling pointer);
//  - if the index is missing/corrupt, OR keys exist outside it, recover those
//    notes by scanning the keys (order is lost, but no note is lost — a corrupt
//    index must never equal lost notes).
export function readPerNoteNotes(){
  const collected=[];
  const seen=new Set();
  const index=lsGet(INDEX_KEY,null);
  if(Array.isArray(index)){
    for(const id of index){
      const n=lsGet(noteKey(id),null);
      if(isNote(n)){collected.push(n);seen.add(String(id));}
    }
  }
  for(const id of noteIdsFromKeys()){
    if(seen.has(String(id)))continue;
    const n=lsGet(noteKey(id),null);
    if(isNote(n)){collected.push(n);seen.add(String(id));}
  }
  return collected;
}

// One-time split of the legacy etudes-freeNotes blob into per-note keys.
// Lossless + idempotent guarantee:
//  - clear any leftover per-note keys/index from a prior aborted pass first, so
//    orphans never accumulate and eat the headroom a near-quota retry needs;
//  - write each note key FIRST, then the index (a failed write leaves an
//    invisible orphan, never a dangling index pointer);
//  - flip the layout marker and retire the legacy blob ONLY after every write
//    confirms (lsSet returns false on failure);
//  - on ANY failure, roll back every key written this pass and leave the legacy
//    blob untouched — it stays the source of truth and the split retries on the
//    next load.
function writePerNoteLayout(notes){
  for(const k of lsKeys(NOTE_PREFIX))lsRemove(k); // clean slate (also clears a stale index)
  const written=[];
  let ok=true;
  for(const n of notes){
    if(lsSet(noteKey(n.id),n)){written.push(noteKey(n.id));}
    else{ok=false;break;}
  }
  if(ok)ok=lsSet(INDEX_KEY,notes.map(n=>n.id));
  if(ok){
    lsSet(LAYOUT_KEY,LAYOUT_PERNOTE);
    lsRemove(LEGACY_KEY); // retire legacy only once the new layout is provably complete
    return true;
  }
  for(const k of written)lsRemove(k); // roll back partial pass; legacy blob is untouched
  lsRemove(INDEX_KEY);
  return false;
}

// Load notes for app init. Applies the v11 shape migration (updatedAt) first,
// then ensures the per-note layout. Returns the migrated notes array regardless
// of whether the split succeeds (the legacy blob remains the source of truth
// until it does).
export function loadFreeNotes(){
  const layout=lsGet(LAYOUT_KEY,1);
  if(layout>=LAYOUT_PERNOTE){
    return migrateFreeNotes(readPerNoteNotes());
  }
  const legacy=lsGet(LEGACY_KEY,null);
  const notes=migrateFreeNotes(Array.isArray(legacy)?legacy:[]);
  if(legacy==null){
    // Fresh install / no legacy blob — nothing to split, adopt per-note layout.
    lsSet(LAYOUT_KEY,LAYOUT_PERNOTE);
    return notes;
  }
  writePerNoteLayout(notes);
  return notes;
}

// Persist the current notes array to per-note keys, diffing against the
// previously-persisted array so only changed notes rewrite (write-amplification
// win, and the catastrophic-loss fix: one note's quota failure is isolated).
// Crash-safe ordering:
//  - adds/updates write the note key first; a key whose write FAILS is excluded
//    from the index (no dangling pointer to missing content);
//  - the index is rewritten WITHOUT removed ids before their keys are deleted.
export function persistFreeNotes(notes,prev){
  if(lsGet(LAYOUT_KEY,1)<LAYOUT_PERNOTE){
    // The one-time split has not completed (e.g. a prior near-quota failure).
    // Retry it from the current notes; until it succeeds the legacy blob is the
    // source of truth on reload, so keep it current so this edit isn't shadowed.
    if(!writePerNoteLayout(notes))lsSet(LEGACY_KEY,notes);
    return;
  }
  const prevById=new Map((prev||[]).map(n=>[String(n.id),n]));
  const prevIds=(prev||[]).map(n=>String(n.id));
  const curIdSet=new Set(notes.map(n=>String(n.id)));
  const failedNew=new Set();
  for(const n of notes){
    const sid=String(n.id);
    if(prevById.get(sid)===n)continue; // unchanged reference → already persisted
    const ok=lsSet(noteKey(n.id),n);
    if(!ok&&!prevById.has(sid))failedNew.add(sid); // brand-new note whose write failed: keep out of index
  }
  // Index = current order, minus brand-new ids whose key write just failed.
  const indexIds=notes.map(n=>n.id).filter(id=>!failedNew.has(String(id)));
  const indexChanged=indexIds.length!==prevIds.length||indexIds.some((id,i)=>String(id)!==prevIds[i]);
  if(indexChanged)lsSet(INDEX_KEY,indexIds);
  for(const sid of prevById.keys()){
    if(!curIdSet.has(sid))lsRemove(noteKey(sid)); // index already excludes it → safe to delete
  }
}
