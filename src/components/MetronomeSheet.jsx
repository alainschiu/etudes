import React, {useRef, useState} from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import {
  BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM,
  LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT,
  serif, sans, mono, Z_SHEET,
} from '../constants/theme.js';
import {displayTitle} from '../lib/items.js';
import {
  Eye, Rule, BPMHero, TempoSlider, VolumeSlider, SliderRow,
  TimeSigFlip, AccentToggles,
  Segmented, SoundChips, ModeToggle, Transport, TapButton,
  zoneName,
} from './metronomeAtoms.jsx';

const COMPOUND_OPTS=[{value:0,label:'Off'},{value:2,label:'2'},{value:3,label:'3'}];
const SUB_OPTS=[{value:1,label:'1/4'},{value:2,label:'1/8'},{value:4,label:'1/16'},{value:3,label:'triplet'}];

// Pull a target BPM from the active spot or piece, plus a one-line context label.
function deriveContextLine(activeItem,activeSpot){
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
  const trail=[composerLast,title].filter(Boolean).join(' · ');
  return {bpm,kind,trail};
}

export default function MetronomeSheet({
  open,onClose,metronome,setMetronome,handleTap,currentBeat,currentSub,activeItem,activeSpot,
}){
  const accel=metronome.accel||{enabled:false,targetBpm:120,stepBpm:1,every:8,unit:'bar'};
  const visualMode=metronome.visualMode||'bars';
  const compoundAuto=metronome.compoundAuto!==false;
  const compoundGroup=metronome.compoundGroup||0;
  const denom=metronome.noteValue||'4';

  const sheetStyle={
    position:'fixed',bottom:0,left:0,right:0,height:'min(86vh,820px)',
    background:'rgba(17,16,16,0.97)',
    backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',
    borderTop:`1px solid ${LINE_STR}`,
    zIndex:Z_SHEET,
    transform:open?'translateY(0)':'translateY(100%)',
    transition:open?'transform 240ms ease-out':'transform 200ms ease-in',
    display:'flex',flexDirection:'column',
  };

  const onSetBeats=(n)=>setMetronome(m=>({...m,beats:Math.max(1,Math.min(16,n))}));
  const onSetDenom=(v)=>setMetronome(m=>({...m,noteValue:v}));
  const onAccentChange=(pat)=>setMetronome(m=>({...m,accentPattern:pat}));
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

  const ctx=deriveContextLine(activeItem,activeSpot);

  const [dragY,setDragY]=useState(0);
  const [dragging,setDragging]=useState(false);
  const startYRef=useRef(null);
  const onTouchStart=(e)=>{startYRef.current=e.touches[0].clientY;setDragging(true);};
  const onTouchMove=(e)=>{
    if(startYRef.current==null)return;
    const dy=e.touches[0].clientY-startYRef.current;
    setDragY(Math.max(0,dy));
  };
  const onTouchEnd=()=>{
    const dy=dragY;
    setDragging(false);
    setDragY(0);
    startYRef.current=null;
    if(dy>80)onClose();
  };

  const sheetTransform=open
    ?`translateY(${dragY}px)`
    :'translateY(100%)';
  const sheetTransition=dragging?'none':(open?'transform 240ms ease-out':'transform 200ms ease-in');

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:Z_SHEET-1,opacity:open?Math.max(0,1-dragY/300):0,transition:dragging?'none':'opacity 200ms ease',pointerEvents:open?'auto':'none'}}/>
      <div style={{...sheetStyle,transform:sheetTransform,transition:sheetTransition}}>
        {/* Handle — swipe-down-to-close */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          style={{display:'flex',justifyContent:'center',padding:'10px 16px 0',flexShrink:0,touchAction:'none',cursor:'grab'}}
        >
          <div style={{width:42,height:3,borderRadius:2,background:LINE_STR}}/>
        </div>
        {/* Close */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          style={{display:'flex',justifyContent:'flex-end',padding:'4px 14px 0',flexShrink:0,touchAction:'none'}}
        >
          <button onClick={onClose} style={{minWidth:40,minHeight:40,display:'flex',alignItems:'center',justifyContent:'center',color:FAINT,background:'transparent',border:'none',cursor:'pointer'}}>
            <ChevronDown size={18} strokeWidth={1.5}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'4px 22px 32px',fontFamily:sans,color:TEXT}}>
          {/* Header row */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:18}}>
            <Eye>Métronome</Eye>
            <span style={{fontFamily:serif,fontStyle:'italic',fontSize:13,color:MUTED}}>{zoneName(metronome.bpm).toLowerCase()}</span>
          </div>

          {/* Hero: BPM | Time-sig flip */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:6}}>
            <BPMHero bpm={metronome.bpm} onChange={(v)=>setMetronome(m=>({...m,bpm:v}))} fontSize={120}/>
            <TimeSigFlip beats={metronome.beats} onBeatsChange={onSetBeats} denom={denom} onDenomChange={onSetDenom} size="md"/>
          </div>
          <Eye style={{display:'block',marginBottom:4}}>BPM</Eye>
          {ctx&&(
            <div style={{marginTop:4,marginBottom:18}}>
              <span style={{fontFamily:serif,fontStyle:'italic',fontSize:13,color:MUTED}}>
                ♩={ctx.bpm} · {ctx.kind} · {ctx.trail}
              </span>
            </div>
          )}
          {!ctx&&<div style={{height:18}}/>}

          <Rule/>

          {/* Tempo + Volume sliders (tight stack) */}
          <div style={{paddingTop:14,paddingBottom:6}}>
            <SliderRow label="Tempo" right={`${metronome.bpm}`}>
              <TempoSlider bpm={metronome.bpm} onChange={(v)=>setMetronome(m=>({...m,bpm:v}))}/>
            </SliderRow>
          </div>
          <div style={{paddingBottom:14}}>
            <SliderRow label="Volume" right={`${Math.round(((metronome.clickVolume??0.22)/0.6)*100)}%`}>
              <VolumeSlider value={metronome.clickVolume??0.22} max={0.6} onChange={(v)=>setMetronome(m=>({...m,clickVolume:v}))}/>
            </SliderRow>
          </div>

          <Rule/>

          {/* Pulse / Sub / Accents — equal vertical rhythm */}
          <div style={{display:'flex',flexDirection:'column',gap:14,padding:'14px 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <Eye>Pulse</Eye>
              <ModeToggle label={visualMode==='pulse'?'pulse · on':'pulse · off'} value={visualMode==='pulse'} onChange={(on)=>setMetronome(m=>({...m,visualMode:on?'pulse':'bars'}))}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <Eye>Sub</Eye>
              <Segmented options={SUB_OPTS} value={[1,2,3,4].includes(metronome.subdivision)?metronome.subdivision:1} onChange={(v)=>setMetronome(m=>({...m,subdivision:v}))}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <Eye>Accents</Eye>
              <AccentToggles beats={metronome.beats} accentPattern={metronome.accentPattern||[]} onChange={onAccentChange} active={metronome.running?currentBeat:-1} size={20}/>
            </div>
          </div>

          <Rule/>

          {/* Transport row */}
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'18px 0'}}>
            <Transport running={metronome.running} onToggle={()=>setMetronome(m=>({...m,running:!m.running}))} size={64}/>
            <TapButton onTap={handleTap}/>
            <div style={{flex:1}}/>
            <ModeToggle label="auto" value={compoundAuto} onChange={onToggleAuto}/>
            <ModeToggle label="accel" value={accel.enabled} onChange={onToggleAccel}/>
          </div>

          {/* Accel detail (only when enabled) */}
          {accel.enabled&&(
            <div style={{display:'flex',flexDirection:'column',gap:10,padding:'4px 0 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <Eye>Target</Eye>
                <input type="number" min="40" max="300" value={accel.targetBpm}
                  onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,targetBpm:n}}));}}
                  style={{width:60,background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:13,padding:'4px 8px',textAlign:'right',outline:'none'}}/>
                <span style={{color:FAINT,fontFamily:mono,fontSize:9,letterSpacing:'0.16em'}}>BPM</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <Eye>Step</Eye>
                <span style={{color:MUTED,fontFamily:mono,fontSize:11}}>+</span>
                <input type="number" min="1" max="20" value={accel.stepBpm}
                  onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,stepBpm:n}}));}}
                  style={{width:48,background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:13,padding:'4px 6px',textAlign:'right',outline:'none'}}/>
                <span style={{color:FAINT,fontFamily:mono,fontSize:9,letterSpacing:'0.16em'}}>BPM EVERY</span>
                <input type="number" min="1" max="64" value={accel.every}
                  onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,every:n}}));}}
                  style={{width:48,background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:13,padding:'4px 6px',textAlign:'right',outline:'none'}}/>
                <Segmented options={[{value:'beat',label:'beat'},{value:'bar',label:'bar'}]} value={accel.unit||'bar'} onChange={(u)=>setMetronome(m=>({...m,accel:{...m.accel,unit:u}}))} height={22}/>
              </div>
            </div>
          )}

          {/* Compound group (only when Auto is off) */}
          {!compoundAuto&&(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0 16px'}}>
              <Eye>Group</Eye>
              <Segmented options={COMPOUND_OPTS} value={compoundGroup} onChange={(v)=>setMetronome(m=>({...m,compoundGroup:v}))}/>
            </div>
          )}

          <Rule/>

          {/* Footer: sound chips */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',paddingTop:14}}>
            <Eye style={{marginRight:14}}>Sound</Eye>
            <SoundChips value={metronome.sound} onChange={(v)=>setMetronome(m=>({...m,sound:v}))}/>
          </div>

        </div>
      </div>
    </>
  );
}
