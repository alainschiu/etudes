/**
 * DevToolsBar — only mounts in development builds (import.meta.env.DEV).
 * Provides two one-click actions rendered as a thin strip above the footer:
 *   • Seed All  — repertoire (50 pieces) → history (50 days) → recordings (10 per first piece)
 *   • Clear All — wipes all etudes-* localStorage keys + drops the etudes IndexedDB
 * After each action the page reloads so the app boots with the fresh state.
 */
import React, {useState, useEffect} from 'react';
import {LINE, WARM, mono} from '../constants/theme.js';

// ── IDB helpers ──────────────────────────────────────────────────────────────
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('etudes', 3);
    r.onupgradeneeded = () => {
      const db = r.result;
      ['pdfs','recordings','pieceRecordings','refTracks'].forEach(s => {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function idbPut(store, key, value) {
  return openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }));
}

// ── Audio helpers ────────────────────────────────────────────────────────────
function makeSineWav(durationSec, freq = 440) {
  const sr = 22050, n = Math.floor(sr * durationSec);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const wr = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  wr(0,'RIFF'); v.setUint32(4,36+n*2,true);
  wr(8,'WAVE'); wr(12,'fmt ');
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*2,true);
  v.setUint16(32,2,true); v.setUint16(34,16,true);
  wr(36,'data'); v.setUint32(40,n*2,true);
  for (let i = 0; i < n; i++)
    v.setInt16(44+i*2, Math.round(Math.sin(2*Math.PI*freq*i/sr)*0.3*32767), true);
  return new Blob([buf], {type:'audio/wav'});
}
async function computePeaks(blob, buckets = 120) {
  try {
    const ctx = new AudioContext();
    const ab = await ctx.decodeAudioData(await blob.arrayBuffer());
    const d = ab.getChannelData(0);
    const bs = Math.max(1, Math.floor(d.length / buckets));
    let raw = Array.from({length: buckets}, (_, i) => {
      let sum = 0, cnt = 0;
      for (let j = 0; j < bs && i*bs+j < d.length; j++) { const vv = d[i*bs+j]||0; sum+=vv*vv; cnt++; }
      return cnt ? Math.sqrt(sum/cnt) : 0;
    });
    for (let p = 0; p < 2; p++)
      raw = raw.map((v,i) => !i||i===raw.length-1 ? v : raw[i-1]*0.25+v*0.5+raw[i+1]*0.25);
    const mx = Math.max(...raw, 1e-6);
    ctx.close().catch(()=>{});
    return raw.map(x => x/mx);
  } catch { return []; }
}

// ── Seed: 50 repertoire pieces ───────────────────────────────────────────────
const SEED_PREFIX = 'seed-piece-';
function seedRepertoire() {
  const rand = a => a[Math.floor(Math.random()*a.length)];
  const composers = [
    {name:'J.S. Bach',era:'baroque'},{name:'D. Scarlatti',era:'baroque'},
    {name:'G.F. Handel',era:'baroque'},{name:'W.A. Mozart',era:'classical'},
    {name:'L. van Beethoven',era:'classical'},{name:'F. Schubert',era:'classical'},
    {name:'F. Chopin',era:'romantic'},{name:'R. Schumann',era:'romantic'},
    {name:'J. Brahms',era:'romantic'},{name:'F. Liszt',era:'romantic'},
    {name:'C. Debussy',era:'impressionist'},{name:'M. Ravel',era:'impressionist'},
    {name:'S. Prokofiev',era:'modern'},{name:'B. Bartok',era:'modern'},
    {name:'D. Shostakovich',era:'modern'},{name:'A. Piazzolla',era:'contemporary'},
    {name:'P. Glass',era:'contemporary'},{name:'N. Kapustin',era:'contemporary'},
  ];
  const forms = ['Sonata Movement','Prelude','Etude','Nocturne','Waltz','Impromptu',
    'Intermezzo','Ballade','Rhapsody','Toccata','Fugue','Suite Movement','Character Piece','Mazurka','Polonaise'];
  const keys = ['C major','G major','D major','A major','E-flat major','B minor','F-sharp minor','D minor','A-flat major','E minor'];
  const stages = ['queued','learning','polishing','maintenance'];
  const instruments = ['piano','violin','cello','flute','guitar','clarinet'];
  const moods = ['lyrical','dramatic','brilliant','intimate','stormy','meditative','dance-like','cantabile'];
  const ytRefs = [
    'https://youtu.be/GRxofEmo3HA','https://youtu.be/4Tr0otuiQuU',
    'https://www.youtube.com/watch?v=H1Dvg2MxQn8','https://youtu.be/ho9rZjlsyYY',
  ];
  const now = Date.now();
  const pieces = Array.from({length:50}, (_, i) => {
    const composer = rand(composers);
    const form = rand(forms);
    const key = rand(keys);
    const mood = rand(moods);
    const opus = 5 + Math.floor(Math.random()*90);
    const num = 1 + Math.floor(Math.random()*4);
    const d = new Date(); d.setDate(d.getDate()-Math.floor(Math.random()*180));
    return {
      id: `${SEED_PREFIX}${String(i+1).padStart(3,'0')}-${now.toString(36)}`,
      type: 'piece',
      title: `${form} in ${key}`,
      tags: [composer.era, form.toLowerCase(), mood, rand(instruments)].filter((v,j,a)=>a.indexOf(v)===j),
      pdfs: [], defaultPdfId: null,
      detail: `${composer.era} style — articulation and phrase pacing.`,
      composer: composer.name, author: '', arranger: '',
      catalog: Math.random()<0.6 ? `Op. ${opus} No. ${num}` : '',
      collection: Math.random()<0.5 ? `${form}s` : '',
      movement: Math.random()<0.45 ? `${rand(['I','II','III'])}. ${mood[0].toUpperCase()+mood.slice(1)}` : '',
      stage: rand(stages),
      referenceUrl: Math.random()<0.4 ? rand(ytRefs) : '',
      startedDate: d.toISOString().slice(0,10),
      bpmLog: [], bpmTarget: Math.random()<0.7 ? 56+Math.floor(Math.random()*96) : null,
      todayNote: '', instrument: rand(instruments),
      spots: [], performances: [],
      lengthSecs: 90+Math.floor(Math.random()*720), noteLog: [],
    };
  });
  const current = JSON.parse(localStorage.getItem('etudes-items')||'[]')
    .filter(x => !(typeof x?.id==='string' && x.id.startsWith(SEED_PREFIX)));
  localStorage.setItem('etudes-items', JSON.stringify([...current, ...pieces]));
  return pieces.length;
}

// ── Seed: 50 history days ─────────────────────────────────────────────────────
function seedHistory() {
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const rnd = (lo, hi) => lo + Math.floor(Math.random()*(hi-lo+1));
  const dateStr = d => d.toISOString().split('T')[0];
  const addDays = (d, n) => { const c=new Date(d); c.setDate(c.getDate()+n); return c; };

  const allItems = JSON.parse(localStorage.getItem('etudes-items')||'[]');
  if (!allItems.length) return 0;

  const pieceNotes = [
    'Slow practice through the difficult passage — left-hand tension releasing by the third run.',
    'Worked with metronome at 60% tempo. Phrase endings still rushed.',
    'Ran through twice, then isolated mm. 34–48. Cross-string arpeggios are getting cleaner.',
    'Intonation drill on the descending passage. Using drone on the tonic.',
    'Memorisation work — two slips at the recapitulation.',
    'Tempo pushed to 80% — coordination holding. Ready to push further.',
    'Performance-mode run. Stopped only once.',
    'Focused on coda. Every note fine in isolation but continuity breaks at tempo.',
  ];
  const techNotes = [
    'Scales in thirds. Slow with drone. Intonation cleaned up by the end.',
    'Hanon No. 1 at MM=80 then 100. Finger independence improving.',
    'Shifting drill — all shifts to 3rd and 5th position from 1st.',
    'Legato bow changes. No accent, no gap.',
    'Vibrato speed exercise. Slow → medium → fast and back.',
  ];
  const notesByType = {piece:pieceNotes, tech:techNotes, play:pieceNotes, study:techNotes};
  const reflections = [
    '# Session Notes\n\nFocused session. Consistent slow practice paying off.\n\n#focused #progress',
    '# Maintenance\n\nSolid maintenance day. Warmup routine is clicking.\n\n#maintenance',
    '# Struggle Day\n\nDifficult session — intonation off from the start. Cut short.\n\n#honest #fatigue',
    '# Technical Focus\n\nOne problem: bow arm collapse on down-bow. Mirror work. Aware of the habit now.\n\n#technique',
    '# Good Energy\n\nUnusually high energy. Pushed tempo on three passages and they held.\n\n#momentum',
  ];

  // generate ~50 practice days from 2026-01-01
  const practiceDays = [];
  let cursor = new Date('2026-01-01'), consecutive = 0;
  while (practiceDays.length < 50) {
    if (consecutive < 4 && Math.random() > 0.22) { practiceDays.push(dateStr(cursor)); consecutive++; }
    else { consecutive = 0; }
    cursor = addDays(cursor, 1);
  }

  const newDays = practiceDays.map(date => {
    const totalMin = rnd(40,120), warmupMin = Math.random()<0.6 ? rnd(8,20) : 0;
    const shuffled = [...allItems].sort(()=>Math.random()-0.5);
    const count = Math.min(rnd(2,4), shuffled.length);
    const sel = shuffled.slice(0, count);
    const mins = sel.map((_,i) => i<sel.length-1 ? rnd(8, Math.floor((totalMin-warmupMin)/count)+5) : null);
    let rem = totalMin - warmupMin - mins.slice(0,-1).reduce((a,b)=>a+b,0);
    mins[mins.length-1] = Math.max(5, rem);
    return {
      kind:'day', date,
      minutes: totalMin, warmupMinutes: warmupMin,
      items: sel.map((item,i) => ({
        id:item.id, minutes:mins[i],
        title:item.title||'Untitled', composer:item.composer||'',
        arranger:item.arranger||'', catalog:item.catalog||'',
        collection:item.collection||'', movement:item.movement||'',
        type:item.type||'piece',
        note: pick(notesByType[item.type]||pieceNotes),
        spotMinutes:{}, spotsSnapshot:[],
      })),
      reflection: pick(reflections),
    };
  });

  // weekly entries
  const weekStarts = new Set();
  practiceDays.forEach(ds => {
    const d=new Date(ds), dow=(d.getDay()+6)%7, mon=new Date(d);
    mon.setDate(d.getDate()-dow); weekStarts.add(dateStr(mon));
  });
  const newWeeks = [...weekStarts].map(ws => ({
    kind:'week', weekStart:ws, weekEnd:dateStr(addDays(new Date(ws),6)),
    notes:'# Week Review\n\nConsistent week. Intonation improving. Ready to push tempo.\n\n#weeklyreview',
    goals:'# Next Week\n\n1. Tempo push\n2. Memorise next section\n3. Record a run-through\n\n#goals',
  }));

  // monthly entries
  const newMonths = ['2026-01','2026-02','2026-03'].map(month => ({
    kind:'month', month,
    notes:`# ${month} Review\n\nSolid month of consistent work. Progress is compounding.\n\n#monthreview`,
    goals:`# Goals\n\n1. Tempo push\n2. Address technical bottleneck\n3. Performance opportunity\n\n#goals`,
  }));

  const existing = JSON.parse(localStorage.getItem('etudes-history')||'[]');
  const merged = [...existing];
  let added = 0;
  for (const e of newDays) {
    if (!merged.find(h=>(h.kind==='day'||!h.kind)&&h.date===e.date)) { merged.push(e); added++; }
  }
  for (const e of newWeeks) {
    if (!merged.find(h=>h.kind==='week'&&h.weekStart===e.weekStart)) merged.push(e);
  }
  for (const e of newMonths) {
    if (!merged.find(h=>h.kind==='month'&&h.month===e.month)) merged.push(e);
  }
  localStorage.setItem('etudes-history', JSON.stringify(merged));
  return added;
}

// ── Seed: 10 recordings for first piece ─────────────────────────────────────
async function seedRecordings() {
  const allItems = JSON.parse(localStorage.getItem('etudes-items')||'[]');
  const piece = allItems.find(i=>i.type==='piece');
  if (!piece) return 0;

  const bpms   = [72,76,80,84,88,76,92,80,88,96];
  const stages = ['learning','learning','learning','polishing','polishing',
                  'polishing','polishing','maintenance','maintenance','maintenance'];
  const freqs  = [261,293,329,349,392,440,494,523,587,659];
  const existingMeta = JSON.parse(localStorage.getItem('etudes-pieceRecordingMeta')||'{}');
  const metaPatch = {};
  for (let i = 0; i < 10; i++) {
    const d = new Date(); d.setDate(d.getDate()-i-1);
    const date = d.toISOString().slice(0,10);
    const dur = 30 + Math.floor(Math.random()*16);
    const blob = makeSineWav(dur, freqs[i]);
    await idbPut('pieceRecordings', `${piece.id}__${date}`, blob);
    const peaks = await computePeaks(blob);
    metaPatch[date] = {peaks, size:blob.size, ts:new Date(date+'T12:00:00').getTime(), bpm:bpms[i], stage:stages[i]};
  }
  const merged = {...existingMeta, [piece.id]: {...(existingMeta[piece.id]||{}), ...metaPatch}};
  localStorage.setItem('etudes-pieceRecordingMeta', JSON.stringify(merged));
  return 10;
}

// ── Seed: 50 free notes ──────────────────────────────────────────────────────
function seedNotes() {
  const rand = a => a[Math.floor(Math.random()*a.length)];
  const categories = ['Practice Journal','Theory Analysis','Masterclass Notes','Audition Prep','Repertoire Research'];
  const tags = ['#intonation','#technique','#phrasing','#memorization','#rhythm','#tone','#practice','#progress','#goals','#masterclass','#performance','#bowwork','#scale','#focused'];
  const bodies = [
    `# Intonation Focus\n\nDrilling descending semitones with a drone. The ${rand(['A♭–G','D♭–C','G♭–F'])} semitone in the middle register is particularly slippery.\n\n## Method\n\nSlow bow near the bridge, tuner displayed. Listening for resonance, not just pitch.\n\n${rand(tags)} ${rand(tags)}`,
    `# Session Notes\n\nFocused session today. Consistent slow practice is paying off — more confidence at tempo.\n\n**Main win:** the passage at m. ${20+Math.floor(Math.random()*60)} that's been troublesome finally felt secure.\n\n${rand(tags)} ${rand(tags)} #progress`,
    `# Phrasing Work\n\nEvery phrase needs a single *destination* note. Currently my phrases feel like journeys without destinations.\n\n## Rule for this week\n\nIdentify the peak note of every phrase before practicing it. Let everything lead to it and depart from it.\n\n${rand(tags)} ${rand(tags)}`,
    `# Technical Focus\n\nEntire session devoted to one problem: bow arm mechanics at the frog.\n\n## Observations\n\n1. Elbow drops on up-bow — compensate with forearm rotation\n2. Contact point drifts toward fingerboard under forte\n3. Tip pressure uneven in long slow bows\n\n${rand(tags)} #bowwork`,
    `# Memory Strategy\n\nApplying **structural mapping** to the new movement:\n\n- Macro: A B A′ Coda\n- Phrase groups: 4-bar units\n- Harmonic waypoints: I, V, vi, modulation\n\nTest: play from any phrase group cold, name the harmonic destination first.\n\n${rand(tags)} #memorization`,
    `# Scale Log\n\n| Scale | BPM | Notes |\n|---|---|---|\n| C major | ${96+Math.floor(Math.random()*40)} | Clean |\n| G minor melodic | ${80+Math.floor(Math.random()*30)} | ↓ scale rough |\n| B♭ major | ${100+Math.floor(Math.random()*30)} | Consistent |\n\n**Focus next week:** G minor descending. Finger crossing 3→1 LH ascending.\n\n${rand(tags)} #scale`,
    `# Masterclass Notes\n\n## Key Points\n\n**On sound:** "You have more bow than you think. Use it."\n\n**On phrasing:** The ritardando should arrive at the downbeat with no bow left — forces the next phrase to begin quietly.\n\n**Specific correction:** Don't stop when you make a mistake in performance. Keep the line moving.\n\n${rand(tags)} #masterclass`,
    `# Repertoire Research\n\nListened to three recordings back-to-back. Observations:\n\n- **Tempo:** ranges from ♩=58 to ♩=72 — huge variance\n- **Pedaling:** all three interpreters change on the melody note, not the bass\n- **Dynamic contrast:** the best recording uses a much wider range than I've been attempting\n\n${rand(tags)} #repertoire`,
    `# Pre-Performance Notes\n\nProgram order confirmed. Run-through tomorrow.\n\n## Things to remember on stage\n\n1. Breathe before the first note — actually breathe\n2. Eye contact with the audience at m. 1 and the coda\n3. If a memory slip happens: keep the musical line, no visible reaction\n\n${rand(tags)} #performance #audition`,
    `# Weekly Review\n\n## What went well\n- Consistent practice — only one rest day\n- Intonation improving on ascending passage\n- New fingering for the shift is working\n\n## What needs work\n- Still rushing after long notes\n- Haven't started the new étude yet\n\n## Goals\n1. Address the coda\n2. Memorise mm. 65–end\n3. Record a full run-through\n\n${rand(tags)} #weeklyreview`,
  ];
  const now = Date.now();
  const existing = JSON.parse(localStorage.getItem('etudes-freeNotes')||'[]');
  const notes = Array.from({length:50}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*90));
    const body = rand(bodies);
    const inlineTags = (body.match(/(?<!\w)#(\w+)/g)||[]).map(t=>t.slice(1));
    return {
      id: `nl-seed-${String(i+1).padStart(3,'0')}-${now.toString(36)}`,
      title: body.split('\n')[0].replace(/^#+\s*/,'').slice(0,60),
      body,
      date: d.toISOString().slice(0,10),
      category: rand(categories),
      tags: [...new Set(inlineTags)],
    };
  });
  const existingCats = JSON.parse(localStorage.getItem('etudes-noteCategories')||'[]');
  const mergedCats = [...new Set([...existingCats, ...categories])];
  localStorage.setItem('etudes-noteCategories', JSON.stringify(mergedCats));
  localStorage.setItem('etudes-freeNotes', JSON.stringify([...existing, ...notes]));
  return notes.length;
}

// ── Seed: 8 routines ──────────────────────────────────────────────────────────
function seedRoutines() {
  const allItems = JSON.parse(localStorage.getItem('etudes-items')||'[]');
  const byType = t => allItems.filter(i=>i.type===t).map(i=>i.id);
  const pick = (arr, n) => [...arr].sort(()=>Math.random()-0.5).slice(0,n);
  const types = ['tech','piece','play','study'];
  const names = [
    'Morning Fundamentals','Deep Work Session','Maintenance Run','Pre-Performance Warmup',
    'Technique Focus','Repertoire Polish','New Material','Sunday Full Practice',
  ];
  const intentions = [
    'Focus on tone quality throughout','Slow practice — no rushing','Intonation priority',
    'Musical shaping, not technical','Record at least one pass','Push tempo today',
  ];
  const rand = a => a[Math.floor(Math.random()*a.length)];
  const now = Date.now();
  const existing = JSON.parse(localStorage.getItem('etudes-routines')||'[]');
  const routines = names.map((name, i) => ({
    id: `r-seed-${String(i+1).padStart(2,'0')}-${now.toString(36)}`,
    name,
    sessions: types
      .filter(() => Math.random() > 0.25)
      .map(type => ({
        type,
        intention: Math.random() < 0.6 ? rand(intentions) : '',
        itemIds: pick(byType(type), Math.min(3, byType(type).length)),
        target: Math.random() < 0.5 ? [15,20,25,30][Math.floor(Math.random()*4)] : null,
        itemTargets: {},
        isWarmup: type === 'tech' && Math.random() < 0.4,
      })),
  }));
  localStorage.setItem('etudes-routines', JSON.stringify([...existing, ...routines]));
  return routines.length;
}

// ── Seed: 5 programs ──────────────────────────────────────────────────────────
function seedPrograms() {
  const allItems = JSON.parse(localStorage.getItem('etudes-items')||'[]');
  const pieces = allItems.filter(i=>i.type==='piece');
  const pick = (arr, n) => [...arr].sort(()=>Math.random()-0.5).slice(0,n);
  const names = [
    'Spring Recital 2026','Audition Program','Studio Class','Informal House Concert','Competition Round 1',
  ];
  const now = Date.now();
  const existing = JSON.parse(localStorage.getItem('etudes-programs')||'[]');
  const d = new Date(); d.setMonth(d.getMonth()+Math.floor(Math.random()*3)+1);
  const programs = names.map((name, i) => ({
    id: `prog-seed-${String(i+1).padStart(2,'0')}-${now.toString(36)}`,
    name,
    performanceDate: d.toISOString().slice(0,10),
    itemIds: pick(pieces, Math.min(3+Math.floor(Math.random()*4), pieces.length)).map(p=>p.id),
    notes: `Notes for ${name}.`,
  }));
  localStorage.setItem('etudes-programs', JSON.stringify([...existing, ...programs]));
  return programs.length;
}

// ── Seed: 10 ref tracks ───────────────────────────────────────────────────────
async function seedRefTracks() {
  const allItems = JSON.parse(localStorage.getItem('etudes-items')||'[]');
  const pieces = allItems.filter(i=>i.type==='piece').slice(0,10);
  if (!pieces.length) return 0;
  const existingMeta = JSON.parse(localStorage.getItem('etudes-refTrackMeta')||'{}');
  const freqs = [261,293,329,349,392,440,494,523,587,659];
  let count = 0;
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const blob = makeSineWav(8, freqs[i % freqs.length]);
    await idbPut('refTracks', piece.id, blob);
    const peaks = await computePeaks(blob);
    existingMeta[piece.id] = {peaks, filename:`ref-${piece.title.slice(0,20).replace(/\s+/g,'-').toLowerCase()}.wav`};
    count++;
  }
  localStorage.setItem('etudes-refTrackMeta', JSON.stringify(existingMeta));
  return count;
}

// ── Seed: 5 YouTube reference URLs ───────────────────────────────────────────
function seedYouTubeLinks() {
  const ytLinks = [
    'https://www.youtube.com/watch?v=GRxofEmo3HA',
    'https://www.youtube.com/watch?v=4Tr0otuiQuU',
    'https://www.youtube.com/watch?v=H1Dvg2MxQn8',
    'https://www.youtube.com/watch?v=GHGXXVE2ZwQ',
    'https://www.youtube.com/watch?v=ho9rZjlsyYY',
  ];
  const allItems = JSON.parse(localStorage.getItem('etudes-items')||'[]');
  const candidates = allItems.filter(i=>i.type==='piece'&&!i.referenceUrl);
  const toUpdate = [...candidates].sort(()=>Math.random()-0.5).slice(0,5);
  const updated = allItems.map(item => {
    const idx = toUpdate.findIndex(x=>x.id===item.id);
    if (idx === -1) return item;
    return {...item, referenceUrl: ytLinks[idx % ytLinks.length]};
  });
  localStorage.setItem('etudes-items', JSON.stringify(updated));
  return toUpdate.length;
}

// ── Clear all etudes data ─────────────────────────────────────────────────────
async function clearAllData() {
  // Wipe all etudes app data
  Object.keys(localStorage)
    .filter(k => k.startsWith('etudes-'))
    .forEach(k => localStorage.removeItem(k));

  // Also wipe any remaining Supabase session keys
  Object.keys(localStorage)
    .filter(k => k.startsWith('sb-'))
    .forEach(k => localStorage.removeItem(k));

  // Drop IndexedDB
  await new Promise((res) => {
    const r = indexedDB.deleteDatabase('etudes');
    r.onsuccess = r.onblocked = () => res();
    r.onerror = () => res();
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DevToolsBar() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Reset busy on every mount/HMR so it never gets stuck
  useEffect(() => { setBusy(false); setStatus(''); }, []);

  // Must be after hooks
  if (!import.meta.env.DEV) return null;

  async function handleSeedAll() {
    if (busy) return;
    console.log('[dev] seed: start');
    setBusy(true);
    setStatus('starting…');
    try {
      console.log('[dev] seed: clearing sb- keys');
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));

      setStatus('seeding repertoire…');
      const pieces = seedRepertoire();
      console.log('[dev] seed: repertoire done', pieces);

      setStatus('seeding history…');
      const days = seedHistory();
      console.log('[dev] seed: history done', days);

      setStatus('seeding notes, routines, programs…');
      const notes = seedNotes();
      const routines = seedRoutines();
      const programs = seedPrograms();
      const ytLinks = seedYouTubeLinks();
      console.log('[dev] seed: notes/routines/programs done', notes, routines, programs, ytLinks);

      setStatus('seeding recordings & ref tracks…');
      const recs = await seedRecordings();
      const refs = await seedRefTracks();
      console.log('[dev] seed: recordings/refs done', recs, refs);

      console.log('[dev] seed: dispatching etudes-dev-seed-complete');
      window.dispatchEvent(new CustomEvent('etudes-dev-seed-complete'));
      setStatus(`✓ ${pieces} pieces · ${days} days · ${notes} notes · ${routines} routines · ${programs} programs · ${refs} refs · ${ytLinks} yt`);
      setBusy(false);
    } catch (e) {
      console.error('[dev] seed error:', e);
      setStatus(`✗ ${e.message || String(e)}`);
      setBusy(false);
    }
  }

  async function handleClearAll() {
    if (busy) return;
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    setConfirmClear(false);
    setBusy(true);
    setStatus('clearing…');
    try {
      await clearAllData();
      setStatus('✓ cleared — reloading…');
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setStatus(`✗ ${e.message}`);
      setBusy(false);
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-10"
      style={{
        height: '30px',
        borderBottom: `1px solid ${LINE}`,
        background: '#1a1108',
        flexShrink: 0,
      }}
    >
      <span
        className="uppercase shrink-0"
        style={{color:'#7a6a40', fontSize:'9px', letterSpacing:'0.3em', fontFamily:mono}}
      >
        dev
      </span>
      <div style={{width:'1px', height:'12px', background:'#3a2e10', flexShrink:0}}/>
      <button
        type="button"
        onClick={handleSeedAll}
        disabled={busy}
        className="uppercase shrink-0"
        style={{
          fontSize:'9px', letterSpacing:'0.22em', fontFamily:mono,
          color: busy ? '#7a6a40' : WARM,
          cursor: busy ? 'not-allowed' : 'pointer',
          padding:'2px 6px',
          border:`1px solid ${busy?'#3a2e10':'#5a4820'}`,
          background: busy ? 'transparent' : 'rgba(180,120,20,0.08)',
        }}
      >
        Seed All
      </button>
      <button
        type="button"
        onClick={handleClearAll}
        disabled={busy}
        className="uppercase shrink-0"
        style={{
          fontSize:'9px', letterSpacing:'0.22em', fontFamily:mono,
          color: busy ? '#7a6a40' : confirmClear ? '#ff6b4a' : '#c0614a',
          cursor: busy ? 'not-allowed' : 'pointer',
          padding:'2px 6px',
          border:`1px solid ${busy?'#3a2e10':confirmClear?'#ff6b4a':'#6a2e20'}`,
          background: confirmClear ? 'rgba(255,107,74,0.15)' : busy ? 'transparent' : 'rgba(192,97,74,0.08)',
        }}
      >
        {confirmClear ? 'Sure?' : 'Clear All'}
      </button>
      {status && (
        <span
          className="truncate"
          style={{color:'#7a6a40', fontSize:'9px', letterSpacing:'0.1em', fontFamily:mono}}
        >
          {status}
        </span>
      )}
    </div>
  );
}
