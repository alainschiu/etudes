// V1 (Pass 5 · D1 pure) atoms for Metronome and Tuner surfaces.
// Repo color tokens; design font choices.
import React, {useState, useEffect, useRef} from 'react';
import {
  BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM,
  LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, WARN,
  serif, sans, mono,
} from '../constants/theme.js';

// ── Italian tempo zones ────────────────────────────────────────────────────
export const ZONES=[
  {name:'Larghetto',lo:40,hi:65},
  {name:'Adagio',lo:66,hi:76},
  {name:'Andante',lo:77,hi:108},
  {name:'Moderato',lo:109,hi:119},
  {name:'Allegro',lo:120,hi:167},
  {name:'Presto',lo:168,hi:240},
];
export const BPM_MIN=40, BPM_MAX=240;
export const zoneName=(bpm)=>(ZONES.find(z=>bpm>=z.lo&&bpm<=z.hi)||ZONES[0]).name;

// ── Eyebrow label ──────────────────────────────────────────────────────────
export function Eye({children,style}){
  return <span style={{fontFamily:mono,fontSize:'9.5px',letterSpacing:'0.24em',color:MUTED,textTransform:'uppercase',...style}}>{children}</span>;
}

// ── Hairline rule ──────────────────────────────────────────────────────────
export function Rule({tone='med',style}){
  return <div style={{height:1,background:tone==='strong'?LINE_STR:LINE_MED,...style}}/>;
}

// ── BPM hero (tap-to-type, mono numerals) ──────────────────────────────────
export function BPMHero({bpm,onChange,fontSize=120}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(String(bpm));
  useEffect(()=>{setDraft(String(bpm));},[bpm]);
  const commit=()=>{const v=Math.max(BPM_MIN,Math.min(BPM_MAX,parseInt(draft,10)||bpm));onChange(v);setEditing(false);};
  return (
    <div style={{position:'relative',display:'inline-block',cursor:'pointer'}} onClick={()=>!editing&&setEditing(true)}>
      {editing?(
        <input autoFocus type="number" value={draft}
          onChange={e=>setDraft(e.target.value)} onBlur={commit}
          onKeyDown={e=>{if(e.key==='Enter')commit();if(e.key==='Escape'){setDraft(String(bpm));setEditing(false);}}}
          style={{fontFamily:mono,fontSize,lineHeight:0.82,fontWeight:300,color:TEXT,background:'transparent',border:`1px solid ${LINE_STR}`,padding:'4px 8px',width:`${String(bpm).length+1}ch`,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.04em'}}/>
      ):(
        <span style={{fontFamily:mono,fontSize,lineHeight:0.82,fontWeight:300,color:TEXT,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.04em',display:'inline-block'}}>{bpm}</span>
      )}
    </div>
  );
}

// ── Tempo slider with active-zone Italian labels ───────────────────────────
export function TempoSlider({bpm,onChange,showLabels=true,height=38}){
  const trackRef=useRef(null);
  const pct=(bpm-BPM_MIN)/(BPM_MAX-BPM_MIN);
  const active=zoneName(bpm);
  const handleDown=(clientX)=>{
    if(!trackRef.current)return;
    const r=trackRef.current.getBoundingClientRect();
    const p=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
    onChange(Math.round(BPM_MIN+p*(BPM_MAX-BPM_MIN)));
  };
  const startDrag=(clientX)=>{
    handleDown(clientX);
    const m=(ev)=>handleDown(ev.touches?ev.touches[0].clientX:ev.clientX);
    const u=()=>{document.removeEventListener('mousemove',m);document.removeEventListener('mouseup',u);document.removeEventListener('touchmove',m);document.removeEventListener('touchend',u);};
    document.addEventListener('mousemove',m);document.addEventListener('mouseup',u);
    document.addEventListener('touchmove',m,{passive:true});document.addEventListener('touchend',u);
  };
  return (
    <div style={{width:'100%',lineHeight:0}}>
      <div ref={trackRef}
        onMouseDown={e=>startDrag(e.clientX)}
        onTouchStart={e=>startDrag(e.touches[0].clientX)}
        style={{position:'relative',height,cursor:'pointer',userSelect:'none',touchAction:'none'}}>
        <div style={{position:'absolute',left:0,right:0,top:'50%',height:1,background:LINE_MED,transform:'translateY(-50%)'}}/>
        <div style={{position:'absolute',left:0,top:'50%',height:1,background:IKB,width:`${pct*100}%`,transform:'translateY(-50%)'}}/>
        {ZONES.slice(1).map((z,i)=>{
          const t=(z.lo-BPM_MIN)/(BPM_MAX-BPM_MIN);
          return <div key={i} style={{position:'absolute',left:`${t*100}%`,top:'50%',width:1,height:6,background:LINE_MED,transform:'translate(-50%,-50%)'}}/>;
        })}
        <div style={{position:'absolute',left:`${pct*100}%`,top:'50%',width:10,height:10,borderRadius:'50%',background:IKB,transform:'translate(-50%,-50%)'}}/>
      </div>
      {showLabels&&(
        <div style={{position:'relative',height:16,marginTop:4,lineHeight:1}}>
          {ZONES.map(z=>{
            const center=((z.lo+z.hi)/2-BPM_MIN)/(BPM_MAX-BPM_MIN);
            const isActive=z.name===active;
            return <span key={z.name} style={{position:'absolute',left:`${center*100}%`,top:0,transform:'translateX(-50%)',fontFamily:serif,fontStyle:'italic',fontSize:11,color:isActive?TEXT:FAINT,whiteSpace:'nowrap',transition:'color 120ms'}}>{z.name}</span>;
          })}
        </div>
      )}
    </div>
  );
}

// ── Volume slider (0–1 range, scaled to 0–100%) ────────────────────────────
export function VolumeSlider({value,onChange,max=1,height=22}){
  const trackRef=useRef(null);
  const pct=value/max;
  const handleDown=(clientX)=>{
    if(!trackRef.current)return;
    const r=trackRef.current.getBoundingClientRect();
    const p=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
    onChange(+(p*max).toFixed(3));
  };
  const startDrag=(clientX)=>{
    handleDown(clientX);
    const m=(ev)=>handleDown(ev.touches?ev.touches[0].clientX:ev.clientX);
    const u=()=>{document.removeEventListener('mousemove',m);document.removeEventListener('mouseup',u);document.removeEventListener('touchmove',m);document.removeEventListener('touchend',u);};
    document.addEventListener('mousemove',m);document.addEventListener('mouseup',u);
    document.addEventListener('touchmove',m,{passive:true});document.addEventListener('touchend',u);
  };
  return (
    <div ref={trackRef}
      onMouseDown={e=>startDrag(e.clientX)}
      onTouchStart={e=>startDrag(e.touches[0].clientX)}
      style={{position:'relative',height,cursor:'pointer',userSelect:'none',width:'100%',touchAction:'none'}}>
      <div style={{position:'absolute',left:0,right:0,top:'50%',height:1,background:LINE_MED,transform:'translateY(-50%)'}}/>
      <div style={{position:'absolute',left:0,top:'50%',height:1,background:IKB,width:`${pct*100}%`,transform:'translateY(-50%)'}}/>
      <div style={{position:'absolute',left:`${pct*100}%`,top:'50%',width:10,height:10,borderRadius:'50%',background:IKB,transform:'translate(-50%,-50%)'}}/>
    </div>
  );
}

// ── Slider row (label + right readout above slider) ────────────────────────
export function SliderRow({label,right,children}){
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
        <Eye>{label}</Eye>
        {right!=null&&<span style={{fontFamily:mono,fontSize:11,color:MUTED,fontVariantNumeric:'tabular-nums'}}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Time signature flip card ───────────────────────────────────────────────
// Top +/− steps beats (numerator, 1..maxBeats).
// Bottom +/− steps denom (cycles 1, 2, 4, 8, 16).
const DENOM_OPTS=['1','2','4','8','16'];
export function TimeSigFlip({beats,onBeatsChange,denom='4',onDenomChange,minBeats=1,maxBeats=16,size='md'}){
  const ds=size==='sm'?{w:64,h:96,num:22,btn:18}
         :size==='lg'?{w:96,h:152,num:40,btn:26}
         :{w:78,h:122,num:28,btn:22};
  const denomStr=String(denom);
  const idx=Math.max(0,DENOM_OPTS.indexOf(denomStr));
  const stepDenom=(d)=>{const ni=(idx+d+DENOM_OPTS.length)%DENOM_OPTS.length;onDenomChange&&onDenomChange(DENOM_OPTS[ni]);};
  const stepBtn=(onClick,glyph,border)=>(
    <button type="button" onClick={onClick} style={{flex:1,height:ds.btn,background:'transparent',border:0,color:MUTED,fontFamily:mono,fontSize:11,cursor:'pointer',...border}}>{glyph}</button>
  );
  return (
    <div style={{display:'inline-block'}}>
      <div style={{width:ds.w,height:ds.h,border:`1px solid ${LINE_MED}`,background:BG,display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
        {/* Top: ±beats */}
        <div style={{display:'flex',borderBottom:`1px solid ${LINE_MED}`}}>
          {stepBtn(()=>onBeatsChange(Math.max(minBeats,beats-1)),'−',{borderRight:`1px solid ${LINE_MED}`})}
          {stepBtn(()=>onBeatsChange(Math.min(maxBeats,beats+1)),'+')}
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontFamily:mono,fontSize:ds.num,lineHeight:1,color:TEXT,fontVariantNumeric:'tabular-nums'}}>{beats}</span>
          <div style={{width:ds.num+14,height:1,background:LINE_MED,margin:'4px 0'}}/>
          <span style={{fontFamily:mono,fontSize:ds.num,lineHeight:1,color:TEXT,fontVariantNumeric:'tabular-nums'}}>{denomStr}</span>
        </div>
        {/* Bottom: ±denom (cycles 1/2/4/8/16) */}
        <div style={{display:'flex',borderTop:`1px solid ${LINE_MED}`}}>
          {stepBtn(()=>stepDenom(-1),'−',{borderRight:`1px solid ${LINE_MED}`})}
          {stepBtn(()=>stepDenom(1),'+')}
        </div>
      </div>
    </div>
  );
}

// ── Pulse dots (animated on currentBeat) ───────────────────────────────────
export function PulseDots({beats,accents=[0],active=-1,size=8,gap=8}){
  const accSet=Array.isArray(accents)?accents:[];
  const includes=(i)=>i===0||accSet.includes(i);
  return (
    <div style={{display:'inline-flex',gap,alignItems:'center'}}>
      {Array.from({length:beats}).map((_,i)=>{
        const isAccent=includes(i);
        const isActive=i===active;
        const d=isAccent?size+2:size;
        return <span key={i} style={{width:d,height:d,borderRadius:'50%',background:isActive?IKB:isAccent?MUTED:'transparent',border:isActive?0:`1px solid ${isAccent?MUTED:LINE_MED}`,transition:'background 80ms'}}/>;
      })}
    </div>
  );
}

// ── Accent toggle squares (sequencer; lights up on the active beat) ────────
export function AccentToggles({beats,accentPattern,onChange,active=-1,size=18,gap=9}){
  const pat=Array.isArray(accentPattern)?accentPattern:[];
  const isOn=(i)=>i===0||pat.includes(i);
  const toggle=(i)=>{
    if(i===0)return;
    const next=pat.includes(i)?pat.filter(x=>x!==i):[...pat,i].sort((a,b)=>a-b);
    onChange(next);
  };
  return (
    <div style={{display:'inline-flex',gap,flexWrap:'wrap'}}>
      {Array.from({length:beats}).map((_,i)=>{
        const on=isOn(i);
        const isActive=i===active;
        return (
          <button key={i} type="button" onClick={()=>toggle(i)} style={{
            width:size,height:size,padding:0,
            background:isActive?IKB:on?IKB:'transparent',
            border:`1px solid ${isActive?TEXT:on?IKB:LINE_MED}`,
            boxShadow:isActive?`0 0 8px ${IKB}`:'none',
            cursor:i===0?'default':'pointer',
            transition:isActive?'none':'box-shadow 120ms, background 120ms, border-color 120ms',
          }}/>
        );
      })}
    </div>
  );
}

// ── Subdivision stepper (1 / ½ / trip / ¼ / dotted) ────────────────────────
const SUB_LABELS={1:'beat',2:'½',3:'trip',4:'¼',dot:'♩.'};
const SUB_ORDER=[1,2,3,4,'dot'];
export function SubStepper({value,onChange,width=86}){
  const idx=Math.max(0,SUB_ORDER.indexOf(value));
  const step=(d)=>{const ni=Math.max(0,Math.min(SUB_ORDER.length-1,idx+d));onChange(SUB_ORDER[ni]);};
  return (
    <div style={{display:'inline-flex',alignItems:'center',border:`1px solid ${LINE_MED}`,height:24}}>
      <button type="button" onClick={()=>step(-1)} style={{width:22,height:'100%',background:'transparent',border:0,color:MUTED,fontFamily:mono,fontSize:11,cursor:'pointer'}}>−</button>
      <span style={{width:width-44,textAlign:'center',fontFamily:mono,fontSize:10,color:TEXT,letterSpacing:'0.04em'}}>{SUB_LABELS[value]||value}</span>
      <button type="button" onClick={()=>step(1)} style={{width:22,height:'100%',background:'transparent',border:0,color:MUTED,fontFamily:mono,fontSize:11,cursor:'pointer'}}>+</button>
    </div>
  );
}

// ── Generic numeric stepper ────────────────────────────────────────────────
export function NumStepper({value,onChange,min,max,format=(v)=>v,width=84}){
  return (
    <div style={{display:'inline-flex',alignItems:'center',border:`1px solid ${LINE_MED}`,height:24,width}}>
      <button type="button" onClick={()=>onChange(Math.max(min,value-1))} style={{width:22,height:'100%',background:'transparent',border:0,color:MUTED,fontFamily:mono,fontSize:11,cursor:'pointer'}}>−</button>
      <span style={{flex:1,textAlign:'center',fontFamily:mono,fontSize:11,color:TEXT,fontVariantNumeric:'tabular-nums'}}>{format(value)}</span>
      <button type="button" onClick={()=>onChange(Math.min(max,value+1))} style={{width:22,height:'100%',background:'transparent',border:0,color:MUTED,fontFamily:mono,fontSize:11,cursor:'pointer'}}>+</button>
    </div>
  );
}

// ── Segmented control ──────────────────────────────────────────────────────
export function Segmented({options,value,onChange,height=26,fontSize=10}){
  return (
    <div style={{display:'inline-flex',border:`1px solid ${LINE_MED}`,height}}>
      {options.map((o,i)=>{
        const v=typeof o==='string'?o:o.value;
        const label=typeof o==='string'?o:o.label;
        const active=v===value;
        return (
          <button key={v} type="button" onClick={()=>onChange(v)} style={{background:active?SURFACE2:'transparent',color:active?TEXT:MUTED,border:0,borderLeft:i?`1px solid ${LINE_MED}`:0,padding:'0 12px',fontFamily:mono,fontSize,letterSpacing:'0.06em',cursor:'pointer'}}>{label}</button>
        );
      })}
    </div>
  );
}

// ── Sound chips ────────────────────────────────────────────────────────────
export function SoundChips({value,onChange,options=['click','wood','beep'],fontSize=10,gap=10}){
  return (
    <div style={{display:'inline-flex',gap}}>
      {options.map(o=>(
        <button key={o} type="button" onClick={()=>onChange(o)} style={{background:value===o?SURFACE2:'transparent',color:value===o?TEXT:MUTED,border:`1px solid ${value===o?LINE_STR:LINE_MED}`,padding:'3px 9px',fontFamily:mono,fontSize,letterSpacing:'0.04em',cursor:'pointer'}}>{o}</button>
      ))}
    </div>
  );
}

// ── Mode toggle (auto / accel pill) ────────────────────────────────────────
export function ModeToggle({label,value,onChange}){
  return (
    <button type="button" onClick={()=>onChange(!value)} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 8px',background:'transparent',border:`1px solid ${value?LINE_STR:LINE_MED}`,color:value?TEXT:MUTED,cursor:'pointer',fontFamily:mono,fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase'}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:value?IKB:LINE_MED}}/>
      {label}
    </button>
  );
}

// ── Transport (circular ▶/■, or wide variant) ──────────────────────────────
function Tri({size=12}){return <svg width={size} height={size} viewBox="0 0 12 12"><path d="M3 2 L10 6 L3 10 Z" fill="currentColor"/></svg>;}
function Sq({size=12}){return <svg width={size} height={size} viewBox="0 0 12 12"><rect x="3" y="3" width="6" height="6" fill="currentColor"/></svg>;}
export function Transport({running,onToggle,size=56,variant='circle',label}){
  if(variant==='wide'){
    return (
      <button type="button" onClick={onToggle} style={{width:'100%',height:size,background:running?IKB_SOFT:'transparent',border:`1px solid ${running?IKB:LINE_STR}`,color:running?TEXT:TEXT,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:12,fontFamily:mono,fontSize:11,letterSpacing:'0.24em',textTransform:'uppercase'}}>
        <span style={{display:'inline-flex'}}>{running?<Sq size={12}/>:<Tri size={12}/>}</span>
        {label||(running?'stop':'play')}
      </button>
    );
  }
  return (
    <button type="button" onClick={onToggle} style={{width:size,height:size,borderRadius:'50%',background:running?IKB:'transparent',border:`1px solid ${running?IKB:LINE_STR}`,color:TEXT,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
      {running?<Sq size={Math.max(12,Math.round(size*0.22))}/>:<Tri size={Math.max(12,Math.round(size*0.22))}/>}
    </button>
  );
}

// ── Tap button ─────────────────────────────────────────────────────────────
export function TapButton({onTap,size='md'}){
  const sz=size==='sm'?{w:56,h:28,fs:10}:{w:64,h:36,fs:11};
  return (
    <button type="button" onClick={onTap} style={{width:sz.w,height:sz.h,background:'transparent',border:`1px solid ${LINE_STR}`,color:MUTED,fontFamily:mono,fontSize:sz.fs,letterSpacing:'0.24em',textTransform:'uppercase',cursor:'pointer'}}>tap</button>
  );
}

// ── V5 Keyboard (sharps row above whites in scale slots) ───────────────────
const WHITES=['C','D','E','F','G','A','B'];
const SHARPS=[
  {name:'C#',gap:0},
  {name:'D#',gap:1},
  {name:'F#',gap:3},
  {name:'G#',gap:4},
  {name:'A#',gap:5},
];
export function Keyboard({note,onNoteChange,width,height=200,getCentTone}){
  const sharpH=Math.round(height*0.62);
  const whiteW=100/7;
  const sharpW=whiteW*0.62;
  const baseCell={
    boxSizing:'border-box',display:'flex',alignItems:'flex-end',justifyContent:'center',
    cursor:'pointer',userSelect:'none',background:'transparent',border:0,padding:0,
    color:MUTED,fontFamily:mono,fontSize:11,letterSpacing:'0.04em',transition:'background 80ms, color 80ms',
  };
  return (
    <div style={{width:width||'100%',height,border:`1px solid ${LINE_MED}`,background:BG,position:'relative',boxSizing:'border-box'}}>
      <div style={{position:'absolute',inset:0,display:'flex'}}>
        {WHITES.map((w,i)=>{
          const active=note===w;
          const tone=getCentTone?getCentTone(w):null;
          return (
            <button key={w} type="button" onClick={()=>onNoteChange(w)} style={{
              ...baseCell,flex:1,
              borderLeft:i===0?0:`1px solid ${LINE_MED}`,
              background:active?SURFACE2:'transparent',
              color:active?TEXT:MUTED,
              paddingBottom:8,
            }}>
              {tone&&<span style={{position:'absolute',top:6,fontSize:6,color:tone,lineHeight:1}}>●</span>}
              <span style={{position:'relative'}}>{w}</span>
            </button>
          );
        })}
      </div>
      <div style={{position:'absolute',left:0,right:0,top:0,height:sharpH,pointerEvents:'none'}}>
        {SHARPS.map(s=>{
          const active=note===s.name;
          const leftPct=(s.gap+1)*whiteW;
          const tone=getCentTone?getCentTone(s.name):null;
          return (
            <button key={s.name} type="button" onClick={()=>onNoteChange(s.name)} style={{
              ...baseCell,position:'absolute',left:`${leftPct}%`,top:0,
              transform:'translateX(-50%)',width:`${sharpW}%`,height:'100%',
              background:active?SURFACE2:BG,
              border:`1px solid ${active?TEXT:LINE_MED}`,
              color:active?TEXT:MUTED,
              pointerEvents:'auto',paddingBottom:6,
            }}>
              {tone&&<span style={{position:'absolute',top:4,fontSize:6,color:tone,lineHeight:1}}>●</span>}
              <span style={{position:'relative'}}>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
