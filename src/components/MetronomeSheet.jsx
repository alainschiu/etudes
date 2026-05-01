import React from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Zap from 'lucide-react/dist/esm/icons/zap';
import {
  BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM,
  LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, serif, sans, mono,
  Z_SHEET,
} from '../constants/theme.js';

// Consistent label width so all button rows left-align
const LABEL_W = '56px';

function Label({children}) {
  return (
    <span className="uppercase" style={{
      flexShrink:0, width:LABEL_W, color:FAINT, fontSize:'9px',
      letterSpacing:'0.22em', fontFamily:sans,
    }}>
      {children}
    </span>
  );
}

function Row({children, style={}}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',...style}}>
      {children}
    </div>
  );
}

function Seg({value, active, onClick, label, mono: useMono}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:'5px 10px',
        border:`1px solid ${active?IKB:LINE_MED}`,
        background:active?IKB_SOFT:'transparent',
        color:active?TEXT:MUTED,
        fontFamily:useMono?mono:serif,
        fontSize:'13px',
        marginLeft:'-1px',
        cursor:'pointer',
      }}
    >
      {label??value}
    </button>
  );
}

export default function MetronomeSheet({open, onClose, metronome, setMetronome, handleTap, currentBeat, currentSub}) {
  const accel = metronome.accel;
  const isDotSub = metronome.subdivision === 'dot';
  const noteValOpts = [{v:'2',label:'2'},{v:'4',label:'4'},{v:'8',label:'8'},{v:'16',label:'16'}];
  const subOpts = [{value:1,label:'♩'},{value:2,label:'♫'},{value:3,label:'♩₃'},{value:4,label:'♬'},{value:'dot',label:'♩.'}];
  const tempos = [
    {bpm:60,name:'Larghetto'},{bpm:72,name:'Adagio'},{bpm:92,name:'Andante'},
    {bpm:108,name:'Moderato'},{bpm:120,name:'Allegro'},{bpm:144,name:'Vivace'},{bpm:176,name:'Presto'},
  ];
  const visualMode = metronome.visualMode || 'bars';

  const sheetStyle = {
    position:'fixed', bottom:0, left:0, right:0, height:'70vh',
    background:'rgba(17,16,16,0.97)',
    backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
    borderTop:`1px solid ${LINE_STR}`,
    zIndex:Z_SHEET,
    transform:open?'translateY(0)':'translateY(100%)',
    transition:open?'transform 240ms ease-out':'transform 200ms ease-in',
    display:'flex', flexDirection:'column',
  };

  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:Z_SHEET-1,opacity:open?1:0,transition:'opacity 200ms ease',pointerEvents:open?'auto':'none'}} onClick={onClose}/>
      <div style={sheetStyle}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}>
          <div style={{width:'36px',height:'3px',background:LINE_STR,borderRadius:'999px'}}/>
        </div>
        {/* Close */}
        <div style={{display:'flex',justifyContent:'flex-end',padding:'4px 20px 0',flexShrink:0}}>
          <button onClick={onClose} style={{minWidth:'40px',minHeight:'40px',display:'flex',alignItems:'center',justifyContent:'center',color:FAINT,background:'transparent',border:'none',cursor:'pointer'}}>
            <ChevronDown size={18} strokeWidth={1.5}/>
          </button>
        </div>

        {/* BPM large */}
        <div style={{textAlign:'center',padding:'0 24px 10px',flexShrink:0}}>
          <div style={{fontFamily:mono,fontSize:'48px',fontWeight:500,color:TEXT,lineHeight:1}}>{metronome.bpm}</div>
          <div style={{fontFamily:serif,fontStyle:'italic',fontSize:'13px',color:FAINT,marginTop:'4px'}}>
            {tempos.find(t=>Math.abs(t.bpm-metronome.bpm)<12)?.name||''}
          </div>
        </div>

        {/* Bars / Pulse toggle */}
        <div style={{display:'flex',justifyContent:'center',padding:'0 24px 10px',flexShrink:0}}>
          {['bars','pulse'].map((mode,i)=>(
            <button key={mode} onClick={()=>setMetronome(m=>({...m,visualMode:mode}))}
              style={{padding:'5px 20px',border:`1px solid ${visualMode===mode?IKB:LINE_MED}`,background:visualMode===mode?IKB_SOFT:'transparent',color:visualMode===mode?TEXT:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',marginLeft:i===0?0:'-1px',cursor:'pointer'}}>
              {mode}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'0 20px 32px',display:'flex',flexDirection:'column',gap:'14px'}}>

          {/* Tap tempo */}
          <button onClick={handleTap} style={{width:'100%',minHeight:'56px',background:'transparent',border:`1px solid ${LINE}`,borderRadius:'4px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.28em',color:FAINT}}>Tap tempo</span>
          </button>

          {/* BPM slider */}
          <input type="range" min="40" max="240" value={metronome.bpm} onChange={e=>setMetronome(m=>({...m,bpm:+e.target.value}))} style={{width:'100%',accentColor:IKB}}/>

          {/* Beats */}
          <Row>
            <Label>Beats</Label>
            <button onClick={()=>setMetronome(m=>({...m,beats:Math.max(1,m.beats-1)}))} style={{width:'32px',height:'32px',border:`1px solid ${LINE_MED}`,color:TEXT,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>−</button>
            <span style={{fontFamily:serif,fontWeight:300,fontSize:'22px',minWidth:'24px',textAlign:'center',color:TEXT}}>{metronome.beats}</span>
            <button onClick={()=>setMetronome(m=>({...m,beats:Math.min(16,m.beats+1)}))} style={{width:'32px',height:'32px',border:`1px solid ${LINE_MED}`,color:TEXT,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>+</button>
          </Row>

          {/* Note value */}
          <Row>
            <Label>Note</Label>
            <div style={{display:'flex'}}>
              {noteValOpts.map(o=><Seg key={o.v} value={o.v} label={o.label} active={metronome.noteValue===o.v} onClick={()=>setMetronome(m=>({...m,noteValue:o.v}))}/>)}
            </div>
          </Row>

          {/* Subdivision */}
          <Row>
            <Label>Sub</Label>
            <div style={{display:'flex'}}>
              {subOpts.map(s=><Seg key={s.value} value={s.value} label={s.label} active={metronome.subdivision===s.value} onClick={()=>setMetronome(m=>({...m,subdivision:s.value}))}/>)}
            </div>
          </Row>

          {/* Sound */}
          <Row>
            <Label>Sound</Label>
            <div style={{display:'flex'}}>
              {['click','wood','beep'].map(s=>(
                <button key={s} onClick={()=>setMetronome(m=>({...m,sound:s}))} style={{padding:'5px 10px',border:`1px solid ${metronome.sound===s?IKB:LINE_MED}`,background:metronome.sound===s?IKB_SOFT:'transparent',color:metronome.sound===s?TEXT:MUTED,fontFamily:sans,fontSize:'10px',letterSpacing:'0.18em',textTransform:'uppercase',marginLeft:'-1px',cursor:'pointer'}}>{s}</button>
              ))}
            </div>
          </Row>

          {/* Volume */}
          <Row>
            <Label>Vol</Label>
            <input type="range" min="0" max="0.6" step="0.01" value={metronome.clickVolume??0.22} onChange={e=>setMetronome(m=>({...m,clickVolume:+e.target.value}))} style={{flex:1,accentColor:IKB}}/>
            <span style={{fontFamily:mono,color:MUTED,fontSize:'10px',minWidth:'32px',textAlign:'right'}}>{Math.round(((metronome.clickVolume??0.22)/0.6)*100)}%</span>
          </Row>

          {/* Accel */}
          <div style={{borderTop:`1px solid ${LINE}`,paddingTop:'12px',display:'flex',flexDirection:'column',gap:'10px'}}>
            <Row>
              <Label style={{display:'flex',alignItems:'center',gap:'4px'}}><Zap size={10} strokeWidth={1.5} style={{display:'inline'}}/> Accel</Label>
              <button onClick={()=>setMetronome(m=>({...m,accel:{...m.accel,enabled:!m.accel.enabled}}))}
                style={{padding:'5px 12px',border:`1px solid ${accel.enabled?IKB:LINE_MED}`,background:accel.enabled?IKB_SOFT:'transparent',color:accel.enabled?TEXT:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',cursor:'pointer'}}>
                {accel.enabled?'On':'Off'}
              </button>
            </Row>
            {accel.enabled&&(<>
              <Row>
                <Label>Target</Label>
                <input type="number" min="40" max="300" value={accel.targetBpm}
                  onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,targetBpm:n}}));}}
                  style={{width:'56px',background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:'13px',padding:'4px 8px',textAlign:'right',outline:'none'}}/>
                <span style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.12em'}}>bpm</span>
              </Row>
              <Row>
                <Label>Step</Label>
                <span style={{color:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.12em'}}>+</span>
                <input type="number" min="1" max="20" value={accel.stepBpm}
                  onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,stepBpm:n}}));}}
                  style={{width:'44px',background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:'13px',padding:'4px 6px',textAlign:'right',outline:'none'}}/>
                <span style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.12em'}}>bpm every</span>
                <input type="number" min="1" max="64" value={accel.every}
                  onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,every:n}}));}}
                  style={{width:'44px',background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:'13px',padding:'4px 6px',textAlign:'right',outline:'none'}}/>
                <div style={{display:'flex',marginLeft:'2px'}}>
                  {['beat','bar'].map((u,i)=>(
                    <button key={u} onClick={()=>setMetronome(m=>({...m,accel:{...m.accel,unit:u}}))}
                      style={{padding:'4px 8px',border:`1px solid ${accel.unit===u?IKB:LINE_MED}`,background:accel.unit===u?IKB_SOFT:'transparent',color:accel.unit===u?TEXT:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.18em',textTransform:'uppercase',marginLeft:i===0?0:'-1px',cursor:'pointer'}}>
                      {u}
                    </button>
                  ))}
                </div>
              </Row>
            </>)}
          </div>

          {/* Tempo names */}
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',paddingTop:'4px'}}>
            {tempos.map(pr=>(
              <button key={pr.bpm} onClick={()=>setMetronome(m=>({...m,bpm:pr.bpm}))}
                style={{color:metronome.bpm===pr.bpm?IKB:MUTED,fontFamily:serif,fontStyle:'italic',fontSize:'13px',background:'none',border:'none',cursor:'pointer',padding:0}}>
                {pr.name} <span style={{fontFamily:mono,fontStyle:'normal'}}>{pr.bpm}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
