import React from 'react';
import {FAINT, MUTED, IKB, LINE_MED, sans} from '../constants/theme.js';

const LABEL_W='56px';

export function MetronomeAccentEditor({beats, accentPattern, onChange, showLabel}){
  const pat=accentPattern||[];
  const isStrong=(i)=>i===0||pat.includes(i);
  const toggle=(i)=>{
    if(i===0)return;
    const next=pat.includes(i)?pat.filter(x=>x!==i):[...pat,i].sort((a,b)=>a-b);
    onChange(next);
  };
  const bars=(
    <>
      <div style={{display:'flex',alignItems:'flex-end',gap:'4px'}}>
        {Array.from({length:beats},(_,i)=>(
          <div key={i} role="button" tabIndex={0} onClick={()=>toggle(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')toggle(i);}} style={{
            width:'11px',
            height:isStrong(i)?'24px':'8px',
            background:isStrong(i)?IKB:LINE_MED,
            cursor:i===0?'default':'pointer',
            transition:'height 100ms ease, background 100ms ease',
            borderRadius:'2px',
          }}/>
        ))}
      </div>
      {pat.length>0&&(
        <button type="button" onClick={()=>onChange([])} style={{
          color:FAINT,fontSize:'9px',fontFamily:sans,
          background:'none',border:'none',cursor:'pointer',
          letterSpacing:'0.18em',textTransform:'uppercase',marginLeft:'8px',
        }}>reset</button>
      )}
    </>
  );
  if(showLabel){
    return (
      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
        <span className="uppercase" style={{
          flexShrink:0,width:LABEL_W,color:MUTED,fontSize:'9px',
          letterSpacing:'0.22em',fontFamily:sans,
        }}>Accent</span>
        {bars}
      </div>
    );
  }
  return <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>{bars}</div>;
}
