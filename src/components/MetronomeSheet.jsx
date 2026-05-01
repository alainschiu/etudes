import React from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Zap from 'lucide-react/dist/esm/icons/zap';
import {
  BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM,
  LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, serif, sans, mono,
  Z_SHEET,
} from '../constants/theme.js';

export default function MetronomeSheet({open, onClose, metronome, setMetronome, handleTap, currentBeat, currentSub}) {
  const accel = metronome.accel;
  const isDotSub = metronome.subdivision === 'dot';
  const effectiveSub = isDotSub ? 1 : (typeof metronome.subdivision === 'number' ? metronome.subdivision : 1);
  const noteValOpts = [{v:'2',label:'2'},{v:'4',label:'4'},{v:'8',label:'8'},{v:'16',label:'16'}];
  const subOpts = [{value:1,label:'♩'},{value:2,label:'♫'},{value:3,label:'♩₃'},{value:4,label:'♬'},{value:'dot',label:'♩.'}];
  const tempos = [
    {bpm:60,name:'Larghetto'},{bpm:72,name:'Adagio'},{bpm:92,name:'Andante'},
    {bpm:108,name:'Moderato'},{bpm:120,name:'Allegro'},{bpm:144,name:'Vivace'},{bpm:176,name:'Presto'},
  ];
  const visualMode = metronome.visualMode || 'bars';

  const sheetStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '62vh',
    background: 'rgba(17,16,16,0.94)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderTop: `1px solid ${LINE_STR}`,
    zIndex: Z_SHEET,
    transform: open ? 'translateY(0)' : 'translateY(100%)',
    transition: open
      ? 'transform 240ms ease-out'
      : 'transform 200ms ease-in',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  };

  const scrimStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: Z_SHEET - 1,
    opacity: open ? 1 : 0,
    transition: 'opacity 200ms ease',
    pointerEvents: open ? 'auto' : 'none',
  };

  return (
    <>
      <div style={scrimStyle} onClick={onClose}/>
      <div style={sheetStyle}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}>
          <div style={{width:'36px',height:'3px',background:LINE_STR,borderRadius:'999px'}}/>
        </div>

        {/* Close button */}
        <div style={{display:'flex',justifyContent:'flex-end',padding:'4px 16px 0',flexShrink:0}}>
          <button onClick={onClose} style={{minWidth:'40px',minHeight:'40px',display:'flex',alignItems:'center',justifyContent:'center',color:FAINT,background:'transparent',border:'none',cursor:'pointer'}}>
            <ChevronDown size={18} strokeWidth={1.5}/>
          </button>
        </div>

        {/* BPM display */}
        <div style={{textAlign:'center',padding:'4px 24px 8px',flexShrink:0}}>
          <div style={{fontFamily:mono,fontSize:'42px',fontWeight:500,color:TEXT,lineHeight:1}}>{metronome.bpm}</div>
          <div style={{fontFamily:serif,fontStyle:'italic',fontSize:'12px',color:FAINT,marginTop:'4px'}}>
            {tempos.find(t=>Math.abs(t.bpm-metronome.bpm)<12)?.name||''}
          </div>
        </div>

        {/* Bars / Pulse toggle */}
        <div style={{display:'flex',justifyContent:'center',gap:0,padding:'0 24px 8px',flexShrink:0}}>
          {['bars','pulse'].map((mode,i)=>(
            <button key={mode} onClick={()=>setMetronome(m=>({...m,visualMode:mode}))}
              style={{
                padding:'4px 18px',
                border:`1px solid ${visualMode===mode?IKB:LINE_MED}`,
                background:visualMode===mode?IKB_SOFT:'transparent',
                color:visualMode===mode?TEXT:MUTED,
                fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',
                marginLeft:i===0?0:'-1px',cursor:'pointer',
              }}>
              {mode}
            </button>
          ))}
        </div>

        {/* Beat visualiser */}
        {visualMode==='bars'?(
          // Bars mode — 100–120px container, equal-width beat groups, beat labels below
          <div style={{padding:'0 24px 12px',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:'4px',height:'110px'}}>
              {Array.from({length:metronome.beats}).map((_,i)=>{
                const isA=metronome.running&&currentBeat===i;
                const isBeat1=i===0;
                return(
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',height:'100%',justifyContent:'flex-end'}}>
                    {/* subdivision bars */}
                    <div style={{width:'100%',display:'flex',alignItems:'flex-end',gap:'1px',flex:1}}>
                      {/* downbeat */}
                      <div style={{
                        flex:2,
                        height:isA&&isBeat1?'100px':isA?'72px':isBeat1?'58px':'40px',
                        background:isA?IKB:isBeat1?DIM:`rgba(244,238,227,0.18)`,
                        borderRadius:'1px',
                        transition:isA?'none':'height 150ms ease-out',
                        alignSelf:'flex-end',
                      }}/>
                      {/* subdivision marks */}
                      {effectiveSub>1&&Array.from({length:effectiveSub-1}).map((_,si)=>{
                        const isAS=metronome.running&&currentBeat===i&&currentSub===si+1;
                        return(
                          <div key={si} style={{
                            flex:1,
                            height:isAS?'50px':'24px',
                            background:isAS?IKB:'rgba(244,238,227,0.10)',
                            borderRadius:'1px',
                            transition:isAS?'none':'height 150ms ease-out',
                            alignSelf:'flex-end',
                          }}/>
                        );
                      })}
                    </div>
                    {/* beat number label */}
                    <div style={{fontFamily:mono,fontSize:'9px',color:isA?IKB:FAINT,lineHeight:1,paddingTop:'4px',flexShrink:0}}>{i+1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ):(
          // Pulse mode — single rectangle flashes per beat
          <div style={{padding:'0 24px 12px',flexShrink:0,display:'flex',justifyContent:'center',alignItems:'center',height:'110px'}}>
            {metronome.running?(()=>{
              const isBeat1=currentBeat===0;
              return(
                <div style={{
                  width:'80px',
                  height: isBeat1?'90px':'64px',
                  background:isBeat1?IKB:DIM,
                  opacity:currentBeat>=0?1:0,
                  boxShadow:isBeat1?`0 0 24px ${IKB}80`:'none',
                  borderRadius:'2px',
                  transition:'height 120ms ease-out, opacity 120ms ease-out, box-shadow 120ms ease-out',
                }}/>
              );
            })():(
              <div style={{width:'80px',height:'64px',background:`rgba(244,238,227,0.08)`,borderRadius:'2px'}}/>
            )}
          </div>
        )}

        <div style={{flex:1,overflowY:'auto',padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:'16px'}}>
          {/* Tap + BPM slider */}
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <button
              onClick={handleTap}
              style={{flex:1,minHeight:'64px',background:'transparent',border:`1px solid ${LINE}`,borderRadius:'4px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
            >
              <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.28em',color:FAINT}}>Tap tempo</span>
            </button>
          </div>
          <input
            type="range" min="40" max="240"
            value={metronome.bpm}
            onChange={e=>setMetronome(m=>({...m,bpm:+e.target.value}))}
            style={{width:'100%',accentColor:IKB}}
          />

          {/* Time sig row */}
          <div style={{display:'flex',gap:'16px',alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>Beats</span>
              <button onClick={()=>setMetronome(m=>({...m,beats:Math.max(1,m.beats-1)}))} style={{width:'28px',height:'28px',border:`1px solid ${LINE_MED}`,color:TEXT,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
              <span style={{fontFamily:serif,fontWeight:300,fontSize:'20px',minWidth:'20px',textAlign:'center',color:TEXT}}>{metronome.beats}</span>
              <button onClick={()=>setMetronome(m=>({...m,beats:Math.min(16,m.beats+1)}))} style={{width:'28px',height:'28px',border:`1px solid ${LINE_MED}`,color:TEXT,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>Note</span>
              <div style={{display:'flex'}}>
                {noteValOpts.map(o=>(
                  <button key={o.v} onClick={()=>setMetronome(m=>({...m,noteValue:o.v}))} style={{padding:'4px 10px',border:`1px solid ${metronome.noteValue===o.v?IKB:LINE_MED}`,background:metronome.noteValue===o.v?IKB_SOFT:'transparent',color:metronome.noteValue===o.v?TEXT:MUTED,fontFamily:serif,fontSize:'13px',marginLeft:'-1px',cursor:'pointer'}}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Sub row */}
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>Sub</span>
            <div style={{display:'flex'}}>
              {subOpts.map(s=>(
                <button key={s.value} onClick={()=>setMetronome(m=>({...m,subdivision:s.value}))} style={{padding:'4px 10px',border:`1px solid ${metronome.subdivision===s.value?IKB:LINE_MED}`,background:metronome.subdivision===s.value?IKB_SOFT:'transparent',color:metronome.subdivision===s.value?TEXT:MUTED,fontFamily:serif,fontSize:'13px',marginLeft:'-1px',cursor:'pointer'}}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>Sound</span>
            {['click','wood','beep'].map(s=>(
              <button key={s} onClick={()=>setMetronome(m=>({...m,sound:s}))} style={{padding:'4px 10px',border:`1px solid ${metronome.sound===s?IKB:LINE_MED}`,background:metronome.sound===s?IKB_SOFT:'transparent',color:metronome.sound===s?TEXT:MUTED,fontFamily:sans,fontSize:'10px',letterSpacing:'0.18em',textTransform:'uppercase',marginLeft:'-1px',cursor:'pointer'}}>{s}</button>
            ))}
          </div>

          {/* Accel */}
          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
            <span className="uppercase" style={{display:'flex',alignItems:'center',gap:'4px',color:FAINT,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>
              <Zap size={10} strokeWidth={1.5}/> Accel
            </span>
            <button onClick={()=>setMetronome(m=>({...m,accel:{...m.accel,enabled:!m.accel.enabled}}))} style={{padding:'4px 10px',border:`1px solid ${accel.enabled?IKB:LINE_MED}`,background:accel.enabled?IKB_SOFT:'transparent',color:accel.enabled?TEXT:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',cursor:'pointer'}}>
              {accel.enabled?'Enabled':'Off'}
            </button>
            {accel.enabled && (
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginTop:'4px',width:'100%'}}>
                <span style={{color:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.18em',textTransform:'uppercase'}}>Target</span>
                <input type="number" min="40" max="300" value={accel.targetBpm} onChange={e=>{const n=parseInt(e.target.value,10);if(Number.isFinite(n)&&n>0)setMetronome(m=>({...m,accel:{...m.accel,targetBpm:n}}));}} style={{width:'52px',background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:'12px',padding:'3px 6px',textAlign:'right'}}/>
                <span style={{color:FAINT,fontFamily:mono,fontSize:'9px'}}>bpm</span>
              </div>
            )}
          </div>

          {/* Volume */}
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>Vol</span>
            <input type="range" min="0" max="0.6" step="0.01" value={metronome.clickVolume??0.22} onChange={e=>setMetronome(m=>({...m,clickVolume:+e.target.value}))} style={{flex:1,accentColor:IKB}}/>
            <span style={{fontFamily:mono,color:MUTED,fontSize:'10px',minWidth:'32px',textAlign:'right'}}>{Math.round(((metronome.clickVolume??0.22)/0.6)*100)}%</span>
          </div>
        </div>
      </div>
    </>
  );
}
