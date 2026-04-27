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
  return {
    ...remote,                                               // scalar fields: remote wins
    items:     mergeById(local.items,    remote.items),
    routines:  mergeById(local.routines, remote.routines),
    programs:  mergeById(local.programs, remote.programs),
    history:   mergeObj(local.history,   remote.history),   // local wins per date
    itemTimes: mergeObj(local.itemTimes, remote.itemTimes), // local wins per item
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
