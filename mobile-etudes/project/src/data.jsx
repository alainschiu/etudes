// Mock data + helpers

const SECTIONS = [
  {
    id: 'technique', label: 'Technique', target: 30,
    items: [
      { id: 't1', title: 'Hanon', subtitle: 'No. 1 – No. 5', target: 6, time: 0 },
    ]
  },
  {
    id: 'pieces', label: 'Pieces', target: 35,
    items: [
      { id: 'p1', title: 'Suite — I. Prélude', subtitle: 'Debussy · Piano', target: 15, time: 4*60, spots: 4, perfDays: 12 },
      { id: 'p2', title: 'Nun komm der Heiden Heiland', subtitle: 'Bach‑Busoni', target: null, time: 51, spots: 1 },
    ]
  },
  {
    id: 'study', label: 'Study', target: 15,
    items: [
      { id: 's1', title: 'Historical Improv', subtitle: 'Modal · 17th c.', target: 30, time: 0 },
    ]
  },
  {
    id: 'play', label: 'Play', target: null,
    items: []
  }
];

const REPERTOIRE_DETAIL = {
  id: 'p1',
  title: 'Suite — I. Prélude',
  composer: 'Claude Debussy',
  instrument: 'Piano',
  stage: 'Polishing',
  added: 'Mar 14',
  performance: { name: 'Recital — May 12', daysAway: 12 },
  totalTime: 18 * 60 + 42, // 18:42
  spots: [
    { id: 'sp1', label: 'mm. 1–8 — opening', target: 5, time: 4*60+12, bookmark: 'Page 1', linked: true },
    { id: 'sp2', label: 'mm. 24–32 — modulation', target: 10, time: 8*60+30, bookmark: 'Page 3' },
    { id: 'sp3', label: 'mm. 56–64 — coda lead-in', target: 6, time: 5*60+0 },
    { id: 'sp4', label: 'mm. 72 — final cadence', target: 3, time: 1*60+0 },
  ],
  bookmarks: [
    { name: 'I. Opening', page: 1 },
    { name: 'II. Modulation', page: 3 },
    { name: 'III. Coda', page: 5 },
  ]
};

// Past sessions for Logs
const LOGS = [
  { date: 'Thu — Apr 23', total: 92, target: 90, reflection: 'Hanon felt steadier. Coda still stiff in the left hand. Tomorrow: slow with metronome 60.', sections: [['Technique', 32], ['Pieces', 41], ['Study', 19]] },
  { date: 'Wed — Apr 22', total: 88, target: 90, reflection: 'A short evening. The Bach surprised me — the inner voices opened up around the third pass.', sections: [['Technique', 28], ['Pieces', 45], ['Study', 15]] },
  { date: 'Tue — Apr 21', total: 95, target: 90, reflection: '', sections: [['Technique', 30], ['Pieces', 50], ['Study', 15]] },
  { date: 'Mon — Apr 20', total: 60, target: 90, reflection: 'Tired. Half session.', sections: [['Technique', 20], ['Pieces', 40]] },
  { date: 'Sun — Apr 19', total: 0, target: 90, reflection: '', sections: [], rest: true },
  { date: 'Sat — Apr 18', total: 110, target: 90, reflection: 'Long Saturday. Ran the Prélude end-to-end three times.', sections: [['Technique', 25], ['Pieces', 70], ['Study', 15]] },
  { date: 'Fri — Apr 17', total: 90, target: 90, reflection: '', sections: [['Technique', 30], ['Pieces', 45], ['Study', 15]] },
];

const NOTES = [
  { id: 'n1', title: 'On voicing the inner line', date: 'Apr 21', body: 'In Bach‑Busoni, the chorale tune is in the soprano but the alto is what carries the harmony forward. Try voicing alto first, then add soprano on top — the texture clears immediately.' },
  { id: 'n2', title: 'Tempo discipline', date: 'Apr 16', body: 'For the Prélude: never start above 60. The hands have to find each other before tempo means anything.' },
  { id: 'n3', title: 'Reading list', date: 'Apr 09', body: 'Schnabel — On Music. Cortot — Rational Principles. Both due back to the library May 1.' },
  { id: 'n4', title: 'Tuning notes', date: 'Mar 31', body: 'Drone in F at 432 helped with the Suite — the tonic settles differently than at 440. Worth experimenting.' },
];

// Format helpers
const fmt = (sec) => {
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
};
const fmtMin = (sec) => `${Math.floor(sec/60)}′`;

Object.assign(window, { SECTIONS, REPERTOIRE_DETAIL, LOGS, NOTES, fmt, fmtMin });
