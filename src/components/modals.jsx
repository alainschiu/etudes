import React, {useState, useRef} from 'react';
import useFocusTrap from '../hooks/useFocusTrap.js';
import {BG, TEXT, MUTED, FAINT, LINE, LINE_STR, IKB, WARN, WARN_SOFT, serif} from '../constants/theme.js';


export function DriveConflictModal({remoteModified,localMarker,onLoadFromDrive,onKeepLocal}){
  const panelRef=useRef(null);useFocusTrap(panelRef,true);
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}><div ref={panelRef} className="max-w-sm w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}>
    <div className="px-8 py-7">
      <div className="uppercase mb-4" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Google Drive — newer backup</div>
      <p style={{fontFamily:serif,fontSize:'15px',lineHeight:1.7,fontWeight:300}}>A different journal on Google Drive may be newer than what you last matched on this device.</p>
      {(remoteModified||localMarker)&&<p className="mt-3 text-xs italic" style={{color:MUTED,fontFamily:serif}}>Drive: {remoteModified||'—'} · Last matched: {localMarker||'—'}</p>}
      <p className="mt-3" style={{fontFamily:serif,fontSize:'12px',lineHeight:1.6,fontWeight:300,color:FAINT,fontStyle:'italic'}}>Load from Drive replaces journal state and then downloads missing recordings and scores. Local blobs already on this device are kept.</p>
    </div>
    <div className="px-8 pb-6 flex flex-col gap-2" style={{borderTop:`1px solid ${LINE}`,paddingTop:'20px'}}>
      <button onClick={onLoadFromDrive} className="w-full py-2.5 uppercase" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Load from Drive</button>
      <button onClick={onKeepLocal} className="w-full py-2.5 uppercase" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Keep local</button>
    </div>
  </div></div>);
}

export function SyncConflictModal({localCount,remoteCount,hasOverlap,onMerge,onKeepLocal,onKeepCloud}){
  const overlapNote=hasOverlap
    ? 'Some pieces exist on both devices with different edits. Merge combines everything — local edits win on the same piece.'
    : 'Both devices have unique pieces. Merge combines everything safely.';
  const panelRef=useRef(null);useFocusTrap(panelRef,true);
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}><div ref={panelRef} className="max-w-sm w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}>
    <div className="px-8 py-7">
      <div className="uppercase mb-4" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Sync — both devices have data</div>
      <p style={{fontFamily:serif,fontSize:'15px',lineHeight:1.7,fontWeight:300}}>This device has <span style={{color:TEXT}}>{localCount} {localCount===1?'piece':'pieces'}</span>. The cloud has <span style={{color:TEXT}}>{remoteCount} {remoteCount===1?'piece':'pieces'}</span> from another device.</p>
      <p className="mt-3" style={{fontFamily:serif,fontSize:'13px',lineHeight:1.6,fontWeight:300,color:MUTED,fontStyle:'italic'}}>{overlapNote}</p>
      <p className="mt-3" style={{fontFamily:serif,fontSize:'11px',lineHeight:1.6,fontWeight:300,color:FAINT,fontStyle:'italic'}}>Audio recordings and PDFs are stored locally and are not affected by this choice.</p>
    </div>
    <div className="px-8 pb-6 flex flex-col gap-2" style={{borderTop:`1px solid ${LINE}`,paddingTop:'20px'}}>
      <button onClick={onMerge} className="w-full py-2.5 uppercase" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Merge — keep everything</button>
      <button onClick={onKeepLocal} className="w-full py-2.5 uppercase" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Keep this device</button>
      <button onClick={onKeepCloud} className="w-full py-2.5 uppercase" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Keep cloud version</button>
    </div>
  </div></div>);
}

export function ConfirmModal({message,confirmLabel='Confirm',onConfirm,onCancel,isDestructive=false}){
  const panelRef=useRef(null);useFocusTrap(panelRef,true);
  const [hovered,setHovered]=useState(false);
  // Destructive: always WARN border + text so the action is clearly destructive
  // even on touch (no hover). Hover/active deepens with WARN_SOFT background.
  const confirmStyle=isDestructive
    ? {background:hovered?WARN_SOFT:'transparent',color:WARN,border:`1px solid ${WARN}80`,fontSize:'10px',letterSpacing:'0.22em',transition:'background 120ms'}
    : {background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'};
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}} onClick={onCancel}><div ref={panelRef} className="max-w-sm w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}><div className="px-8 py-8 max-h-96 overflow-auto etudes-scroll"><p style={{fontFamily:serif,fontSize:'15px',lineHeight:1.6,fontWeight:300,whiteSpace:'pre-wrap'}}>{message}</p></div><div className="px-8 py-4 flex gap-3" style={{borderTop:`1px solid ${LINE}`}}><button onClick={onCancel} className="flex-1 py-2.5 uppercase" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Cancel</button><button onClick={onConfirm} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} className="flex-1 py-2.5 uppercase" style={confirmStyle}>{confirmLabel}</button></div></div></div>);
}

export function PromptModal({title,placeholder,initial='',onConfirm,onCancel}){
  const [val,setVal]=useState(initial);
  const panelRef=useRef(null);useFocusTrap(panelRef,true);
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}} onClick={onCancel}><div ref={panelRef} className="max-w-sm w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}><div className="px-8 py-7"><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>{title}</div><input autoFocus value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onConfirm(val);onCancel();}}} placeholder={placeholder} className="w-full pb-1 focus:outline-none" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontFamily:serif,fontSize:'17px',fontWeight:300}}/></div><div className="px-8 py-4 flex gap-3" style={{borderTop:`1px solid ${LINE}`}}><button onClick={onCancel} className="flex-1 py-2.5 uppercase" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Cancel</button><button onClick={()=>{onConfirm(val);onCancel();}} className="flex-1 py-2.5 uppercase" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Save</button></div></div></div>);
}
