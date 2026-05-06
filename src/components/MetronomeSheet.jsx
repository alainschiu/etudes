import React, {useState} from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import {
  BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM,
  LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT,
  serif, sans, mono, Z_SHEET,
} from '../constants/theme.js';
import {displayTitle} from '../lib/items.js';
import {
  Eye, Rule, BPMHero, TempoSlider, VolumeSlider, SliderRow,
  TimeSigFlip, PulseDots, AccentToggles, SubStepper, NumStepper,
  Segmented, SoundChips, ModeToggle, Transport, TapButton,
  zoneName,
} from './metronomeAtoms.jsx';

const TEMPO_PRESETS=[
  {bpm:60,name:'Larghetto'},{bpm:72,name:'Adagio'},{bpm:92,name:'Andante'},
  {bpm:108,name:'Moderato'},{bpm:120,name:'Allegro'},{bpm:144,name:'Vivace'},{bpm:176,name:'Presto'},
];
const VISUAL_OPTS=[{value:'bars',label:'bars'},{value:'pulse',label:'pulse'}];
const COMPOUND_OPTS=[{value:0,label:'Off'},{value:2,label:'2'},{value:3,label:'3'}];

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

  const [moreOpen,setMoreOpen]=useState(false);

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

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:Z_SHEET-1,opacity:open?1:0,transition:'opacity 200ms ease',pointerEvents:open?'auto':'none'}}/>
      <div style={sheetStyle}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'10px 16px 0',flexShrink:0}}>
          <div style={{width:42,height:3,borderRadius:2,background:LINE_STR}}/>
        </div>
        {/* Close */}
        <div style={{display:'flex',justifyContent:'flex-end',padding:'4px 14px 0',flexShrink:0}}>
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
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:12,marginBottom:6}}>
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

          {/* Tempo slider */}
          <div style={{paddingTop:18,paddingBottom:14}}>
            <SliderRow label="Tempo" right={`${metronome.bpm}`}>
              <TempoSlider bpm={metronome.bpm} onChange={(v)=>setMetronome(m=>({...m,bpm:v}))}/>
            </SliderRow>
          </div>

          {/* Volume slider */}
          <div style={{paddingBottom:18}}>
            <SliderRow label="Volume" right={`${Math.round(((metronome.clickVolume??0.22)/0.6)*100)}%`}>
              <VolumeSlider value={metronome.clickVolume??0.22} max={0.6} onChange={(v)=>setMetronome(m=>({...m,clickVolume:v}))}/>
            </SliderRow>
          </div>

          <Rule/>

          {/* Pulse dots */}
          <div style={{paddingTop:16,paddingBottom:14}}>
            <Eye style={{display:'block',marginBottom:12}}>Pulse</Eye>
            <PulseDots beats={metronome.beats} accents={[0,...(metronome.accentPattern||[])]} active={metronome.running?currentBeat:-1} size={10} gap={10}/>
          </div>

          {/* Accents row */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <Eye>Accents</Eye>
            <AccentToggles beats={metronome.beats} accentPattern={metronome.accentPattern||[]} onChange={onAccentChange} size={20}/>
          </div>

          {/* Subdivision row */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <Eye>Subdivision</Eye>
            <SubStepper value={metronome.subdivision} onChange={(v)=>setMetronome(m=>({...m,subdivision:v}))}/>
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

          {/* Tempo presets */}
          <div style={{display:'flex',gap:14,flexWrap:'wrap',padding:'14px 0'}}>
            {TEMPO_PRESETS.map(pr=>(
              <button key={pr.bpm} onClick={()=>setMetronome(m=>({...m,bpm:pr.bpm}))} style={{color:metronome.bpm===pr.bpm?IKB:MUTED,fontFamily:serif,fontStyle:'italic',fontSize:13,background:'none',border:'none',cursor:'pointer',padding:0}}>
                {pr.name} <span style={{fontFamily:mono,fontStyle:'normal'}}>{pr.bpm}</span>
              </button>
            ))}
          </div>

          <Rule/>

          {/* Footer: sound chips + visual-cue 'more' */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:16}}>
            <SoundChips value={metronome.sound} onChange={(v)=>setMetronome(m=>({...m,sound:v}))}/>
            <div style={{position:'relative'}}>
              <button onClick={()=>setMoreOpen(o=>!o)} style={{background:'transparent',border:0,color:MUTED,cursor:'pointer',fontFamily:mono,fontSize:10,letterSpacing:'0.24em',textTransform:'uppercase',padding:'4px 0'}}>
                visual · {visualMode}
              </button>
              {moreOpen&&(
                <div style={{position:'absolute',right:0,bottom:'calc(100% + 6px)',background:SURFACE,border:`1px solid ${LINE_STR}`,padding:'12px 14px',minWidth:180,zIndex:5,boxShadow:'0 12px 32px -10px rgba(0,0,0,0.6)'}}>
                  <div style={{fontFamily:mono,fontSize:9,letterSpacing:'0.28em',color:FAINT,marginBottom:8,textTransform:'uppercase'}}>Visual cue</div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {VISUAL_OPTS.map(o=>(
                      <button key={o.value} onClick={()=>{setMetronome(m=>({...m,visualMode:o.value}));setMoreOpen(false);}} style={{background:visualMode===o.value?SURFACE2:'transparent',color:visualMode===o.value?TEXT:MUTED,border:0,textAlign:'left',padding:'6px 8px',fontFamily:serif,fontStyle:'italic',fontSize:14,cursor:'pointer'}}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
