/**
 * @param {object} data — migrated import { state, blobs }
 * @returns {Array<{ store: string, key: string, ns: string }>}
 */
export function collectJournalBlobRefs(data) {
  const st = data.state || {};
  const blobs = data.blobs || {};
  const out = [];
  const seen = new Set();

  const add = (store, key) => {
    if (key == null || key === '') return;
    const k = String(key);
    const ns = `${store}:${k}`;
    if (seen.has(ns)) return;
    seen.add(ns);
    out.push({store, key: k, ns});
  };

  for (const k of Object.keys(blobs.pdfs || {})) add('pdfs', k);
  for (const k of Object.keys(blobs.recordings || {})) add('recordings', k);
  for (const k of Object.keys(blobs.pieceRecordings || {})) add('pieceRecordings', k);
  for (const k of Object.keys(blobs.refTracks || {})) add('refTracks', k);

  for (const k of Object.keys(st.recordingMeta || {})) add('recordings', k);

  const prm = st.pieceRecordingMeta || {};
  for (const [, dates] of Object.entries(prm)) {
    if (!dates || typeof dates !== 'object') continue;
    for (const entry of Object.values(dates)) {
      if (entry?.idbKey) add('pieceRecordings', entry.idbKey);
    }
  }

  for (const k of Object.keys(st.refTrackMeta || {})) add('refTracks', k);

  for (const item of st.items || []) {
    for (const p of item.pdfs || []) {
      if (p.libraryId) add('pdfs', p.libraryId);
    }
  }

  return out;
}
