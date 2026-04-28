/**
 * seed-history.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Paste this entire file into your browser's DevTools console while
 * the Études app is open.
 *
 * Seeds 50 realistic daily practice log entries from Jan 1 2026, with:
 *   • varied minutes (40–120) and warmup times
 *   • 2–4 items per session (drawn from your actual repertoire)
 *   • per-piece session notes
 *   • daily reflections
 *   • weekly reflection entries for every covered week
 *   • monthly reflection entries for Jan, Feb, Mar 2026
 *
 * Does NOT overwrite entries that already exist for a given date.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(() => {

// ── helpers ──────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd  = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const dateStr = (d) => d.toISOString().split('T')[0];
const addDays  = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

// ── load items ───────────────────────────────────────────────────────────────
const raw = localStorage.getItem('etudes-items');
if (!raw) { console.error('❌ etudes-items not found. Open the app first.'); return; }
const allItems = JSON.parse(raw);
if (!allItems.length) { console.error('❌ No items found.'); return; }
console.log('Items found:', allItems.map(i => `[${i.type}] ${i.title}`).join(' | '));

// ── content pools ─────────────────────────────────────────────────────────────
const pieceNotes = [
  'Slow practice through the difficult passage — noticed the left-hand tension releasing by the third run.',
  'Worked with metronome at 60% tempo. Articulation improving but phrase endings still rushed.',
  'Focused on the exposition. Bow distribution in the upper half needs more control — arm weight not transferring cleanly.',
  'Ran through twice in full, then isolated mm. 34–48. The cross-string arpeggios are getting cleaner.',
  'Intonation drill on the descending passage. Using drone on the tonic — ears are adjusting.',
  'Memorisation work. Tested without the score — two memory slips at the recapitulation.',
  'Worked on dynamics: the *pp* subito at m. 52 needs to land more decisively.',
  'Phrase shaping session. Identified three long phrases that need a clearer destination note.',
  'Tempo pushed to 80% — coordination between hands is holding. Ready to push further next session.',
  'Scale warm-up bled into this piece — used the same key to transition. Surprisingly effective.',
  'Marked the score with new fingerings for the shift passages. Will test tomorrow.',
  'Performance-mode run. Stopped only once — progress from last week where I stopped four times.',
  'Worked with a recording of the piece for reference. Surprised by how different the phrasing sounds.',
  'Focused on the coda. Every note feels fine in isolation but the continuity breaks down at tempo.',
  'Bow arm check — elbow leading on the up-bow slurs is helping.',
  'Left-hand independence exercise drawn from this piece. Twenty minutes on just the left hand.',
  'Rhythm variants on the sixteenth-note run. Dotted forward, dotted back — really stabilised it.',
  'Checked intonation on double stops using tuner. The major thirds are slightly wide.',
  'Mental practice session — went through the piece in my head without the instrument for 10 min first.',
  'Spot practice on m. 67–72. The position shift arrives late — need to prepare earlier.',
];

const techNotes = [
  'Scales in thirds, B♭ major. Slow bow with drone. Intonation cleaned up significantly by the end.',
  'Chromatic scale exercise, full range. Focus on evenness of tone across registers.',
  'Hanon No. 1 at MM=80 then 100. Finger independence in the weaker fingers improving.',
  'Long tones: each note held for a full breath. Listening for resonance and core tone.',
  'String crossing exercise with open strings. Elbow level and arm weight the focus.',
  'Thumb position introduction exercise. Discomfort reducing session by session.',
  'Shifting drill: all shifts to 3rd and 5th position from 1st. Using guide fingers.',
  'Spiccato practice off the string — landing point finding itself around the balance point.',
  'Legato bow changes. No accent, no gap — the seam is the goal.',
  'Vibrato speed exercise. Slow oscillation → medium → fast and back. 5 min each.',
];

const playNotes = [
  'Sight-reading: Bach Minuet in G. First pass rough, second pass reasonable.',
  'Free improv session over a drone. Exploring upper register.',
  'Played through the full programme from memory. One memory slip — tolerable.',
  'Run-through for a simulated lesson scenario. Played as if being recorded.',
  'Sight-read a new étude. More difficult than expected — will return to it.',
];

const studyNotes = [
  'Score study: annotated phrase structure and dynamic plan for the first movement.',
  'Listened to three recordings of the piece back-to-back. Took notes on tempo choices.',
  'Transcribed a short passage from a recording — ear training + harmonic analysis.',
  'Read the analytical notes in the Urtext edition. New insights on the development section.',
  'Music theory review: worked through voice-leading exercises from a textbook.',
];

const notesByType = { piece: pieceNotes, tech: techNotes, play: playNotes, study: studyNotes };

const reflections = [
  `# Session Notes\n\nFocused session today. The consistent slow practice is paying off — more confidence at tempo.\n\nMain win: the passage at m. 45 that's been troublesome finally felt secure.\n\n#focused #progress`,
  `# Deep Work Day\n\nDedicated two full sessions today — rare to have that kind of uninterrupted time.\n\n---\n\n**Breakthrough**: found the right bow contact point for the sustained melodic line. The tone opened up immediately.\n\n#deepwork #tone #breakthrough`,
  `# Maintenance Session\n\nNot a breakthrough day but solid maintenance. Kept everything in shape. Sometimes that's what's needed.\n\nWarmup felt particularly good — the new routine (scales → long tones → piece) is clicking.\n\n#maintenance #routine`,
  `# Struggle Day\n\nDifficult session. The intonation was off from the start — probably fatigue from yesterday's long session. Cut the session short rather than reinforce bad habits.\n\nNote: build in a rest day tomorrow.\n\n#honest #fatigue #rest`,
  `# Technical Focus\n\nEntire session devoted to one technical problem: the bow arm collapse on the down-bow at the frog. Slow-motion work with a mirror. By the end, aware of the habit — first step to fixing it.\n\n#technical #awareness #habit`,
  `# Memory Work\n\nTest run without the score. Held together better than expected — only two spots needed checking. The visual memory of the page is fading, replaced by muscular and auditory memory.\n\n#memory #milestone`,
  `# Short but Sharp\n\nOnly 45 minutes today — other commitments. Used the time well: one technical drill, one passage in the piece, one run-through. Quality over quantity.\n\n#shortday #focused`,
  `# Rhythm Drilling\n\nAll the sixteenth-note passages today using rhythm variants. Tedious but effective. The unevenness in the third beat is almost gone.\n\n#rhythm #drilling #patience`,
  `# Good Energy\n\nUnusually high energy today — the practice reflected it. Everything clicked a bit faster. Pushed the tempo on three passages and they held.\n\n#energy #momentum #progress`,
  `# Reflection\n\nMid-week check-in. The week has been consistent — four sessions, varied focus. The piece is coming together slowly but perceptibly.\n\nGoal for the rest of the week: address the coda, which I've been avoiding.\n\n#reflection #honest #goal`,
  `# Intonation Day\n\nAlmost the entire session on intonation. Drone exercises, tuner checks, slow single notes. Tedious but necessary. The sharp tendency on ascending semitones is a physical habit — needs rewiring.\n\n#intonation #focused #technique`,
  `# Productive Morning Session\n\nEarly start. The mind was fresh and the session felt effortless for the first hour. Noted that the best practice happens before noon — something to build around.\n\n#morning #insight #routine`,
  `# Physical Awareness\n\nSpent part of the session just standing and checking posture — feet, hips, spine, shoulders. Noticed I've been collapsing on the right side. Correcting it changed the bow arm mechanics immediately.\n\n#posture #awareness #technique`,
  `# New Piece Introduction\n\nFirst read-through of the new piece. Identified the technical challenges: the thumb position passage in the middle section and the extended left-hand stretches at the climax.\n\n#newpiece #overview #planning`,
  `# Before the Lesson\n\nSession structured around what I'll show next week. Cleaned up the two passages I'm least confident about. The octave run is now reliable — previously it was 50/50.\n\n#lesson #preparation #progress`,
];

// ── weekly reflection pool ────────────────────────────────────────────────────
const weeklyNotes = [
  `# Week in Review\n\n## What went well\n- Consistent daily practice — only two rest days\n- Intonation improving on the ascending passage\n- New fingering for the shift is working\n\n## What needs work\n- Still rushing the coda\n- Haven't started the new étude\n\n#weeklyreview`,
  `# Week ${Math.floor(Math.random()*52)+1} Reflection\n\n## Observations\n\nThis was a week of consolidation rather than breakthroughs. The pieces feel more secure at tempo, but the musical shaping still needs work.\n\n## Surprise\n\nThe technique session on Thursday turned into a 90-minute deep dive into bow mechanics. Unexpected but valuable.\n\n#weeklyreview #consolidation`,
  `# Weekly Check-in\n\nFour sessions this week. Consistent but not groundbreaking. The slow practice approach is boring but it's working — the passages I drilled this week feel genuinely secure.\n\n## Next week focus\n1. Push tempo on main piece to 90%\n2. Sight-reading session (been neglecting this)\n3. Start memorising the second movement\n\n#weeklyreview #goals`,
  `# Week Review\n\n## Progress\n- Main piece: exposition secure, development in progress\n- Technical routine: expanded to include thumb position\n- Memory: held together for a full run-through without score\n\n## Challenges\n- Double stops in third movement still inconsistent\n- Need more rest — fatigue affecting sessions by day 5\n\n#weeklyreview #progress #honest`,
  `# Reflection\n\nStrong week overall. Energy was good, focus was good. Three breakthrough moments:\n1. Found the right fingering for the tricky shift\n2. Tone opened up in the upper register after changing bow contact point\n3. Memory run without score was the cleanest yet\n\n#weeklyreview #progress`,
];

const weeklyGoals = [
  `# Goals for Next Week\n\n1. **Tempo push** — bring main piece to 85% with no stops\n2. **Étude** — daily 15-minute étude session\n3. **Sight-reading** — one new piece per session\n4. **Rest day** — plan it, don't let it happen by default\n\n#goals #planning`,
  `# Next Week\n\n1. Address the coda — stop avoiding it\n2. Memorise mm. 65–96\n3. Record a practice session and listen back\n4. Check in with the tuner more frequently\n\n#goals`,
  `# Week Ahead\n\n- Reduce session length by 10 min — quality over quantity\n- Technical focus on vibrato speed variation\n- Begin the new étude\n- One full performance-mode run on Saturday\n\n#planning #goals`,
];

const monthlyNotesByMonth = {
  '2026-01': `# January Review\n\n## Overview\n\nBack to serious practice after the holiday break. The first two weeks were rough — the instrument felt unfamiliar again. By mid-January the hands and ears were back.\n\n## Highlights\n- Relearned the first movement from memory\n- Established a more consistent warm-up routine\n- Started the new étude (Kreutzer No. 2)\n\n## Challenges\n- Intonation inconsistency — particularly ascending semitones\n- Left-hand fatigue after long sessions — need to address tension\n\n## Going Forward\nFebruary focus: technical development. The foundation is there — now the details.\n\n#monthreview #january`,
  '2026-02': `# February Review\n\n## Overview\n\nA month of detail work. Less glamorous than last month's memory work but necessary. The double-stop intonation has measurably improved.\n\n## Highlights\n- Double-stop thirds: audibly cleaner\n- Bow technique: addressed the arm collapse at the frog\n- Finished memorising the first movement\n\n## Challenges\n- Tempo push has stalled — the passage at m. 67 is a bottleneck\n- Missed three sessions due to illness\n\n#monthreview #february`,
  '2026-03': `# March Review\n\n## Overview\n\nThe best month yet. The combination of consistent daily practice and targeted technical work is compounding.\n\n## Highlights\n- First clean full run-through at 90% tempo\n- Vibrato more consistent across registers\n- Sight-reading sessions introduced: two per week\n\n## Challenges\n- Coda still not performance-ready\n- Need to address the mental game — still stopping when I make a mistake\n\n## April Goals\n1. Coda at tempo\n2. Full performance-mode run-through\n3. Find a performance opportunity\n\n#monthreview #march #momentum`,
};

const monthlyGoals = {
  '2026-01': `# February Goals\n\n1. Double-stop work — targeted drill every session\n2. Bow arm technique — address the collapse at the frog\n3. Finish memorising first movement\n4. Introduce sight-reading sessions (twice weekly)\n\n#goals #february`,
  '2026-02': `# March Goals\n\n1. Tempo: bring main piece to 90% by end of month\n2. Vibrato: expand range and consistency\n3. Sight-reading: two sessions per week minimum\n4. Begin the second movement\n\n#goals #march`,
  '2026-03': `# April Goals\n\n1. Coda at performance tempo\n2. Full run-through in performance mode (with recording)\n3. Address mental errors — practice recovery, not avoidance\n4. Find a performance opportunity or informal playing session\n\n#goals #april`,
};

// ── generate 50 practice dates from Jan 1 2026 ───────────────────────────────
// roughly 4-5 days per week, with realistic patterns (rest after heavy days)
const start = new Date('2026-01-01');
const practiceDays = [];
let cursor = new Date(start);
let consecutiveDays = 0;

while (practiceDays.length < 50) {
  const ds = dateStr(cursor);
  // rest after 4+ consecutive days, or random rest (~25%)
  const forceRest = consecutiveDays >= 4;
  const randomRest = !forceRest && Math.random() < 0.22;
  if (!forceRest && !randomRest) {
    practiceDays.push(ds);
    consecutiveDays++;
  } else {
    consecutiveDays = 0;
  }
  cursor = addDays(cursor, 1);
}

// ── build daily entries ───────────────────────────────────────────────────────
const newDayEntries = practiceDays.map(date => {
  const totalMin = rnd(40, 120);
  const warmupMin = Math.random() < 0.6 ? rnd(8, 20) : 0;
  const practiceMin = totalMin - warmupMin;

  // pick 2–4 items
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  const count = Math.min(rnd(2, 4), shuffled.length);
  const sessionItems = shuffled.slice(0, count);

  // distribute minutes across items
  const itemMins = sessionItems.map((_, i) => {
    if (i === sessionItems.length - 1) return null; // assigned last
    return rnd(8, Math.floor(practiceMin / sessionItems.length) + 5);
  });
  let remaining = practiceMin - itemMins.slice(0, -1).reduce((a, b) => a + b, 0);
  if (remaining < 5) remaining = 5;
  itemMins[itemMins.length - 1] = remaining;

  const items = sessionItems.map((item, i) => ({
    id: item.id,
    minutes: itemMins[i],
    title: item.title || 'Untitled',
    composer: item.composer || '',
    arranger: item.arranger || '',
    catalog: item.catalog || '',
    collection: item.collection || '',
    movement: item.movement || '',
    type: item.type || 'piece',
    note: pick(notesByType[item.type] || pieceNotes),
    spotMinutes: {},
    spotsSnapshot: [],
  }));

  return {
    kind: 'day',
    date,
    minutes: totalMin,
    warmupMinutes: warmupMin,
    items,
    reflection: pick(reflections),
  };
});

// ── build weekly entries ──────────────────────────────────────────────────────
// find all ISO weeks covered by practice days
const weekStarts = new Set();
practiceDays.forEach(ds => {
  const d = new Date(ds);
  const dow = (d.getDay() + 6) % 7; // Mon=0
  const mon = new Date(d);
  mon.setDate(d.getDate() - dow);
  weekStarts.add(dateStr(mon));
});

const newWeekEntries = [...weekStarts].map(ws => {
  const we = dateStr(addDays(new Date(ws), 6));
  return {
    kind: 'week',
    weekStart: ws,
    weekEnd: we,
    notes: pick(weeklyNotes),
    goals: pick(weeklyGoals),
  };
});

// ── build monthly entries ─────────────────────────────────────────────────────
const months = ['2026-01', '2026-02', '2026-03'];
const newMonthEntries = months.map(month => ({
  kind: 'month',
  month,
  notes: monthlyNotesByMonth[month] || '',
  goals: monthlyGoals[month] || '',
}));

// ── merge into existing history ───────────────────────────────────────────────
const existing = JSON.parse(localStorage.getItem('etudes-history') || '[]');

const merged = [...existing];

let addedDays = 0, addedWeeks = 0, addedMonths = 0, skipped = 0;

for (const e of newDayEntries) {
  const idx = merged.findIndex(h => (h.kind === 'day' || !h.kind) && h.date === e.date);
  if (idx >= 0) { skipped++; continue; }
  merged.push(e);
  addedDays++;
}
for (const e of newWeekEntries) {
  const idx = merged.findIndex(h => h.kind === 'week' && h.weekStart === e.weekStart);
  if (idx >= 0) continue;
  merged.push(e);
  addedWeeks++;
}
for (const e of newMonthEntries) {
  const idx = merged.findIndex(h => h.kind === 'month' && h.month === e.month);
  if (idx >= 0) continue;
  merged.push(e);
  addedMonths++;
}

localStorage.setItem('etudes-history', JSON.stringify(merged));

// trigger storage event so app picks up change
window.dispatchEvent(new StorageEvent('storage', {
  key: 'etudes-history',
  newValue: JSON.stringify(merged),
  storageArea: localStorage,
}));

console.log(`
✅ Seed complete
   Daily entries added : ${addedDays}  (${skipped} skipped — already existed)
   Weekly entries added : ${addedWeeks}
   Monthly entries added: ${addedMonths}
   Total history entries: ${merged.length}

Reload the app or navigate to the Logs tab to see the new entries.
`);

})();
