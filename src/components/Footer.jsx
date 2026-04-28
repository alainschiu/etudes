import React, {useState, useEffect, useRef, useMemo} from 'react';
import DevToolsBar from '../dev/DevToolsBar.jsx';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import X from 'lucide-react/dist/esm/icons/x';
import Waves from 'lucide-react/dist/esm/icons/waves';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Coffee from 'lucide-react/dist/esm/icons/coffee';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Square from 'lucide-react/dist/esm/icons/square';
import MessageSquarePlus from 'lucide-react/dist/esm/icons/message-square-plus';
import Crosshair from 'lucide-react/dist/esm/icons/crosshair';
import Lock from 'lucide-react/dist/esm/icons/lock';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import {Waveform,Tooltip} from './shared.jsx';
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
  // Piano keyboard data
  const whites=['C','D','E','F','G','A','B'];
  const blacks=[{wi:1,n:'C#'},{wi:2,n:'D#'},{wi:4,n:'F#'},{wi:5,n:'G#'},{wi:6,n:'A#'}];
  const W=100/7; // % width per white key
  const BW=W*0.62; // black key width %
  return (<div className="px-10 py-4" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
    {/* Header row */}
    <div className="flex items-baseline justify-between mb-4">
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
    {/* TU3: Vol / Pitch / Temperament / Octave on one line */}
    <div className="flex items-center gap-4 flex-wrap mb-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}>
      <button onClick={toggleDrone} className="w-7 h-7 flex items-center justify-center shrink-0" style={{background:drone.running?IKB:'transparent',color:TEXT,border:`1px solid ${drone.running?IKB:LINE_STR}`}}>{drone.running?<Pause className="w-3 h-3" strokeWidth={1.25} fill="currentColor"/>:<Play className="w-3 h-3 ml-px" strokeWidth={1.25} fill="currentColor"/>}</button>
      <span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Vol.</span>
      <input type="range" min="0" max="0.6" step="0.01" value={drone.volume} onChange={e=>setDrone(d=>({...d,volume:+e.target.value}))} className="w-20 shrink-0" style={{accentColor:IKB}}/>
      <span className="tabular-nums shrink-0" style={{fontFamily:mono,color:MUTED,fontSize:'10px',fontWeight:300,minWidth:'24px'}}>{Math.round(drone.volume*100)}</span>
      <div style={{width:'1px',height:'14px',background:LINE_MED,flexShrink:0}}/>
      <span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>A=</span>
      <div className="flex">{pitchOpts.map(p=>(<button key={p} onClick={()=>setDrone(d=>({...d,pitchRef:p}))} className="tabular-nums font-mono px-2.5 py-1" style={{border:`1px solid ${(drone.pitchRef||440)===p?IKB:LINE_MED}`,background:(drone.pitchRef||440)===p?IKB_SOFT:'transparent',color:(drone.pitchRef||440)===p?TEXT:MUTED,fontSize:'11px',marginLeft:'-1px'}}>{p}</button>))}</div>
      <div style={{width:'1px',height:'14px',background:LINE_MED,flexShrink:0}}/>
      <span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Temper.</span>
      <div className="flex">{tempOpts.map(t=>(<button key={t.v} onClick={()=>setDrone(d=>({...d,temperament:t.v}))} className="px-2.5 py-1" style={{border:`1px solid ${(drone.temperament||'equal')===t.v?IKB:LINE_MED}`,background:(drone.temperament||'equal')===t.v?IKB_SOFT:'transparent',color:(drone.temperament||'equal')===t.v?TEXT:MUTED,fontSize:'11px',marginLeft:'-1px',letterSpacing:'0.02em'}}>{t.label}</button>))}</div>
      <div style={{width:'1px',height:'14px',background:LINE_MED,flexShrink:0}}/>
      <span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Oct.</span>
      <div className="flex">{[3,4,5].map(o=>(<button key={o} onClick={()=>setDrone(d=>({...d,octave:o}))} className="tabular-nums px-3 py-1" style={{border:`1px solid ${drone.octave===o?IKB:LINE_MED}`,background:drone.octave===o?IKB_SOFT:'transparent',color:drone.octave===o?TEXT:MUTED,fontFamily:serif,fontSize:'13px',marginLeft:'-1px'}}>{o}</button>))}</div>
    </div>
    {/* Root (only when not equal) */}
    {notEqual&&<div className="flex items-center gap-3 flex-wrap mb-3">
      <span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Root</span>
      <div className="flex flex-wrap gap-1">{NOTE_NAMES.map(n=>(<button key={n} onClick={()=>setDrone(d=>({...d,root:n}))} className="tabular-nums" style={{minWidth:'30px',padding:'3px 5px',border:`1px solid ${(drone.root||'C')===n?IKB:LINE_MED}`,background:(drone.root||'C')===n?IKB_SOFT:'transparent',color:(drone.root||'C')===n?TEXT:MUTED,fontFamily:serif,fontSize:'11px',fontWeight:300}}>{n}</button>))}</div>
    </div>}
    {/* TU4: Piano keyboard layout */}
    <div className="mb-3">
      <div className="uppercase mb-2" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Note</div>
      <div style={{position:'relative',height:'52px',maxWidth:'320px',userSelect:'none'}}>
        {whites.map((n,i)=>{const isActive=drone.note===n;const nc=notEqual?getCentOffset(n,drone.root||'C',drone.temperament||'equal'):0;const nca=Math.abs(nc);const nc2=nca>15?'#E07A7A':nca>5?WARM:null;return(<div key={n} onClick={()=>setDrone(d=>({...d,note:n}))} style={{position:'absolute',left:`${i*W}%`,width:`${W}%`,top:0,bottom:0,background:isActive?IKB:'#D4CEC4',border:`1px solid rgba(26,25,21,0.28)`,zIndex:1,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',paddingBottom:'4px'}}>{notEqual&&nc2&&<span style={{position:'absolute',top:'3px',fontSize:'5px',color:nc2,lineHeight:1}}>●</span>}<span style={{fontSize:'9px',color:isActive?'#fff':'#1A1915',fontFamily:serif}}>{n}</span></div>);})}
        {blacks.map(({wi,n})=>{const isActive=drone.note===n;const nc=notEqual?getCentOffset(n,drone.root||'C',drone.temperament||'equal'):0;const nca=Math.abs(nc);const nc2=nca>15?'#E07A7A':nca>5?WARM:null;const left=wi*W-BW/2;return(<div key={n} onClick={()=>setDrone(d=>({...d,note:n}))} style={{position:'absolute',left:`${left}%`,width:`${BW}%`,top:0,height:'62%',background:isActive?IKB:'#1A1915',border:`1px solid #0A0A08`,zIndex:2,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',paddingBottom:'2px'}}>{notEqual&&nc2&&<span style={{position:'absolute',top:'2px',fontSize:'4px',color:nc2,lineHeight:1}}>●</span>}<span style={{fontSize:'7px',color:isActive?'#fff':'rgba(212,206,196,0.55)',fontFamily:serif}}>{n.replace('#','♯')}</span></div>);})}
      </div>
    </div>
    {/* Interval reference table when not equal */}
    {notEqual&&<div className="mt-4 pt-4" style={{borderTop:`1px solid ${LINE}`}}>
      <div className="uppercase mb-2" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Offsets from equal · root {drone.root||'C'}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">{NOTE_NAMES.map(n=>{const c=getCentOffset(n,drone.root||'C',drone.temperament||'equal');const ca=Math.abs(c);const cc=ca>15?'#E07A7A':ca>5?WARM:FAINT;const isActive=drone.note===n;return(<span key={n} className="tabular-nums" style={{fontFamily:mono,fontSize:'10px',color:isActive?TEXT:cc,fontWeight:isActive?500:300,minWidth:'60px'}}>{n} {c>=0?'+':''}{c.toFixed(1)}¢</span>);})}</div>
    </div>}
  </div>);
}

function AccelProgress({metronome}){if(!metronome.accel.enabled)return null;const s=metronome.bpm;const tgt=metronome.accel.targetBpm;const r=s>=tgt;const pct=r?100:Math.min(100,((s-60)/Math.max(1,tgt-60))*100);const u=metronome.accel.unit||'bar';return (<div className="mt-3 flex items-center gap-3"><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Accel</span><div className="flex-1 h-px relative" style={{background:LINE_MED}}><div className="absolute inset-y-0 left-0" style={{background:r?WARM:IKB,width:`${pct}%`,height:'1px'}}/></div><span className="tabular-nums shrink-0" style={{color:r?WARM:MUTED,fontSize:'10px'}}>{r?`▲ ${tgt}`:`${s} → ${tgt} · +${metronome.accel.stepBpm}/${metronome.accel.every}${u[0]}`}</span></div>);}

export default function Footer({metronome,setMetronome,metroExpanded,setMetroExpanded,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,currentBeat,currentSub,activeItemId,activeSpotId,activeItem,activeSpot,activeIsWarmup,sectionTimes,totalToday,effectiveTotalToday,warmupTimeToday,restToday,isResting,toggleRest,itemTimes,fmt,fmtMin,stopItem,handleTap,isRecording,startRecording,stopRecording,logTempo,quickNoteOpen,setQuickNoteOpen,addQuickNote,dayClosed,recExpanded,setRecExpanded,recordingMeta,deleteRecording,todayKey,startPieceRecording,stopPieceRecording,pieceRecordingItemId,pieceRecordingMeta,attachDailyToPiece,todaySessions,items}){
  const [quickNoteText,setQuickNoteText]=useState('');
  const [attachTarget,setAttachTarget]=useState('');
  // Recording elapsed timer (covers both daily and piece recording)
  const [recElapsed,setRecElapsed]=useState(0);
  useEffect(()=>{if(!isRecording&&!pieceRecordingItemId){setRecElapsed(0);return;}const start=Date.now();const id=setInterval(()=>setRecElapsed(Math.floor((Date.now()-start)/1000)),500);return()=>clearInterval(id);},[isRecording,pieceRecordingItemId]);
  const fmtRec=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  // Smart record helpers
  const isActivePieceRec=!!pieceRecordingItemId&&pieceRecordingItemId===activeItemId;
  const anyRecording=isRecording||!!pieceRecordingItemId;
  const handleRecordClick=()=>{
    if(isActivePieceRec){stopPieceRecording&&stopPieceRecording();}
    else if(isRecording){stopRecording();}
    else if(activeItemId&&!dayClosed&&startPieceRecording){startPieceRecording(activeItemId,metronome.bpm,activeItem?.stage);}
    else if(!dayClosed){setRecExpanded(true);startRecording();}
  };
  // Pieces available in current routine for attaching
  const routinePieceItems=useMemo(()=>{const seen=new Set();const result=[];(todaySessions||[]).forEach(s=>{(s.itemIds||[]).forEach(id=>{if(!seen.has(id)){const item=(items||[]).find(i=>i.id===id);if(item){seen.add(id);result.push(item);}}});});return result;},[todaySessions,items]);
  // BPM drag-to-scrub
  const bpmDragRef=useRef(null);
  const handleBpmMouseDown=(e)=>{e.preventDefault();const startY=e.clientY;const startBpm=metronome.bpm;const onMove=(e)=>{const delta=Math.round((startY-e.clientY)/2);const next=Math.max(40,Math.min(240,startBpm+delta));setMetronome(m=>({...m,bpm:next}));};const onUp=()=>{document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);bpmDragRef.current=null;};document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);bpmDragRef.current={onMove,onUp};};
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
    <DevToolsBar/>
    {droneExpanded&&<DronePanel drone={drone} setDrone={setDrone} toggleDrone={toggleDrone} setDroneExpanded={setDroneExpanded}/>}
    {recExpanded&&(
      <div className="px-10 py-6" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="uppercase flex items-center gap-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>
              Recording
              {anyRecording&&<span className="font-mono tabular-nums normal-case animate-pulse" style={{color:'#A93226',fontSize:'16px',letterSpacing:0,fontWeight:300}}>{fmtRec(recElapsed)}</span>}
              {isActivePieceRec&&activeItem&&<span className="normal-case italic" style={{fontFamily:serif,fontSize:'11px',letterSpacing:0,color:MUTED,marginLeft:'4px'}}>→ {displayTitle(activeItem)}</span>}
            </div>
            {todayRec&&!anyRecording&&<div className="font-mono tabular-nums mt-1" style={{color:MUTED,fontSize:'10px'}}>{Math.round((todayRec.size||0)/1024)}k · {todayKey}</div>}
          </div>
          <div className="flex items-center gap-3">
            {todayRec&&!anyRecording&&<button onClick={()=>deleteRecording(todayKey)} style={{color:FAINT}} title="Delete daily recording"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.25}/></button>}
            <button onClick={()=>setRecExpanded(false)} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button>
          </div>
        </div>
        {anyRecording&&(
          <div className="mb-4 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#A93226'}}/>
            <span className="uppercase" style={{color:'#A93226',fontSize:'9px',letterSpacing:'0.28em'}}>{isActivePieceRec?'Piece recording in progress…':'Recording in progress…'}</span>
            <button
              onClick={isActivePieceRec?(stopPieceRecording||stopRecording):stopRecording}
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
              !anyRecording&&<button
                onClick={startRecording}
                disabled={dayClosed}
                className="flex items-center gap-2 px-3 py-1.5"
                style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',border:`1px solid ${LINE_MED}`,background:'transparent',cursor:dayClosed?'not-allowed':'pointer',color:dayClosed?FAINT:MUTED}}
              >
                <Mic className="w-3.5 h-3.5" strokeWidth={1.25}/>
                <span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>Re-record</span>
              </button>
            }/>
          : !anyRecording&&<div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No recording yet today.</div>
        }
        {todayRec&&!anyRecording&&attachDailyToPiece&&routinePieceItems.length>0&&(
          <div className="mt-5 pt-4" style={{borderTop:`1px solid ${LINE}`}}>
            <div className="uppercase mb-3" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Attach to piece in routine</div>
            <div className="flex items-center gap-3">
              <select value={attachTarget} onChange={e=>setAttachTarget(e.target.value)} className="flex-1 px-2 py-1 text-xs focus:outline-none" style={{background:SURFACE2,color:attachTarget?TEXT:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans}}>
                <option value="" style={{background:SURFACE}}>— select piece —</option>
                {routinePieceItems.map(item=>(<option key={item.id} value={item.id} style={{background:SURFACE}}>{formatByline(item)?`${formatByline(item)} — `+displayTitle(item):displayTitle(item)}</option>))}
              </select>
              <button onClick={async()=>{if(!attachTarget)return;await attachDailyToPiece(attachTarget,null,null);setAttachTarget('');}} disabled={!attachTarget} className="uppercase px-3 py-1.5 shrink-0" style={{border:`1px solid ${attachTarget?IKB:LINE_MED}`,color:attachTarget?TEXT:FAINT,background:attachTarget?IKB_SOFT:'transparent',fontSize:'10px',letterSpacing:'0.22em',cursor:attachTarget?'pointer':'not-allowed'}}>Attach</button>
            </div>
          </div>
        )}
      </div>
    )}
    {metroExpanded&&(<div className="px-10 py-6" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
      <div className="flex items-baseline justify-between mb-5"><div><div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Métronome</div><h4 className="text-2xl mt-0.5" style={{fontFamily:serif,fontStyle:'italic',fontWeight:300}}>{metronome.beats}/{isDotSub?'♩.':nvDisplay}</h4></div><button onClick={()=>setMetroExpanded(false)} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button></div>
      <div className="flex items-center gap-8 pb-4 mb-4 flex-wrap" style={{borderBottom:`1px solid ${LINE}`}}>
        <div className="uppercase shrink-0" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Time</div>
        <div className="flex items-center gap-3"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Beats</span><button onClick={()=>setMetronome(m=>({...m,beats:Math.max(1,m.beats-1)}))} className="w-6 h-6 flex items-center justify-center" style={{border:`1px solid ${LINE_MED}`,color:TEXT}}>−</button><div className="tabular-nums text-center" style={{fontFamily:serif,fontWeight:300,fontSize:'22px',minWidth:'24px'}}>{metronome.beats}</div><button onClick={()=>setMetronome(m=>({...m,beats:Math.min(16,m.beats+1)}))} className="w-6 h-6 flex items-center justify-center" style={{border:`1px solid ${LINE_MED}`,color:TEXT}}>+</button></div>
        <div className="flex items-center gap-2 shrink-0"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Group</span><div className="flex">{[{v:0,label:'Off'},{v:2,label:'2'},{v:3,label:'3'}].map(g=>(<button key={g.v} onClick={()=>setMetronome(m=>({...m,compoundGroup:g.v}))} className="px-2.5 py-1" style={{border:`1px solid ${(metronome.compoundGroup||0)===g.v?IKB:LINE_MED}`,background:(metronome.compoundGroup||0)===g.v?IKB_SOFT:'transparent',color:(metronome.compoundGroup||0)===g.v?TEXT:MUTED,fontSize:'11px',marginLeft:'-1px'}}>{g.label}</button>))}</div></div>
        <div className="flex items-center gap-3"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Note Value</span><div className="flex">{noteValOpts.map(o=>(<button key={o.v} onClick={()=>setMetronome(m=>({...m,noteValue:o.v}))} className="px-3 py-1 tabular-nums" style={{border:`1px solid ${metronome.noteValue===o.v?IKB:LINE_MED}`,background:metronome.noteValue===o.v?IKB_SOFT:'transparent',color:metronome.noteValue===o.v?TEXT:MUTED,fontFamily:serif,fontWeight:300,fontSize:'14px',marginLeft:'-1px'}}>{o.label}</button>))}</div></div>
        <div className="flex items-center gap-3"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Sub</span><div className="flex">{subOpt.map(s=>(<button key={s.value} onClick={()=>setMetronome(m=>({...m,subdivision:s.value}))} className="px-3 py-1" style={{border:`1px solid ${metronome.subdivision===s.value?IKB:LINE_MED}`,background:metronome.subdivision===s.value?IKB_SOFT:'transparent',color:metronome.subdivision===s.value?TEXT:MUTED,fontSize:'14px',fontFamily:serif,marginLeft:'-1px'}}>{s.label}</button>))}</div></div>
      </div>
      <div className="flex items-center gap-8 flex-wrap pb-4 mb-4" style={{borderBottom:`1px solid ${LINE}`}}>
        <div className="uppercase shrink-0" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Feel</div>
        <Tooltip shortcut="T"><button onClick={handleTap} className="uppercase px-3 py-1.5 shrink-0" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Tap tempo</button></Tooltip>
        <div className="flex items-center gap-2 shrink-0"><span className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Sound</span><select value={metronome.sound} onChange={e=>setMetronome(m=>({...m,sound:e.target.value}))} className="px-2 py-1 text-xs focus:outline-none" style={{background:'transparent',color:TEXT,border:`1px solid ${LINE_MED}`}}><option value="click" style={{background:SURFACE}}>Click</option><option value="wood" style={{background:SURFACE}}>Wood</option><option value="beep" style={{background:SURFACE}}>Beep</option></select></div>
        <div className="flex-1 flex items-baseline gap-4 overflow-x-auto etudes-scroll min-w-0">{[{bpm:60,name:'Larghetto'},{bpm:72,name:'Adagio'},{bpm:92,name:'Andante'},{bpm:108,name:'Moderato'},{bpm:120,name:'Allegro'},{bpm:144,name:'Vivace'},{bpm:176,name:'Presto'}].map(pr=>(<button key={pr.bpm} onClick={()=>setMetronome(m=>({...m,bpm:pr.bpm}))} className="shrink-0" style={{color:metronome.bpm===pr.bpm?IKB:MUTED,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>{pr.name} <span className="tabular-nums not-italic" style={{fontFamily:mono}}>{pr.bpm}</span></button>))}</div>
      </div>
      <div className="flex items-center gap-6 flex-wrap pb-4 mb-4" style={{borderBottom:`1px solid ${LINE}`}}>
        <div className="uppercase shrink-0" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em',fontFamily:serif,fontStyle:'italic'}}>Volume</div>
        <input type="range" min="0" max="0.6" step="0.01" value={metronome.clickVolume??0.22} onChange={e=>setMetronome(m=>({...m,clickVolume:+e.target.value}))} className="flex-1 max-w-xs" style={{accentColor:IKB}}/>
        <span className="tabular-nums shrink-0" style={{fontFamily:mono,color:MUTED,fontSize:'10px',minWidth:'32px',textAlign:'right'}}>{Math.round(((metronome.clickVolume??0.22)/0.6)*100)}%</span>
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
          {dayClosed&&restToday>0&&<span className="tabular-nums" style={{fontFamily:mono,fontWeight:300,fontSize:'11px',lineHeight:1,color:FAINT}}>{fmtMin(effectiveTotalToday+restToday)} <span style={{fontSize:'9px',letterSpacing:'0.05em'}}>w/ rest</span></span>}
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
            {activeItemId&&!quickNoteOpen&&<Tooltip shortcut="N" label="Quick note"><button onClick={()=>setQuickNoteOpen(true)} className="uppercase flex items-center gap-1.5 px-2 py-1" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}><MessageSquarePlus className="w-3 h-3" strokeWidth={1.25}/> note</button></Tooltip>}
            {activeItemId&&<Tooltip shortcut="Space"><button onClick={stopItem} className="uppercase px-4 py-1.5" style={{border:`1px solid ${LINE_STR}`,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Stop</button></Tooltip>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Tooltip shortcut="R"><button onClick={toggleRest} disabled={dayClosed&&!isResting} className="flex items-center gap-2 px-3 py-1.5" style={{border:`1px solid ${isResting?IKB:'transparent'}`,color:isResting?IKB:((dayClosed&&!isResting)?FAINT:MUTED),background:isResting?IKB_SOFT:'transparent',cursor:(dayClosed&&!isResting)?'not-allowed':'pointer'}}><Coffee className="w-3 h-3" strokeWidth={1.25}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>{isResting?`${Math.floor(restToday/60)}′ rest`:'Rest'}</span></button></Tooltip>
        <button onClick={handleRecordClick} disabled={dayClosed&&!anyRecording} className="flex items-center gap-2 px-3 py-1.5" style={{border:`1px solid ${anyRecording?'#A93226':(recExpanded&&todayRec?IKB:'transparent')}`,color:anyRecording?'#A93226':((dayClosed&&!anyRecording)?FAINT:MUTED),background:anyRecording?'rgba(169,50,38,0.08)':(recExpanded&&todayRec?IKB_SOFT:'transparent'),cursor:(dayClosed&&!anyRecording)?'not-allowed':'pointer'}}>{anyRecording?<><Square className="w-3 h-3" strokeWidth={1.25} fill="currentColor"/><span className="uppercase animate-pulse" style={{fontSize:'10px',letterSpacing:'0.22em'}}>{isActivePieceRec?'Piece':'REC'}</span></>:<><Mic className="w-3 h-3" strokeWidth={1.25}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>{activeItemId&&startPieceRecording?'Rec piece':'Record'}</span></>}</button>
        {anyRecording&&<span className="font-mono tabular-nums shrink-0" style={{color:'#A93226',fontSize:'12px',fontWeight:300,minWidth:'36px'}}>{fmtRec(recElapsed)}</span>}
        {todayRec&&!isRecording&&<button onClick={()=>setRecExpanded(x=>!x)} className="flex items-center gap-1.5 px-2 py-1.5" style={{color:recExpanded?IKB:FAINT,border:`1px solid ${recExpanded?IKB:'transparent'}`}} title="Play today's recording"><Play className="w-2.5 h-2.5" strokeWidth={1.25} fill="currentColor"/></button>}
        <Tooltip shortcut="D" label="Tuning"><button onClick={()=>setDroneExpanded(x=>!x)} className="flex items-center gap-2 px-3 py-1.5" style={{border:`1px solid ${drone.running?IKB:'transparent'}`,color:drone.running?IKB:MUTED,background:drone.running?IKB_SOFT:'transparent'}}><Waves className="w-3 h-3" strokeWidth={1.25}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>{drone.running?`${drone.note}${drone.octave}`:'Tuning'}</span></button></Tooltip>
      </div>

      <div className="flex items-center gap-4 shrink-0 pl-6" style={{borderLeft:`1px solid ${LINE_MED}`}}>
        <button onClick={()=>setMetroExpanded(x=>!x)} className="flex items-baseline gap-2" style={{color:MUTED}}><div className="text-sm tabular-nums" style={{fontFamily:serif,fontStyle:'italic'}}>{metronome.beats}/{isDotSub?'♩.':nvDisplay}</div>{accel.enabled&&<Zap className="w-2.5 h-2.5" strokeWidth={1.5} style={{color:metronome.bpm>=accel.targetBpm?WARM:IKB}}/>}</button>
        <Tooltip shortcut="M" label="Metronome"><button onClick={()=>setMetronome(m=>({...m,running:!m.running}))} className="w-9 h-9 flex items-center justify-center shrink-0" style={{background:metronome.running?IKB:'transparent',color:TEXT,border:`1px solid ${metronome.running?IKB:LINE_STR}`}}><MetronomeIcon size={14}/></button></Tooltip>
        <div className="flex gap-1.5 items-end" style={{height:'22px'}}>
          {Array.from({length:metronome.beats}).map((_,i)=>(<div key={i} className="flex gap-px items-end" style={{height:'100%'}}>{Array.from({length:isDotSub?1:metronome.subdivision}).map((_,si)=>{const isA=metronome.running&&currentBeat===i&&currentSub===si;const isM=si===0;return <div key={si} style={{alignSelf:'flex-end',height:isA?(i===0&&isM?'22px':isM?'16px':'10px'):(isM?'12px':'6px'),width:isA?'2px':'1px',background:isA?IKB:(isM?DIM:'rgba(244,238,227,0.1)'),transition:'height 75ms, width 75ms'}}/>;})}</div>))}
        </div>
        <div className="flex items-center gap-2 shrink-0"><input type="range" min="40" max="240" value={metronome.bpm} onChange={e=>setMetronome(m=>({...m,bpm:+e.target.value}))} className="w-24" style={{accentColor:IKB}}/><div onMouseDown={handleBpmMouseDown} className="text-sm tabular-nums w-8 text-right select-none" style={{fontFamily:mono,fontWeight:300,cursor:'ns-resize'}}>{metronome.bpm}</div><div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>bpm</div></div>
        {canLog&&(<Tooltip shortcut="L" label={activeSpotId?'Log to spot':'Log BPM'}><button onClick={logTempo} className="uppercase flex items-center gap-1 px-2 py-1 shrink-0" style={{color:IKB,border:`1px solid ${IKB}`,fontSize:'9px',letterSpacing:'0.22em',background:IKB_SOFT}}><TrendingUp className="w-3 h-3" strokeWidth={1.25}/> {activeSpotId?'log→spot':'log'}</button></Tooltip>)}
      </div>
    </div>
  </footer>);
}
