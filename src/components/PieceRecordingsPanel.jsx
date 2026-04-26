import React,{useState} from 'react';
import {Mic,Square,Trash2} from 'lucide-react';
import {SURFACE2,TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,serif,mono} from '../constants/theme.js';
import {idbGet} from '../lib/storage.js';
import {Waveform} from './shared.jsx';

export default function PieceRecordingsPanel({item,pieceRecordingMeta,startPieceRecording,stopPieceRecording,deletePieceRecording,pieceRecordingItemId,isRecording,currentBpm,dayClosed}){
  const [abA,setAbA]=useState(null);
  const [abB,setAbB]=useState(null);

  const itemMeta=pieceRecordingMeta[item.id]||{};
  const dates=Object.keys(itemMeta).sort().reverse();

  const isActiveRecording=pieceRecordingItemId===item.id;
  const canRecord=!isRecording&&!pieceRecordingItemId&&!dayClosed;

  const toggleA=(date)=>{if(abA===date){setAbA(null);return;}if(abB===date)setAbB(null);setAbA(date);};
  const toggleB=(date)=>{if(abB===date){setAbB(null);return;}if(abA===date)setAbA(null);setAbB(date);};

  const btnBase={display:'flex',alignItems:'center',gap:'6px',padding:'4px 10px',border:`1px solid ${LINE_STR}`,background:'transparent',cursor:'pointer',color:TEXT,fontSize:'10px',letterSpacing:'0.22em'};

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="uppercase flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>
          <Mic className="w-3 h-3" strokeWidth={1.25}/> Recordings{dates.length>0&&<span style={{color:DIM}}> · {dates.length}</span>}
        </div>
        {isActiveRecording?(
          <button onClick={stopPieceRecording} style={{...btnBase,border:`1px solid #A93226`,color:'#A93226',background:'rgba(169,50,38,0.08)'}}>
            <Square className="w-3 h-3" strokeWidth={1.25} fill="currentColor"/>
            <span className="uppercase animate-pulse">Stop</span>
          </button>
        ):(
          <button onClick={()=>startPieceRecording(item.id,currentBpm,item.stage)} disabled={!canRecord} style={{...btnBase,color:canRecord?TEXT:FAINT,border:`1px solid ${canRecord?LINE_STR:LINE}`,cursor:canRecord?'pointer':'not-allowed'}}>
            <Mic className="w-3 h-3" strokeWidth={1.25}/>
            <span className="uppercase">Record</span>
          </button>
        )}
      </div>

      {/* Active recording status */}
      {isActiveRecording&&(
        <div className="mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#A93226'}}/>
          <span className="uppercase" style={{color:'#A93226',fontSize:'9px',letterSpacing:'0.28em'}}>Recording in progress…</span>
        </div>
      )}

      {/* Empty state */}
      {dates.length===0&&!isActiveRecording&&(
        <div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No recordings for this piece yet.</div>
      )}

      {/* Entry list */}
      {dates.length>0&&(
        <div style={{border:`1px solid ${LINE}`}}>
          {dates.map((date,idx)=>{
            const entry=itemMeta[date];
            const key=`${item.id}__${date}`;
            const isA=abA===date;
            const isB=abB===date;
            return (
              <div key={date} style={{padding:'10px 12px',borderBottom:idx<dates.length-1?`1px solid ${LINE}`:'none'}}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="tabular-nums" style={{fontFamily:mono,color:MUTED,fontSize:'11px'}}>{date}</span>
                  {entry.bpm&&<span className="tabular-nums" style={{fontFamily:mono,color:FAINT,fontSize:'10px'}}>♩ {entry.bpm}</span>}
                  {entry.stage&&<span className="italic" style={{fontFamily:serif,color:FAINT,fontSize:'11px'}}>{entry.stage}</span>}
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={()=>toggleA(date)} className="uppercase" style={{fontSize:'9px',letterSpacing:'0.22em',padding:'2px 7px',border:`1px solid ${isA?IKB:LINE_MED}`,background:isA?IKB_SOFT:'transparent',color:isA?IKB:FAINT}}>A</button>
                    <button onClick={()=>toggleB(date)} className="uppercase" style={{fontSize:'9px',letterSpacing:'0.22em',padding:'2px 7px',border:`1px solid ${isB?IKB:LINE_MED}`,background:isB?IKB_SOFT:'transparent',color:isB?IKB:FAINT}}>B</button>
                    <button onClick={()=>deletePieceRecording(item.id,date)} style={{color:FAINT,marginLeft:'4px'}} title="Delete"><Trash2 className="w-3 h-3" strokeWidth={1.25}/></button>
                  </div>
                </div>
                <Waveform compact blobLoader={()=>idbGet('pieceRecordings',key)} meta={entry}/>
              </div>
            );
          })}
        </div>
      )}

      {/* AB comparison */}
      {abA&&abB&&(
        <div className="mt-4">
          <div className="uppercase mb-2" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>A / B Comparison</div>
          <div className="flex" style={{border:`1px solid ${LINE}`}}>
            {[{slot:'A',date:abA},{slot:'B',date:abB}].map(({slot,date},i)=>{
              const entry=itemMeta[date];
              const key=`${item.id}__${date}`;
              return (
                <div key={slot} className="flex-1 min-w-0 p-4" style={{borderRight:i===0?`1px solid ${LINE}`:'none'}}>
                  <div className="uppercase mb-3 flex items-baseline gap-3" style={{fontSize:'9px',letterSpacing:'0.28em',color:FAINT}}>
                    <span style={{color:IKB,fontWeight:500}}>{slot}</span>
                    <span>{date}</span>
                    {entry.bpm&&<span className="tabular-nums" style={{fontFamily:mono}}>♩ {entry.bpm}</span>}
                    {entry.stage&&<span className="italic" style={{fontFamily:serif,fontWeight:300,textTransform:'none',fontSize:'11px'}}>{entry.stage}</span>}
                  </div>
                  <Waveform blobLoader={()=>idbGet('pieceRecordings',key)} meta={entry}/>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
