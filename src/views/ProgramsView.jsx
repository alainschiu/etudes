import React,{useState,useMemo} from 'react';
import {Plus,X,ChevronDown,ChevronUp,Pencil,Check,Calendar,GripVertical} from 'lucide-react';
import {BG,SURFACE,SURFACE2,TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,WARM,serif,sans} from '../constants/theme.js';
import {STAGES} from '../constants/config.js';
import {displayTitle,formatByline} from '../lib/items.js';
import {DisplayHeader} from '../components/shared.jsx';

function mkId(){return Math.random().toString(36).slice(2,10);}

function formatLength(secs){
  if(!secs)return null;
  const m=Math.floor(secs/60),s=secs%60;
  return `${m}′${String(s).padStart(2,'0')}″`;
}

function parseLengthInput(v){
  v=(v||'').trim();
  if(!v)return null;
  if(v.includes(':')){const[m,s]=v.split(':').map(Number);return(isNaN(m)||isNaN(s))?null:m*60+s;}
  const n=parseFloat(v);return isNaN(n)?null:Math.round(n*60);
}

function stageLabel(key){return STAGES.find(s=>s.key===key)?.label||key||'';}

// ── Inline editable title ────────────────────────────────────────────────────
function InlineEdit({value,onSave,style,className}){
  const[editing,setEditing]=useState(false);
  const[val,setVal]=useState(value);
  const commit=()=>{const v=val.trim();if(v)onSave(v);else setVal(value);setEditing(false);};
  if(editing)return<input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();if(e.key==='Escape'){setVal(value);setEditing(false);}}} className="focus:outline-none bg-transparent" style={{...style,borderBottom:`1px solid ${LINE_STR}`,paddingBottom:'2px'}}/>;
  return<span onDoubleClick={()=>{setVal(value);setEditing(true);}} className={className} style={{...style,cursor:'text'}} title="Double-click to rename">{value}</span>;
}

// ── Item picker popup ────────────────────────────────────────────────────────
function ItemPicker({items,existingIds,onPick,onClose}){
  const[q,setQ]=useState('');
  const avail=items.filter(i=>i.type==='piece'&&!existingIds.has(i.id)&&(displayTitle(i).toLowerCase().includes(q.toLowerCase())||(i.composer||'').toLowerCase().includes(q.toLowerCase())));
  return(<><div className="fixed inset-0 z-20" onClick={onClose}/><div className="absolute z-30 left-0 mt-1 w-72 max-h-72 overflow-auto etudes-scroll" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}><div className="px-3 py-2" style={{borderBottom:`1px solid ${LINE}`}}><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search pieces…" className="w-full focus:outline-none text-sm bg-transparent" style={{color:TEXT,fontFamily:serif}}/></div>{avail.length===0&&<div className="px-4 py-3 text-xs italic" style={{color:FAINT,fontFamily:serif}}>No matching pieces.</div>}{avail.map(it=>(<button key={it.id} onClick={()=>{onPick(it);onClose();}} className="w-full text-left px-4 py-2.5" style={{borderBottom:`1px solid ${LINE}`}}><div style={{fontSize:'13px',fontWeight:300,fontFamily:sans}}>{displayTitle(it)}</div>{formatByline(it)&&<div className="italic mt-0.5" style={{color:MUTED,fontFamily:serif,fontSize:'11px'}}>{formatByline(it)}</div>}</button>))}</div></>);
}

// ── Single program card ──────────────────────────────────────────────────────
function ProgramCard({program,items,onUpdate,onDelete}){
  const[expanded,setExpanded]=useState(true);
  const[showPicker,setShowPicker]=useState(false);
  const[dragPIdx,setDragPIdx]=useState(null);
  const[dragPOver,setDragPOver]=useState(null);
  const[editingDate,setEditingDate]=useState(false);
  const[dateVal,setDateVal]=useState(program.performanceDate||'');

  const pieceItems=useMemo(()=>program.itemIds.map(id=>items.find(i=>i.id===id)).filter(Boolean),[program.itemIds,items]);
  const existingIds=useMemo(()=>new Set(program.itemIds),[program.itemIds]);

  const totalSecs=useMemo(()=>pieceItems.reduce((a,it)=>a+(it.lengthSecs||0),0),[pieceItems]);

  const addItem=(it)=>onUpdate({...program,itemIds:[...program.itemIds,it.id]});
  const removeItem=(id)=>onUpdate({...program,itemIds:program.itemIds.filter(x=>x!==id)});

  const handlePDragStart=(idx)=>setDragPIdx(idx);
  const handlePDragOver=(e,idx)=>{e.preventDefault();setDragPOver(idx);};
  const handlePDrop=(toIdx)=>{
    if(dragPIdx===null||dragPIdx===toIdx){setDragPIdx(null);setDragPOver(null);return;}
    const ids=[...program.itemIds];const[moved]=ids.splice(dragPIdx,1);ids.splice(toIdx,0,moved);
    onUpdate({...program,itemIds:ids});setDragPIdx(null);setDragPOver(null);
  };

  const commitDate=()=>{onUpdate({...program,performanceDate:dateVal.trim()||null});setEditingDate(false);};

  return(
    <div className="mb-6" style={{border:`1px solid ${LINE_MED}`,background:SURFACE}}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:expanded?`1px solid ${LINE}`:'none'}}>
        <div className="flex items-baseline gap-4 flex-1 min-w-0">
          <InlineEdit value={program.name} onSave={(v)=>onUpdate({...program,name:v})} style={{fontFamily:serif,fontStyle:'italic',fontWeight:300,fontSize:'20px',letterSpacing:'-0.01em',color:TEXT}}/>
          {/* Performance date */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={e=>e.stopPropagation()}>
            {editingDate?(
              <input autoFocus value={dateVal} onChange={e=>setDateVal(e.target.value)} onBlur={commitDate} onKeyDown={e=>{if(e.key==='Enter')commitDate();if(e.key==='Escape')setEditingDate(false);}} placeholder="YYYY-MM-DD" className="font-mono tabular-nums text-xs focus:outline-none px-1" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,width:'100px'}}/>
            ):(
              <button onClick={()=>{setDateVal(program.performanceDate||'');setEditingDate(true);}} className="flex items-center gap-1 uppercase" style={{color:program.performanceDate?MUTED:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>
                <Calendar className="w-2.5 h-2.5" strokeWidth={1.25}/>
                {program.performanceDate||'set date'}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={()=>setShowPicker(v=>!v)} className="relative uppercase flex items-center gap-1.5 px-3 py-1" style={{color:IKB,border:`1px solid ${IKB}40`,background:IKB_SOFT,fontSize:'9px',letterSpacing:'0.22em'}}>
            <Plus className="w-3 h-3" strokeWidth={1.25}/> Add piece
            {showPicker&&<ItemPicker items={items} existingIds={existingIds} onPick={addItem} onClose={()=>setShowPicker(false)}/>}
          </button>
          <button onClick={()=>setExpanded(v=>!v)} style={{color:FAINT}}>{expanded?<ChevronUp className="w-3.5 h-3.5" strokeWidth={1.25}/>:<ChevronDown className="w-3.5 h-3.5" strokeWidth={1.25}/>}</button>
          <button onClick={onDelete} style={{color:FAINT}}><X className="w-3.5 h-3.5" strokeWidth={1.25}/></button>
        </div>
      </div>

      {/* Piece list */}
      {expanded&&(
        <div>
          {pieceItems.length===0&&(
            <div className="px-6 py-5 italic" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No pieces yet — add from your repertoire.</div>
          )}
          {pieceItems.map((it,idx)=>{
            const len=it.lengthSecs?formatLength(it.lengthSecs):null;
            const stage=stageLabel(it.stage);
            const isDragOver=dragPOver===idx&&dragPIdx!==null&&dragPIdx!==idx;
            return(
              <div key={it.id} draggable onDragStart={()=>handlePDragStart(idx)} onDragOver={e=>handlePDragOver(e,idx)} onDrop={()=>handlePDrop(idx)} onDragEnd={()=>{setDragPIdx(null);setDragPOver(null);}}
                className="group flex items-center gap-3 px-6 py-3" style={{borderBottom:`1px solid ${LINE}`,background:isDragOver?`${IKB}08`:'transparent',opacity:dragPIdx===idx?0.4:1}}>
                {/* drag handle */}
                <span className="cursor-grab active:cursor-grabbing shrink-0" style={{color:FAINT}}><GripVertical className="w-3 h-3" strokeWidth={1.25}/></span>
                {/* index */}
                <span className="tabular-nums shrink-0" style={{color:DIM,fontFamily:serif,fontStyle:'italic',fontSize:'11px',minWidth:'16px'}}>{idx+1}.</span>
                {/* title + byline */}
                <div className="flex-1 min-w-0">
                  <div style={{fontFamily:sans,fontWeight:300,fontSize:'14px',color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayTitle(it)}</div>
                  {formatByline(it)&&<div className="italic truncate" style={{color:MUTED,fontFamily:serif,fontSize:'11px'}}>{formatByline(it)}</div>}
                </div>
                {/* stage */}
                <span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.2em'}}>{stage}</span>
                {/* length */}
                <span className="tabular-nums shrink-0 font-mono" style={{color:len?MUTED:DIM,fontSize:'11px',fontWeight:300,minWidth:'44px',textAlign:'right'}}>{len||'—'}</span>
                {/* remove */}
                <button onClick={()=>removeItem(it.id)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{color:FAINT}}><X className="w-3 h-3" strokeWidth={1.25}/></button>
              </div>
            );
          })}
          {/* Footer: total */}
          <div className="flex items-center justify-between px-6 py-3" style={{borderTop:pieceItems.length>0?`1px solid ${LINE_MED}`:'none',background:BG}}>
            <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>{pieceItems.length} piece{pieceItems.length===1?'':'s'}</div>
            <div className="flex items-center gap-2">
              <span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Total</span>
              <span className="font-mono tabular-nums" style={{color:totalSecs>0?TEXT:FAINT,fontSize:'13px',fontWeight:300}}>{totalSecs>0?formatLength(totalSecs):'—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────
export default function ProgramsView({items,programs,setPrograms}){
  const addProgram=()=>{
    const p={id:mkId(),name:'New Program',performanceDate:null,itemIds:[]};
    setPrograms(prev=>[...prev,p]);
  };
  const updateProgram=(updated)=>setPrograms(prev=>prev.map(p=>p.id===updated.id?updated:p));
  const deleteProgram=(id)=>setPrograms(prev=>prev.filter(p=>p.id!==id));

  return(
    <div className="max-w-3xl mx-auto px-12 py-14">
      <DisplayHeader eyebrow="Concert & Audition" title="Programs" right={
        <button onClick={addProgram} className="uppercase flex items-center gap-2 px-4 py-2" style={{color:IKB,border:`1px solid ${IKB}40`,background:IKB_SOFT,fontSize:'10px',letterSpacing:'0.28em'}}>
          <Plus className="w-3.5 h-3.5" strokeWidth={1.25}/> New program
        </button>
      }/>
      {programs.length===0&&(
        <div className="py-20 text-center">
          <div className="italic mb-4" style={{color:FAINT,fontFamily:serif,fontSize:'16px'}}>No programs yet.</div>
          <button onClick={addProgram} className="uppercase flex items-center gap-2 px-5 py-2.5 mx-auto" style={{color:IKB,border:`1px solid ${IKB}40`,background:IKB_SOFT,fontSize:'10px',letterSpacing:'0.28em'}}>
            <Plus className="w-3.5 h-3.5" strokeWidth={1.25}/> Create your first program
          </button>
        </div>
      )}
      {programs.map(p=>(
        <ProgramCard key={p.id} program={p} items={items} onUpdate={updateProgram} onDelete={()=>deleteProgram(p.id)}/>
      ))}
    </div>
  );
}
