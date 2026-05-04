import React, {useState, useRef} from 'react';
import useViewport from '../hooks/useViewport.js';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Check from 'lucide-react/dist/esm/icons/check';
import Clock from 'lucide-react/dist/esm/icons/clock';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, WARM_SOFT, serif, serifText, sans} from '../constants/theme.js';
import {TYPES, SECTION_CONFIG} from '../constants/config.js';
import {displayTitle, formatByline} from '../lib/items.js';
import {toRoman} from '../lib/music.js';
import {DisplayHeader, TargetEdit, ItemPickerPopup, confirmDestructive} from '../components/shared.jsx';

export default function RoutinesView({routines,setRoutines,loadRoutine,setPromptModal,setConfirmModal,todaySessions,setView,items,loadedRoutineId}){
  const {isMobile}=useViewport();
  const [expandedId,setExpandedId]=useState(null);const [pickerKey,setPickerKey]=useState(null);
  const [editingNameId,setEditingNameId]=useState(null);const [editingNameVal,setEditingNameVal]=useState('');const nameInputRef=useRef(null);
  const startEditName=(r,e)=>{e.stopPropagation();setEditingNameId(r.id);setEditingNameVal(r.name);setTimeout(()=>nameInputRef.current?.select(),0);};
  const commitName=(id)=>{const v=editingNameVal.trim();if(v)setRoutines(routines.map(x=>x.id===id?{...x,name:v}:x));setEditingNameId(null);};
  const deleteRoutine=(id)=>{
    const r=routines.find(x=>x.id===id);
    if(!r)return;
    confirmDestructive(setConfirmModal,`Delete routine "${r.name||'Untitled'}"? This cannot be undone.`,
      ()=>setRoutines(routines.filter(x=>x.id!==id)));
  };
  const createNew=()=>setPromptModal({title:'New routine',placeholder:'Name',onConfirm:(name)=>{if(name?.trim()){const nr={id:`r-${Date.now()}`,name:name.trim(),sessions:[]};setRoutines([...routines,nr]);setExpandedId(nr.id);}}});
  const createFromToday=()=>setPromptModal({title:'Save current arrangement as routine',placeholder:'Name',onConfirm:(name)=>{if(name?.trim()){const nr={id:`r-${Date.now()}`,name:name.trim(),sessions:todaySessions.map(s=>({type:s.type,intention:'',itemIds:Array.isArray(s.itemIds)?[...s.itemIds]:items.filter(i=>i.type===s.type&&i.stage!=='queued').map(i=>i.id),target:s.target??null,itemTargets:{...(s.itemTargets||{})},isWarmup:!!s.isWarmup}))};setRoutines([...routines,nr]);}}});
  const moveSession=(rid,sidx,dir)=>{const r=routines.find(x=>x.id===rid);if(!r)return;const ns=[...r.sessions];const ni=sidx+dir;if(ni<0||ni>=ns.length)return;[ns[sidx],ns[ni]]=[ns[ni],ns[sidx]];setRoutines(routines.map(x=>x.id===rid?{...x,sessions:ns}:x));};
  const removeSession=(rid,sidx)=>{
    confirmDestructive(setConfirmModal,'Remove this session from the routine?',
      ()=>setRoutines(routines.map(r=>r.id===rid?{...r,sessions:r.sessions.filter((_,i)=>i!==sidx)}:r)),
      'Remove');
  };
  const addSessionType=(rid,type)=>setRoutines(routines.map(r=>r.id===rid?{...r,sessions:[...r.sessions,{type,intention:'',itemIds:[],target:null,itemTargets:{},isWarmup:false}]}:r));
  const updateIntention=(rid,sidx,v)=>setRoutines(routines.map(r=>r.id===rid?{...r,sessions:r.sessions.map((s,i)=>i===sidx?{...s,intention:v}:s)}:r));
  const updateSessionTarget=(rid,sidx,v)=>setRoutines(routines.map(r=>r.id===rid?{...r,sessions:r.sessions.map((s,i)=>i===sidx?{...s,target:v}:s)}:r));
  const toggleRoutineWarmup=(rid,sidx)=>setRoutines(routines.map(r=>r.id===rid?{...r,sessions:r.sessions.map((s,i)=>i===sidx?{...s,isWarmup:!s.isWarmup}:s)}:r));
  const updateItemTargetInRoutine=(rid,sidx,itemId,v)=>setRoutines(routines.map(r=>{if(r.id!==rid)return r;return{...r,sessions:r.sessions.map((s,i)=>{if(i!==sidx)return s;const nt={...(s.itemTargets||{})};if(v===null||v===undefined)delete nt[itemId];else nt[itemId]=v;return {...s,itemTargets:nt};})};}));
  const addItemToRoutineSession=(rid,sidx,itemId)=>setRoutines(routines.map(r=>r.id===rid?{...r,sessions:r.sessions.map((s,i)=>i===sidx?{...s,itemIds:[...(s.itemIds||[]),itemId]}:s)}:r));
  const removeItemFromRoutineSession=(rid,sidx,itemId)=>{
    const it=items.find(i=>i.id===itemId);
    confirmDestructive(setConfirmModal,`Remove "${it?displayTitle(it):'this item'}" from the session?`,
      ()=>setRoutines(routines.map(r=>{if(r.id!==rid)return r;return{...r,sessions:r.sessions.map((s,i)=>{if(i!==sidx)return s;const nt={...(s.itemTargets||{})};delete nt[itemId];return{...s,itemIds:(s.itemIds||[]).filter(x=>x!==itemId),itemTargets:nt};})};})),
      'Remove');
  };
  const moveItemInRoutineSession=(rid,sidx,itemIdx,dir)=>setRoutines(routines.map(r=>{if(r.id!==rid)return r;return{...r,sessions:r.sessions.map((s,i)=>{if(i!==sidx)return s;const ids=[...(s.itemIds||[])];const ni=itemIdx+dir;if(ni<0||ni>=ids.length)return s;[ids[itemIdx],ids[ni]]=[ids[ni],ids[itemIdx]];return{...s,itemIds:ids};})};}));
  // Drag-to-reorder the routines list itself (mobile uses ↑↓ chevrons).
  const [dragIdx,setDragIdx]=useState(null);
  const [dragOverIdx,setDragOverIdx]=useState(null);
  const handleDragStart=(idx)=>setDragIdx(idx);
  const handleDragOver=(e,idx)=>{e.preventDefault();setDragOverIdx(idx);};
  const handleDrop=(toIdx)=>{
    if(dragIdx===null||dragIdx===toIdx){setDragIdx(null);setDragOverIdx(null);return;}
    const next=[...routines];const[m]=next.splice(dragIdx,1);next.splice(toIdx,0,m);
    setRoutines(next);setDragIdx(null);setDragOverIdx(null);
  };
  const moveRoutine=(idx,dir)=>{
    const ni=idx+dir;
    if(ni<0||ni>=routines.length)return;
    const next=[...routines];[next[idx],next[ni]]=[next[ni],next[idx]];
    setRoutines(next);
  };

  return (<div className="max-w-4xl mx-auto px-12 py-14" style={isMobile?{paddingLeft:'20px',paddingRight:'20px',paddingTop:'12px',paddingBottom:'calc(var(--footer-height,160px) + 28px)'}:{}}>
    {isMobile?(
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'16px',paddingTop:'8px'}}>
        <div style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,fontSize:'clamp(48px,13vw,56px)',letterSpacing:'-0.02em',lineHeight:1.05,color:TEXT}}>Routines</div>
        <div style={{display:'flex',gap:'6px',paddingBottom:'8px'}}>
          <button onClick={createNew} className="uppercase flex items-center gap-1.5 px-2.5 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}><Plus className="w-3 h-3" strokeWidth={1.25}/> New</button>
          <button onClick={createFromToday} className="uppercase flex items-center gap-1.5 px-2.5 py-1.5" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'9px',letterSpacing:'0.22em'}}><Plus className="w-3 h-3" strokeWidth={1.25}/> Today</button>
        </div>
      </div>
    ):(
      <DisplayHeader eyebrow="Arrangements" title="Routines" right={<div className="flex items-end gap-3"><button onClick={createNew} className="uppercase flex items-center gap-2 px-3 py-2" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'10px',letterSpacing:'0.22em'}}><Plus className="w-3 h-3" strokeWidth={1.25}/> New</button><button onClick={createFromToday} className="uppercase flex items-center gap-2 px-3 py-2" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}><Plus className="w-3 h-3" strokeWidth={1.25}/> From Today</button></div>}/>
    )}
    <div className="text-sm italic mb-8" style={{color:MUTED,fontFamily:serif,lineHeight:1.7,fontWeight:300}}>Named arrangements of sessions with specific pieces pinned and optional target times. Load one on Today to replace your current setup.</div>
    <div style={{borderTop:`1px solid ${LINE_STR}`}}>
      {routines.length===0&&<div className="py-10 text-center text-sm italic" style={{color:FAINT,fontFamily:serif}}>No routines yet.</div>}
      {routines.map((r,idx)=>{const expanded=expandedId===r.id;const isLoaded=loadedRoutineId===r.id;const isDragOver=dragOverIdx===idx&&dragIdx!==null&&dragIdx!==idx;return (<div key={r.id} draggable={!isMobile&&!expanded&&editingNameId!==r.id} onDragStart={()=>handleDragStart(idx)} onDragOver={e=>handleDragOver(e,idx)} onDrop={()=>handleDrop(idx)} onDragEnd={()=>{setDragIdx(null);setDragOverIdx(null);}} style={{borderBottom:`1px solid ${LINE}`,background:isDragOver?IKB_SOFT:'transparent',opacity:dragIdx===idx?0.4:1,transition:'background 0.1s'}}>
        <div onClick={()=>setExpandedId(expanded?null:r.id)} className="py-4 px-2 flex items-center gap-3 cursor-pointer" style={{background:expanded?SURFACE:'transparent',minHeight:isMobile?'52px':undefined}}>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              {editingNameId===r.id?(<span className="flex items-baseline gap-2" onClick={e=>e.stopPropagation()}><input ref={nameInputRef} value={editingNameVal} onChange={e=>setEditingNameVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')commitName(r.id);if(e.key==='Escape')setEditingNameId(null);}} onBlur={()=>commitName(r.id)} autoFocus className="focus:outline-none pb-0.5" style={{fontFamily:serif,fontStyle:'italic',fontWeight:300,fontSize:'1.4rem',background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_MED}`,minWidth:'160px'}}/><button onMouseDown={e=>{e.preventDefault();commitName(r.id);}} style={{color:IKB}}><Check className="w-3.5 h-3.5" strokeWidth={1.25}/></button></span>):(<span className="flex items-baseline gap-2 group/name"><span style={{fontFamily:serif,fontStyle:'italic',fontWeight:300,fontSize:'1.4rem',color:TEXT}}>{r.name}</span><button onClick={e=>startEditName(r,e)} className={isMobile?'transition-opacity':'opacity-0 group-hover/name:opacity-100 transition-opacity'} style={{color:FAINT,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}><Pencil className="w-3 h-3" strokeWidth={1.25}/></button></span>)}
              {isLoaded&&<span className="uppercase" style={{color:IKB,fontSize:'9px',letterSpacing:'0.25em',padding:'2px 6px',border:`1px solid ${IKB}`}}>Loaded on today</span>}
            </div>
            <div className="mt-1.5 flex items-center gap-0" style={{flexWrap:'wrap'}}>
              {r.sessions.length===0&&<span className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>Empty — expand to add sessions</span>}
              {r.sessions.map((s,i)=>(<span key={i} className="flex items-center" style={{color:s.isWarmup?WARM:DIM,fontSize:'9px',letterSpacing:'0.18em'}}>
                {i>0&&<span style={{color:DIM,margin:'0 6px',opacity:0.5}}>·</span>}
                <span className="uppercase">{s.isWarmup?'◔ ':''}{SECTION_CONFIG[s.type].label}</span>
                <span style={{color:DIM,opacity:0.6,marginLeft:'3px'}}>({(s.itemIds||[]).length}{s.target?` · ${s.target}′`:''})</span>
              </span>))}
            </div>
          </div>
          {isMobile&&(
            <div className="shrink-0 flex items-center" style={{border:`1px solid ${LINE_MED}`,marginRight:'4px'}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>moveRoutine(idx,-1)} disabled={idx===0} style={{color:idx===0?DIM:MUTED,minWidth:'40px',minHeight:'40px',display:'inline-flex',alignItems:'center',justifyContent:'center',borderRight:`1px solid ${LINE_MED}`}} title="Move up">
                <ArrowUp className="w-4 h-4" strokeWidth={1.5}/>
              </button>
              <button onClick={()=>moveRoutine(idx,1)} disabled={idx===routines.length-1} style={{color:idx===routines.length-1?DIM:MUTED,minWidth:'40px',minHeight:'40px',display:'inline-flex',alignItems:'center',justifyContent:'center'}} title="Move down">
                <ArrowDown className="w-4 h-4" strokeWidth={1.5}/>
              </button>
            </div>
          )}
          <button onClick={e=>{e.stopPropagation();loadRoutine(r);setView('today');}} className="uppercase px-3 py-1.5 shrink-0" style={{color:TEXT,background:IKB,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Load</button>
          {expanded?<ChevronUp className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:DIM}}/>:<ChevronDown className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:DIM}}/>}
        </div>
        {expanded&&(<div className="px-6 py-6 space-y-5" style={{background:SURFACE,borderTop:`1px solid ${LINE}`}}>
          {r.sessions.map((s,idx)=>{const taken=new Set(s.itemIds||[]);const avail=items.filter(it=>it.type===s.type&&!taken.has(it.id));const pickKey=`${r.id}-${idx}`;const sItems=(s.itemIds||[]).map(id=>items.find(i=>i.id===id)).filter(Boolean);return (<div key={idx} className="py-4 px-4" style={{background:s.isWarmup?WARM_SOFT:SURFACE2,border:`1px solid ${LINE}`}}>
            <div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-baseline gap-3"><span className="tabular-nums" style={{color:DIM,fontFamily:serif,fontStyle:'italic',fontSize:'11px'}}>{toRoman(idx+1)}</span>{s.isWarmup&&<span style={{color:WARM,fontSize:'13px',lineHeight:1}}>◔</span>}<span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em',color:TEXT}}>{SECTION_CONFIG[s.type].label}</span></div><div className="flex items-center gap-3"><button onClick={()=>toggleRoutineWarmup(r.id,idx)} style={{color:s.isWarmup?WARM:FAINT,fontSize:'13px',lineHeight:1,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}>◔</button><button onClick={()=>moveSession(r.id,idx,-1)} disabled={idx===0} style={{color:idx===0?DIM:FAINT,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}><ArrowUp className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={()=>moveSession(r.id,idx,1)} disabled={idx===r.sessions.length-1} style={{color:idx===r.sessions.length-1?DIM:FAINT,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}><ArrowDown className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={()=>removeSession(r.id,idx)} style={{color:FAINT,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}><X className="w-3 h-3" strokeWidth={1.25}/></button></div></div>
            <input value={s.intention} onChange={e=>updateIntention(r.id,idx,e.target.value)} placeholder="What you intend for this session." className="w-full italic focus:outline-none pb-2 mb-3" style={{background:'transparent',color:TEXT,fontFamily:serifText,fontSize:'13px',fontWeight:300,borderBottom:`1px solid ${LINE}`}}/>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}><Clock className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:MUTED}}/><input type="number" min="1" value={s.target||''} onChange={e=>{const n=parseInt(e.target.value,10);updateSessionTarget(r.id,idx,Number.isFinite(n)&&n>0?n:null);}} placeholder="Session target (min)" className="font-mono tabular-nums focus:outline-none flex-1" style={{background:'transparent',color:TEXT,fontSize:'12px'}}/></div>
            <div className="space-y-1">{sItems.length===0&&<div className="text-xs italic py-1" style={{color:FAINT,fontFamily:serif}}>No pieces yet.</div>}{sItems.map((it,itemIdx)=>{const itemTarget=(s.itemTargets||{})[it.id]||null;return (<div key={it.id} className="flex items-center gap-2 py-1.5" style={{borderBottom:itemIdx<sItems.length-1?`1px solid ${LINE}`:'none'}}><span className="tabular-nums shrink-0" style={{color:DIM,fontFamily:serif,fontStyle:'italic',fontSize:'10px',width:'18px'}}>{itemIdx+1}</span><div className="flex-1 min-w-0"><span style={{fontSize:'13px',fontWeight:300}}>{displayTitle(it)}</span>{formatByline(it)&&<span className="ml-2 italic" style={{color:MUTED,fontFamily:serif,fontSize:'11px'}}>{formatByline(it)}</span>}</div><span className="flex items-center gap-1 shrink-0"><Clock className="w-2.5 h-2.5" strokeWidth={1.25} style={{color:FAINT}}/><input type="number" min="1" value={itemTarget||''} onChange={e=>{const n=parseInt(e.target.value,10);updateItemTargetInRoutine(r.id,idx,it.id,Number.isFinite(n)&&n>0?n:null);}} placeholder="—" className="font-mono tabular-nums focus:outline-none text-center" style={{background:'transparent',color:MUTED,width:'28px',fontSize:'11px'}}/></span><button onClick={()=>moveItemInRoutineSession(r.id,idx,itemIdx,-1)} disabled={itemIdx===0} style={{color:itemIdx===0?DIM:FAINT,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}><ArrowUp className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={()=>moveItemInRoutineSession(r.id,idx,itemIdx,1)} disabled={itemIdx===sItems.length-1} style={{color:itemIdx===sItems.length-1?DIM:FAINT,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}><ArrowDown className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={()=>removeItemFromRoutineSession(r.id,idx,it.id)} style={{color:FAINT,minWidth:isMobile?'44px':undefined,minHeight:isMobile?'44px':undefined}}><X className="w-3 h-3" strokeWidth={1.25}/></button></div>);})}</div>
            <div className="relative mt-3"><button onClick={()=>setPickerKey(pickerKey===pickKey?null:pickKey)} className="uppercase flex items-center gap-1.5 italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}><Plus className="w-3 h-3 not-italic" strokeWidth={1.25}/> Add piece</button>{pickerKey===pickKey&&<ItemPickerPopup availableItems={avail} onPick={(id)=>addItemToRoutineSession(r.id,idx,id)} onClose={()=>setPickerKey(null)}/>}</div>
          </div>);})}
          {TYPES.filter(t=>!r.sessions.some(s=>s.type===t)).length>0&&(<div className="flex items-center gap-2 flex-wrap pt-2"><span className="uppercase mr-1" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.25em'}}>Add session</span>{TYPES.filter(t=>!r.sessions.some(s=>s.type===t)).map(t=>(<button key={t} onClick={()=>addSessionType(r.id,t)} className="uppercase px-2.5 py-1" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}>+ {SECTION_CONFIG[t].label}</button>))}</div>)}
          <div className="flex items-center gap-4 pt-4" style={{borderTop:`1px solid ${LINE}`}}><button onClick={()=>deleteRoutine(r.id)} className="uppercase" style={{color:MUTED,fontSize:'10px',letterSpacing:'0.22em'}}>Delete</button></div>
        </div>)}
      </div>);})}
    </div>
  </div>);
}
