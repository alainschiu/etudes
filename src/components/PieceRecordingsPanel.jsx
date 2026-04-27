import React,{useState} from 'react';
import {Mic,Square,Trash2,ChevronDown,ChevronUp} from 'lucide-react';
import {SURFACE2,TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,WARM,WARM_SOFT,serif,mono} from '../constants/theme.js';
import {idbGet} from '../lib/storage.js';
import {Waveform} from './shared.jsx';

export default function PieceRecordingsPanel({item,pieceRecordingMeta,startPieceRecording,stopPieceRecording,deletePieceRecording,pieceRecordingItemId,isRecording,currentBpm,dayClosed}){
  const [open,setOpen]=useState(true);
  const [abA,setAbA]=useState(null);
  const [abB,setAbB]=useState(null);
  const [selected,setSelected]=useState(null);

  const itemMeta=pieceRecordingMeta[item.id]||{};
  const dates=Object.keys(itemMeta).sort().reverse();

  const isActiveRecording=pieceRecordingItemId===item.id;
  const canRecord=!isRecording&&!pieceRecordingItemId&&!dayClosed;

  const toggleA=(date)=>{if(abA===date){setAbA(null);return;}if(abB===date)setAbB(null);setAbA(date);};
  const toggleB=(date)=>{if(abB===date){setAbB(null);return;}if(abA===date)setAbA(null);setAbB(date);};
  const selectRow=(date)=>setSelected(p=>p===date?null:date);

  const showAB=abA&&abB;
  const previewDate=showAB?null:selected;
  const previewEntry=previewDate?itemMeta[previewDate]:null;
  const listHasBorder=dates.length>0;

  return (
    <div className="mb-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <button onClick={()=>setOpen(v=>!v)} className="w-full uppercase mb-2 flex items-center gap-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>
        <Mic className="w-3 h-3" strokeWidth={1.25}/>
        Recordings
        {dates.length>0&&<span style={{fontFamily:mono,color:DIM,letterSpacing:'0.1em'}}>{String(dates.length).padStart(2,'0')}</span>}
        {isActiveRecording&&<span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#c0392b',flexShrink:0,display:'inline-block'}} className="animate-pulse"/>}
        {open?<ChevronUp className="w-3 h-3 ml-auto" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 ml-auto" strokeWidth={1.25}/>}
      </button>

      {open&&(<>

      {/* ── Rec / Stop button ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        {isActiveRecording?(
          <button onClick={stopPieceRecording} style={{display:'flex',alignItems:'center',gap:'6px',padding:'3px 10px',border:`1px solid #c0392b`,background:'rgba(192,57,43,0.1)',color:'#c0392b',cursor:'pointer',fontSize:'9px',letterSpacing:'0.28em'}}>
            <Square className="w-2.5 h-2.5" strokeWidth={1.25} fill="currentColor"/>
            <span className="uppercase animate-pulse">Stop</span>
          </button>
        ):(
          <button onClick={()=>startPieceRecording(item.id,currentBpm,item.stage)} disabled={!canRecord} style={{display:'flex',alignItems:'center',gap:'6px',padding:'3px 10px',border:`1px solid ${canRecord?LINE_STR:LINE}`,background:'transparent',color:canRecord?TEXT:FAINT,cursor:canRecord?'pointer':'not-allowed',fontSize:'9px',letterSpacing:'0.28em'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:canRecord?'#c0392b':FAINT,flexShrink:0,display:'inline-block'}}/>
            <span className="uppercase">Rec</span>
          </button>
        )}
      </div>

      {/* ── Active recording pill ───────────────────────────────────────────── */}
      {isActiveRecording&&(
        <div className="flex items-center gap-2 mb-2">
          <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#c0392b',flexShrink:0}} className="animate-pulse"/>
          <span className="uppercase" style={{fontFamily:mono,color:'#c0392b',fontSize:'9px',letterSpacing:'0.28em'}}>Recording</span>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {dates.length===0&&!isActiveRecording&&(
        <div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>No recordings yet.</div>
      )}

      {/* ── Compact ledger list ─────────────────────────────────────────────── */}
      {dates.length>0&&(
        <div className="etudes-scroll" style={{border:`1px solid ${LINE_STR}`,overflowY:'auto',maxHeight:'204px'}}>
          {dates.map((date,idx)=>{
            const entry=itemMeta[date];
            const isA=abA===date;
            const isB=abB===date;
            const isSel=selected===date&&!showAB;
            return (
              <div
                key={date}
                onClick={()=>selectRow(date)}
                className="group flex items-center cursor-pointer"
                style={{
                  borderBottom:idx<dates.length-1?`1px solid ${LINE}`:'none',
                  borderLeft:`2px solid ${isSel?IKB:'transparent'}`,
                  background:isSel?IKB_SOFT:'transparent',
                }}
              >
                {/* Index */}
                <span style={{fontFamily:mono,color:isSel?IKB:DIM,fontSize:'9px',letterSpacing:'0.1em',padding:'9px 8px 9px 10px',minWidth:'32px',textAlign:'right',flexShrink:0}}>
                  {String(idx+1).padStart(2,'0')}
                </span>
                {/* Date */}
                <span style={{fontFamily:mono,color:isSel?TEXT:MUTED,fontSize:'10px',letterSpacing:'0.06em',padding:'9px 0 9px 8px',minWidth:'84px',flexShrink:0}}>
                  {date}
                </span>
                {/* BPM */}
                <span style={{fontFamily:mono,color:FAINT,fontSize:'9px',letterSpacing:'0.06em',padding:'9px 8px',minWidth:'44px',flexShrink:0}}>
                  {entry.bpm?`↓ ${entry.bpm}`:'—'}
                </span>
                {/* Stage */}
                <span style={{fontFamily:serif,fontStyle:'italic',color:FAINT,fontSize:'11px',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'9px 4px'}}>
                  {entry.stage||''}
                </span>
                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 px-2" onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>toggleA(date)} style={{fontSize:'8px',letterSpacing:'0.18em',padding:'2px 6px',border:`1px solid ${isA?IKB:LINE_MED}`,background:isA?IKB_SOFT:'transparent',color:isA?IKB:FAINT,cursor:'pointer'}}>A</button>
                  <button onClick={()=>toggleB(date)} style={{fontSize:'8px',letterSpacing:'0.18em',padding:'2px 6px',border:`1px solid ${isB?WARM:LINE_MED}`,background:isB?WARM_SOFT:'transparent',color:isB?WARM:FAINT,cursor:'pointer'}}>B</button>
                  <button onClick={()=>deletePieceRecording(item.id,date)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{color:FAINT,cursor:'pointer',padding:'0 2px'}}>
                    <Trash2 className="w-3 h-3" strokeWidth={1.25}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Single preview ──────────────────────────────────────────────────── */}
      {previewDate&&previewEntry&&(
        <div style={{border:`1px solid ${LINE_STR}`,borderTop:'none',padding:'12px 14px 14px'}}>
          <div className="flex items-baseline gap-3 mb-3">
            <span style={{fontFamily:mono,color:IKB,fontSize:'9px',letterSpacing:'0.22em'}}>PREVIEW</span>
            <span style={{fontFamily:mono,color:MUTED,fontSize:'10px',letterSpacing:'0.06em'}}>{previewDate}</span>
            {previewEntry.bpm&&<span style={{fontFamily:mono,color:FAINT,fontSize:'9px',letterSpacing:'0.04em'}}>↓ {previewEntry.bpm}</span>}
            {previewEntry.stage&&<span style={{fontFamily:serif,fontStyle:'italic',color:FAINT,fontSize:'11px'}}>{previewEntry.stage}</span>}
          </div>
          <Waveform blobLoader={()=>idbGet('pieceRecordings',`${item.id}__${previewDate}`)} meta={previewEntry}/>
        </div>
      )}

      {/* ── A / B comparison ────────────────────────────────────────────────── */}
      {showAB&&(
        <div style={{border:`1px solid ${LINE_STR}`,borderTop:listHasBorder?'none':`1px solid ${LINE_STR}`}}>
          {/* A/B header bar */}
          <div className="flex items-center gap-2 px-3 py-2" style={{borderBottom:`1px solid ${LINE}`}}>
            <span className="uppercase" style={{fontFamily:mono,color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>
              <span style={{color:IKB}}>A</span>
              <span style={{margin:'0 5px',color:DIM}}>—</span>
              <span style={{color:WARM}}>B</span>
              {' '}Comparison
            </span>
            <button onClick={()=>{setAbA(null);setAbB(null);}} className="ml-auto uppercase" style={{fontFamily:mono,color:DIM,fontSize:'8px',letterSpacing:'0.18em',cursor:'pointer'}}>clear</button>
          </div>
          {/* Two channels */}
          <div className="flex">
            {[{slot:'A',date:abA,accent:IKB,soft:IKB_SOFT},{slot:'B',date:abB,accent:WARM,soft:WARM_SOFT}].map(({slot,date,accent,soft},i)=>{
              const entry=itemMeta[date];
              return (
                <div key={slot} className="flex-1 min-w-0 p-4" style={{borderRight:i===0?`1px solid ${LINE}`:'none',background:soft}}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span style={{fontFamily:mono,color:accent,fontSize:'10px',letterSpacing:'0.22em',fontWeight:600}}>{slot}</span>
                    <span style={{fontFamily:mono,color:MUTED,fontSize:'10px',letterSpacing:'0.06em'}}>{date}</span>
                    {entry.bpm&&<span style={{fontFamily:mono,color:FAINT,fontSize:'9px'}}>↓ {entry.bpm}</span>}
                    {entry.stage&&<span style={{fontFamily:serif,fontStyle:'italic',color:FAINT,fontSize:'11px'}}>{entry.stage}</span>}
                  </div>
                  <Waveform blobLoader={()=>idbGet('pieceRecordings',`${item.id}__${date}`)} meta={entry}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </>)}

    </div>
  );
}
