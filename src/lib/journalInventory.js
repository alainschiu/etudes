import {collectJournalBlobRefs} from './driveBlobRefs.js';

/**
 * Pure summary of a migrated journal payload for the restore-confirm dialog.
 * Shared by the file-restore path (embedded journal) and the Drive-restore
 * path (metadata-only journal) so both show the SAME inventory.
 *
 * Blob counts come from collectJournalBlobRefs — which reads both embedded
 * `blobs` and the state metadata (recordingMeta, pieceRecordingMeta,
 * refTrackMeta, item.pdfs) — so a metadata-only Drive journal and its embedded
 * file equivalent yield identical counts, and the numbers reflect the blobs
 * that will actually be restored.
 *
 * @param {{ state?: object, blobs?: object, exportedAt?: string, schemaVersion?: number }} payload
 *   migrateImport output
 * @returns {{
 *   items: number, routines: number, days: number, weeks: number, months: number,
 *   pdfs: number, recordings: number, pieceRecordings: number, refTracks: number,
 *   notes: number, schemaVersion: number, exportedDateLocal: string, lines: string[]
 * }}
 */
export function describeJournalInventory(payload) {
  const st = payload?.state || {};
  const items = (st.items || []).length;
  const routines = (st.routines || []).length;
  const history = st.history || [];
  const days = history.filter((h) => h.kind === 'day' || !h.kind).length;
  const weeks = history.filter((h) => h.kind === 'week').length;
  const months = history.filter((h) => h.kind === 'month').length;
  const notes = (st.freeNotes || []).length;

  const refs = collectJournalBlobRefs(payload);
  const byStore = (s) => refs.filter((r) => r.store === s).length;
  const pdfs = byStore('pdfs');
  const recordings = byStore('recordings');
  const pieceRecordings = byStore('pieceRecordings');
  const refTracks = byStore('refTracks');

  const schemaVersion = payload?.schemaVersion || 1;
  const exportedDateLocal = payload?.exportedAt
    ? new Date(payload.exportedAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
    : 'unknown';

  const plur = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
  const lines = [
    plur(items, 'repertoire item'),
    plur(routines, 'routine'),
    `${plur(days, 'day')} of practice history`,
    `${weeks} weekly · ${months} monthly reflections`,
    `${plur(pdfs, 'PDF')} · ${plur(recordings, 'day recording')} · ${plur(pieceRecordings, 'piece recording')} · ${plur(refTracks, 'ref track')} · ${plur(notes, 'free note')}`,
    ``,
    `Exported ${exportedDateLocal} (schema v${schemaVersion})`,
  ];

  return {
    items, routines, days, weeks, months,
    pdfs, recordings, pieceRecordings, refTracks, notes,
    schemaVersion, exportedDateLocal, lines,
  };
}
