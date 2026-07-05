export function openDB(){return new Promise((res,rej)=>{try{const r=indexedDB.open('etudes',3);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('pdfs'))db.createObjectStore('pdfs');if(!db.objectStoreNames.contains('recordings'))db.createObjectStore('recordings');if(!db.objectStoreNames.contains('pieceRecordings'))db.createObjectStore('pieceRecordings');if(!db.objectStoreNames.contains('refTracks'))db.createObjectStore('refTracks');};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}});}
export async function idbPut(s,k,v){try{const db=await openDB();return new Promise((res)=>{try{const tx=db.transaction(s,'readwrite');tx.objectStore(s).put(v,k);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false);}catch{res(false);}});}catch{return false;}}
export async function idbDel(s,k){try{const db=await openDB();return new Promise((res)=>{const tx=db.transaction(s,'readwrite');tx.objectStore(s).delete(k);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false);});}catch{return false;}}
export async function idbGet(s,k){try{const db=await openDB();return new Promise((res)=>{try{const tx=db.transaction(s,'readonly');const req=tx.objectStore(s).get(k);req.onsuccess=()=>res(req.result);req.onerror=()=>res(null);}catch{res(null);}});}catch{return null;}}
export async function idbAllKeys(s){try{const db=await openDB();return new Promise((res)=>{try{const tx=db.transaction(s,'readonly');const req=tx.objectStore(s).getAllKeys();req.onsuccess=()=>res(req.result||[]);req.onerror=()=>res([]);}catch{res([]);}});}catch{return [];}}

export const memStore={};
// storageAvailable reflects ONLY the boot probe: whether localStorage is usable
// at all (false in privacy modes that disable it). It is NOT flipped on per-write
// quota errors — a single oversized write must not route every other surface to
// memory. Quota failures are handled per-key in lsSet.
export let storageAvailable=true;
(function(){try{const k='__etudes_probe__';localStorage.setItem(k,'1');localStorage.removeItem(k);}catch{storageAvailable=false;}})();
export function detectStorage(){return storageAvailable?'local':'memory';}

// Writing-surface keys whose save success/failure the autosave indicator reflects.
// Per-note keys (etudes-note-<id>) are matched by prefix in emitWriteResult.
const WRITING_SURFACE_KEYS=new Set([
  'etudes-freeNotes',        // legacy blob (pre-migration reads)
  'etudes-dailyReflection',
  'etudes-weekReflection',
  'etudes-monthReflection',
  'etudes-items',            // holds item.detail, item.todayNote, item.noteLog, spots
  'etudes-programs',
]);
function emitWriteResult(key,ok,reason){
  if(!WRITING_SURFACE_KEYS.has(key)&&!key.startsWith('etudes-note-'))return;
  try{window.dispatchEvent(new CustomEvent('etudes-write-result',{detail:{key,ok,reason,t:Date.now()}}));}catch{/* ignore */}
}

export function lsGet(k,f){
  // memStore holds the freshest value for any key whose last write didn't reach
  // localStorage (storage unavailable at boot, or a per-key quota failure).
  // Prefer it when present; in normal operation memStore is empty for written keys.
  if(Object.prototype.hasOwnProperty.call(memStore,k))return memStore[k];
  if(!storageAvailable)return f;
  try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch{return f;}
}
export function lsSet(k,v){
  if(!storageAvailable){
    // localStorage unusable since boot. Keep an in-memory copy so the session
    // works; report failure so callers/indicator can react.
    memStore[k]=v;emitWriteResult(k,false,'unavailable');return false;
  }
  try{
    localStorage.setItem(k,JSON.stringify(v));
    if(Object.prototype.hasOwnProperty.call(memStore,k))delete memStore[k]; // success: localStorage authoritative again
    emitWriteResult(k,true);
    return true;
  }catch{
    // Per-write failure (quota). Do NOT disable storage globally. Keep the value
    // in memory so the session isn't broken, fire etudes-storage-full to preserve
    // the Sync tab quota WARN (v0.98.2), and return false so callers can react.
    memStore[k]=v;
    try{window.dispatchEvent(new CustomEvent('etudes-storage-full'));}catch{/* ignore */}
    emitWriteResult(k,false,'quota');
    return false;
  }
}
export function lsRemove(k){
  if(Object.prototype.hasOwnProperty.call(memStore,k))delete memStore[k];
  if(!storageAvailable)return;
  try{localStorage.removeItem(k);}catch{/* ignore */}
}
// All keys (localStorage + memStore) optionally filtered by prefix.
export function lsKeys(prefix){
  const out=new Set();
  if(storageAvailable){try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(!prefix||k.startsWith(prefix)))out.add(k);}}catch{/* ignore */}}
  for(const k of Object.keys(memStore)){if(!prefix||k.startsWith(prefix))out.add(k);}
  return Array.from(out);
}
