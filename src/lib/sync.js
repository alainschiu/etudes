import {supabase} from './supabase.js';
import {lsSet} from './storage.js';

// Key written only after a confirmed successful cloud write.
// Separate from etudes-localDirtyAt which tracks local mutations.
export const LS_CLOUD_SYNC_KEY = 'etudes-lastCloudSyncAt';

// Merge two states: union array data by id (local wins same id),
// merge object maps (local wins per key), remote wins for scalar fields.
export function mergeStates(local, remote) {
  const mergeById = (localArr=[], remoteArr=[]) => {
    const map = new Map();
    remoteArr.forEach(item => map.set(item.id, item));
    localArr.forEach(item => map.set(item.id, item)); // local wins on same id
    return Array.from(map.values());
  };
  const mergeObj = (localObj={}, remoteObj={}) => ({...remoteObj, ...localObj});
  const historyKey = x =>
    x.kind === 'week'  ? `week:${x.weekStart}` :
    x.kind === 'month' ? `month:${x.month}` :
                         `day:${x.date}`;
  const mergeHistory = (localH, remoteH) => {
    // Tolerate either side being a plain object (legacy corrupt state) or array
    const toArr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []);
    const map = new Map();
    toArr(remoteH).forEach(x => map.set(historyKey(x), x));
    toArr(localH).forEach(x => map.set(historyKey(x), x)); // local wins on same key
    return Array.from(map.values());
  };
  return {
    ...remote,                                               // scalar fields: remote wins
    items:     mergeById(local.items,    remote.items),
    routines:  mergeById(local.routines, remote.routines),
    programs:  mergeById(local.programs, remote.programs),
    history:   mergeHistory(local.history, remote.history), // local wins per date
    itemTimes:         mergeObj(local.itemTimes,         remote.itemTimes),
    pieceRecordingMeta:mergeObj(local.pieceRecordingMeta,remote.pieceRecordingMeta),
    refTrackMeta:      mergeObj(local.refTrackMeta,      remote.refTrackMeta),
    workingOn: [...new Set([...(local.workingOn||[]), ...(remote.workingOn||[])])],
  };
}

// Returns { kind: 'ok', state, updated_at }
//       | { kind: 'not_found' }            — first sign-in, no row yet
//       | { kind: 'error' }                — real network/RLS failure
export async function loadFromCloud(userId) {
  try {
    const {data, error} = await supabase
      .from('user_state')
      .select('state, updated_at')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return {kind: 'not_found'};
      console.warn('[sync] loadFromCloud error:', error);
      return {kind: 'error'};
    }
    return {kind: 'ok', state: data.state, updated_at: data.updated_at};
  } catch (e) {
    console.warn('[sync] loadFromCloud failed:', e);
    return {kind: 'error'};
  }
}

export function measureSyncPayload(state) {
  try { return Math.round(JSON.stringify(state).length / 1024); }
  catch { return 0; }
}

export async function syncToCloud(userId, state) {
  try {
    const {error} = await supabase
      .from('user_state')
      .upsert(
        {user_id: userId, state, updated_at: new Date().toISOString()},
        {onConflict: 'user_id'}
      );
    if (error) throw error;
    lsSet(LS_CLOUD_SYNC_KEY, Date.now());
    return true;
  } catch (e) {
    console.warn('[sync] syncToCloud failed:', e);
    return false;
  }
}
