import {useState,useEffect,useRef} from 'react';
import {noteToFreq,noteToFreqFull,getCentOffset} from '../lib/music.js';

export default function useMetronome(){
  const [metronome,setMetronome]=useState({running:false,bpm:92,beats:4,noteValue:'4',subdivision:1,sound:'click',accel:{enabled:false,targetBpm:120,stepBpm:2,every:8,unit:'beat'}});
  const [metroExpanded,setMetroExpanded]=useState(false);
  const [currentBeat,setCurrentBeat]=useState(-1);
  const [currentSub,setCurrentSub]=useState(-1);
  const accelCounterRef=useRef(0);
  const metroWasRunningRef=useRef(false);

  const [drone,setDrone]=useState({running:false,note:'A',octave:4,volume:0.25,pitchRef:440,temperament:'equal',root:'C'});
  const [droneExpanded,setDroneExpanded]=useState(false);
  const droneOscRef=useRef(null);
  const droneGainRef=useRef(null);

  const audioCtxRef=useRef(null);
  const ensureAudio=()=>{if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();return audioCtxRef.current;};
  const playClick=(accent,volume=0.22)=>{try{const ctx=ensureAudio();const osc=ctx.createOscillator(),gain=ctx.createGain();const f=metronome.sound==='wood'?(accent?900:600):metronome.sound==='beep'?(accent?1800:1200):(accent?1500:1000);osc.frequency.value=f;osc.type=metronome.sound==='wood'?'triangle':'sine';gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.06);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.07);}catch{}};

  useEffect(()=>{
    if(!metronome.running){setCurrentBeat(-1);setCurrentSub(-1);metroWasRunningRef.current=false;return;}
    const isDot=metronome.subdivision==='dot';const effectiveSub=isDot?1:metronome.subdivision;const beatMs=isDot?(60000/metronome.bpm)*1.5:60000/metronome.bpm;const subMs=beatMs/effectiveSub;let tc=0;
    const tick=()=>{const bi=Math.floor(tc/effectiveSub)%metronome.beats;const si=tc%effectiveSub;setCurrentBeat(bi);setCurrentSub(si);if(si===0){playClick(bi===0);}else if(effectiveSub>1){playClick(false,0.06);}if(si===0&&tc>0&&metronome.accel.enabled&&metronome.bpm<metronome.accel.targetBpm){const unit=metronome.accel.unit||'bar';const count=unit==='beat'||(unit==='bar'&&bi===0);if(count){accelCounterRef.current+=1;const step=Math.max(1,metronome.accel.every||4);if(accelCounterRef.current>=step){accelCounterRef.current=0;setMetronome(m=>({...m,bpm:Math.min(m.accel.targetBpm,m.bpm+Math.max(1,m.accel.stepBpm||1))}));}}}tc++;};
    const justStarted=!metroWasRunningRef.current;metroWasRunningRef.current=true;
    if(justStarted)tick();
    const id=setInterval(tick,subMs);return()=>clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[metronome.running,metronome.bpm,metronome.beats,metronome.noteValue,metronome.subdivision,metronome.sound,metronome.accel.enabled,metronome.accel.targetBpm,metronome.accel.stepBpm,metronome.accel.every,metronome.accel.unit]);
  useEffect(()=>{accelCounterRef.current=0;},[metronome.accel.enabled,metronome.accel.targetBpm,metronome.accel.unit]);

  useEffect(()=>{
    if(!drone.running){if(droneOscRef.current&&droneGainRef.current&&audioCtxRef.current){const ctx=audioCtxRef.current;const g=droneGainRef.current;const o=droneOscRef.current;try{g.gain.cancelScheduledValues(ctx.currentTime);g.gain.linearRampToValueAtTime(0,ctx.currentTime+0.08);}catch{}setTimeout(()=>{try{o.stop();o.disconnect();g.disconnect();}catch{}},120);droneOscRef.current=null;droneGainRef.current=null;}return;}
    const ctx=ensureAudio();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.value=noteToFreqFull(drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root);gain.gain.value=0;osc.connect(gain);gain.connect(ctx.destination);osc.start();gain.gain.linearRampToValueAtTime(drone.volume,ctx.currentTime+0.08);droneOscRef.current=osc;droneGainRef.current=gain;
    return()=>{try{gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.linearRampToValueAtTime(0,ctx.currentTime+0.08);}catch{}setTimeout(()=>{try{osc.stop();osc.disconnect();gain.disconnect();}catch{}},120);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[drone.running]);
  useEffect(()=>{if(drone.running&&droneOscRef.current&&audioCtxRef.current){try{droneOscRef.current.frequency.setValueAtTime(noteToFreqFull(drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root),audioCtxRef.current.currentTime);}catch{}}},[drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root,drone.running]);
  useEffect(()=>{if(drone.running&&droneGainRef.current&&audioCtxRef.current){try{droneGainRef.current.gain.linearRampToValueAtTime(drone.volume,audioCtxRef.current.currentTime+0.06);}catch{}}},[drone.volume,drone.running]);
  const toggleDrone=()=>setDrone(d=>({...d,running:!d.running}));

  const tapTimesRef=useRef([]);
  const handleTap=()=>{const n=Date.now();tapTimesRef.current=[...tapTimesRef.current.filter(t=>n-t<2000),n];if(tapTimesRef.current.length>=2){const ds=[];for(let i=1;i<tapTimesRef.current.length;i++)ds.push(tapTimesRef.current[i]-tapTimesRef.current[i-1]);const avg=ds.reduce((a,b)=>a+b,0)/ds.length;const bpm=Math.round(60000/avg);if(bpm>=40&&bpm<=240)setMetronome(m=>({...m,bpm}));}};

  return {metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,handleTap,audioCtxRef,ensureAudio};
}
