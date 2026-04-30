import React,{useState,useMemo,useCallback} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import {BG,SURFACE,SURFACE2,TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,serif,serifText,sans,mono} from '../constants/theme.js';
import {displayTitle,formatByline} from '../lib/items.js';
import {resolveWikiLink} from '../lib/notes.js';
import {MarkdownField,DisplayHeader} from '../components/shared.jsx';
import {MarkdownEditor} from '../components/MarkdownEditor.jsx';

function mkId(){return Math.random().toString(36).slice(2,10);}

function startOfToday(){
  const d=new Date();d.setHours(0,0,0,0);return d;
}

function formatPerfDate(iso){
  if(!iso)return null;
  const [y,m,d]=iso.split('-').map(Number);
  const dt=new Date(y,m-1,d);
  return dt.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}

function fmtDuration(totalSecs){
  if(!totalSecs||totalSecs<=0)return null;
  const m=Math.round(totalSecs/60);
  return `${m} min`;
}

// ── Item picker ──────────────────────────────────────────────────────────────
function ItemPicker({items,existingIds,onPick,onClose}){
  const [q,setQ]=useState('');
  const avail=useMemo(()=>items.filter(i=>
    i.type==='piece'&&
    !existingIds.has(i.id)&&
    (displayTitle(i).toLowerCase().includes(q.toLowerCase())||(i.composer||'').toLowerCase().includes(q.toLowerCase()))
  ),[items,existingIds,q]);
  return(
    <>
      <div className="fixed inset-0 z-20" onClick={onClose}/>
      <div className="absolute z-30 left-0 mt-1 w-80 max-h-72 overflow-auto etudes-scroll" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
        <div className="px-3 py-2" style={{borderBottom:`1px solid ${LINE}`}}>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search pieces…" className="w-full focus:outline-none bg-transparent" style={{color:TEXT,fontFamily:serif,fontSize:'13px'}}/>
        </div>
        {avail.length===0&&<div className="px-4 py-3 italic" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No matching pieces.</div>}
        {avail.map(it=>(
          <button key={it.id} onClick={()=>{onPick(it);onClose();}} className="w-full text-left px-4 py-2.5" style={{borderBottom:`1px solid ${LINE}`}}>
            <div className="italic" style={{fontSize:'13px',fontWeight:300,fontFamily:serif,color:TEXT}}>{displayTitle(it)}</div>
            {formatByline(it)&&<div className="italic mt-0.5" style={{color:MUTED,fontFamily:serif,fontSize:'11px'}}>{formatByline(it)}</div>}
          </button>
        ))}
      </div>
    </>
  );
}

// ── Program editor ───────────────────────────────────────────────────────────
function ProgramEditor({program,items,onUpdate,onBack,freeNotes,setView,setActiveNoteId}){
  const [showPicker,setShowPicker]=useState(false);
  const [dragIdx,setDragIdx]=useState(null);
  const [dragOverIdx,setDragOverIdx]=useState(null);
  const [confirmRemoveId,setConfirmRemoveId]=useState(null);
  const [bodyMode,setBodyMode]=useState('edit');

  const handleBodyWikiClick=useCallback((rawText)=>{
    const resolved=resolveWikiLink(rawText,items,[],null,freeNotes||[]);
    if(!resolved)return;
    if(resolved.type==='note'){
      if(setActiveNoteId)setActiveNoteId(resolved.target);
      if(setView)setView('notes');
    }
  },[items,freeNotes,setView,setActiveNoteId]);

  const pieceItems=useMemo(()=>program.itemIds.map(id=>items.find(i=>i.id===id)).filter(Boolean),[program.itemIds,items]);
  const existingIds=useMemo(()=>new Set(program.itemIds),[program.itemIds]);
  const totalSecs=useMemo(()=>pieceItems.reduce((a,it)=>a+(it.lengthSecs||0),0),[pieceItems]);

  const update=useCallback((patch)=>onUpdate({...program,...patch}),[program,onUpdate]);

  const isPast=!!program.performanceDate&&new Date(program.performanceDate)<startOfToday();
  const isFuture=!!program.performanceDate&&new Date(program.performanceDate)>startOfToday();
  // Writable today and in the future; locked once the date has passed
  const intentionReadOnly=!!program.performanceDate&&new Date(program.performanceDate)<startOfToday();

  const addPiece=(it)=>update({itemIds:[...program.itemIds,it.id]});
  const removePiece=(id)=>{
    const hasNote=(program.itemNotes||{})[id];
    if(hasNote){setConfirmRemoveId(id);}
    else{
      const itemNotes={...(program.itemNotes||{})};delete itemNotes[id];
      update({itemIds:program.itemIds.filter(x=>x!==id),itemNotes});
    }
  };
  const confirmRemove=(id)=>{
    const itemNotes={...(program.itemNotes||{})};delete itemNotes[id];
    update({itemIds:program.itemIds.filter(x=>x!==id),itemNotes});
    setConfirmRemoveId(null);
  };

  const setItemNote=(itemId,val)=>{
    const itemNotes={...(program.itemNotes||{}),[itemId]:val};
    update({itemNotes});
  };

  const handleDragStart=(idx)=>setDragIdx(idx);
  const handleDragOver=(e,idx)=>{e.preventDefault();setDragOverIdx(idx);};
  const handleDrop=(toIdx)=>{
    if(dragIdx===null||dragIdx===toIdx){setDragIdx(null);setDragOverIdx(null);return;}
    const ids=[...program.itemIds];const[moved]=ids.splice(dragIdx,1);ids.splice(toIdx,0,moved);
    update({itemIds:ids});setDragIdx(null);setDragOverIdx(null);
  };

  return(
    <div className="max-w-4xl mx-auto px-12 py-14">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 mb-8 uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans}}>
        <ChevronLeft className="w-3 h-3" strokeWidth={1.5}/> All programs
      </button>

      {/* Name */}
      <div className="mb-2">
        <input
          value={program.name||''}
          onChange={e=>update({name:e.target.value})}
          onBlur={e=>update({name:e.target.value.trim()||'Untitled program'})}
          placeholder="Untitled program"
          className="w-full focus:outline-none bg-transparent"
          style={{fontFamily:serif,fontStyle:'italic',fontWeight:300,fontSize:'clamp(32px,5vw,36px)',letterSpacing:'-0.02em',color:TEXT,lineHeight:1.1}}
        />
      </div>

      {/* Date */}
      <div className="mb-1.5">
        <input
          type="date"
          value={program.performanceDate||''}
          onChange={e=>update({performanceDate:e.target.value||null})}
          className="focus:outline-none bg-transparent"
          style={{fontFamily:sans,fontSize:'13px',color:program.performanceDate?MUTED:FAINT}}
        />
        {!program.performanceDate&&<span style={{fontFamily:sans,fontSize:'13px',color:FAINT}}>No date set</span>}
      </div>

      {/* Venue */}
      <div className="mb-1">
        <input
          value={program.venue||''}
          onChange={e=>update({venue:e.target.value||null})}
          placeholder="Where"
          className="focus:outline-none bg-transparent w-full"
          style={{fontFamily:sans,fontSize:'13px',color:FAINT}}
        />
      </div>

      {/* Audience — whisper, never exported */}
      <div className="mb-8">
        <input
          value={program.audience||''}
          onChange={e=>update({audience:e.target.value||null})}
          placeholder="Who was there"
          className="focus:outline-none bg-transparent w-full"
          style={{fontFamily:sans,fontSize:'11px',color:DIM}}
        />
      </div>

      {/* Intention */}
      <div className="mb-8">
        <div className="uppercase mb-2" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.32em',color:DIM}}>Intention</div>
        {intentionReadOnly?(
          <div style={{fontFamily:serifText,fontSize:'15px',lineHeight:1.8,color:MUTED,whiteSpace:'pre-wrap'}}>
            {program.intention||<span style={{color:DIM}}>—</span>}
          </div>
        ):(
          <textarea
            value={program.intention||''}
            onChange={e=>update({intention:e.target.value||null})}
            onBlur={e=>update({intention:e.target.value.trim()||null})}
            placeholder="Why these pieces. Why this order. What you want to say."
            rows={4}
            className="w-full focus:outline-none bg-transparent resize-none"
            style={{fontFamily:serifText,fontSize:'15px',lineHeight:1.8,color:MUTED}}
          />
        )}
      </div>

      {/* Piece list */}
      <div className="mb-2" style={{borderTop:`1px solid ${LINE_STR}`}}>
        <div className="flex items-center justify-between py-3">
          <div className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.28em',color:DIM}}>Program</div>
          <div className="relative">
            <button onClick={()=>setShowPicker(v=>!v)} className="uppercase flex items-center gap-1.5 px-3 py-1" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',color:LINE_STR,border:`1px solid ${LINE_STR}`,background:'transparent'}}>
              <Plus className="w-3 h-3" strokeWidth={1.25}/> Add piece
            </button>
            {showPicker&&<ItemPicker items={items} existingIds={existingIds} onPick={addPiece} onClose={()=>setShowPicker(false)}/>}
          </div>
        </div>

        {pieceItems.length===0&&(
          <div className="py-8 text-center italic" style={{fontFamily:serif,fontSize:'14px',color:DIM}}>Nothing here yet.</div>
        )}

        {pieceItems.map((it,idx)=>{
          const isDragOver=dragOverIdx===idx&&dragIdx!==null&&dragIdx!==idx;
          const note=(program.itemNotes||{})[it.id]||'';
          return(
            <div key={it.id}
              draggable
              onDragStart={()=>handleDragStart(idx)}
              onDragOver={e=>handleDragOver(e,idx)}
              onDrop={()=>handleDrop(idx)}
              onDragEnd={()=>{setDragIdx(null);setDragOverIdx(null);}}
              className="group"
              style={{borderBottom:`1px solid ${LINE}`,background:isDragOver?IKB_SOFT:'transparent',opacity:dragIdx===idx?0.4:1,transition:'background 0.1s'}}
            >
              <div className="flex items-start gap-3 px-0 py-3">
                <span className="cursor-grab active:cursor-grabbing shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{color:DIM}}>
                  <GripVertical className="w-3.5 h-3.5" strokeWidth={1.25}/>
                </span>
                <span className="tabular-nums shrink-0 mt-0.5" style={{color:DIM,fontFamily:serif,fontStyle:'italic',fontSize:'11px',minWidth:'18px'}}>{idx+1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="italic leading-snug" style={{fontFamily:serif,fontWeight:300,fontSize:'15px',color:TEXT}}>{displayTitle(it)}</div>
                  {formatByline(it)&&<div className="italic mt-0.5" style={{fontFamily:sans,fontSize:'12px',color:FAINT}}>{formatByline(it)}</div>}
                  <input
                    value={note}
                    onChange={e=>setItemNote(it.id,e.target.value)}
                    onBlur={e=>{if(!e.target.value.trim())setItemNote(it.id,'');}}
                    placeholder="A note on this piece — attacca, long pause before, the pivot"
                    className="w-full focus:outline-none bg-transparent mt-1"
                    style={{fontFamily:serifText,fontStyle:'italic',fontSize:'12px',color:FAINT}}
                  />
                </div>
                <span className="tabular-nums shrink-0 mt-0.5" style={{fontFamily:mono,fontSize:'11px',color:it.lengthSecs?DIM:DIM}}>
                  {it.lengthSecs?fmtDuration(it.lengthSecs):'—'}
                </span>
                <button onClick={()=>removePiece(it.id)} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{color:FAINT}}>
                  <X className="w-3.5 h-3.5" strokeWidth={1.25}/>
                </button>
              </div>
            </div>
          );
        })}

        {/* Total */}
        {pieceItems.length>0&&(
          <div className="flex items-center justify-end gap-2 py-3" style={{borderTop:`1px solid ${LINE_MED}`}}>
            <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',color:FAINT}}>Total</span>
            <span className="tabular-nums" style={{fontFamily:mono,fontSize:'13px',color:totalSecs>0?MUTED:DIM}}>
              {totalSecs>0?fmtDuration(totalSecs):'—'}
            </span>
          </div>
        )}
      </div>

      {/* Confirm remove with annotation */}
      {confirmRemoveId&&(()=>{
        const it=items.find(i=>i.id===confirmRemoveId);
        return(
          <div className="mb-6 px-4 py-3 flex items-center justify-between gap-4" style={{border:`1px solid ${LINE_STR}`,background:SURFACE}}>
            <span style={{fontFamily:serif,fontStyle:'italic',fontSize:'13px',color:MUTED}}>
              Remove {it?displayTitle(it):'this piece'}? Its annotation will be lost.
            </span>
            <div className="flex items-center gap-3">
              <button onClick={()=>setConfirmRemoveId(null)} className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',color:FAINT}}>Cancel</button>
              <button onClick={()=>confirmRemove(confirmRemoveId)} className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',color:TEXT}}>Remove</button>
            </div>
          </div>
        );
      })()}

      {/* Reflection */}
      <div className="mt-8 mb-8">
        <div className="uppercase mb-2" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.32em',color:DIM}}>Reflection</div>
        {isFuture?(
          <div style={{fontFamily:serifText,fontSize:'15px',color:DIM}}>—</div>
        ):(
          <textarea
            value={program.reflection||''}
            onChange={e=>update({reflection:e.target.value||null})}
            onBlur={e=>update({reflection:e.target.value.trim()||null})}
            placeholder="What the evening meant. What the room held. Whether the argument landed."
            rows={4}
            className="w-full focus:outline-none bg-transparent resize-none"
            style={{fontFamily:serifText,fontSize:'15px',lineHeight:1.8,color:MUTED}}
          />
        )}
      </div>

      {/* Body / Notes — always writable */}
      <div className="mt-8" style={{borderTop:`1px solid ${LINE}`}}>
        <div className="flex items-center justify-between py-3">
          <div className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.32em',color:DIM}}>Notes</div>
          <button onClick={()=>setBodyMode(m=>m==='edit'?'preview':'edit')} className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',color:FAINT}}>
            {bodyMode==='preview'?'Edit':'Preview'}
          </button>
        </div>
        {bodyMode==='preview'?(
          <div style={{fontFamily:serifText,fontSize:'15px',lineHeight:1.8,color:TEXT,minHeight:'80px'}}>
            {program.body?(
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                p:({children})=><p style={{marginBottom:'1em'}}>{children}</p>,
                a:({href,children})=>{
                  if(href?.startsWith('wiki://')){
                    const raw=decodeURIComponent(href.slice(7));
                    return <span onClick={()=>handleBodyWikiClick(raw)} style={{color:IKB,borderBottom:`1px solid ${IKB}40`,cursor:'pointer'}}>{children}</span>;
                  }
                  const url=href&&!href.match(/^https?:\/\//)? `https://${href}`:href;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{color:IKB,borderBottom:`1px solid ${IKB}40`}}>{children}</a>;
                },
              }}>
                {program.body.replace(/\[\[([^\]\n]+)\]\]/g,(_,t)=>`[${t}](wiki://${encodeURIComponent(t)})`)}
              </ReactMarkdown>
            ):(
              <span style={{fontFamily:serifText,fontStyle:'italic',color:DIM,fontSize:'14px'}}>Nothing here yet.</span>
            )}
          </div>
        ):(
          <MarkdownEditor
            value={program.body||''}
            onChange={v=>update({body:v||null})}
            placeholder="Program notes, quotes, ideas — anything belonging to this program's world."
            minHeight={120}
          />
        )}
      </div>
    </div>
  );
}

// ── Programs list ────────────────────────────────────────────────────────────
function ProgramsList({programs,items,onSelect,onNew}){
  const sorted=useMemo(()=>{
    const dated=programs.filter(p=>p.performanceDate).sort((a,b)=>b.performanceDate.localeCompare(a.performanceDate));
    const undated=programs.filter(p=>!p.performanceDate).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    return [...dated,...undated];
  },[programs]);

  return(
    <div className="max-w-4xl mx-auto px-12 py-14">
      <DisplayHeader eyebrow="Programs" title="Programs" right={
        <button
          onClick={onNew}
          className="uppercase flex items-center gap-2 px-4 py-2 shrink-0"
          style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',color:TEXT,border:`1px solid ${LINE_STR}`,background:'transparent',marginTop:'auto'}}
        >
          <Plus className="w-3 h-3" strokeWidth={1.25}/> New program
        </button>
      }/>

      {sorted.length===0&&(
        <div className="py-20 text-center">
          <div className="italic" style={{fontFamily:serif,fontSize:'16px',color:DIM}}>Nothing here yet.</div>
        </div>
      )}

      {sorted.map(p=>{
        const pieceCount=p.itemIds?.length||0;
        const totalSecs=(p.itemIds||[]).reduce((a,id)=>{const it=items.find(i=>i.id===id);return a+(it?.lengthSecs||0);},0);
        const formattedDate=p.performanceDate?formatPerfDate(p.performanceDate):null;
        return(
          <button
            key={p.id}
            onClick={()=>onSelect(p.id)}
            className="w-full text-left py-4 group"
            style={{borderBottom:`1px solid ${LINE}`}}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="italic" style={{fontFamily:serif,fontWeight:300,fontSize:'clamp(18px,2.5vw,22px)',color:TEXT}}>{p.name||'Untitled program'}</span>
              <span className="tabular-nums shrink-0" style={{fontFamily:mono,fontSize:'11px',color:totalSecs>0?DIM:DIM}}>
                {totalSecs>0?fmtDuration(totalSecs):''}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-0.5">
              {formattedDate?(
                <span style={{fontFamily:sans,fontSize:'12px',color:MUTED}}>{formattedDate}</span>
              ):(
                <span style={{fontFamily:sans,fontSize:'12px',color:FAINT}}>Undated</span>
              )}
              {p.venue&&<span style={{fontFamily:sans,fontSize:'12px',color:FAINT}}>{p.venue}</span>}
              <span className="tabular-nums" style={{fontFamily:mono,fontSize:'11px',color:DIM}}>
                {pieceCount} piece{pieceCount===1?'':'s'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────
export default function ProgramsView({items,programs,setPrograms,selectedProgramId,setSelectedProgramId,setView,freeNotes,setActiveNoteId}){
  const selectedProgram=programs.find(p=>p.id===selectedProgramId)||null;

  const createProgram=()=>{
    const p={
      id:mkId(),name:'',performanceDate:null,venue:null,audience:null,
      itemIds:[],itemNotes:{},intention:null,reflection:null,body:null,
    };
    setPrograms(prev=>[...prev,p]);
    setSelectedProgramId(p.id);
  };

  const updateProgram=(updated)=>setPrograms(prev=>prev.map(p=>p.id===updated.id?updated:p));

  if(selectedProgram){
    return(
      <ProgramEditor
        program={selectedProgram}
        items={items}
        onUpdate={updateProgram}
        onBack={()=>setSelectedProgramId(null)}
        freeNotes={freeNotes||[]}
        setView={setView}
        setActiveNoteId={setActiveNoteId}
      />
    );
  }

  return(
    <ProgramsList
      programs={programs}
      items={items}
      onSelect={(id)=>setSelectedProgramId(id)}
      onNew={createProgram}
    />
  );
}
