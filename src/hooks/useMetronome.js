import {useState,useEffect,useRef} from 'react';
import {noteToFreq,noteToFreqFull,getCentOffset} from '../lib/music.js';

export default function useMetronome(){
  const [metronome,setMetronome]=useState({running:false,bpm:92,beats:4,noteValue:'4',subdivision:1,sound:'click',clickVolume:0.22,compoundGroup:0,accel:{enabled:false,targetBpm:120,stepBpm:2,every:8,unit:'beat'}});
  const [metroExpanded,setMetroExpanded]=useState(false);
  const [currentBeat,setCurrentBeat]=useState(-1);
  const [currentSub,setCurrentSub]=useState(-1);
  const accelCounterRef=useRef(0);
  const accelAccRef=useRef(0);
  const metroWasRunningRef=useRef(false);
  const bpmRef=useRef(metronome.bpm);
  const timerRef=useRef(null);
  useEffect(()=>{bpmRef.current=metronome.bpm;},[metronome.bpm]);

  const [drone,setDrone]=useState({running:false,note:'A',octave:4,volume:0.25,pitchRef:440,temperament:'equal',root:'C'});
  const [droneExpanded,setDroneExpanded]=useState(false);
  const droneOscRef=useRef(null);
  const droneGainRef=useRef(null);

  const audioCtxRef=useRef(null);
  const clickVolumeRef=useRef(0.22);
  useEffect(()=>{clickVolumeRef.current=metronome.clickVolume??0.22;},[metronome.clickVolume]);
  const ensureAudio=()=>{if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();return audioCtxRef.current;};
  // accent: 'strong'|'medium'|'weak'|'sub'
  const playClick=(accent)=>{try{const base=clickVolumeRef.current;const vol=accent==='strong'?base:accent==='medium'?base*0.65:accent==='weak'?base*0.45:base*0.27;const isAccent=accent==='strong'||accent==='medium';const ctx=ensureAudio();const osc=ctx.createOscillator(),gain=ctx.createGain();const f=metronome.sound==='wood'?(isAccent?900:600):metronome.sound==='beep'?(isAccent?1800:1200):(isAccent?1500:1000);osc.frequency.value=f;osc.type=metronome.sound==='wood'?'triangle':'sine';gain.gain.setValueAtTime(vol,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.06);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.07);}catch{}};

  useEffect(()=>{
    if(!metronome.running){
      setCurrentBeat(-1);setCurrentSub(-1);metroWasRunningRef.current=false;
      if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}
      return;
    }
    const isDot=metronome.subdivision==='dot';
    const effectiveSub=isDot?1:metronome.subdivision;
    let tc=0;accelAccRef.current=0;accelCounterRef.current=0;metroWasRunningRef.current=true;
    const compound=metronome.compoundGroup||0;
    // In compound time, BPM refers to the dotted beat; each click = beatMs / compoundGroup
    const calcSubMs=(bpm)=>{const beatMs=isDot?(60000/bpm)*1.5:60000/bpm;return compound>1?beatMs/compound/effectiveSub:beatMs/effectiveSub;};
    const tick=()=>{
      const bpm=bpmRef.current;
      const bi=Math.floor(tc/effectiveSub)%metronome.beats;
      const si=tc%effectiveSub;
      setCurrentBeat(bi);setCurrentSub(si);
      if(si===0){const accent=bi===0?'strong':(compound>1&&bi%compound===0)?'medium':'weak';playClick(accent);}else if(effectiveSub>1){playClick('sub');}
      // Gradual accel: distribute stepBpm across beats within the interval
      if(si===0&&metronome.accel.enabled&&bpmRef.current<metronome.accel.targetBpm){
        const unit=metronome.accel.unit||'bar';
        const beatsPerInterval=unit==='bar'?(metronome.beats*(metronome.accel.every||1)):(metronome.accel.every||1);
        const rate=(metronome.accel.stepBpm||1)/beatsPerInterval;
        accelAccRef.current+=rate;
        if(accelAccRef.current>=1){
          const inc=Math.floor(accelAccRef.current);
          accelAccRef.current-=inc;
          const nb=Math.min(metronome.accel.targetBpm,bpmRef.current+inc);
          bpmRef.current=nb;
          setMetronome(m=>({...m,bpm:nb}));
        }
      }
      tc++;
      timerRef.current=setTimeout(tick,calcSubMs(bpmRef.current));
    };
    tick();
    return()=>{if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[metronome.running,metronome.beats,metronome.noteValue,metronome.subdivision,metronome.sound,metronome.compoundGroup,metronome.accel.enabled,metronome.accel.targetBpm,metronome.accel.stepBpm,metronome.accel.every,metronome.accel.unit]);
  useEffect(()=>{accelAccRef.current=0;accelCounterRef.current=0;},[metronome.accel.enabled,metronome.accel.targetBpm,metronome.accel.unit]);

  useEffect(()=>{
    if(!drone.running){if(droneOscRef.current&&droneGainRef.current&&audioCtxRef.current){const ctx=audioCtxRef.current;const g=droneGainRef.current;const o=droneOscRef.current;try{g.gain.cancelScheduledValues(ctx.currentTime);g.gain.setValueAtTime(g.gain.value,ctx.currentTime);g.gain.linearRampToValueAtTime(0,ctx.currentTime+0.06);}catch{}setTimeout(()=>{try{o.stop();o.disconnect();g.disconnect();}catch{}},100);droneOscRef.current=null;droneGainRef.current=null;}return;}
    const ctx=ensureAudio();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.value=noteToFreqFull(drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root);gain.gain.setValueAtTime(0,ctx.currentTime);osc.connect(gain);gain.connect(ctx.destination);osc.start();gain.gain.linearRampToValueAtTime(drone.volume,ctx.currentTime+0.06);droneOscRef.current=osc;droneGainRef.current=gain;
    return()=>{try{gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setValueAtTime(gain.gain.value,ctx.currentTime);gain.gain.linearRampToValueAtTime(0,ctx.currentTime+0.06);}catch{}setTimeout(()=>{try{osc.stop();osc.disconnect();gain.disconnect();}catch{}},100);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[drone.running]);
  useEffect(()=>{if(drone.running&&droneOscRef.current&&audioCtxRef.current){try{droneOscRef.current.frequency.setValueAtTime(noteToFreqFull(drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root),audioCtxRef.current.currentTime);}catch{}}},[drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root,drone.running]);
  useEffect(()=>{if(drone.running&&droneGainRef.current&&audioCtxRef.current){try{droneGainRef.current.gain.linearRampToValueAtTime(drone.volume,audioCtxRef.current.currentTime+0.06);}catch{}}},[drone.volume,drone.running]);
  const toggleDrone=()=>setDrone(d=>({...d,running:!d.running}));

  const tapTimesRef=useRef([]);
  const handleTap=()=>{const n=Date.now();tapTimesRef.current=[...tapTimesRef.current.filter(t=>n-t<2000),n];if(tapTimesRef.current.length>=2){const ds=[];for(let i=1;i<tapTimesRef.current.length;i++)ds.push(tapTimesRef.current[i]-tapTimesRef.current[i-1]);const avg=ds.reduce((a,b)=>a+b,0)/ds.length;const bpm=Math.round(60000/avg);if(bpm>=40&&bpm<=240)setMetronome(m=>({...m,bpm}));}};

  return {metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,handleTap,audioCtxRef,ensureAudio};
}
