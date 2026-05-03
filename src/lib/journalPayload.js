import {APP_VERSION, SCHEMA_VERSION, ROLLOVER_KEY, WEEK_ROLLOVER_KEY, MONTH_ROLLOVER_KEY, DEFAULT_SESSIONS} from '../constants/config.js';
import {idbGet, idbAllKeys} from './storage.js';
import {blobToBase64, base64ToBlob} from './media.js';
import {todayDateStr, getWeekStart, getMonthKey} from './dates.js';
import {migrateItems, migrateSessions, migrateRoutines, migrateHistory, migratePrograms} from './migrations.js';

/**
 * @param {function} lsGet
 */
export async function buildFullJournalPayload(slice, lsGet) {
  const {
    items,
    itemTimes,
    warmupTimeToday,
    restToday,
    workingOn,
    todaySessions,
    loadedRoutineId,
    routines,
    programs,
    dailyReflection,
    weekReflection,
    monthReflection,
    settings,
    freeNotes,
    recordingMeta,
    history,
    dayClosed,
    pieceRecordingMeta,
    noteCategories,
    refTrackMeta,
  } = slice;
  const pk = await idbAllKeys('pdfs');
  const pb = {};
  for (const k of pk) {
    const b = await idbGet('pdfs', k);
    if (b) pb[String(k)] = await blobToBase64(b);
  }
  const rk = await idbAllKeys('recordings');
  const rb = {};
  for (const k of rk) {
    const b = await idbGet('recordings', k);
    if (b) rb[String(k)] = await blobToBase64(b);
  }
  const prk = await idbAllKeys('pieceRecordings');
  const prb = {};
  for (const k of prk) {
    const b = await idbGet('pieceRecordings', k);
    if (b) prb[String(k)] = await blobToBase64(b);
  }
  const rtk = await idbAllKeys('refTracks');
  const rtb = {};
  for (const k of rtk) {
    const b = await idbGet('refTracks', k);
    if (b) rtb[String(k)] = {d: await blobToBase64(b), t: b.type || 'audio/mpeg'};
  }
  return {
    app: 'Etudes',
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state: {
      items: (items || []).map((i) => {
        const {pdfUrl, ...r} = i;
        return r;
      }),
      itemTimes: itemTimes || {},
      warmupTimeToday: warmupTimeToday || 0,
      restToday: restToday || 0,
      workingOn: Array.isArray(workingOn) ? workingOn : [],
      todaySessions: todaySessions || [],
      loadedRoutineId: loadedRoutineId ?? null,
      routines: routines || [],
      programs: programs || [],
      dailyReflection: dailyReflection || '',
      weekReflection: weekReflection || {notes: '', goals: ''},
      monthReflection: monthReflection || {notes: '', goals: ''},
      settings: settings || {dailyTarget: 90, weeklyTarget: 600, monthlyTarget: 2400},
      freeNotes: Array.isArray(freeNotes) ? freeNotes : [],
      recordingMeta: recordingMeta || {},
      pieceRecordingMeta: pieceRecordingMeta || {},
      noteCategories: Array.isArray(noteCategories) ? noteCategories : [],
      refTrackMeta: refTrackMeta || {},
      history: history || [],
      dayClosed: !!dayClosed,
      rolloverKeys: {
        day: lsGet(ROLLOVER_KEY, null),
        week: lsGet(WEEK_ROLLOVER_KEY, null),
        month: lsGet(MONTH_ROLLOVER_KEY, null),
      },
    },
    blobs: {pdfs: pb, recordings: rb, pieceRecordings: prb, refTracks: rtb},
  };
}

/**
 * @param {object} data — migrateImport output
 * @param {{ blobMode: 'embedded' | 'none' }} options
 * @param {object} deps
 */
export async function applyJournalPayload(data, options, deps) {
  const {blobMode} = options;
  const {
    idbPut,
    idbDel,
    idbGet,
    idbAllKeys: idbAllKeysFn,
    lsSet,
    pdfUrlMap,
    setItems,
    setItemTimes,
    setWarmupTimeToday,
    setRestToday,
    setWorkingOn,
    setTodaySessions,
    setLoadedRoutineId,
    setRoutines,
    setPrograms,
    setDailyReflection,
    setWeekReflection,
    setMonthReflection,
    setSettings,
    setFreeNotes,
    setRecordingMeta,
    setHistory,
    setDayClosed,
    setPdfUrlMap,
    setPieceRecordingMeta,
    setNoteCategories,
    setRefTrackMeta,
    setLocalPieceRecordingIds,
    setLocalRefTrackIds,
    setActiveItemId,
    setActiveSpotId,
    setActiveSessionId,
    setIsResting,
    setExpandedItemId,
    setPdfDrawerItemId,
  } = deps;

  const st = data.state || {};

  if (blobMode === 'embedded') {
    const npb = {};
    for (const [k, b] of Object.entries(data.blobs?.pdfs || {})) {
      const bl = base64ToBlob(b, 'application/pdf');
      if (bl) npb[k] = bl;
    }
    const nrb = {};
    for (const [k, b] of Object.entries(data.blobs?.recordings || {})) {
      const bl = base64ToBlob(b, 'audio/webm');
      if (bl) nrb[k] = bl;
    }
    const nprb = {};
    for (const [k, b] of Object.entries(data.blobs?.pieceRecordings || {})) {
      const bl = base64ToBlob(b, 'audio/webm');
      if (bl) nprb[k] = bl;
    }
    const nrtb = {};
    for (const [k, v] of Object.entries(data.blobs?.refTracks || {})) {
      const entry = typeof v === 'object' ? v : {d: v, t: 'audio/mpeg'};
      const bl = base64ToBlob(entry.d, entry.t || 'audio/mpeg');
      if (bl) nrtb[k] = bl;
    }
    Object.values(pdfUrlMap || {}).forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    for (const k of await idbAllKeysFn('pdfs')) await idbDel('pdfs', k);
    for (const k of await idbAllKeysFn('recordings')) await idbDel('recordings', k);
    const hasPieceRec = data.blobs?.pieceRecordings !== undefined;
    const hasRefTracks = data.blobs?.refTracks !== undefined;
    if (hasPieceRec) {
      for (const k of await idbAllKeysFn('pieceRecordings')) await idbDel('pieceRecordings', k);
    }
    if (hasRefTracks) {
      for (const k of await idbAllKeysFn('refTracks')) await idbDel('refTracks', k);
    }
    const newUrl = {};
    for (const [k, b] of Object.entries(npb)) {
      await idbPut('pdfs', k, b);
      newUrl[k] = URL.createObjectURL(b);
    }
    for (const [k, b] of Object.entries(nrb)) await idbPut('recordings', k, b);
    for (const [k, b] of Object.entries(nprb)) await idbPut('pieceRecordings', k, b);
    for (const [k, b] of Object.entries(nrtb)) await idbPut('refTracks', k, b);
    const importedRecKeys = new Set(Object.keys(nrb));
    const reconciledMeta = Object.fromEntries(
      Object.entries(st.recordingMeta || {}).filter(([k]) => importedRecKeys.has(k)),
    );
    setItems(migrateItems(st.items || []));
    setItemTimes(st.itemTimes || {});
    setWarmupTimeToday(st.warmupTimeToday || 0);
    setRestToday(st.restToday || 0);
    setWorkingOn(Array.isArray(st.workingOn) ? st.workingOn : []);
    setTodaySessions(migrateSessions(st.todaySessions || DEFAULT_SESSIONS));
    setLoadedRoutineId(st.loadedRoutineId || null);
    setRoutines(migrateRoutines(st.routines || []));
    setPrograms(migratePrograms(st.programs || []));
    setDailyReflection(st.dailyReflection || '');
    setWeekReflection(st.weekReflection || {notes: '', goals: ''});
    setMonthReflection(st.monthReflection || {notes: '', goals: ''});
    setSettings(st.settings || {dailyTarget: 90, weeklyTarget: 600, monthlyTarget: 2400});
    setFreeNotes(Array.isArray(st.freeNotes) ? st.freeNotes : []);
    if (st.noteCategories !== undefined) setNoteCategories(Array.isArray(st.noteCategories) ? st.noteCategories : []);
    setRecordingMeta(reconciledMeta);
    if (hasPieceRec) setPieceRecordingMeta(st.pieceRecordingMeta || {});
    if (hasRefTracks) setRefTrackMeta(st.refTrackMeta || {});
    setHistory(migrateHistory(st.history || []));
    setDayClosed(!!st.dayClosed);
    setPdfUrlMap(newUrl);
    if (hasPieceRec) setLocalPieceRecordingIds(new Set(Object.keys(nprb).map((k) => k.split('__')[0])));
    else idbAllKeysFn('pieceRecordings').then((keys) => setLocalPieceRecordingIds(new Set(keys.map((k) => String(k).split('__')[0]))));
    if (hasRefTracks) setLocalRefTrackIds(new Set(Object.keys(nrtb)));
    else idbAllKeysFn('refTracks').then((keys) => setLocalRefTrackIds(new Set(keys.map((k) => String(k)))));
  } else {
    const entries = await Promise.all(Object.keys(st.recordingMeta || {}).map(async (k) => [k, await idbGet('recordings', k)]));
    const reconciledMeta = Object.fromEntries(entries.filter(([, blob]) => !!blob).map(([k]) => [k, st.recordingMeta[k]]));
    setItems(migrateItems(st.items || []));
    setItemTimes(st.itemTimes || {});
    setWarmupTimeToday(st.warmupTimeToday || 0);
    setRestToday(st.restToday || 0);
    setWorkingOn(Array.isArray(st.workingOn) ? st.workingOn : []);
    setTodaySessions(migrateSessions(st.todaySessions || DEFAULT_SESSIONS));
    setLoadedRoutineId(st.loadedRoutineId || null);
    setRoutines(migrateRoutines(st.routines || []));
    setPrograms(migratePrograms(st.programs || []));
    setDailyReflection(st.dailyReflection || '');
    setWeekReflection(st.weekReflection || {notes: '', goals: ''});
    setMonthReflection(st.monthReflection || {notes: '', goals: ''});
    setSettings(st.settings || {dailyTarget: 90, weeklyTarget: 600, monthlyTarget: 2400});
    setFreeNotes(Array.isArray(st.freeNotes) ? st.freeNotes : []);
    if (st.noteCategories !== undefined) setNoteCategories(Array.isArray(st.noteCategories) ? st.noteCategories : []);
    setRecordingMeta(reconciledMeta);
    setPieceRecordingMeta(st.pieceRecordingMeta || {});
    setRefTrackMeta(st.refTrackMeta || {});
    setHistory(migrateHistory(st.history || []));
    setDayClosed(!!st.dayClosed);
    Object.values(pdfUrlMap || {}).forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    const pdfKeys = await idbAllKeysFn('pdfs');
    const newUrl = {};
    for (const k of pdfKeys) {
      const b = await idbGet('pdfs', k);
      if (b) newUrl[String(k)] = URL.createObjectURL(b);
    }
    setPdfUrlMap(newUrl);
    idbAllKeysFn('pieceRecordings').then((keys) => setLocalPieceRecordingIds(new Set(keys.map((k) => String(k).split('__')[0]))));
    idbAllKeysFn('refTracks').then((keys) => setLocalRefTrackIds(new Set(keys.map((k) => String(k)))));
  }

  setActiveItemId(null);
  setActiveSpotId(null);
  setActiveSessionId(null);
  setIsResting(false);
  setExpandedItemId(null);
  setPdfDrawerItemId(null);
  if (st.rolloverKeys?.day) lsSet(ROLLOVER_KEY, st.rolloverKeys.day);
  else lsSet(ROLLOVER_KEY, todayDateStr());
  if (st.rolloverKeys?.week) lsSet(WEEK_ROLLOVER_KEY, st.rolloverKeys.week);
  else lsSet(WEEK_ROLLOVER_KEY, getWeekStart(todayDateStr()));
  if (st.rolloverKeys?.month) lsSet(MONTH_ROLLOVER_KEY, st.rolloverKeys.month);
  else lsSet(MONTH_ROLLOVER_KEY, getMonthKey(todayDateStr()));
}
