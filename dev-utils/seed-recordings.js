/**
 * seed-recordings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Paste this entire file into your browser's DevTools console while
 * the Études app is open. It seeds 10 placeholder recordings (30–45 s each)
 * for one piece so you can test the PieceRecordingsPanel and A/B UI.
 *
 * CONFIG ↓
 */
const TARGET_PIECE_INDEX = 0; // 0 = first piece; change index to target another
// ─────────────────────────────────────────────────────────────────────────────

(async () => {

  // ── Diagnostic dump ───────────────────────────────────────────────────────
  console.group('📋 Études localStorage diagnosis');
  const lsKeys = Object.keys(localStorage).filter(k => k.startsWith('etudes-'));
  console.log('keys found:', lsKeys.join(', ') || '(none — app may not be loaded)');
  const rawItems = localStorage.getItem('etudes-items');
  const allItems = rawItems ? JSON.parse(rawItems) : [];
  console.log('total items:', allItems.length);
  console.log('items by type:', allItems.reduce((a, i) => { a[i.type] = (a[i.type]||0)+1; return a; }, {}));
  const existingMeta = JSON.parse(localStorage.getItem('etudes-pieceRecordingMeta') || '{}');
  console.log('existing pieceRecordingMeta keys:', Object.keys(existingMeta));
  console.groupEnd();

  // ── 1. Resolve target piece ──────────────────────────────────────────────
  const pieces = allItems.filter(i => i.type === 'piece');
  if (!pieces.length) {
    console.error('❌ No piece-type items found in etudes-items. Open the app, go to Repertoire, and add at least one piece first.');
    return;
  }
  if (TARGET_PIECE_INDEX >= pieces.length) {
    console.error(`❌ TARGET_PIECE_INDEX=${TARGET_PIECE_INDEX} out of range. Available pieces (0-indexed):`, pieces.map((p,i)=>`[${i}] ${p.title}`));
    return;
  }
  const piece = pieces[TARGET_PIECE_INDEX];
  console.log(`\n🎵 Target: "${piece.title}" (id: ${piece.id})`);
  console.log('   All pieces:', pieces.map((p,i)=>`[${i}] ${p.title}`).join(' | '));

  // ── 2. Build 10 past dates ────────────────────────────────────────────────
  const dates = [];
  for (let i = 1; i <= 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  console.log('dates to seed:', dates.join(', '));

  // ── 3. WAV blob generator ────────────────────────────────────────────────
  function makeSineWav(durationSec, freq) {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buf = new ArrayBuffer(44 + numSamples * 2);
    const v = new DataView(buf);
    const wr = (off, str) => str.split('').forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));
    wr(0, 'RIFF'); v.setUint32(4, 36 + numSamples * 2, true);
    wr(8, 'WAVE'); wr(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    wr(36, 'data'); v.setUint32(40, numSamples * 2, true);
    for (let i = 0; i < numSamples; i++) {
      v.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.3 * 32767), true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  // ── 4. Peak computation (mirrors src/lib/media.js) ───────────────────────
  async function computePeaks(blob, buckets = 120) {
    try {
      const ctx = new AudioContext();
      const audioBuf = await ctx.decodeAudioData(await blob.arrayBuffer());
      const d = audioBuf.getChannelData(0);
      const bs = Math.max(1, Math.floor(d.length / buckets));
      const raw = [];
      for (let i = 0; i < buckets; i++) {
        const s = i * bs; let sum = 0, n = 0;
        for (let j = 0; j < bs && s + j < d.length; j++) { const vv = d[s+j]||0; sum += vv*vv; n++; }
        raw.push(n > 0 ? Math.sqrt(sum / n) : 0);
      }
      let peaks = [...raw];
      for (let pass = 0; pass < 2; pass++) {
        const next = [...peaks];
        for (let i = 1; i < peaks.length - 1; i++)
          next[i] = peaks[i-1]*0.25 + peaks[i]*0.5 + peaks[i+1]*0.25;
        peaks = next;
      }
      const mx = Math.max(...peaks, 1e-6);
      peaks = peaks.map(p => p / mx);
      try { ctx.close(); } catch {}
      return peaks;
    } catch (e) {
      console.warn('  ⚠️  computePeaks failed (waveform display will be empty):', e.message);
      return [];
    }
  }

  // ── 5. IDB helpers — includes onupgradeneeded to handle fresh DB ─────────
  const openDB = () => new Promise((res, rej) => {
    try {
      const r = indexedDB.open('etudes', 3);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('pdfs'))             db.createObjectStore('pdfs');
        if (!db.objectStoreNames.contains('recordings'))       db.createObjectStore('recordings');
        if (!db.objectStoreNames.contains('pieceRecordings'))  db.createObjectStore('pieceRecordings');
        if (!db.objectStoreNames.contains('refTracks'))        db.createObjectStore('refTracks');
      };
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    } catch (e) { rej(e); }
  });

  const idbPut = async (store, key, value) => {
    const db = await openDB();
    return new Promise((res, rej) => {
      try {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => res(true);
        tx.onerror    = () => rej(tx.error);
      } catch (e) { rej(e); }
    });
  };

  const idbGet = async (store, key) => {
    const db = await openDB();
    return new Promise((res) => {
      try {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => res(req.result);
        req.onerror   = () => res(null);
      } catch { res(null); }
    });
  };

  // ── 6. Seed ───────────────────────────────────────────────────────────────
  const bpms   = [72, 76, 80, 84, 88, 76, 92, 80, 88, 96];
  const stages = ['learning','learning','learning','polishing','polishing',
                  'polishing','polishing','maintenance','maintenance','maintenance'];
  const freqs  = [261, 293, 329, 349, 392, 440, 494, 523, 587, 659];

  const metaPatch = {};
  let idbOk = 0, idbFail = 0;

  console.log('\n⏳ Writing 10 recordings…');
  for (let i = 0; i < 10; i++) {
    const date     = dates[i];
    const duration = 30 + Math.floor(Math.random() * 16);
    const blob     = makeSineWav(duration, freqs[i]);
    const idbKey   = `${piece.id}__${date}`;

    // IDB write
    try {
      await idbPut('pieceRecordings', idbKey, blob);
      idbOk++;
    } catch (e) {
      console.error(`  ❌ IDB write failed for ${idbKey}:`, e);
      idbFail++;
    }

    // Peaks (non-fatal if it fails)
    const peaks = await computePeaks(blob, 120);

    metaPatch[date] = {
      peaks,
      size:  blob.size,
      ts:    new Date(date + 'T12:00:00').getTime(),
      bpm:   bpms[i],
      stage: stages[i],
    };
    console.log(`  [${i+1}/10] ${date}  ${duration}s  BPM ${bpms[i]}  stage: ${stages[i]}  idb: ${idbOk>i?'✓':'✗'}`);
  }

  // ── 7. Patch pieceRecordingMeta in localStorage ──────────────────────────
  const merged = { ...existingMeta };
  merged[piece.id] = { ...(merged[piece.id] || {}), ...metaPatch };
  localStorage.setItem('etudes-pieceRecordingMeta', JSON.stringify(merged));
  const verify = JSON.parse(localStorage.getItem('etudes-pieceRecordingMeta') || '{}');
  const savedCount = Object.keys(verify[piece.id] || {}).length;
  console.log(`\n💾 localStorage write: etudes-pieceRecordingMeta now has ${savedCount} date(s) for this piece`);

  // ── 8. IDB read-back verification ────────────────────────────────────────
  console.log('🔍 Verifying pieceRecordings IDB blobs…');
  let verified = 0;
  for (const date of dates) {
    const key  = `${piece.id}__${date}`;
    const blob = await idbGet('pieceRecordings', key);
    if (blob) { verified++; }
    else       { console.warn(`  ⚠️  IDB blob missing for ${key}`); }
  }
  console.log(`   ${verified}/10 blobs confirmed in IndexedDB`);

  // ── 9. Seed one reference track ──────────────────────────────────────────
  console.log('\n⏳ Seeding reference track…');
  const refBlob  = makeSineWav(8, 440); // 8-second A440 tone
  const refPeaks = await computePeaks(refBlob, 120);
  let refOk = false;
  try {
    await idbPut('refTracks', piece.id, refBlob);
    refOk = true;
  } catch (e) {
    console.error('  ❌ refTracks IDB write failed:', e);
  }
  if (refOk) {
    const existingRefMeta = JSON.parse(localStorage.getItem('etudes-refTrackMeta') || '{}');
    existingRefMeta[piece.id] = { peaks: refPeaks, filename: 'seed-reference.wav' };
    localStorage.setItem('etudes-refTrackMeta', JSON.stringify(existingRefMeta));
    console.log(`  ✓ refTracks IDB blob written, etudes-refTrackMeta updated`);
  }

  if (idbFail > 0 || verified < 10 || savedCount < 10 || !refOk) {
    console.error('\n❌ Seed incomplete — see warnings above.');
  } else {
    console.log(`\n✅ All done! Reload the page → Repertoire → expand "${piece.title}" to see 10 recordings + 1 ref track.`);
    console.log('   Test A/B by clicking the A and B buttons on any two rows in the recording list.');
    console.log('   Export a backup (Réglages → Export) — should include pieceRecordings + refTracks blobs.');
  }

})();
