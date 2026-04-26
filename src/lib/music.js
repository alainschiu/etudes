export const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export function noteToFreq(note,octave){const idx=NOTE_NAMES.indexOf(note);if(idx<0)return 440;const semi=(octave*12+idx)-(4*12+9);return 440*Math.pow(2,semi/12);}
export function toRoman(n){if(!Number.isFinite(n)||n<=0)return String(n||0);const map=[['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];let s='';let x=Math.floor(n);for(const [r,v] of map){while(x>=v){s+=r;x-=v;}}return s;}

// Cent offsets from equal temperament, indexed by semitones-from-root (0–11)
// Just intonation (pure harmonic ratios: 1/1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 16/9, 15/8)
const JUST_OFFSETS=[0,11.73,3.91,15.64,-13.69,-1.96,9.78,1.96,13.69,-15.64,-3.91,-11.73];
// ¼-comma Meantone offsets from ET, anchored on C, for the 12 chromatic notes (C C# D Eb E F F# G Ab A Bb B)
const MEANTONE_OFFSETS=[0,-24.4,-6.84,10.26,-13.69,3.42,-20.53,-3.42,6.84,-10.26,13.69,-17.11];

export function getCentOffset(note,root,temperament){
  if(temperament==='equal')return 0;
  const ni=NOTE_NAMES.indexOf(note),ri=NOTE_NAMES.indexOf(root);
  if(ni<0||ri<0)return 0;
  const semis=(ni-ri+12)%12;
  if(temperament==='just')return JUST_OFFSETS[semis];
  if(temperament==='meantone')return MEANTONE_OFFSETS[semis];
  return 0;
}

export function noteToFreqFull(note,octave,pitchRef=440,temperament='equal',root='C'){
  const idx=NOTE_NAMES.indexOf(note);if(idx<0)return pitchRef;
  const semi=(octave*12+idx)-(4*12+9);
  const etFreq=pitchRef*Math.pow(2,semi/12);
  if(temperament==='equal')return etFreq;
  const cents=getCentOffset(note,root,temperament);
  return etFreq*Math.pow(2,cents/1200);
}
