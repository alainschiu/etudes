import {supabase} from './supabase.js';
import {lsSet} from './storage.js';
import {displayTitle} from './items.js';

// Key written only after a confirmed successful cloud write.
// Separate from etudes-localDirtyAt which tracks local mutations.
export const LS_CLOUD_SYNC_KEY = 'etudes-lastCloudSyncAt';

// ── Schema v13 merge primitives ─────────────────────────────────────────────
// Per-entity last-writer-wins keyed on updatedAt, plus tombstones so a deletion
// propagates instead of being resurrected by the device that still holds it.

/** Tombstones older than this are pruned; the cap below bounds the rest. */
export const TOMBSTONE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
export const TOMBSTONE_MAX = 500;

/** Stamp an entity as changed. The one place updatedAt is written. */
export function stampChanged(entity, now = Date.now()) {
  return {...entity, updatedAt: now};
}

const ts = (x) => (typeof x?.updatedAt === 'number' ? x.updatedAt : 0);

/**
 * Pick the newer of two versions of the same entity. Exact ties keep local, so
 * the merge is stable and a tie never silently flips a device's own copy.
 */
export function pickNewer(localEntity, remoteEntity) {
  if (!localEntity) return remoteEntity;
  if (!remoteEntity) return localEntity;
  return ts(remoteEntity) > ts(localEntity) ? remoteEntity : localEntity;
}

/** Union two collections by `key`, keeping the newer side of each collision. */
function mergeByKeyLWW(localArr, remoteArr, keyFn) {
  const toArr = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []));
  const map = new Map();
  for (const x of toArr(remoteArr)) map.set(keyFn(x), x);
  for (const x of toArr(localArr)) {
    const k = keyFn(x);
    map.set(k, map.has(k) ? pickNewer(x, map.get(k)) : x);
  }
  return Array.from(map.values());
}

export const historyKey = (x) =>
  x.kind === 'week'  ? `week:${x.weekStart}` :
  x.kind === 'month' ? `month:${x.month}` :
                       `day:${x.date}`;

const tombKey = (t) => `${t.type}:${t.id}`;

/** Append tombstones, then prune by age and cap. Newest wins on a repeat key. */
export function pushTombstone(deletions, entries, now = Date.now()) {
  const list = Array.isArray(deletions) ? deletions : [];
  const incoming = Array.isArray(entries) ? entries : [entries];
  const map = new Map();
  for (const t of [...list, ...incoming]) {
    if (!t || !t.type || !t.id) continue;
    const prev = map.get(tombKey(t));
    if (!prev || (t.deletedAt || 0) > (prev.deletedAt || 0)) map.set(tombKey(t), t);
  }
  let out = Array.from(map.values()).filter((t) => (t.deletedAt || 0) >= now - TOMBSTONE_MAX_AGE_MS);
  if (out.length > TOMBSTONE_MAX) {
    out = out.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0)).slice(0, TOMBSTONE_MAX);
  }
  return out;
}

/** Union two tombstone lists, keeping the newest deletedAt per entity. */
export function mergeTombstones(localD, remoteD, now = Date.now()) {
  return pushTombstone(Array.isArray(localD) ? localD : [], Array.isArray(remoteD) ? remoteD : [], now);
}

/**
 * Drop entities whose deletion is newer than their last edit. An entity edited
 * (or re-created) after the tombstone survives — that is the deliberate
 * edit-after-delete resurrect, and it is why this compares timestamps rather
 * than merely testing for the tombstone's presence.
 */
export function applyTombstones(arr, deletions, type) {
  const dead = new Map();
  for (const t of deletions || []) if (t?.type === type) dead.set(t.id, t.deletedAt || 0);
  return (arr || []).filter((x) => !(dead.has(x.id) && dead.get(x.id) > ts(x)));
}

/**
 * Merge two states. Per-entity LWW on updatedAt for the id-keyed collections and
 * history, whole-object LWW for settings, per-scale LWW for the reflections, and
 * tombstones applied last so a deletion beats a stale copy.
 *
 * Every key the caller's state carries must appear here — a dropped key wipes
 * that slice on every merge.
 */
export function mergeStates(local, remote, now = Date.now()) {
  const mergeObj = (localObj={}, remoteObj={}) => ({...remoteObj, ...localObj});
  const byId = (l, r) => mergeByKeyLWW(l, r, (x) => x.id);
  const deletions = mergeTombstones(local.deletions, remote.deletions, now);

  // Singletons carry no id, so their timestamps live in reflectionMeta / settings.
  const rMetaL = local.reflectionMeta || {};
  const rMetaR = remote.reflectionMeta || {};
  const reflectionMeta = {};
  const reflections = {};
  for (const [scale, field] of [['daily','dailyReflection'],['week','weekReflection'],['month','monthReflection']]) {
    const localNewer = (rMetaL[scale]?.updatedAt || 0) >= (rMetaR[scale]?.updatedAt || 0);
    reflections[field] = localNewer ? local[field] : remote[field];
    const winner = localNewer ? rMetaL[scale] : rMetaR[scale];
    if (winner) reflectionMeta[scale] = winner;
  }
  const settings = (local.settings?.updatedAt || 0) >= (remote.settings?.updatedAt || 0)
    ? local.settings
    : remote.settings;

  return {
    ...remote,                                     // session-local day state: remote wins, as before
    items:    applyTombstones(byId(local.items,    remote.items),    deletions, 'item'),
    routines: applyTombstones(byId(local.routines, remote.routines), deletions, 'routine'),
    programs: applyTombstones(byId(local.programs, remote.programs), deletions, 'program'),
    freeNotes:applyTombstones(byId(local.freeNotes,remote.freeNotes),deletions, 'note'),
    history:  mergeByKeyLWW(local.history, remote.history, historyKey),
    settings,
    ...reflections,
    reflectionMeta,
    deletions,
    itemTimes:         mergeObj(local.itemTimes,         remote.itemTimes),
    pieceRecordingMeta:mergeObj(local.pieceRecordingMeta,remote.pieceRecordingMeta),
    refTrackMeta:      mergeObj(local.refTrackMeta,      remote.refTrackMeta),
    workingOn: [...new Set([...(local.workingOn||[]), ...(remote.workingOn||[])])],
  };
}

/**
 * A6 — the stamping choke-point, expressed as a diff rather than as N call sites.
 *
 * The state hook hands its setters straight to the views, which mutate items /
 * routines / programs / notes from dozens of places. Stamping at each call site
 * would mean finding every one of them and would silently lose an edit for any
 * that were missed. Instead the wrapped setter compares the outgoing collection
 * with the incoming one and stamps whatever actually changed: a site cannot be
 * missed, and — because it stamps only on a real content difference — a re-render
 * or a no-op write never drifts a timestamp.
 *
 * Pure. `structurallyEqual` ignores updatedAt, so a previously stamped entity
 * does not re-stamp itself.
 *
 * @returns {{next: Array, removed: Array<string>}} stamped collection + ids that vanished
 */
export function stampCollectionDiff(prev, next, now = Date.now()) {
  const prevById = new Map((prev || []).map((x) => [x.id, x]));
  const stamped = (next || []).map((x) => {
    const before = prevById.get(x.id);
    if (before && structurallyEqual(before, x)) return x; // unchanged — keep its stamp
    return stampChanged(x, now);
  });
  const nextIds = new Set((next || []).map((x) => x.id));
  const removed = [];
  for (const id of prevById.keys()) if (!nextIds.has(id)) removed.push(id);
  return {next: stamped, removed};
}

/** As above, for history — keyed by date rather than id, and never tombstoned. */
export function stampHistoryDiff(prev, next, now = Date.now()) {
  const prevByKey = new Map((prev || []).map((x) => [historyKey(x), x]));
  return (next || []).map((x) => {
    const before = prevByKey.get(historyKey(x));
    if (before && structurallyEqual(before, x)) return x;
    return stampChanged(x, now);
  });
}

/**
 * Entities that exist on both sides with genuinely different content. Drives the
 * conflict modal: an empty set means LWW can resolve everything silently.
 * Returns entries carrying both sides' timestamps so the modal can say when each
 * was last edited, and whether LWW can pick a winner at all.
 */
export function computeDivergence(local, remote) {
  const out = [];
  const collections = [
    ['item', 'items'], ['routine', 'routines'], ['program', 'programs'], ['note', 'freeNotes'],
  ];
  for (const [type, field] of collections) {
    const remoteById = new Map((remote?.[field] || []).map((x) => [x.id, x]));
    for (const l of local?.[field] || []) {
      const r = remoteById.get(l.id);
      if (!r || structurallyEqual(l, r)) continue;
      const lt = ts(l), rt = ts(r);
      out.push({
        type, id: l.id,
        label: type === 'item' ? displayTitle(l) : (l.name || l.title || '(untitled)'),
        localAt: lt, remoteAt: rt,
        // LWW cannot pick when the stamps tie, or when either side predates
        // stamping (v12 data) — those are the cases a human should see.
        undecidable: lt === rt || lt === 0 || rt === 0,
      });
    }
  }
  return out;
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

/**
 * Stable structural equality. Ignores object key order and
 * undefined-vs-missing fields. Used in place of JSON.stringify
 * comparison for items round-tripped through Postgres JSONB,
 * which does not preserve key order.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function structurallyEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!structurallyEqual(a[i], b[i])) return false;
    return true;
  }
  const aKeys = Object.keys(a).filter(k => a[k] !== undefined && !IGNORED_EQUALITY_KEYS.has(k));
  const bKeys = Object.keys(b).filter(k => b[k] !== undefined && !IGNORED_EQUALITY_KEYS.has(k));
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) if (!structurallyEqual(a[k], b[k])) return false;
  return true;
}

// Fields excluded from structural equality. updatedAt is a last-write-wins
// timestamp, not content — two entities differing only by updatedAt are equal, so
// a normal post-edit sync round-trip does not read as a conflict. Matched by key
// name at every depth, so the single entry covers notes (v11) and the items /
// routines / programs / history / settings stamps added in v13.
const IGNORED_EQUALITY_KEYS = new Set(['updatedAt']);

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
