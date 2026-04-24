export function openDB(){return new Promise((res,rej)=>{try{const r=indexedDB.open('etudes',1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('pdfs'))db.createObjectStore('pdfs');if(!db.objectStoreNames.contains('recordings'))db.createObjectStore('recordings');};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}});}
export async function idbPut(s,k,v){try{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(s,'readwrite');tx.objectStore(s).put(v,k);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}catch{return false;}}
export async function idbDel(s,k){try{const db=await openDB();return new Promise((res)=>{const tx=db.transaction(s,'readwrite');tx.objectStore(s).delete(k);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false);});}catch{return false;}}
export async function idbGet(s,k){try{const db=await openDB();return new Promise((res)=>{try{const tx=db.transaction(s,'readonly');const req=tx.objectStore(s).get(k);req.onsuccess=()=>res(req.result);req.onerror=()=>res(null);}catch{res(null);}});}catch{return null;}}
export async function idbAllKeys(s){try{const db=await openDB();return new Promise((res)=>{try{const tx=db.transaction(s,'readonly');const req=tx.objectStore(s).getAllKeys();req.onsuccess=()=>res(req.result||[]);req.onerror=()=>res([]);}catch{res([]);}});}catch{return [];}}

export const memStore={};
export let storageAvailable=true;
(function(){try{const k='__etudes_probe__';localStorage.setItem(k,'1');localStorage.removeItem(k);}catch{storageAvailable=false;}})();
export function detectStorage(){return storageAvailable?'local':'memory';}
export function lsGet(k,f){if(!storageAvailable){return Object.prototype.hasOwnProperty.call(memStore,k)?memStore[k]:f;}try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch{return f;}}
export function lsSet(k,v){if(!storageAvailable){memStore[k]=v;return true;}try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{storageAvailable=false;memStore[k]=v;try{window.dispatchEvent(new CustomEvent('etudes-storage-full'));}catch{}return true;}}
