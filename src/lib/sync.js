import {supabase} from './supabase.js';
import {lsSet} from './storage.js';

export async function loadFromCloud(userId) {
  if (!supabase) return null;
  try {
    const {data, error} = await supabase
      .from('user_state')
      .select('state, updated_at')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // no rows — first sign-in
      throw error;
    }
    return data; // { state, updated_at }
  } catch (e) {
    console.warn('[sync] loadFromCloud failed:', e);
    return null;
  }
}

export async function syncToCloud(userId, state) {
  if (!supabase) return false;
  try {
    const {error} = await supabase
      .from('user_state')
      .upsert(
        {user_id: userId, state, updated_at: new Date().toISOString()},
        {onConflict: 'user_id'}
      );
    if (error) throw error;
    lsSet('etudes-lastSyncedAt', Date.now());
    return true;
  } catch (e) {
    console.warn('[sync] syncToCloud failed:', e);
    return false;
  }
}
