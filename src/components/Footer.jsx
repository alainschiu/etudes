import React, {useState, useEffect, useRef, useMemo} from 'react';
import MetronomeSheet from './MetronomeSheet.jsx';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import DevToolsBar from '../dev/DevToolsBar.jsx';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import X from 'lucide-react/dist/esm/icons/x';
import Waves from 'lucide-react/dist/esm/icons/waves';
import AudioWaveform from 'lucide-react/dist/esm/icons/audio-waveform';
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
import {
  Eye as V1Eye, Rule as V1Rule, BPMHero, TempoSlider, VolumeSlider, SliderRow,
  TimeSigFlip, AccentToggles, NumStepper,
  Segmented as V1Segmented, SoundChips, ModeToggle, Transport, TapButton,
  Keyboard as V1Keyboard, zoneName,
} from './metronomeAtoms.jsx';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, WARN, REC, serif, serifText, sans, mono, Z_FOOTER} from '../constants/theme.js';
import {SECTION_CONFIG} from '../constants/config.js';
import {NOTE_NAMES, noteToFreqFull, getCentOffset} from '../lib/music.js';
import {displayTitle, formatByline, getSpotTime, getParentBucket} from '../lib/items.js';

function MetronomeIcon({size=14}){return(<svg width={size} height={size+2} viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,15 11,15 7,3"/><line x1="7" y1="3" x2="10" y2="9"/><circle cx="7" cy="15" r="1" fill="currentColor" stroke="none"/></svg>);}

// Tuner cents-tone for the V1 keyboard's per-key dot indicator
function centsTone(note,root,temperament){
  if((temperament||'equal')==='equal')return null;
  const c=getCentOffset(note,root||'C',temperament||'equal');
  const a=Math.abs(c);
  if(a>15)return WARN;
  if(a>5)return WARM;
  return null;
}

function MobileDronePanel({drone,setDrone,toggleDrone,setDroneExpanded}){
  const tempLabel={equal:'Equal',just:'Just',meantone:'Meantone ¼'}[drone.temperament||'equal']||'Equal';
  const hz=noteToFreqFull(drone.note,drone.octave,drone.pitchRef||440,drone.temperament||'equal',drone.root||'C');
  const cents=getCentOffset(drone.note,drone.root||'C',drone.temperament||'equal');
  const centsAbs=Math.abs(cents);
  const centsStr=cents===0?null:`${cents>0?'+':''}${cents.toFixed(1)}¢`;
  const centsColor=centsAbs===0?FAINT:centsAbs>15?WARN:centsAbs>5?WARM:IKB;
  const notEqual=(drone.temperament||'equal')!=='equal';
  const tempOpts=[{value:'equal',label:'Equal'},{value:'just',label:'Just'},{value:'meantone',label:'Meantone ¼'}];
  const pitchOpts=[440,415,432];
  const tone=(n)=>centsTone(n,drone.root,drone.temperament);
  return(
    <div style={{borderBottom:`1px solid ${LINE}`,background:BG,padding:'18px 22px',fontFamily:sans,color:TEXT}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
        <V1Eye>Tuning · drone</V1Eye>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontFamily:serif,fontStyle:'italic',fontSize:13,color:MUTED}}>{tempLabel.toLowerCase()}</span>
          <button onClick={()=>setDroneExpanded(false)} style={{color:FAINT,background:'transparent',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}><X className="w-4 h-4" strokeWidth={1.25}/></button>
        </div>
      </div>
      {/* Hero: note + octave | Hz */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:6}}>
        <div style={{display:'flex',alignItems:'baseline',gap:4}}>
          <span style={{fontFamily:mono,fontSize:80,lineHeight:0.82,fontWeight:300,letterSpacing:'-0.04em',color:TEXT}}>{drone.note}</span>
          <span style={{fontFamily:mono,fontSize:30,color:MUTED}}>{drone.octave}</span>
        </div>
        <div style={{textAlign:'right'}}>
          <V1Eye>Hz</V1Eye>
          <div style={{fontFamily:mono,fontSize:18,color:TEXT,fontVariantNumeric:'tabular-nums',marginTop:4}}>{hz.toFixed(2)}</div>
          {centsStr&&<div style={{fontFamily:mono,fontSize:11,color:centsColor,marginTop:2,fontVariantNumeric:'tabular-nums'}}>{centsStr}</div>}
        </div>
      </div>
      <V1Eye style={{display:'block',marginBottom:14}}>Pitch</V1Eye>

      <V1Rule/>

      {/* Keyboard */}
      <div style={{paddingTop:14,paddingBottom:14}}>
        <V1Eye style={{display:'block',marginBottom:10}}>Note</V1Eye>
        <V1Keyboard note={drone.note} onNoteChange={(n)=>setDrone(d=>({...d,note:n}))} height={150} getCentTone={tone}/>
      </div>

      <V1Rule/>

      {/* Param rows */}
      <div style={{display:'flex',flexDirection:'column',gap:12,padding:'14px 0'}}>
        <Row1 label="A=">
          <div style={{display:'flex'}}>{pitchOpts.map(p=>(<button key={p} onClick={()=>setDrone(d=>({...d,pitchRef:p}))} style={{padding:'4px 10px',border:`1px solid ${(drone.pitchRef||440)===p?IKB:LINE_MED}`,background:(drone.pitchRef||440)===p?IKB_SOFT:'transparent',color:(drone.pitchRef||440)===p?TEXT:MUTED,fontFamily:mono,fontSize:11,marginLeft:'-1px',cursor:'pointer'}}>{p}</button>))}</div>
        </Row1>
        <Row1 label="Octave">
          <NumStepper value={drone.octave} onChange={(v)=>setDrone(d=>({...d,octave:v}))} min={1} max={7} width={84}/>
        </Row1>
        <Row1 label="Temperament">
          <V1Segmented options={tempOpts} value={drone.temperament||'equal'} onChange={(v)=>setDrone(d=>({...d,temperament:v}))}/>
        </Row1>
        {notEqual&&(
          <Row1 label="Root">
            <div style={{display:'flex',flexWrap:'wrap',gap:4,justifyContent:'flex-end',maxWidth:240}}>{NOTE_NAMES.map(n=>(<button key={n} onClick={()=>setDrone(d=>({...d,root:n}))} style={{minWidth:30,padding:'3px 5px',border:`1px solid ${(drone.root||'C')===n?IKB:LINE_MED}`,background:(drone.root||'C')===n?IKB_SOFT:'transparent',color:(drone.root||'C')===n?TEXT:MUTED,fontFamily:mono,fontSize:11,cursor:'pointer'}}>{n}</button>))}</div>
          </Row1>
        )}
      </div>

      <V1Rule/>

      <div style={{paddingTop:14,paddingBottom:14}}>
        <SliderRow label="Volume" right={`${Math.round(drone.volume*100)}%`}>
          <VolumeSlider value={drone.volume} max={0.6} onChange={(v)=>setDrone(d=>({...d,volume:v}))}/>
        </SliderRow>
      </div>

      <Transport variant="wide" running={drone.running} onToggle={toggleDrone} size={48}/>
    </div>
  );
}

function Row1({label,children}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
      <V1Eye>{label}</V1Eye>
      <div>{children}</div>
    </div>
  );
}
function RightRow({label,children}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,minHeight:24}}>
      <V1Eye>{label}</V1Eye>
      <div style={{display:'flex',justifyContent:'flex-end'}}>{children}</div>
    </div>
  );
}

function DronePanel({drone,setDrone,toggleDrone,setDroneExpanded}){
  const tempLabel={equal:'Equal',just:'Just',meantone:'Meantone ¼'}[drone.temperament||'equal']||'Equal';
  const hz=noteToFreqFull(drone.note,drone.octave,drone.pitchRef||440,drone.temperament||'equal',drone.root||'C');
  const cents=getCentOffset(drone.note,drone.root||'C',drone.temperament||'equal');
  const centsAbs=Math.abs(cents);
  const centsStr=cents===0?null:`${cents>0?'+':''}${cents.toFixed(1)}¢`;
  const centsColor=centsAbs===0?FAINT:centsAbs>15?WARN:centsAbs>5?WARM:IKB;
  const notEqual=(drone.temperament||'equal')!=='equal';
  const tempOpts=[{value:'equal',label:'Equal'},{value:'just',label:'Just'},{value:'meantone',label:'Meantone ¼'}];
  const pitchOpts=[440,415,432];
  const tone=(n)=>centsTone(n,drone.root,drone.temperament);

  return (
    <div style={{borderBottom:`1px solid ${LINE}`,background:BG,padding:'18px 28px',fontFamily:sans,color:TEXT,position:'relative'}}>
      {/* Close */}
      <button onClick={()=>setDroneExpanded(false)} style={{position:'absolute',top:14,right:18,color:FAINT,background:'transparent',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}>
        <X className="w-4 h-4" strokeWidth={1.25}/>
      </button>
      <div style={{display:'grid',gridTemplateColumns:'140px 1fr 280px 100px',columnGap:28,alignItems:'stretch',minHeight:200}}>
        {/* Col 1: note hero */}
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <V1Eye>Tuning · drone</V1Eye>
          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
            <span style={{fontFamily:mono,fontSize:78,lineHeight:0.82,fontWeight:300,letterSpacing:'-0.04em',color:TEXT}}>{drone.note}</span>
            <span style={{fontFamily:mono,fontSize:30,color:MUTED}}>{drone.octave}</span>
          </div>
          <span style={{fontFamily:serif,fontStyle:'italic',fontSize:11,color:FAINT}}>{tempLabel.toLowerCase()}</span>
        </div>

        {/* Col 2: keyboard hero — stretches from NOTE label to Volume fader */}
        <div style={{display:'flex',flexDirection:'column',gap:8,minWidth:0}}>
          <V1Eye>Note</V1Eye>
          <div style={{flex:1,display:'flex',alignItems:'stretch',justifyContent:'center',minHeight:0}}>
            <V1Keyboard note={drone.note} onNoteChange={(n)=>setDrone(d=>({...d,note:n}))} width={520} height="100%" getCentTone={tone}/>
          </div>
          {notEqual&&(
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
              <V1Eye>Root</V1Eye>
              <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                {NOTE_NAMES.map(n=>(<button key={n} onClick={()=>setDrone(d=>({...d,root:n}))} style={{minWidth:24,padding:'2px 4px',border:`1px solid ${(drone.root||'C')===n?IKB:LINE_MED}`,background:(drone.root||'C')===n?IKB_SOFT:'transparent',color:(drone.root||'C')===n?TEXT:MUTED,fontFamily:mono,fontSize:9,cursor:'pointer'}}>{n}</button>))}
              </div>
            </div>
          )}
        </div>

        {/* Col 3: params, right-aligned */}
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',gap:6}}>
          <RightRow label="Hz">
            <span style={{fontFamily:mono,fontSize:13,color:TEXT,fontVariantNumeric:'tabular-nums'}}>{hz.toFixed(2)}{centsStr&&<span style={{color:centsColor,marginLeft:8}}>{centsStr}</span>}</span>
          </RightRow>
          <RightRow label="A=">
            <div style={{display:'flex'}}>{pitchOpts.map(p=>(<button key={p} onClick={()=>setDrone(d=>({...d,pitchRef:p}))} style={{padding:'3px 9px',border:`1px solid ${(drone.pitchRef||440)===p?IKB:LINE_MED}`,background:(drone.pitchRef||440)===p?IKB_SOFT:'transparent',color:(drone.pitchRef||440)===p?TEXT:MUTED,fontFamily:mono,fontSize:11,marginLeft:'-1px',cursor:'pointer'}}>{p}</button>))}</div>
          </RightRow>
          <RightRow label="Octave">
            <NumStepper value={drone.octave} onChange={(v)=>setDrone(d=>({...d,octave:v}))} min={1} max={7} width={70}/>
          </RightRow>
          <RightRow label="Temp.">
            <V1Segmented options={tempOpts} value={drone.temperament||'equal'} onChange={(v)=>setDrone(d=>({...d,temperament:v}))}/>
          </RightRow>
          <SliderRow label="Volume" right={`${Math.round(drone.volume*100)}%`}>
            <VolumeSlider value={drone.volume} max={0.6} onChange={(v)=>setDrone(d=>({...d,volume:v}))}/>
          </SliderRow>
        </div>

        {/* Col 4: transport */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',justifyContent:'center'}}>
          <Transport running={drone.running} onToggle={toggleDrone} size={70}/>
        </div>
      </div>
      {notEqual&&(
        <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${LINE}`}}>
          <V1Eye style={{display:'block',marginBottom:8}}>Offsets from equal · root {drone.root||'C'}</V1Eye>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px 16px'}}>
            {NOTE_NAMES.map(n=>{const c=getCentOffset(n,drone.root||'C',drone.temperament||'equal');const ca=Math.abs(c);const cc=ca>15?WARN:ca>5?WARM:FAINT;const isActive=drone.note===n;return <span key={n} style={{fontFamily:mono,fontSize:10,color:isActive?TEXT:cc,fontWeight:isActive?500:300,minWidth:60,fontVariantNumeric:'tabular-nums'}}>{n} {c>=0?'+':''}{c.toFixed(1)}¢</span>;})}
          </div>
        </div>
      )}
    </div>
  );
}

function AccelProgress({metronome}){if(!metronome.accel.enabled)return null;const s=metronome.bpm;const tgt=metronome.accel.targetBpm;const r=s>=tgt;const pct=r?100:Math.min(100,((s-60)/Math.max(1,tgt-60))*100);const u=metronome.accel.unit||'bar';return (<div className="mt-3 flex items-center gap-3"><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Accel</span><div className="flex-1 h-px relative" style={{background:LINE_MED}}><div className="absolute inset-y-0 left-0" style={{background:r?WARM:IKB,width:`${pct}%`,height:'1px'}}/></div><span className="tabular-nums shrink-0" style={{color:r?WARM:MUTED,fontSize:'10px'}}>{r?`▲ ${tgt}`:`${s} → ${tgt} · +${metronome.accel.stepBpm}/${metronome.accel.every}${u[0]}`}</span></div>);}

const SUB_OPTS=[{value:1,label:'1/4'},{value:2,label:'1/8'},{value:4,label:'1/16'},{value:3,label:'triplet'}];

// V1 desktop metronome bar — opens when metroExpanded toggles on.
function DesktopMetroBar({metronome,setMetronome,currentBeat,handleTap,activeItem,activeSpot,onClose}){
  const accel=metronome.accel||{enabled:false,targetBpm:120,stepBpm:1,every:8,unit:'bar'};
  const denom=metronome.noteValue||'4';
  const compoundAuto=metronome.compoundAuto!==false;
  const compoundGroup=metronome.compoundGroup||0;
  const ctx=(()=>{
    if(!activeItem)return null;
    const spotLog=activeSpot?.bpmLog;
    const spotTarget=activeSpot?.tempoTarget;
    const pieceLog=activeItem.bpmLog;
    const pieceTarget=activeItem.bpmTarget;
    let bpm=null,kind=null;
    if(Number.isFinite(spotTarget)){bpm=spotTarget;kind='target';}
    else if(Array.isArray(spotLog)&&spotLog.length){bpm=spotLog[spotLog.length-1].bpm;kind='last';}
    else if(Number.isFinite(pieceTarget)){bpm=pieceTarget;kind='target';}
    else if(Array.isArray(pieceLog)&&pieceLog.length){bpm=pieceLog[pieceLog.length-1].bpm;kind='last';}
    if(!Number.isFinite(bpm))return null;
    const composer=(activeItem.composer||'').trim();
    const composerLast=composer?composer.split(/\s+/).slice(-1)[0]:'';
    const title=displayTitle(activeItem);
    return {bpm,kind,trail:[composerLast,title].filter(Boolean).join(' · ')};
  })();
  const onSetBeats=(n)=>setMetronome(m=>({...m,beats:Math.max(1,Math.min(16,n))}));
  const onSetDenom=(v)=>setMetronome(m=>({...m,noteValue:v}));
  const onToggleAuto=()=>{
    setMetronome(m=>{
      const on=m.compoundAuto!==false;
      if(on)return {...m,compoundAuto:false};
      const folded=(m.compoundGroup===3&&m.subdivision===3&&m.beats>=2&&m.beats<=5);
      if(folded)return {...m,compoundAuto:true,beats:m.beats*3,subdivision:1,compoundGroup:0};
      const b=m.beats;
      const canFold=(m.compoundGroup||0)===0&&m.subdivision===1&&(b===6||b===9||b===12||b===15);
      if(canFold)return {...m,compoundAuto:true,beats:b/3,subdivision:3,compoundGroup:3};
      return {...m,compoundAuto:true};
    });
  };
  const onToggleAccel=()=>setMetronome(m=>({...m,accel:{...accel,enabled:!accel.enabled}}));
  return (
    <div style={{borderBottom:`1px solid ${LINE}`,background:BG,padding:'18px 28px',fontFamily:sans,color:TEXT,position:'relative'}}>
      <button onClick={onClose} style={{position:'absolute',top:14,right:18,color:FAINT,background:'transparent',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}>
        <X className="w-4 h-4" strokeWidth={1.25}/>
      </button>
      <div style={{display:'grid',gridTemplateColumns:'260px 1fr 130px',columnGap:24,alignItems:'stretch',minHeight:200}}>
        {/* Col 1: BPM hero + meter */}
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <V1Eye>Métronome</V1Eye>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <BPMHero bpm={metronome.bpm} onChange={(v)=>setMetronome(m=>({...m,bpm:v}))} fontSize={82}/>
            <TimeSigFlip beats={metronome.beats} onBeatsChange={onSetBeats} denom={denom} onDenomChange={onSetDenom} size="sm"/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}>
            <V1Eye>BPM</V1Eye>
            <span style={{fontFamily:serif,fontStyle:'italic',fontSize:11,color:FAINT,textAlign:'right',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {zoneName(metronome.bpm).toLowerCase()}{ctx?` · ♩=${ctx.bpm} · ${ctx.kind} · ${ctx.trail}`:''}
            </span>
          </div>
        </div>

        {/* Col 2: tempo + volume sliders (tight) + AccelProgress */}
        <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:0}}>
          <div style={{paddingTop:14}}>
            <SliderRow label="Tempo" right={String(metronome.bpm)}>
              <TempoSlider bpm={metronome.bpm} onChange={(v)=>setMetronome(m=>({...m,bpm:v}))} height={28}/>
            </SliderRow>
          </div>
          <div style={{marginTop:-6}}>
            <SliderRow label="Volume" right={`${Math.round(((metronome.clickVolume??0.22)/0.6)*100)}%`}>
              <VolumeSlider value={metronome.clickVolume??0.22} max={0.6} onChange={(v)=>setMetronome(m=>({...m,clickVolume:v}))}/>
            </SliderRow>
          </div>
          <div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap',marginTop:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <V1Eye>Accents</V1Eye>
              <AccentToggles beats={metronome.beats} accentPattern={metronome.accentPattern||[]} onChange={(pat)=>setMetronome(m=>({...m,accentPattern:pat}))} active={metronome.running?currentBeat:-1} size={14}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <V1Eye>Pulse</V1Eye>
              <ModeToggle label={(metronome.visualMode||'bars')==='pulse'?'on':'off'} value={(metronome.visualMode||'bars')==='pulse'} onChange={(on)=>setMetronome(m=>({...m,visualMode:on?'pulse':'bars'}))}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <V1Eye>Sub</V1Eye>
              <V1Segmented options={SUB_OPTS} value={metronome.subdivision===1||metronome.subdivision===2||metronome.subdivision===3||metronome.subdivision===4?metronome.subdivision:1} onChange={(v)=>setMetronome(m=>({...m,subdivision:v}))}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginLeft:'auto'}}>
              <V1Eye>Sound</V1Eye>
              <SoundChips value={metronome.sound} onChange={(v)=>setMetronome(m=>({...m,sound:v}))}/>
            </div>
            <div style={{display:'flex',gap:6}}>
              <ModeToggle label="auto" value={compoundAuto} onChange={onToggleAuto}/>
              <ModeToggle label="accel" value={accel.enabled} onChange={onToggleAccel}/>
            </div>
          </div>
          {accel.enabled&&<AccelProgress metronome={metronome}/>}
        </div>

        {/* Col 4: transport + tap (right-aligned to match tuner play button) */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',justifyContent:'center',gap:10}}>
          <Transport running={metronome.running} onToggle={()=>setMetronome(m=>({...m,running:!m.running}))} size={70}/>
          <Tooltip shortcut="T"><TapButton onTap={handleTap} size="sm"/></Tooltip>
        </div>
      </div>

      {/* Accel detail (when enabled) */}
      {accel.enabled&&(
        <div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end',marginTop:14,paddingTop:12,borderTop:`1px solid ${LINE}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <V1Eye>Target</V1Eye>
            <input type="number" min="40" max="300" value={accel.targetBpm}
              onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,targetBpm:n}}));}}
              style={{width:56,background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:12,padding:'2px 6px',textAlign:'right',outline:'none'}}/>
            <span style={{color:FAINT,fontFamily:mono,fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase'}}>BPM</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <V1Eye>Step</V1Eye>
            <span style={{color:MUTED,fontFamily:mono,fontSize:11}}>+</span>
            <input type="number" min="1" max="20" value={accel.stepBpm}
              onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,stepBpm:n}}));}}
              style={{width:44,background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:12,padding:'2px 6px',textAlign:'right',outline:'none'}}/>
            <span style={{color:FAINT,fontFamily:mono,fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase'}}>BPM EVERY</span>
            <input type="number" min="1" max="64" value={accel.every}
              onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,every:n}}));}}
              style={{width:44,background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:12,padding:'2px 6px',textAlign:'right',outline:'none'}}/>
            <V1Segmented options={[{value:'beat',label:'beat'},{value:'bar',label:'bar'}]} value={accel.unit||'bar'} onChange={(u)=>setMetronome(m=>({...m,accel:{...m.accel,unit:u}}))} height={22}/>
          </div>
        </div>
      )}

      {/* Compound group (when Auto is off) */}
      {!compoundAuto&&(
        <div style={{display:'flex',gap:10,alignItems:'center',marginTop:12}}>
          <V1Eye>Group</V1Eye>
          <V1Segmented options={[{value:0,label:'Off'},{value:2,label:'2'},{value:3,label:'3'}]} value={compoundGroup} onChange={(v)=>setMetronome(m=>({...m,compoundGroup:v}))}/>
        </div>
      )}

    </div>
  );
}

export default function Footer({isMobile,metronome,setMetronome,metroExpanded,setMetroExpanded,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,currentBeat,currentSub,activeItemId,activeSpotId,activeItem,activeSpot,activeIsWarmup,sectionTimes,totalToday,effectiveTotalToday,warmupTimeToday,restToday,isResting,toggleRest,itemTimes,fmt,fmtMin,stopItem,handleTap,isRecording,startRecording,stopRecording,logTempo,quickNoteOpen,setQuickNoteOpen,addQuickNote,dayClosed,dayJustRolled,recExpanded,setRecExpanded,recordingMeta,deleteRecording,todayKey,startPieceRecording,stopPieceRecording,pieceRecordingItemId,pieceRecordingMeta,attachDailyToPiece,todaySessions,items,settings,handleStartRecording}){
  const [quickNoteText,setQuickNoteText]=useState('');
  const [attachTarget,setAttachTarget]=useState('');
  // Pulse-mode flash: snap on at beat, decay after 90ms
  const [pulseFlash,setPulseFlash]=useState(-1);
  const pulseTimerRef=useRef(null);
  useEffect(()=>{
    if(!isMobile||(metronome.visualMode||'bars')!=='pulse'||!metronome.running||currentBeat<0)return;
    setPulseFlash(currentBeat);
    if(pulseTimerRef.current)clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current=setTimeout(()=>setPulseFlash(-1),90);
  },[currentBeat]);// eslint-disable-line react-hooks/exhaustive-deps
  // Recording elapsed timer (covers both daily and piece recording)
  const [recElapsed,setRecElapsed]=useState(0);
  useEffect(()=>{if(!isRecording&&!pieceRecordingItemId){setRecElapsed(0);return;}const start=Date.now();const id=setInterval(()=>setRecElapsed(Math.floor((Date.now()-start)/1000)),500);return()=>clearInterval(id);},[isRecording,pieceRecordingItemId]);
  const fmtRec=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  // Smart record helpers
  const isActivePieceRec=!!pieceRecordingItemId&&pieceRecordingItemId===activeItemId;
  const anyRecording=isRecording||!!pieceRecordingItemId;
  // Mobile: metronome bottom sheet
  const [metroSheetOpen,setMetroSheetOpen]=useState(false);
  // Mobile: publish footer height as CSS custom property
  const footerRef=useRef(null);
  useEffect(()=>{
    if(!isMobile||!footerRef.current)return;
    const update=()=>{
      if(footerRef.current){
        document.documentElement.style.setProperty('--footer-height',`${footerRef.current.offsetHeight}px`);
      }
    };
    update();
    const ro=new ResizeObserver(update);
    ro.observe(footerRef.current);
    return()=>ro.disconnect();
  },[isMobile]);
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
  const statusLabel=activeItem?activeTitle:(isResting?'Resting':(dayClosed?'Day closed':activeItemId?'':(dayJustRolled?'New day — timer reset':(effectiveTotalToday>0?'Today so far':'Not practicing'))));
  const nvDisplay=metronome.noteValue;
  const isDotSub=metronome.subdivision==='dot';

  const todayRec=recordingMeta?.[todayKey];

  return (<footer className={isMobile?'':'shrink-0'} style={{borderTop:`1px solid ${LINE_MED}`,background:BG,...(isMobile&&{position:'fixed',bottom:0,left:0,right:0,zIndex:Z_FOOTER})}}>
    <DevToolsBar/>
    {droneExpanded&&(isMobile?<MobileDronePanel drone={drone} setDrone={setDrone} toggleDrone={toggleDrone} setDroneExpanded={setDroneExpanded}/>:<DronePanel drone={drone} setDrone={setDrone} toggleDrone={toggleDrone} setDroneExpanded={setDroneExpanded}/>)}
    {recExpanded&&(
      <div className={isMobile?'px-4 py-5':'px-10 py-6'} style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
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
            <div className={isMobile?'flex flex-col gap-2':'flex items-center gap-3'}>
              <select value={attachTarget} onChange={e=>setAttachTarget(e.target.value)} className={isMobile?'w-full px-2 py-2 text-xs focus:outline-none':'flex-1 px-2 py-1 text-xs focus:outline-none'} style={{background:SURFACE2,color:attachTarget?TEXT:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,maxWidth:'100%'}}>
                <option value="" style={{background:SURFACE}}>— select piece —</option>
                {routinePieceItems.map(item=>{const full=formatByline(item)?`${formatByline(item)} — `+displayTitle(item):displayTitle(item);const label=isMobile&&full.length>38?full.slice(0,37)+'…':full;return(<option key={item.id} value={item.id} style={{background:SURFACE}}>{label}</option>);})}
              </select>
              <button onClick={async()=>{if(!attachTarget)return;await attachDailyToPiece(attachTarget,null,null);setAttachTarget('');}} disabled={!attachTarget} className={isMobile?'w-full uppercase py-2':'uppercase px-3 py-1.5 shrink-0'} style={{border:`1px solid ${attachTarget?IKB:LINE_MED}`,color:attachTarget?TEXT:FAINT,background:attachTarget?IKB_SOFT:'transparent',fontSize:'10px',letterSpacing:'0.22em',cursor:attachTarget?'pointer':'not-allowed'}}>Attach</button>
            </div>
          </div>
        )}
      </div>
    )}
    {metroExpanded&&(
      <DesktopMetroBar
        metronome={metronome} setMetronome={setMetronome}
        currentBeat={currentBeat} handleTap={handleTap}
        activeItem={activeItem} activeSpot={activeSpot}
        onClose={()=>setMetroExpanded(false)}
      />
    )}

    {quickNoteOpen&&(<div className={isMobile?'px-4 py-3 flex items-center gap-3':'px-10 py-3 flex items-center gap-3'} style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}><MessageSquarePlus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.25} style={{color:IKB}}/><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Note {activeSpot&&<span style={{color:IKB,marginLeft:'6px'}}>· {activeSpot.label}</span>}</span><input autoFocus value={quickNoteText} onChange={e=>setQuickNoteText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();else if(e.key==='Escape'){setQuickNoteText('');setQuickNoteOpen(false);}}} onBlur={submit} placeholder="A note for this session…" className="flex-1 text-sm focus:outline-none" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_MED}`,fontFamily:serif,fontSize:'14px',paddingBottom:'2px'}}/>{!isMobile&&<span className="uppercase shrink-0" style={{color:DIM,fontSize:'9px',letterSpacing:'0.22em'}}>Enter to save · Esc to cancel</span>}</div>)}

    {isMobile?(
      /* ── Mobile 3-row transport ─────────────────────────────────────────── */
      <div ref={footerRef} style={{background:BG,borderTop:`1px solid ${LINE_MED}`,paddingBottom:'env(safe-area-inset-bottom,16px)'}}>
        {/* Row 1 — Readout (only when active item) */}
        {activeItemId&&activeItem&&(
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 18px 6px',borderBottom:`1px solid ${LINE}`}}>
            <div className="animate-pulse" style={{width:'6px',height:'6px',borderRadius:'999px',background:IKB,flexShrink:0,boxShadow:`0 0 5px ${IKB}`}}/>
            <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.22em',color:IKB,flexShrink:0}}>{SECTION_CONFIG[activeItem.type].label}</span>
            <span style={{fontFamily:serifText,fontStyle:'italic',fontSize:'13px',color:'rgba(212,206,195,0.9)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayTitle(activeItem)}</span>
            <span style={{fontFamily:mono,fontSize:'11px',color:TEXT,flexShrink:0}}>{fmt(activeTimerSec)}</span>
          </div>
        )}

        {/* Row 2 — Transport */}
        <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px 8px'}}>
          {/* Play / Pause */}
          <button
            onClick={()=>activeItemId?stopItem():undefined}
            style={{
              width:'44px',height:'44px',borderRadius:'999px',flexShrink:0,
              border:`1px solid ${activeItemId?IKB:LINE_STR}`,
              background:activeItemId?IKB_SOFT:'transparent',
              color:activeItemId?IKB:MUTED,
              display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',
              transition:'all 200ms cubic-bezier(0.2,0.7,0.2,1)',
            }}
          >
            {activeItemId
              ? <Pause size={16} strokeWidth={1.5}/>
              : <Play size={16} strokeWidth={1.5}/>
            }
          </button>

          {/* Metronome widget */}
          <div style={{flex:1,height:'48px',borderRadius:'4px',border:`1px solid ${metronome.running?IKB:LINE_STR}`,overflow:'hidden',display:'flex',minWidth:0}}>
            {/* Left zone — entire toggle surface (bars or pulse) */}
            {(metronome.visualMode||'bars')==='pulse'?(
              /* Pulse mode: whole left area flashes briefly on each beat then returns to dark */
              <button
                onClick={()=>setMetronome(m=>({...m,running:!m.running}))}
                style={{flex:'1 1 0',minWidth:0,border:'none',cursor:'pointer',padding:0,
                  background: pulseFlash>=0 ? (pulseFlash===0?IKB:`rgba(0,47,167,0.55)`) : 'transparent',
                  boxShadow: pulseFlash===0 ? `0 0 22px ${IKB}99` : 'none',
                  transition: pulseFlash>=0 ? 'none' : 'background 200ms ease-out, box-shadow 200ms ease-out',
                }}
              />
            ):(
              /* Bars mode: single button covering bars + BPM/timesig */
              <button
                onClick={()=>setMetronome(m=>({...m,running:!m.running}))}
                style={{flex:'1 1 0',minWidth:0,display:'flex',alignItems:'center',border:'none',cursor:'pointer',padding:'0',background:'transparent',overflow:'hidden'}}
              >
                {/* Beat bars */}
                <div style={{flex:1,minWidth:0,display:'flex',alignItems:'flex-end',gap:'3px',padding:'0 8px 8px',height:'100%',overflow:'hidden'}}>
                  {Array.from({length:Math.min(metronome.beats,8)}).map((_,i)=>{
                    const isDotSub2=metronome.subdivision==='dot';
                    const effectiveSub2=isDotSub2?1:(typeof metronome.subdivision==='number'?metronome.subdivision:1);
                    const isA=metronome.running&&currentBeat===i;
                    const pat=metronome.accentPattern||[];
                    const hasCustom=pat.length>0;
                    const compoundMob=metronome.compoundGroup||0;
                    const isGroupStart=(j)=>compoundMob>1?j%compoundMob===0:j===0;
                    const isGroupDown=isGroupStart(i);
                    const isBeat1=i===0;
                    let h;
                    if(hasCustom){
                      const idle=i===0?26:pat.includes(i)?22:12;
                      const act=i===0?40:pat.includes(i)?32:20;
                      h=`${isA?act:idle}px`;
                    }else{
                      h=isA&&isBeat1?'40px':isA&&isGroupDown?'32px':isA?'24px':isBeat1?'26px':isGroupDown?'20px':'14px';
                    }
                    const bg=isA?IKB:hasCustom?(i===0||pat.includes(i)?DIM:`rgba(244,238,227,0.14)`):(isBeat1?DIM:isGroupDown?DIM:`rgba(244,238,227,0.12)`);
                    return(
                      <div key={i} style={{flex:1,minWidth:'5px',display:'flex',alignItems:'flex-end',gap:'2px',height:'40px'}}>
                        <div style={{
                          flex:1,minWidth:'5px',
                          height:h,
                          background:bg,
                          borderRadius:'2px',
                          transition:isA?'none':'height 150ms ease-out',
                        }}/>
                        {effectiveSub2>1&&Array.from({length:effectiveSub2-1}).map((_,si)=>{
                          const isAS=metronome.running&&currentBeat===i&&currentSub===si+1;
                          return <div key={si} style={{width:'4px',height:isAS?'18px':'12px',background:isAS?IKB:'rgba(244,238,227,0.12)',borderRadius:'2px',transition:isAS?'none':'height 150ms ease-out',flexShrink:0}}/>;
                        })}
                      </div>
                    );
                  })}
                </div>
                {/* BPM + time sig */}
                <div style={{flexShrink:0,width:'46px',display:'flex',flexDirection:'column',alignItems:'flex-end',justifyContent:'center',padding:'0 8px 0 0',gap:'2px'}}>
                  <span style={{fontFamily:mono,fontSize:'14px',fontWeight:500,color:metronome.running?IKB:MUTED,lineHeight:1}}>{metronome.bpm}</span>
                  <span style={{fontFamily:serif,fontStyle:'italic',fontSize:'16px',color:metronome.running?IKB:FAINT,lineHeight:1}}>{metronome.beats}/{isDotSub?'♩.':metronome.noteValue}</span>
                </div>
              </button>
            )}
            {/* Chevron — sheet only */}
            <button
              onClick={()=>setMetroSheetOpen(true)}
              style={{width:'28px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'none',borderLeft:`1px solid ${metronome.running?IKB:LINE_MED}`,cursor:'pointer'}}
            >
              <ChevronUp size={12} strokeWidth={1.5} style={{color:FAINT}}/>
            </button>
          </div>

          {/* Right cluster — tightly grouped to give the metronome bar more room */}
          <div style={{display:'flex',alignItems:'center',gap:'2px',flexShrink:0,marginLeft:'2px'}}>
            <button
              onClick={handleRecordClick}
              disabled={dayClosed&&!anyRecording}
              style={{width:'30px',height:'30px',borderRadius:'999px',flexShrink:0,border:`1px solid ${anyRecording?REC:'transparent'}`,background:anyRecording?'rgba(169,50,38,0.10)':'transparent',color:anyRecording?REC:(dayClosed?FAINT:MUTED),display:'flex',alignItems:'center',justifyContent:'center',cursor:dayClosed&&!anyRecording?'not-allowed':'pointer'}}
            >
              {anyRecording?<Square size={13} strokeWidth={1.25} fill="currentColor"/>:<Mic size={13} strokeWidth={1.25}/>}
            </button>
            <button
              onClick={()=>setDroneExpanded(x=>!x)}
              style={{width:'30px',height:'30px',borderRadius:'999px',flexShrink:0,border:`1px solid ${drone.running?IKB:'transparent'}`,background:drone.running?IKB_SOFT:'transparent',color:drone.running?IKB:MUTED,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
              aria-label="Tuning"
            >
              <AudioWaveform size={13} strokeWidth={1.25}/>
            </button>
            <button
              onClick={()=>setQuickNoteOpen(true)}
              style={{width:'30px',height:'30px',borderRadius:'999px',flexShrink:0,border:'1px solid transparent',background:'transparent',color:MUTED,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
            >
              <MessageSquarePlus size={13} strokeWidth={1.25}/>
            </button>
          </div>
        </div>

        {/* Row 3 — Status strip */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 18px 4px',borderTop:`1px solid ${LINE}`}}>
          <div style={{display:'flex',alignItems:'baseline',gap:'6px'}}>
            <span className="uppercase" style={{fontFamily:sans,fontSize:'8px',fontWeight:500,letterSpacing:'0.28em',color:FAINT}}>Aujourd'hui</span>
            <span style={{fontFamily:mono,fontSize:'10px',color:MUTED}}>{fmtMin(effectiveTotalToday)}{settings?.dailyTarget?` / ${settings.dailyTarget}′`:''}</span>
          </div>
          {/* Rest toggle */}
          <button
            onClick={toggleRest}
            disabled={dayClosed&&!isResting}
            style={{display:'flex',alignItems:'center',gap:'5px',background:'transparent',border:'none',cursor:dayClosed&&!isResting?'not-allowed':'pointer',opacity:dayClosed&&!isResting?0.4:1}}
          >
            {isResting
              ? <span className="uppercase animate-pulse" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.22em',color:WARM}}>Rest</span>
              : <Coffee size={13} strokeWidth={1.25} style={{color:FAINT}}/>
            }
          </button>
        </div>

        {/* Metronome bottom sheet */}
        <MetronomeSheet
          open={metroSheetOpen}
          onClose={()=>setMetroSheetOpen(false)}
          metronome={metronome}
          setMetronome={setMetronome}
          handleTap={handleTap}
          currentBeat={currentBeat}
          currentSub={currentSub}
          activeItem={activeItem}
          activeSpot={activeSpot}
        />
      </div>
    ):(
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
    )}
  </footer>);
}
