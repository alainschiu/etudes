import React, {useState, useEffect} from 'react';
import {Play, Pause, X, Waves, Zap, Coffee, Mic, Square, MessageSquarePlus, Crosshair, Lock, TrendingUp, Trash2} from 'lucide-react';
import {Waveform} from './shared.jsx';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, serif, sans, mono} from '../constants/theme.js';
import {SECTION_CONFIG} from '../constants/config.js';
import {NOTE_NAMES, noteToFreqFull, getCentOffset} from '../lib/music.js';
import {displayTitle, formatByline, getSpotTime, getParentBucket} from '../lib/items.js';

function MetronomeIcon({size=14}){return(<svg width={size} height={size+2} viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,15 11,15 7,3"/><line x1="7" y1="3" x2="10" y2="9"/><circle cx="7" cy="15" r="1" fill="currentColor" stroke="none"/></svg>);}

function DronePanel({drone,setDrone,toggleDrone,setDroneExpanded}){
  const hz=noteToFreqFull(drone.note,drone.octave,drone.pitchRef||440,drone.temperament||'equal',drone.root||'C').toFixed(1);
  const cents=getCentOffset(drone.note,drone.root||'C',drone.temperament||'equal');
  const centsAbs=Math.abs(cents);
  const centsStr=cents===0?null:`${cents>0?'+':''}${cents.toFixed(1)}¢`;
  const centsColor=centsAbs===0?FAINT:centsAbs>15?'#E07A7A':centsAbs>5?WARM:IKB;
  const pitchOpts=[440,415,432];
  const tempOpts=[{v:'equal',label:'Equal'},{v:'just',label:'Just'},{v:'meantone',label:'Meantone ¼'}];
  const notEqual=(drone.temperament||'equal')!=='equal';
  return (<div className="px-10 py-5" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
    {/* Header row */}
    <div className="flex items-baseline justify-between mb-5">
      <div>
        <div className="uppercase flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}><Waves className="w-3 h-3" strokeWidth={1.25}/> Tuning</div>
        <div className="flex items-baseline gap-3 mt-0.5">
          <h4 className="text-xl" style={{fontFamily:serif,fontStyle:'italic',fontWeight:300}}>{drone.note}<span style={{fontSize:'13px',color:MUTED,marginLeft:'4px'}}>{drone.octave}</span></h4>
          <span className="tabular-nums" style={{fontFamily:mono,color:FAINT,fontSize:'11px'}}>{hz} Hz</span>
          {centsStr&&<span className="tabular-nums" style={{fontFamily:mono,color:centsColor,fontSize:'11px',fontWeight:500}}>{centsStr}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleDrone} className="w-9 h-9 flex items-center justify-center shrink-0" style={{background:drone.running?IKB:'transparent',color:TEXT,border:`1px solid ${drone.running?IKB:LINE_STR}`}}>{drone.running?<Pause className="w-3.5 h-3.5" strokeWidth={1.25} fill="currentColor"/>:<Play className="w-3.5 h-3.5 ml-0.5" strokeWidth={1.25} fill="currentColor"/>}</button>
        <button onClick={()=>setDroneExpanded(false)} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button>
      </div>
    </div>
    {/* Pitch reference */}
    <div className="flex items-center gap-3 flex-wrap mb-3">
      <div className="uppercase shrink-0 w-20" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Pitch</div>
      <div className="flex">{pitchOpts.map(p=>(<button key={p} onClick={()=>setDrone(d=>({...d,pitchRef:p}))} className="tabular-nums font-mono px-3 py-1" style={{border:`1px solid ${(drone.pitchRef||440)===p?IKB:LINE_MED}`,background:(drone.pitchRef||440)===p?IKB_SOFT:'transparent',color:(drone.pitchRef||440)===p?TEXT:MUTED,fontSize:'12px',marginLeft:'-1px'}}>A={p}</button>))}</div>
    </div>
    {/* Temperament */}
    <div className="flex items-center gap-3 flex-wrap mb-3">
      <div className="uppercase shrink-0 w-20" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Temper.</div>
      <div className="flex">{tempOpts.map(t=>(<button key={t.v} onClick={()=>setDrone(d=>({...d,temperament:t.v}))} className="px-3 py-1" style={{border:`1px solid ${(drone.temperament||'equal')===t.v?IKB:LINE_MED}`,background:(drone.temperament||'equal')===t.v?IKB_SOFT:'transparent',color:(drone.temperament||'equal')===t.v?TEXT:MUTED,fontSize:'11px',marginLeft:'-1px',letterSpacing:'0.02em'}}>{t.label}</button>))}</div>
    </div>
    {/* Root (only when not equal) */}
    {notEqual&&<div className="flex items-center gap-3 flex-wrap mb-3">
      <div className="uppercase shrink-0 w-20" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Root</div>
      <div className="flex flex-wrap gap-1">{NOTE_NAMES.map(n=>(<button key={n} onClick={()=>setDrone(d=>({...d,root:n}))} className="tabular-nums" style={{minWidth:'30px',padding:'3px 5px',border:`1px solid ${(drone.root||'C')===n?IKB:LINE_MED}`,background:(drone.root||'C')===n?IKB_SOFT:'transparent',color:(drone.root||'C')===n?TEXT:MUTED,fontFamily:serif,fontSize:'11px',fontWeight:300}}>{n}</button>))}</div>
    </div>}
    {/* Note */}
    <div className="flex items-center gap-3 flex-wrap mb-3">
      <div className="uppercase shrink-0 w-20" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Note</div>
      <div className="flex flex-wrap gap-1">{NOTE_NAMES.map(n=>{const nc=notEqual?getCentOffset(n,drone.root||'C',drone.temperament||'equal'):0;const nca=Math.abs(nc);const nc2=nca>15?'#E07A7A':nca>5?WARM:null;return(<button key={n} onClick={()=>setDrone(d=>({...d,note:n}))} className="tabular-nums relative" style={{minWidth:'34px',padding:'4px 6px',border:`1px solid ${drone.note===n?IKB:LINE_MED}`,background:drone.note===n?IKB_SOFT:'transparent',color:drone.note===n?TEXT:MUTED,fontFamily:serif,fontSize:'12px',fontWeight:300}}>{n}{notEqual&&nc2&&<span style={{position:'absolute',top:'1px',right:'2px',fontSize:'6px',color:nc2,fontFamily:sans,fontWeight:700,lineHeight:1}}>●</span>}</button>);})}</div>
    </div>
    {/* Octave */}
    <div className="flex items-center gap-3 flex-wrap mb-3">
      <div className="uppercase shrink-0 w-20" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Octave</div>
      <div className="flex gap-0">{[3,4,5].map(o=>(<button key={o} onClick={()=>setDrone(d=>({...d,octave:o}))} className="tabular-nums" style={{padding:'4px 14px',border:`1px solid ${drone.octave===o?IKB:LINE_MED}`,background:drone.octave===o?IKB_SOFT:'transparent',color:drone.octave===o?TEXT:MUTED,fontFamily:serif,fontSize:'13px',marginLeft:'-1px'}}>{o}</button>))}</div>
    </div>
    {/* Volume */}
    <div className="flex items-center gap-3">
      <div className="uppercase shrink-0 w-20" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Volume</div>
      <input type="range" min="0" max="0.6" step="0.01" value={drone.volume} onChange={e=>setDrone(d=>({...d,volume:+e.target.value}))} className="flex-1 max-w-xs" style={{accentColor:IKB}}/>
      <span className="tabular-nums text-xs w-10 text-right" style={{fontFamily:mono,color:MUTED,fontWeight:300}}>{Math.round(drone.volume*100)}</span>
    </div>
    {/* Interval reference table when not equal */}
    {notEqual&&<div className="mt-4 pt-4" style={{borderTop:`1px solid ${LINE}`}}>
      <div className="uppercase mb-2" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Offsets from equal · root {drone.root||'C'}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">{NOTE_NAMES.map(n=>{const c=getCentOffset(n,drone.root||'C',drone.temperament||'equal');const ca=Math.abs(c);const cc=ca>15?'#E07A7A':ca>5?WARM:FAINT;const isActive=drone.note===n;return(<span key={n} className="tabular-nums" style={{fontFamily:mono,fontSize:'10px',color:isActive?TEXT:cc,fontWeight:isActive?500:300,minWidth:'60px'}}>{n} {c>=0?'+':''}{c.toFixed(1)}¢</span>);})}</div>
    </div>}
  </div>);
}

function AccelProgress({metronome}){if(!metronome.accel.enabled)return null;const s=metronome.bpm;const tgt=metronome.accel.targetBpm;const r=s>=tgt;const pct=r?100:Math.min(100,((s-60)/Math.max(1,tgt-60))*100);const u=metronome.accel.unit||'bar';return (<div className="mt-3 flex items-center gap-3"><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Accel</span><div className="flex-1 h-px relative" style={{background:LINE_MED}}><div className="absolute inset-y-0 left-0" style={{background:r?WARM:IKB,width:`${pct}%`,height:'1px'}}/></div><span className="tabular-nums shrink-0" style={{color:r?WARM:MUTED,fontSize:'10px'}}>{r?`▲ ${tgt}`:`${s} → ${tgt} · +${metronome.accel.stepBpm}/${metronome.accel.every}${u[0]}`}</span></div>);}

export default function Footer({metronome,setMetronome,metroExpanded,setMetroExpanded,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,currentBeat,currentSub,activeItemId,activeSpotId,activeItem,activeSpot,activeIsWarmup,sectionTimes,totalToday,effectiveTotalToday,warmupTimeToday,restToday,isResting,toggleRest,itemTimes,fmt,fmtMin,stopItem,handleTap,isRecording,startRecording,stopRecording,logTempo,quickNoteOpen,setQuickNoteOpen,addQuickNote,dayClosed,recExpanded,setRecExpanded,recordingMeta,deleteRecording,todayKey}){
  const [quickNoteText,setQuickNoteText]=useState('');
  // noteValue is always a string: '2','4','8','16','d4'
  const noteValOpts=[{v:'2',label:'2'},{v:'4',label:'4'},{v:'8',label:'8'},{v:'16',label:'16'}];
  const subOpt=[{value:1,label:'♩'},{value:2,label:'♫'},{value:3,label:'♩₃'},{value:4,label:'♬'},{value:'dot',label:'♩.'}];
  const canLog=metronome.running&&!!activeItemId;
  const submit=()=>{if(quickNoteText.trim()){addQuickNote(quickNoteText);setQuickNoteText('');}setQuickNoteOpen(false);};
  useEffect(()=>{if(!quickNoteOpen)setQuickNoteText('');},[quickNoteOpen]);
  const activeTitle=activeItem?(formatByline(activeItem)?`${formatByline(activeItem)} — `:'')+displayTitle(activeItem):'';
  const activeTimerSec=activeItemId?(activeSpotId?getSpotTime(itemTimes,activeItemId,activeSpotId):getParentBucket(itemTimes,activeItemId)):0;
  const bpmTip=canLog?(activeSpotId?`Log BPM to spot (L)`:'Log BPM to whole piece (L)'):'';
  const accel=metronome.accel;
  const statusSec=isResting&&!activeItemId?restToday:(activeItemId?activeTimerSec:effectiveTotalToday);
  const statusColor=activeItemId?IKB:(isResting?MUTED:DIM);
  const statusGlow=activeItemId?`0 0 20px ${IKB}40`:'none';
  const statusLabel=activeItem?activeTitle:(isResting?'Resting':(dayClosed?'Day closed':activeItemId?'':(effectiveTotalToday>0?'Today so far':'Not practicing')));
  const nvDisplay=metronome.noteValue;
  const isDotSub=metronome.subdivision==='dot';

  const todayRec=recordingMeta?.[todayKey];

  return (<footer className="shrink-0" style={{borderTop:`1px solid ${LINE_MED}`,background:BG}}>
    {droneExpanded&&<DronePanel drone={drone} setDrone={setDrone} toggleDrone={toggleDrone} setDroneExpanded={setDroneExpanded}/>}
    {recExpanded&&(
      <div className="px-10 py-6" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Recording</div>
            {todayRec&&<div className="font-mono tabular-nums mt-1" style={{color:MUTED,fontSize:'10px'}}>{Math.round((todayRec.size||0)/1024)}k · {todayKey}</div>}
          </div>
          <div className="flex items-center gap-3">
            {todayRec&&<button onClick={()=>deleteRecording(todayKey)} style={{color:FAINT}} title="Delete recording"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.25}/></button>}
            <button onClick={()=>setRecExpanded(false)} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button>
          </div>
        </div>
        {isRecording&&(
          <div className="mb-4 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#A93226'}}/>
            <span className="uppercase" style={{color:'#A93226',fontSize:'9px',letterSpacing:'0.28em'}}>Recording in progress…</span>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-3 py-1.5 ml-2"
              style={{border:`1px solid #A93226`,color:'#A93226',background:'rgba(169,50,38,0.08)',cursor:'pointer'}}
            >
              <Square className="w-3 h-3" strokeWidth={1.25} fill="currentColor"/>
              <span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>Stop</span>
            </button>
          </div>
        )}
        {todayRec
          ? <Waveform key={todayRec.ts} date={todayKey} meta={todayRec} actions={
              !isRecording&&<button
                onClick={startRecording}
                disabled={dayClosed}
                className="flex items-center gap-2 px-3 py-1.5"
                style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',border:`1px solid ${LINE_MED}`,background:'transparent',cursor:dayClosed?'not-allowed':'pointer',color:dayClosed?FAINT:MUTED}}
              >
                <Mic className="w-3.5 h-3.5" strokeWidth={1.25}/>
                <span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>Re-record</span>
              </button>
            }/>
          : !isRecording&&<div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No recording yet today.</div>
        }
      </div>
    )}
    {metroExpanded&&(<div className="px-10 py-6" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
      <div className="flex items-baseline justify-between mb-5"><div><div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Métronome</div><h4 className="text-2xl mt-0.5" style={{fontFamily:serif,fontStyle:'italic',fontWeight:300}}>{metronome.beats}/{isDotSub?'♩.':nvDisplay}</h4></div><button onClick={()=>setMetroExpanded(false)} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button></div>
      <div className="flex items-center gap-8 pb-4 mb-4 flex-wrap" style={{borderBottom:`1px solid ${LINE}`}}>
        <div className="uppercase shrink-0" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Time</div>
        <div className="flex items-center gap-3"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Beats</span><button onClick={()=>setMetronome(m=>({...m,beats:Math.max(1,m.beats-1)}))} className="w-6 h-6 flex items-center justify-center" style={{border:`1px solid ${LINE_MED}`,color:TEXT}}>−</button><div className="tabular-nums text-center" style={{fontFamily:serif,fontWeight:300,fontSize:'22px',minWidth:'24px'}}>{metronome.beats}</div><button onClick={()=>setMetronome(m=>({...m,beats:Math.min(12,m.beats+1)}))} className="w-6 h-6 flex items-center justify-center" style={{border:`1px solid ${LINE_MED}`,color:TEXT}}>+</button></div>
        <div className="flex items-center gap-3"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Note Value</span><div className="flex">{noteValOpts.map(o=>(<button key={o.v} onClick={()=>setMetronome(m=>({...m,noteValue:o.v}))} className="px-3 py-1 tabular-nums" style={{border:`1px solid ${metronome.noteValue===o.v?IKB:LINE_MED}`,background:metronome.noteValue===o.v?IKB_SOFT:'transparent',color:metronome.noteValue===o.v?TEXT:MUTED,fontFamily:serif,fontWeight:300,fontSize:'14px',marginLeft:'-1px'}}>{o.label}</button>))}</div></div>
        <div className="flex items-center gap-3"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Sub</span><div className="flex">{subOpt.map(s=>(<button key={s.value} onClick={()=>setMetronome(m=>({...m,subdivision:s.value}))} className="px-3 py-1" style={{border:`1px solid ${metronome.subdivision===s.value?IKB:LINE_MED}`,background:metronome.subdivision===s.value?IKB_SOFT:'transparent',color:metronome.subdivision===s.value?TEXT:MUTED,fontSize:'14px',fontFamily:serif,marginLeft:'-1px'}}>{s.label}</button>))}</div></div>
      </div>
      <div className="flex items-center gap-8 flex-wrap pb-4 mb-4" style={{borderBottom:`1px solid ${LINE}`}}>
        <div className="uppercase shrink-0" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Feel</div>
        <button onClick={handleTap} className="uppercase px-3 py-1.5 shrink-0" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Tap tempo</button>
        <div className="flex items-center gap-2 shrink-0"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Sound</span><select value={metronome.sound} onChange={e=>setMetronome(m=>({...m,sound:e.target.value}))} className="px-2 py-1 text-xs focus:outline-none" style={{background:'transparent',color:TEXT,border:`1px solid ${LINE_MED}`}}><option value="click" style={{background:SURFACE}}>Click</option><option value="wood" style={{background:SURFACE}}>Wood</option><option value="beep" style={{background:SURFACE}}>Beep</option></select></div>
        <div className="flex-1 flex items-baseline gap-4 overflow-x-auto etudes-scroll min-w-0">{[{bpm:60,name:'Larghetto'},{bpm:72,name:'Adagio'},{bpm:92,name:'Andante'},{bpm:108,name:'Moderato'},{bpm:120,name:'Allegro'},{bpm:144,name:'Vivace'},{bpm:176,name:'Presto'}].map(pr=>(<button key={pr.bpm} onClick={()=>setMetronome(m=>({...m,bpm:pr.bpm}))} className="shrink-0" style={{color:metronome.bpm===pr.bpm?IKB:MUTED,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>{pr.name} <span className="tabular-nums not-italic" style={{fontFamily:mono}}>{pr.bpm}</span></button>))}</div>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="uppercase shrink-0 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}><Zap className="w-3 h-3 not-italic" strokeWidth={1.25}/> Accel</div>
        <button onClick={()=>setMetronome(m=>({...m,accel:{...m.accel,enabled:!m.accel.enabled}}))} className="uppercase px-3 py-1.5 shrink-0" style={{color:accel.enabled?TEXT:MUTED,border:`1px solid ${accel.enabled?IKB:LINE_MED}`,background:accel.enabled?IKB_SOFT:'transparent',fontSize:'10px',letterSpacing:'0.22em'}}>{accel.enabled?'Enabled':'Off'}</button>
        {accel.enabled&&(<>
          <div className="flex items-center gap-2"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Target</span><input type="number" min="40" max="300" value={accel.targetBpm} onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,targetBpm:n}}));}} className="w-14 text-right font-mono tabular-nums focus:outline-none px-1 py-0.5" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontSize:'12px'}}/><span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>bpm</span></div>
          <div className="flex items-center gap-2"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>+</span><input type="number" min="1" max="20" value={accel.stepBpm} onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,stepBpm:n}}));}} className="w-12 text-right font-mono tabular-nums focus:outline-none px-1 py-0.5" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontSize:'12px'}}/><span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>bpm every</span><input type="number" min="1" max="64" value={accel.every} onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,every:n}}));}} className="w-12 text-right font-mono tabular-nums focus:outline-none px-1 py-0.5" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontSize:'12px'}}/>
            <div className="flex"><button onClick={()=>setMetronome(m=>({...m,accel:{...m.accel,unit:'beat'}}))} className="uppercase px-2 py-1" style={{border:`1px solid ${accel.unit==='beat'?IKB:LINE_MED}`,background:accel.unit==='beat'?IKB_SOFT:'transparent',color:accel.unit==='beat'?TEXT:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>beat{accel.every===1?'':'s'}</button><button onClick={()=>setMetronome(m=>({...m,accel:{...m.accel,unit:'bar'}}))} className="uppercase px-2 py-1" style={{border:`1px solid ${accel.unit==='bar'?IKB:LINE_MED}`,background:accel.unit==='bar'?IKB_SOFT:'transparent',color:accel.unit==='bar'?TEXT:MUTED,fontSize:'9px',letterSpacing:'0.22em',marginLeft:'-1px'}}>bar{accel.every===1?'':'s'}</button></div>
          </div>
          <div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'11px'}}>holds at target</div>
        </>)}
      </div>
      {accel.enabled&&<AccelProgress metronome={metronome}/>}
    </div>)}

    {quickNoteOpen&&activeItemId&&(<div className="px-10 py-3 flex items-center gap-3" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}><MessageSquarePlus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.25} style={{color:IKB}}/><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Note {activeSpot&&<span style={{color:IKB,marginLeft:'6px'}}>· {activeSpot.label}</span>}</span><input autoFocus value={quickNoteText} onChange={e=>setQuickNoteText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();else if(e.key==='Escape'){setQuickNoteText('');setQuickNoteOpen(false);}}} onBlur={submit} placeholder="Jot a quick note for this session…" className="flex-1 text-sm focus:outline-none" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_MED}`,fontFamily:serif,fontSize:'14px',paddingBottom:'2px'}}/><span className="uppercase shrink-0" style={{color:DIM,fontSize:'9px',letterSpacing:'0.22em'}}>Enter to save · Esc to cancel</span></div>)}

    <div className="h-16 flex items-stretch px-10 gap-6">
      {/* ── Unified stat grid: 3 cols share label-row + value-row baselines ── */}
      <div className="flex items-stretch flex-1 min-w-0 gap-0" style={{paddingTop:'10px',paddingBottom:'8px'}}>
        {/* Col 1 – Aujourd'hui */}
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',minWidth:'80px',paddingRight:'16px'}}>
          <div className="uppercase flex items-center gap-1" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',lineHeight:1}}>Aujourd'hui{dayClosed&&<Lock className="w-2.5 h-2.5 ml-1" strokeWidth={1.5} style={{color:IKB}}/>}</div>
          <span className="tabular-nums" style={{fontFamily:mono,fontWeight:300,fontSize:'16px',lineHeight:1,fontVariantNumeric:'tabular-nums lining-nums'}}>{fmtMin(effectiveTotalToday)}{warmupTimeToday>0&&<span style={{color:WARM,fontSize:'9px',marginLeft:'4px',lineHeight:1}}>+◔{Math.floor(warmupTimeToday/60)}</span>}</span>
        </div>
        {/* Divider */}
        <div className="w-px self-stretch shrink-0" style={{background:LINE_MED,marginRight:'16px'}}/>
        {/* Col 2 – Section */}
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',minWidth:'64px',paddingRight:'16px'}}>
          <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',lineHeight:1}}>{activeItem?SECTION_CONFIG[activeItem.type].label:'Section'}</div>
          <span className="tabular-nums" style={{fontFamily:mono,fontWeight:300,fontSize:'16px',lineHeight:1,fontVariantNumeric:'tabular-nums lining-nums'}}>{fmtMin(activeItem?sectionTimes[activeItem.type]:0)}</span>
        </div>
        {/* Divider */}
        <div className="w-px self-stretch shrink-0" style={{background:LINE_MED,marginRight:'16px'}}/>
        {/* Col 3 – Status / active timer */}
        <div className="flex-1 min-w-0" style={{display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <div className="uppercase truncate flex items-center gap-1.5" style={{color:activeItem?MUTED:(isResting?MUTED:FAINT),fontSize:'9px',letterSpacing:'0.28em',lineHeight:1}}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${(activeItemId||isResting)?'animate-pulse':''}`} style={{background:activeItemId?IKB:(isResting?MUTED:DIM)}}/>
            {activeIsWarmup&&<span style={{color:WARM,fontSize:'12px',lineHeight:1}}>◔</span>}
            {activeSpot?<span className="truncate italic" style={{fontFamily:serif,fontSize:'10px',letterSpacing:'0.1em'}}>{activeSpot.label}</span>:statusLabel}
          </div>
          <div className="flex items-baseline gap-4">
            <span className="tabular-nums tracking-tight" style={{fontFamily:mono,color:statusColor,fontWeight:300,fontSize:'24px',lineHeight:1,fontVariantNumeric:'tabular-nums lining-nums'}}>{fmt(statusSec)}</span>
            {activeItemId&&!quickNoteOpen&&<button onClick={()=>setQuickNoteOpen(true)} className="uppercase flex items-center gap-1.5 px-2 py-1" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}} title="Quick note (N)"><MessageSquarePlus className="w-3 h-3" strokeWidth={1.25}/> note</button>}
            {activeItemId&&<button onClick={stopItem} className="uppercase px-4 py-1.5" style={{border:`1px solid ${LINE_STR}`,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Stop</button>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button onClick={toggleRest} disabled={dayClosed&&!isResting} className="flex items-center gap-2 px-3 py-1.5" style={{border:`1px solid ${isResting?IKB:'transparent'}`,color:isResting?IKB:((dayClosed&&!isResting)?FAINT:MUTED),background:isResting?IKB_SOFT:'transparent',cursor:(dayClosed&&!isResting)?'not-allowed':'pointer'}}><Coffee className="w-3 h-3" strokeWidth={1.25}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>{isResting?`${Math.floor(restToday/60)}′ rest`:'Rest'}</span></button>
        <button onClick={()=>{if(isRecording){stopRecording();}else{setRecExpanded(true);startRecording();}}} disabled={dayClosed&&!isRecording} className="flex items-center gap-2 px-3 py-1.5" style={{border:`1px solid ${isRecording?IKB:(recExpanded&&todayRec?IKB:'transparent')}`,color:isRecording?IKB:((dayClosed&&!isRecording)?FAINT:MUTED),background:isRecording?IKB_SOFT:(recExpanded&&todayRec?IKB_SOFT:'transparent'),cursor:(dayClosed&&!isRecording)?'not-allowed':'pointer'}}>{isRecording?<><Square className="w-3 h-3" strokeWidth={1.25} fill="currentColor"/><span className="uppercase animate-pulse" style={{fontSize:'10px',letterSpacing:'0.22em'}}>REC</span></>:<><Mic className="w-3 h-3" strokeWidth={1.25}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>Record</span></>}</button>
        {todayRec&&!isRecording&&<button onClick={()=>setRecExpanded(x=>!x)} className="flex items-center gap-1.5 px-2 py-1.5" style={{color:recExpanded?IKB:FAINT,border:`1px solid ${recExpanded?IKB:'transparent'}`}} title="Today's recording"><Mic className="w-2.5 h-2.5" strokeWidth={1.25}/></button>}
        <button onClick={()=>setDroneExpanded(x=>!x)} className="flex items-center gap-2 px-3 py-1.5" style={{border:`1px solid ${drone.running?IKB:'transparent'}`,color:drone.running?IKB:MUTED,background:drone.running?IKB_SOFT:'transparent'}} title="Tuning pitch (D)"><Waves className="w-3 h-3" strokeWidth={1.25}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>{drone.running?`${drone.note}${drone.octave}`:'Tuning'}</span></button>
      </div>

      <div className="flex items-center gap-4 shrink-0 pl-6" style={{borderLeft:`1px solid ${LINE_MED}`}}>
        <button onClick={()=>setMetroExpanded(x=>!x)} className="flex items-baseline gap-2" style={{color:MUTED}}><div className="text-sm tabular-nums" style={{fontFamily:serif,fontStyle:'italic'}}>{metronome.beats}/{isDotSub?'♩.':nvDisplay}</div>{accel.enabled&&<Zap className="w-2.5 h-2.5" strokeWidth={1.5} style={{color:metronome.bpm>=accel.targetBpm?WARM:IKB}}/>}</button>
        <button onClick={()=>setMetronome(m=>({...m,running:!m.running}))} className="w-9 h-9 flex items-center justify-center shrink-0" style={{background:metronome.running?IKB:'transparent',color:TEXT,border:`1px solid ${metronome.running?IKB:LINE_STR}`}}><MetronomeIcon size={14}/></button>
        <div className="flex gap-1.5 items-end" style={{height:'22px'}}>
          {Array.from({length:metronome.beats}).map((_,i)=>(<div key={i} className="flex gap-px items-end" style={{height:'100%'}}>{Array.from({length:isDotSub?1:metronome.subdivision}).map((_,si)=>{const isA=metronome.running&&currentBeat===i&&currentSub===si;const isM=si===0;return <div key={si} style={{alignSelf:'flex-end',height:isA?(i===0&&isM?'22px':isM?'16px':'10px'):(isM?'12px':'6px'),width:isA?'2px':'1px',background:isA?IKB:(isM?DIM:'rgba(244,238,227,0.1)'),transition:'height 75ms, width 75ms'}}/>;})}</div>))}
        </div>
        <div className="flex items-center gap-2 shrink-0"><input type="range" min="40" max="240" value={metronome.bpm} onChange={e=>setMetronome(m=>({...m,bpm:+e.target.value}))} className="w-24" style={{accentColor:IKB}}/><div className="text-sm tabular-nums w-8 text-right" style={{fontFamily:mono,fontWeight:300}}>{metronome.bpm}</div><div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>bpm</div></div>
        {canLog&&(<button onClick={logTempo} className="uppercase flex items-center gap-1 px-2 py-1 shrink-0" style={{color:IKB,border:`1px solid ${IKB}`,fontSize:'9px',letterSpacing:'0.22em',background:IKB_SOFT}} title={bpmTip}><TrendingUp className="w-3 h-3" strokeWidth={1.25}/> {activeSpotId?'log→spot':'log'}</button>)}
      </div>
    </div>
  </footer>);
}
