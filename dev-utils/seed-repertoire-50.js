/**
 * seed-repertoire-50.js
 * Paste into browser DevTools console while Etudes is open.
 * Seeds 50 diversified repertoire pieces into localStorage key `etudes-items`.
 */
(function seedRepertoire50() {
  const STORAGE_KEY = 'etudes-items';
  const TOTAL = 50;
  const REMOVE_OLD_SEEDED = true;
  const ID_PREFIX = 'seed-piece-';

  const composers = [
    { name: 'J.S. Bach', era: 'baroque' },
    { name: 'D. Scarlatti', era: 'baroque' },
    { name: 'G.F. Handel', era: 'baroque' },
    { name: 'W.A. Mozart', era: 'classical' },
    { name: 'L. van Beethoven', era: 'classical' },
    { name: 'F. Schubert', era: 'classical' },
    { name: 'F. Chopin', era: 'romantic' },
    { name: 'R. Schumann', era: 'romantic' },
    { name: 'J. Brahms', era: 'romantic' },
    { name: 'F. Liszt', era: 'romantic' },
    { name: 'C. Debussy', era: 'impressionist' },
    { name: 'M. Ravel', era: 'impressionist' },
    { name: 'S. Prokofiev', era: 'modern' },
    { name: 'B. Bartok', era: 'modern' },
    { name: 'D. Shostakovich', era: 'modern' },
    { name: 'A. Piazzolla', era: 'contemporary' },
    { name: 'P. Glass', era: 'contemporary' },
    { name: 'N. Kapustin', era: 'contemporary' }
  ];

  const forms = [
    'Sonata Movement',
    'Prelude',
    'Etude',
    'Nocturne',
    'Waltz',
    'Impromptu',
    'Intermezzo',
    'Ballade',
    'Rhapsody',
    'Toccata',
    'Fugue',
    'Suite Movement',
    'Character Piece',
    'Mazurka',
    'Polonaise'
  ];

  const keys = ['C major', 'G major', 'D major', 'A major', 'E-flat major', 'B minor', 'F-sharp minor', 'D minor', 'A-flat major', 'E minor'];
  const stages = ['queued', 'learning', 'polishing', 'maintenance'];
  const instruments = ['piano', 'violin', 'cello', 'flute', 'guitar', 'clarinet'];
  const moods = ['lyrical', 'dramatic', 'brilliant', 'intimate', 'stormy', 'meditative', 'dance-like', 'cantabile'];
  const ytRefs = [
    'https://youtu.be/GRxofEmo3HA',
    'https://youtu.be/4Tr0otuiQuU',
    'https://www.youtube.com/watch?v=H1Dvg2MxQn8',
    'https://www.youtube.com/watch?v=GHGXXVE2ZwQ',
    'https://youtu.be/ho9rZjlsyYY'
  ];

  function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function maybe(value, chance) {
    return Math.random() < chance ? value : '';
  }

  function mkId(i) {
    return `${ID_PREFIX}${String(i + 1).padStart(3, '0')}-${Date.now().toString(36)}`;
  }

  function randomPastDate(maxDaysBack) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * maxDaysBack));
    return d.toISOString().slice(0, 10);
  }

  function buildPiece(i) {
    const composer = rand(composers);
    const form = rand(forms);
    const key = rand(keys);
    const instrument = rand(instruments);
    const stage = rand(stages);
    const mood = rand(moods);
    const number = Math.floor(Math.random() * 4) + 1;
    const opus = Math.floor(Math.random() * 90) + 5;
    const itemTitle = `${form} in ${key}`;
    const movement = maybe(`${['I', 'II', 'III'][Math.floor(Math.random() * 3)]}. ${mood[0].toUpperCase() + mood.slice(1)}`, 0.45);
    const collection = maybe(`${form}s`, 0.5);
    const catalog = Math.random() < 0.6 ? `Op. ${opus} No. ${number}` : '';
    const bpmTarget = Math.random() < 0.7 ? 56 + Math.floor(Math.random() * 96) : null;
    const lengthSecs = 90 + Math.floor(Math.random() * 720);
    const refUrl = Math.random() < 0.45 ? rand(ytRefs) : '';

    const tags = [composer.era, form.toLowerCase(), mood, instrument]
      .map((t) => t.replace(/\s+/g, '-'))
      .filter((v, idx, arr) => arr.indexOf(v) === idx);

    return {
      id: mkId(i),
      type: 'piece',
      title: itemTitle,
      tags,
      pdfs: [],
      defaultPdfId: null,
      detail: `${composer.era} style focus; prioritize articulation and phrase pacing.`,
      composer: composer.name,
      author: '',
      arranger: '',
      catalog,
      collection,
      movement,
      stage,
      referenceUrl: refUrl,
      startedDate: randomPastDate(180),
      bpmLog: [],
      bpmTarget,
      todayNote: '',
      instrument,
      spots: [],
      performances: [],
      lengthSecs,
      noteLog: []
    };
  }

  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const cleaned = REMOVE_OLD_SEEDED
    ? current.filter((x) => !(typeof x?.id === 'string' && x.id.startsWith(ID_PREFIX)))
    : current;

  const seeded = Array.from({ length: TOTAL }, (_, i) => buildPiece(i));
  const merged = [...cleaned, ...seeded];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

  console.group('Etudes repertoire seed');
  console.log('previous items:', current.length);
  console.log('removed old seeded:', current.length - cleaned.length);
  console.log('added pieces:', seeded.length);
  console.log('new total:', merged.length);
  console.table(
    seeded.slice(0, 10).map((p) => ({
      title: p.title,
      composer: p.composer,
      era: p.tags[0],
      stage: p.stage,
      instrument: p.instrument
    }))
  );
  console.log('Done. Refresh the app to load newly seeded repertoire.');
  console.groupEnd();
})();
