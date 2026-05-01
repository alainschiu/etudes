import {useState,useEffect,useRef} from 'react';
import {noteToFreqFull} from '../lib/music.js';
import {getCentOffset} from '../lib/music.js';

export default function useMetronome(){
  const [metronome,setMetronome]=useState({running:false,bpm:92,beats:4,noteValue:'4',subdivision:1,sound:'click',clickVolume:0.22,compoundGroup:0,visualMode:'bars',accel:{enabled:false,targetBpm:120,stepBpm:2,every:8,unit:'beat'}});
  const [metroExpanded,setMetroExpanded]=useState(false);
  const [currentBeat,setCurrentBeat]=useState(-1);
  const [currentSub,setCurrentSub]=useState(-1);

  const audioCtxRef=useRef(null);
  const clickVolumeRef=useRef(0.22);
  useEffect(()=>{clickVolumeRef.current=metronome.clickVolume??0.22;},[metronome.clickVolume]);

  const ensureAudio=()=>{
    if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    return audioCtxRef.current;
  };

  // accent: 'strong'|'medium'|'weak'|'sub'
  // time: audioCtx.currentTime at which to fire the click (for look-ahead scheduling)
  const playClick=(accent,time)=>{
    try{
      const ctx=ensureAudio();
      const t=time??ctx.currentTime;
      const base=clickVolumeRef.current;
      const vol=accent==='strong'?base:accent==='medium'?base*0.65:accent==='weak'?base*0.45:base*0.27;
      const isAccent=accent==='strong'||accent==='medium';
      const osc=ctx.createOscillator();const gain=ctx.createGain();
      const f=metronome.sound==='wood'?(isAccent?900:600):metronome.sound==='beep'?(isAccent?1800:1200):(isAccent?1500:1000);
      osc.frequency.value=f;osc.type=metronome.sound==='wood'?'triangle':'sine';
      gain.gain.setValueAtTime(vol,t);
      gain.gain.exponentialRampToValueAtTime(0.001,t+0.06);
      osc.connect(gain);gain.connect(ctx.destination);
      osc.start(t);osc.stop(t+0.07);
    }catch{}
  };

  // ── Look-ahead scheduler state ─────────────────────────────────────────────
  const scheduledBeatsRef=useRef([]);   // [{beat,sub,time}] scheduled but not yet displayed
  const nextBeatTimeRef=useRef(0);      // audioCtx.currentTime for next beat to schedule
  const rafRef=useRef(null);            // RAF id
  const schedTimerRef=useRef(null);     // setTimeout id for scheduler loop
  const metroStateRef=useRef(metronome);
  const bpmRef=useRef(metronome.bpm);
  useEffect(()=>{metroStateRef.current=metronome;bpmRef.current=metronome.bpm;},[metronome]);

  const accelCounterRef=useRef(0);
  const accelAccRef=useRef(0);
  const metroWasRunningRef=useRef(false);

  const [drone,setDrone]=useState({running:false,note:'A',octave:4,volume:0.25,pitchRef:440,temperament:'equal',root:'C'});
  const [droneExpanded,setDroneExpanded]=useState(false);
  const droneOscRef=useRef(null);
  const droneGainRef=useRef(null);

  // ── Metronome start/stop ───────────────────────────────────────────────────
  useEffect(()=>{
    if(!metronome.running){
      setCurrentBeat(-1);setCurrentSub(-1);
      metroWasRunningRef.current=false;
      if(schedTimerRef.current){clearTimeout(schedTimerRef.current);schedTimerRef.current=null;}
      if(rafRef.current){cancelAnimationFrame(rafRef.current);rafRef.current=null;}
      scheduledBeatsRef.current=[];
      return;
    }

    audioCtxRef.current?.resume();

    const ctx=ensureAudio();
    const m=metroStateRef.current;
    const isDot=m.subdivision==='dot';
    const effectiveSub=isDot?1:(typeof m.subdivision==='number'?m.subdivision:1);
    const compound=m.compoundGroup||0;

    let tc=0;
    accelAccRef.current=0;accelCounterRef.current=0;metroWasRunningRef.current=true;
    scheduledBeatsRef.current=[];
    nextBeatTimeRef.current=ctx.currentTime+0.05; // slight delay on start

    const calcSubMs=(bpm)=>{
      const beatMs=isDot?(60000/bpm)*1.5:60000/bpm;
      return compound>1?beatMs/compound/effectiveSub:beatMs/effectiveSub;
    };
    const calcSubSec=(bpm)=>calcSubMs(bpm)/1000;

    const schedule=()=>{
      const ctx2=audioCtxRef.current;if(!ctx2)return;
      const m2=metroStateRef.current;
      const lookahead=0.25; // seconds
      while(nextBeatTimeRef.current<ctx2.currentTime+lookahead){
        const bi=Math.floor(tc/effectiveSub)%m2.beats;
        const si=tc%effectiveSub;
        const t=nextBeatTimeRef.current;
        // Schedule audio
        if(si===0){const accent=bi===0?'strong':(compound>1&&bi%compound===0)?'medium':'weak';playClick(accent,t);}
        else if(effectiveSub>1){playClick('sub',t);}
        // Push visual marker
        scheduledBeatsRef.current.push({beat:bi,sub:si,time:t});
        // Accel
        if(si===0&&m2.accel.enabled&&bpmRef.current<m2.accel.targetBpm){
          const unit=m2.accel.unit||'bar';
          const beatsPerInterval=unit==='bar'?(m2.beats*(m2.accel.every||1)):(m2.accel.every||1);
          const rate=(m2.accel.stepBpm||1)/beatsPerInterval;
          accelAccRef.current+=rate;
          if(accelAccRef.current>=1){
            const inc=Math.floor(accelAccRef.current);
            accelAccRef.current-=inc;
            const nb=Math.min(m2.accel.targetBpm,bpmRef.current+inc);
            bpmRef.current=nb;
            setMetronome(prev=>({...prev,bpm:nb}));
          }
        }
        nextBeatTimeRef.current+=calcSubSec(bpmRef.current);
        tc++;
      }
      schedTimerRef.current=setTimeout(schedule,25);
    };
    schedule();

    // RAF visual update
    const drawFrame=()=>{
      const ctx3=audioCtxRef.current;if(!ctx3)return;
      const now=ctx3.currentTime;
      const arr=scheduledBeatsRef.current;
      // find the latest entry whose time <= now
      let idx=-1;
      for(let i=0;i<arr.length;i++){if(arr[i].time<=now)idx=i;else break;}
      if(idx>=0){
        const entry=arr[idx];
        setCurrentBeat(entry.beat);
        setCurrentSub(entry.sub);
        scheduledBeatsRef.current=arr.slice(idx+1);
      }
      rafRef.current=requestAnimationFrame(drawFrame);
    };
    rafRef.current=requestAnimationFrame(drawFrame);

    return()=>{
      if(schedTimerRef.current){clearTimeout(schedTimerRef.current);schedTimerRef.current=null;}
      if(rafRef.current){cancelAnimationFrame(rafRef.current);rafRef.current=null;}
      scheduledBeatsRef.current=[];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[metronome.running,metronome.beats,metronome.noteValue,metronome.subdivision,metronome.sound,metronome.compoundGroup,metronome.accel.enabled,metronome.accel.targetBpm,metronome.accel.stepBpm,metronome.accel.every,metronome.accel.unit]);
  useEffect(()=>{accelAccRef.current=0;accelCounterRef.current=0;},[metronome.accel.enabled,metronome.accel.targetBpm,metronome.accel.unit]);

  // ── Drone ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!drone.running){
      if(droneOscRef.current&&droneGainRef.current&&audioCtxRef.current){
        const ctx=audioCtxRef.current;const g=droneGainRef.current;const o=droneOscRef.current;
        try{g.gain.cancelScheduledValues(ctx.currentTime);g.gain.setValueAtTime(g.gain.value,ctx.currentTime);g.gain.linearRampToValueAtTime(0,ctx.currentTime+0.06);}catch{}
        setTimeout(()=>{try{o.stop();o.disconnect();g.disconnect();}catch{}},100);
        droneOscRef.current=null;droneGainRef.current=null;
      }
      return;
    }
    const ctx=ensureAudio();
    const osc=ctx.createOscillator();const gain=ctx.createGain();
    osc.type='sine';
    osc.frequency.value=noteToFreqFull(drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root);
    gain.gain.setValueAtTime(0,ctx.currentTime);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(drone.volume,ctx.currentTime+0.06);
    droneOscRef.current=osc;droneGainRef.current=gain;
    return()=>{
      try{gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setValueAtTime(gain.gain.value,ctx.currentTime);gain.gain.linearRampToValueAtTime(0,ctx.currentTime+0.06);}catch{}
      setTimeout(()=>{try{osc.stop();osc.disconnect();gain.disconnect();}catch{}},100);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[drone.running]);

  useEffect(()=>{
    if(drone.running&&droneOscRef.current&&audioCtxRef.current){
      try{
        const ctx=audioCtxRef.current;
        const newFreq=noteToFreqFull(drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root);
        droneOscRef.current.frequency.setValueAtTime(droneOscRef.current.frequency.value,ctx.currentTime);
        droneOscRef.current.frequency.exponentialRampToValueAtTime(Math.max(newFreq,0.01),ctx.currentTime+0.03);
      }catch{}
    }
  },[drone.note,drone.octave,drone.pitchRef,drone.temperament,drone.root,drone.running]);

  useEffect(()=>{
    if(drone.running&&droneGainRef.current&&audioCtxRef.current){
      try{droneGainRef.current.gain.linearRampToValueAtTime(drone.volume,audioCtxRef.current.currentTime+0.06);}catch{}
    }
  },[drone.volume,drone.running]);

  const toggleDrone=()=>{audioCtxRef.current?.resume();setDrone(d=>({...d,running:!d.running}));};

  // ── Tap tempo ─────────────────────────────────────────────────────────────
  const tapTimesRef=useRef([]);
  const handleTap=()=>{
    const n=Date.now();
    tapTimesRef.current=[...tapTimesRef.current.filter(t=>n-t<2000),n];
    if(tapTimesRef.current.length>=2){
      const ds=[];for(let i=1;i<tapTimesRef.current.length;i++)ds.push(tapTimesRef.current[i]-tapTimesRef.current[i-1]);
      const avg=ds.reduce((a,b)=>a+b,0)/ds.length;
      const bpm=Math.round(60000/avg);
      if(bpm>=40&&bpm<=240)setMetronome(m=>({...m,bpm}));
    }
  };

  return {metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,handleTap,audioCtxRef,ensureAudio};
}
