import React,{useState} from 'react';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Lock from 'lucide-react/dist/esm/icons/lock';
import LockOpen from 'lucide-react/dist/esm/icons/lock-open';
import {TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,WARM,WARM_SOFT,serif,mono} from '../constants/theme.js';
import {idbGet} from '../lib/storage.js';
import {Waveform,RefTrackPlayer} from './shared.jsx';

const ROLLING_LIMIT   = 10;
const ROLLING_WARN_AT = 7;

export default function PieceRecordingsPanel({
  item,
  pieceRecordingMeta,
  deletePieceRecording,
  lockPieceRecording,
  pieceRecordingItemId,
  dayClosed,
  // cross-piece AB (passed from RepertoireView)
  globalAbA,
  globalAbB,
  setGlobalAbA,
  setGlobalAbB,
  // reference track
  refTrackMeta,
  uploadRefTrack,
  deleteRefTrack,
}){
  const [open,setOpen]=useState(true);
  const [selected,setSelected]=useState(null);

  const itemMeta=pieceRecordingMeta?.[item.id]||{};
  const dates=Object.keys(itemMeta).sort().reverse(); // newest first

  const unlockedDates=dates.filter(d=>!(itemMeta[d]?.locked??false));
  const lockedDates=dates.filter(d=>(itemMeta[d]?.locked??false));
  const unlockedCount=unlockedDates.length;
  const lockedCount=lockedDates.length;

  const isActiveRecording=pieceRecordingItemId===item.id;

  const isA=(date)=>globalAbA?.itemId===item.id&&globalAbA?.date===date;
  const isB=(date)=>globalAbB?.itemId===item.id&&globalAbB?.date===date;

  const toggleA=(date)=>{
    if(isA(date)){setGlobalAbA(null);return;}
    // if this date was in B slot for this item, clear B
    if(isB(date))setGlobalAbB(null);
    setGlobalAbA({itemId:item.id,date,meta:itemMeta[date],title:item.title});
  };
  const toggleB=(date)=>{
    if(isB(date)){setGlobalAbB(null);return;}
    if(isA(date))setGlobalAbA(null);
    setGlobalAbB({itemId:item.id,date,meta:itemMeta[date],title:item.title});
  };

  const selectRow=(date)=>setSelected(p=>p===date?null:date);

  // In-panel A/B: both slots set AND both belong to this piece
  const showLocalAB=!!(globalAbA&&globalAbB&&globalAbA.itemId===item.id&&globalAbB.itemId===item.id);

  // Single-click preview only when A/B panel is not active for this piece
  const previewDate=showLocalAB?null:selected;
  const previewEntry=previewDate?itemMeta[previewDate]:null;

  return (
    <div className="mb-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <button onClick={()=>setOpen(v=>!v)} className="w-full uppercase mb-2 flex items-center gap-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>
        <Mic className="w-3 h-3" strokeWidth={1.25}/>
        Recordings
        {/* Slot counters */}
        {dates.length>0&&(
          <span className="flex items-center gap-2" style={{fontFamily:mono,letterSpacing:'0.08em'}}>
            <span style={{color:DIM}}>{unlockedCount}/{ROLLING_LIMIT}</span>
            {lockedCount>0&&(
              <span className="flex items-center gap-0.5" style={{color:WARM}}>
                <Lock className="w-2.5 h-2.5" strokeWidth={1.5}/>
                <span>{lockedCount}</span>
              </span>
            )}
          </span>
        )}
        {isActiveRecording&&<span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#c0392b',flexShrink:0,display:'inline-block'}} className="animate-pulse"/>}
        {open?<ChevronUp className="w-3 h-3 ml-auto" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 ml-auto" strokeWidth={1.25}/>}
      </button>

      {open&&(<>

      {/* ── Reference sub-label ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>
        <span className="uppercase shrink-0">Reference</span>
        <span style={{flex:1,height:'1px',background:'rgba(244,238,227,0.16)'}}/>
      </div>

      {/* ── Reference track ─────────────────────────────────────────────────── */}
      <RefTrackPlayer
        meta={refTrackMeta?.[item.id]}
        blobLoader={()=>idbGet('refTracks',item.id)}
        onUpload={(file,peaks)=>uploadRefTrack(item.id,file,peaks)}
        onDelete={()=>deleteRefTrack(item.id)}
      />

      {/* ── Recordings sub-label ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mt-2 mb-2" style={{fontSize:'9px',letterSpacing:'0.28em'}}>
        <span className="uppercase shrink-0" style={{color:FAINT}}>Recordings</span>
        <span style={{flex:1,height:'1px',background:LINE_MED}}/>
        {dates.length>0&&<span className="shrink-0 tabular-nums" style={{fontFamily:mono,color:DIM,letterSpacing:'0.08em'}}>{unlockedCount}/{ROLLING_LIMIT}</span>}
        {lockedCount>0&&<span className="shrink-0 flex items-center gap-0.5" style={{color:WARM,fontFamily:mono}}><Lock className="w-2.5 h-2.5" strokeWidth={1.5}/>{lockedCount}</span>}
        {unlockedCount>=ROLLING_LIMIT&&<span className="uppercase shrink-0" style={{color:WARM,fontSize:'8px',letterSpacing:'0.14em'}}>rack full — next take deletes oldest</span>}
        {unlockedCount>=9&&unlockedCount<ROLLING_LIMIT&&<span className="uppercase shrink-0" style={{color:WARM,fontSize:'8px',letterSpacing:'0.14em'}}>{ROLLING_LIMIT-unlockedCount} slot{ROLLING_LIMIT-unlockedCount===1?'':'s'} left</span>}
        {unlockedCount>=ROLLING_WARN_AT&&unlockedCount<9&&<span className="uppercase shrink-0" style={{color:FAINT,fontSize:'8px',letterSpacing:'0.14em'}}>lock takes to keep them</span>}
        {unlockedCount>=ROLLING_WARN_AT&&lockPieceRecording&&(
          <button onClick={e=>{e.stopPropagation();const oldest=unlockedDates[unlockedDates.length-1];if(oldest)lockPieceRecording(item.id,oldest);}} className="shrink-0 uppercase" style={{color:WARM,fontSize:'7px',letterSpacing:'0.14em',marginLeft:'4px',border:`1px solid ${WARM}40`,padding:'1px 5px'}}>Lock oldest</button>
        )}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {dates.length===0&&(
        <div className="italic mb-2" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>No recordings yet.</div>
      )}

      {/* ── Compact ledger list ─────────────────────────────────────────────── */}
      {dates.length>0&&(
        <div className="etudes-scroll" style={{border:`1px solid ${LINE_STR}`,overflowY:'auto',maxHeight:'240px'}}>
          {dates.map((date,idx)=>{
            const entry=itemMeta[date];
            const locked=entry?.locked??false;
            const isSelRow=selected===date;
            const isARow=isA(date);
            const isBRow=isB(date);

            // Left border: locked → WARM, A slot → IKB, B slot → WARM, selected → IKB, else transparent
            const leftBorder=locked?WARM:isARow?IKB:isBRow?WARM:isSelRow?IKB:'transparent';
            const rowBg=locked?`${WARM}08`:isARow?IKB_SOFT:isBRow?WARM_SOFT:isSelRow?IKB_SOFT:'transparent';

            return (
              <div
                key={date}
                onClick={()=>selectRow(date)}
                className="group flex items-center cursor-pointer"
                style={{
                  borderBottom:idx<dates.length-1?`1px solid ${LINE}`:'none',
                  borderLeft:`2px solid ${leftBorder}`,
                  background:rowBg,
                  transition:'background 100ms',
                }}
              >
                {/* Lock toggle */}
                <button
                  onClick={(e)=>{e.stopPropagation();lockPieceRecording&&lockPieceRecording(item.id,date);}}
                  title={locked?'Unlock recording':'Lock recording (exempt from auto-purge)'}
                  style={{padding:'9px 6px 9px 8px',color:locked?WARM:FAINT,cursor:'pointer',flexShrink:0,transition:'color 120ms'}}
                  onMouseEnter={e=>e.currentTarget.style.color=locked?MUTED:WARM}
                  onMouseLeave={e=>e.currentTarget.style.color=locked?WARM:FAINT}
                >
                  {locked
                    ?<Lock className="w-2.5 h-2.5" strokeWidth={1.5}/>
                    :<LockOpen className="w-2.5 h-2.5" strokeWidth={1.5}/>
                  }
                </button>

                {/* Index */}
                <span style={{fontFamily:mono,color:isSelRow||isARow||isBRow?IKB:DIM,fontSize:'9px',letterSpacing:'0.1em',padding:'9px 6px 9px 2px',minWidth:'24px',textAlign:'right',flexShrink:0}}>
                  {String(idx+1).padStart(2,'0')}
                </span>
                {/* Date */}
                <span style={{fontFamily:mono,color:isSelRow?TEXT:MUTED,fontSize:'10px',letterSpacing:'0.06em',padding:'9px 0 9px 6px',minWidth:'80px',flexShrink:0}}>
                  {date}
                </span>
                {/* BPM */}
                <span style={{fontFamily:mono,color:FAINT,fontSize:'9px',letterSpacing:'0.06em',padding:'9px 8px',minWidth:'40px',flexShrink:0}}>
                  {entry?.bpm?`↓ ${entry.bpm}`:'—'}
                </span>
                {/* Stage */}
                <span style={{fontFamily:serif,fontStyle:'italic',color:FAINT,fontSize:'11px',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'9px 4px'}}>
                  {entry?.stage||''}
                </span>
                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 px-2" onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>toggleA(date)} style={{fontSize:'8px',letterSpacing:'0.18em',padding:'2px 6px',border:`1px solid ${isARow?IKB:LINE_MED}`,background:isARow?IKB_SOFT:'transparent',color:isARow?IKB:FAINT,cursor:'pointer'}}>A</button>
                  <button onClick={()=>toggleB(date)} style={{fontSize:'8px',letterSpacing:'0.18em',padding:'2px 6px',border:`1px solid ${isBRow?WARM:LINE_MED}`,background:isBRow?WARM_SOFT:'transparent',color:isBRow?WARM:FAINT,cursor:'pointer'}}>B</button>
                  <button
                    onClick={()=>!locked&&deletePieceRecording(item.id,date)}
                    title={locked?'Unlock before deleting':'Delete recording'}
                    style={{color:locked?LINE_STR:FAINT,cursor:locked?'not-allowed':'pointer',padding:'0 2px'}}
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.25}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Local A/B comparison (same piece) ──────────────────────────────── */}
      {showLocalAB&&(
        <div style={{border:`1px solid ${LINE_STR}`,borderTop:'none'}}>
          <div className="flex items-center gap-2 px-3 py-1.5" style={{borderBottom:`1px solid ${LINE}`,background:`${IKB}06`}}>
            <span style={{fontFamily:mono,fontSize:'8px',letterSpacing:'0.22em',color:IKB}}>A</span>
            <span style={{fontFamily:mono,fontSize:'8px',letterSpacing:'0.12em',color:DIM}}>—</span>
            <span style={{fontFamily:mono,fontSize:'8px',letterSpacing:'0.22em',color:WARM}}>B</span>
            <span className="uppercase" style={{fontFamily:mono,fontSize:'8px',letterSpacing:'0.18em',color:FAINT,marginLeft:'4px'}}>Comparison</span>
            <button onClick={()=>{setGlobalAbA(null);setGlobalAbB(null);}} className="ml-auto uppercase" style={{fontFamily:mono,fontSize:'7px',letterSpacing:'0.18em',color:DIM,cursor:'pointer'}}>clear</button>
          </div>
          <div className="flex">
            {[{slot:'A',ab:globalAbA,accent:IKB,soft:IKB_SOFT},{slot:'B',ab:globalAbB,accent:WARM,soft:WARM_SOFT}].map(({slot,ab,accent,soft},i)=>{
              const entry=itemMeta[ab.date];
              return (
                <div key={slot} className="flex-1 min-w-0 p-3" style={{borderRight:i===0?`1px solid ${LINE}`:'none',background:soft}}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span style={{fontFamily:mono,color:accent,fontSize:'10px',letterSpacing:'0.22em',fontWeight:600}}>{slot}</span>
                    <span style={{fontFamily:mono,color:MUTED,fontSize:'10px',letterSpacing:'0.06em'}}>{ab.date}</span>
                    {entry?.bpm&&<span style={{fontFamily:mono,color:FAINT,fontSize:'9px'}}>↓ {entry.bpm}</span>}
                    {entry?.stage&&<span style={{fontFamily:serif,fontStyle:'italic',color:FAINT,fontSize:'11px'}}>{entry.stage}</span>}
                    {(entry?.locked??false)&&<Lock className="w-2.5 h-2.5" strokeWidth={1.5} style={{color:WARM}}/>}
                  </div>
                  <Waveform blobLoader={()=>idbGet('pieceRecordings',entry?.idbKey??`${item.id}__${ab.date}`)} meta={entry} accentColor={accent} accentSoft={soft}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Single preview (no A/B active for this piece) ──────────────────── */}
      {!showLocalAB&&previewDate&&previewEntry&&(
        <div style={{border:`1px solid ${LINE_STR}`,borderTop:'none',padding:'12px 14px 14px'}}>
          <div className="flex items-baseline gap-3 mb-3">
            <span style={{fontFamily:mono,color:IKB,fontSize:'9px',letterSpacing:'0.22em'}}>PREVIEW</span>
            <span style={{fontFamily:mono,color:MUTED,fontSize:'10px',letterSpacing:'0.06em'}}>{previewDate}</span>
            {previewEntry.bpm&&<span style={{fontFamily:mono,color:FAINT,fontSize:'9px',letterSpacing:'0.04em'}}>↓ {previewEntry.bpm}</span>}
            {previewEntry.stage&&<span style={{fontFamily:serif,fontStyle:'italic',color:FAINT,fontSize:'11px'}}>{previewEntry.stage}</span>}
            {(previewEntry.locked??false)&&<Lock className="w-2.5 h-2.5" strokeWidth={1.5} style={{color:WARM}}/>}
          </div>
          <Waveform blobLoader={()=>idbGet('pieceRecordings',`${item.id}__${previewDate}`)} meta={previewEntry}/>
        </div>
      )}

      </>)}
    </div>
  );
}
