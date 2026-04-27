import React, {useState, useMemo, useCallback, useEffect} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {Plus, Search, Trash2, Folder, FolderPlus, X, BookOpen, Calendar, ChevronRight, ChevronDown, Pencil, Check} from 'lucide-react';
import {TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, SURFACE, SURFACE2, BG, serif, sans, LINK} from '../constants/theme.js';
import {todayDateStr} from '../lib/dates.js';
import {displayTitle, formatByline} from '../lib/items.js';
import {resolveWikiLink, parseTagsFromBody} from '../lib/notes.js';
import {MarkdownEditor} from '../components/MarkdownEditor.jsx';

// ── Standard categories (read-only views) ────────────────────────────────
const STD_CATEGORIES=[
  {id:'__daily',label:'Daily Reflections',icon:<Calendar className="w-3 h-3" strokeWidth={1.25}/>},
  {id:'__repertoire',label:'Repertoire Logs',icon:<BookOpen className="w-3 h-3" strokeWidth={1.25}/>},
];

// ── Tag renderer ──────────────────────────────────────────────────────────

// ── Daily Reflections standard view ──────────────────────────────────────
function DailyReflectionsView({history, onClose}){
  const days=useMemo(()=>[...history].filter(h=>(h.kind==='day'||!h.kind)&&h.reflection&&h.reflection.trim()).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30),[history]);
  if(days.length===0)return <div className="italic py-8 text-center" style={{color:FAINT,fontFamily:serif,fontSize:'15px'}}>No daily reflections yet.</div>;
  return (
    <div className="space-y-8">
      {days.map(h=>{
        const d=new Date(h.date);
        return (
          <div key={h.date} style={{borderBottom:`1px solid ${LINE}`,paddingBottom:'24px'}}>
            <div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>{d.toLocaleDateString('en-US',{weekday:'long', month:'long',day:'numeric',year:'numeric'})}</div>
            <div style={{fontFamily:serif,fontSize:'16px',lineHeight:1.8,fontWeight:300}}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{p:({children})=><p style={{marginBottom:'0.8em'}}>{children}</p>,h3:({children})=><h3 style={{fontSize:'1em',fontWeight:400,marginBottom:'0.35em',marginTop:'0.7em',opacity:0.75}}>{children}</h3>,hr:()=><hr style={{border:'none',borderTop:`1px solid rgba(244,238,227,0.12)`,margin:'0.75em 0'}}/>,a:({href,children})=><a href={href} target="_blank" rel="noopener noreferrer" style={{color:LINK,textDecoration:'underline'}}>{children}</a>}}>
                {h.reflection}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Repertoire Logs standard view ────────────────────────────────────────
function RepertoireLogsView({items}){
  const [pieceFilter,setPieceFilter]=useState('');
  const q=pieceFilter.trim().toLowerCase();
  const withLogs=useMemo(()=>items.filter(i=>(i.noteLog||[]).length>0),[items]);
  const filtered=q?withLogs.filter(i=>displayTitle(i).toLowerCase().includes(q)||(i.composer||'').toLowerCase().includes(q)):withLogs;
  if(withLogs.length===0)return <div className="italic py-8 text-center" style={{color:FAINT,fontFamily:serif,fontSize:'15px'}}>No repertoire logs yet. Practice notes from the Today view appear here after day rollover.</div>;
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.25} style={{color:FAINT}}/>
        <input type="text" value={pieceFilter} onChange={e=>setPieceFilter(e.target.value)} placeholder="Filter by piece…" className="flex-1 text-sm focus:outline-none" style={{background:'transparent',color:TEXT}}/>
        {pieceFilter&&<button onClick={()=>setPieceFilter('')} style={{color:FAINT,fontSize:'10px'}}>✕</button>}
      </div>
      {filtered.map(item=>(
        <div key={item.id} style={{borderBottom:`1px solid ${LINE_MED}`,marginBottom:'24px',paddingBottom:'12px'}}>
          <div className="mb-2">
            <div style={{fontSize:'16px',fontWeight:300}}>{displayTitle(item)}</div>
            {formatByline(item)&&<div className="italic" style={{color:MUTED,fontFamily:serif,fontSize:'13px'}}>{formatByline(item)}</div>}
          </div>
          <div className="space-y-3">
            {[...(item.noteLog||[])].reverse().map(entry=>(
              <div key={entry.id} style={{borderLeft:`2px solid ${IKB}30`,paddingLeft:'12px'}}>
                <div className="uppercase mb-1" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>{entry.date}{entry.source==='manual'?' · manual':''}</div>
                <div style={{fontFamily:serif,fontSize:'13px',lineHeight:1.65,color:TEXT,whiteSpace:'pre-wrap'}}>{entry.text}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main NotesView ────────────────────────────────────────────────────────
export default function NotesView({freeNotes,setFreeNotes,noteCategories,setNoteCategories,items,history,setView,setExpandedItemId,openLogEntry,seedTestNotes}){
  const [activeCategoryId,setActiveCategoryId]=useState('__all');
  const [activeNoteId,setActiveNoteId]=useState(freeNotes[0]?.id);
  const [query,setQuery]=useState('');
  const [tagSearch,setTagSearch]=useState('');
  const [addingCategory,setAddingCategory]=useState(false);
  const [newCatName,setNewCatName]=useState('');
  const [editingCatId,setEditingCatId]=useState(null);
  const [editingCatName,setEditingCatName]=useState('');

  const activeNote=freeNotes.find(n=>n.id===activeNoteId);

  const addNote=()=>{
    const n={id:Date.now(),date:todayDateStr(),title:'New note',body:'',category:activeCategoryId==='__all'||activeCategoryId==='__daily'||activeCategoryId==='__repertoire'?'':activeCategoryId,tags:[]};
    setFreeNotes([n,...freeNotes]);
    setActiveNoteId(n.id);
  };

  const updateNote=(id,patch)=>{
    setFreeNotes(prev=>prev.map(n=>{
      if(n.id!==id)return n;
      const updated={...n,...patch};
      if(patch.body!==undefined)updated.tags=parseTagsFromBody(patch.body);
      return updated;
    }));
  };

  const deleteNote=(id)=>{
    const next=freeNotes.filter(n=>n.id!==id);
    setFreeNotes(next);
    if(activeNoteId===id)setActiveNoteId(next[0]?.id??null);
  };

  const addCategory=()=>{
    const name=newCatName.trim();
    if(!name)return;
    setNoteCategories([...noteCategories,name]);
    setActiveCategoryId(name);
    setNewCatName('');
    setAddingCategory(false);
  };

  const renameCategory=(oldName,newName)=>{
    const nn=newName.trim();
    if(!nn||nn===oldName)return;
    setNoteCategories(noteCategories.map(c=>c===oldName?nn:c));
    setFreeNotes(freeNotes.map(n=>n.category===oldName?{...n,category:nn}:n));
    if(activeCategoryId===oldName)setActiveCategoryId(nn);
    setEditingCatId(null);
  };

  const deleteCategory=(name)=>{
    setNoteCategories(noteCategories.filter(c=>c!==name));
    setFreeNotes(freeNotes.map(n=>n.category===name?{...n,category:''}:n));
    if(activeCategoryId===name)setActiveCategoryId('__all');
  };

  // Filter notes
  const q=tagSearch||query;
  const filtered=useMemo(()=>{
    let list=freeNotes;
    if(activeCategoryId&&activeCategoryId!=='__all'&&!activeCategoryId.startsWith('__')){
      list=list.filter(n=>n.category===activeCategoryId);
    }else if(activeCategoryId==='__all'){
      // show all free notes
    }
    const qs=(tagSearch||query).trim().toLowerCase();
    if(qs){
      if(tagSearch){
        list=list.filter(n=>(n.tags||[]).includes(qs.replace(/^#/,'')));
      }else{
        list=list.filter(n=>(n.title||'').toLowerCase().includes(qs)||(n.body||'').toLowerCase().includes(qs)||(n.date||'').includes(qs));
      }
    }
    return list;
  },[freeNotes,activeCategoryId,query,tagSearch]);

  // All tags across all notes
  const allTags=useMemo(()=>{
    const m={};
    freeNotes.forEach(n=>(n.tags||[]).forEach(t=>{m[t]=(m[t]||0)+1;}));
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[freeNotes]);

  const handleTagClick=(tag)=>{
    setTagSearch(tag===tagSearch?'':tag);
  };

  const handleWikiLinkClick=useCallback((resolved)=>{
    if(!resolved)return;
    if(resolved.type==='day'){
      const entry=history.find(h=>(h.kind==='day'||!h.kind)&&h.date===resolved.target);
      if(entry&&openLogEntry)openLogEntry(entry);
    }else if(resolved.type==='item'){
      if(setExpandedItemId)setExpandedItemId(resolved.target);
      if(setView)setView('repertoire');
    }else if(resolved.type==='spot'){
      if(setExpandedItemId)setExpandedItemId(resolved.target.itemId);
      if(setView)setView('repertoire');
    }
  },[history,openLogEntry,setExpandedItemId,setView]);

  const isStdView=activeCategoryId==='__daily'||activeCategoryId==='__repertoire';

  return (
    <div className="max-w-6xl mx-auto px-0 py-14 flex h-full">
      {/* ── Left sidebar ── */}
      <aside className="w-52 shrink-0 px-6 py-0 flex flex-col" style={{borderRight:`1px solid ${LINE}`}}>
        <div className="uppercase mb-4" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Notes</div>

        {/* All notes */}
        <button
          onClick={()=>{setActiveCategoryId('__all');setTagSearch('');}}
          className="text-left py-2 px-2 flex items-center justify-between"
          style={{color:activeCategoryId==='__all'&&!tagSearch?TEXT:MUTED,background:activeCategoryId==='__all'&&!tagSearch?IKB_SOFT:'transparent',borderLeft:activeCategoryId==='__all'&&!tagSearch?`2px solid ${IKB}`:'2px solid transparent',fontSize:'13px',fontWeight:300}}
        >
          <span style={{fontFamily:serif,fontStyle:'italic'}}>All notes</span>
          <span style={{color:FAINT,fontSize:'10px'}}>{freeNotes.length}</span>
        </button>

        {/* Standard categories */}
        <div className="mt-4 mb-2 uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Archives</div>
        {STD_CATEGORIES.map(cat=>(
          <button
            key={cat.id}
            onClick={()=>{setActiveCategoryId(cat.id);setTagSearch('');}}
            className="text-left py-2 px-2 flex items-center gap-2"
            style={{color:activeCategoryId===cat.id?TEXT:MUTED,background:activeCategoryId===cat.id?IKB_SOFT:'transparent',borderLeft:activeCategoryId===cat.id?`2px solid ${IKB}`:'2px solid transparent',fontSize:'12px',fontWeight:300}}
          >
            <span style={{color:activeCategoryId===cat.id?IKB:FAINT}}>{cat.icon}</span>
            <span style={{fontFamily:serif,fontStyle:'italic'}}>{cat.label}</span>
          </button>
        ))}

        {/* User categories */}
        {noteCategories.length>0&&(
          <>
            <div className="mt-4 mb-2 uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Folders</div>
            {noteCategories.map(cat=>(
              <div key={cat} className="group flex items-center">
                {editingCatId===cat?(
                  <div className="flex-1 flex items-center gap-1 py-1 px-2">
                    <input
                      autoFocus
                      value={editingCatName}
                      onChange={e=>setEditingCatName(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter')renameCategory(cat,editingCatName);else if(e.key==='Escape')setEditingCatId(null);}}
                      onBlur={()=>setEditingCatId(null)}
                      className="flex-1 focus:outline-none text-xs"
                      style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`}}
                    />
                    <button onClick={()=>renameCategory(cat,editingCatName)} style={{color:IKB}}><Check className="w-3 h-3" strokeWidth={1.25}/></button>
                  </div>
                ):(
                  <button
                    onClick={()=>{setActiveCategoryId(cat);setTagSearch('');}}
                    className="flex-1 text-left py-2 px-2 flex items-center gap-1.5"
                    style={{color:activeCategoryId===cat?TEXT:MUTED,background:activeCategoryId===cat?IKB_SOFT:'transparent',borderLeft:activeCategoryId===cat?`2px solid ${IKB}`:'2px solid transparent',fontSize:'12px',fontWeight:300}}
                  >
                    <Folder className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:activeCategoryId===cat?IKB:FAINT}}/>
                    <span className="truncate" style={{fontFamily:serif,fontStyle:'italic'}}>{cat}</span>
                    <span className="ml-auto" style={{color:FAINT,fontSize:'10px'}}>{freeNotes.filter(n=>n.category===cat).length}</span>
                  </button>
                )}
                {editingCatId!==cat&&(
                  <div className="opacity-0 group-hover:opacity-100 flex items-center shrink-0">
                    <button onClick={()=>{setEditingCatId(cat);setEditingCatName(cat);}} style={{color:FAINT,padding:'4px 2px'}}><Pencil className="w-2.5 h-2.5" strokeWidth={1.25}/></button>
                    <button onClick={()=>deleteCategory(cat)} style={{color:FAINT,padding:'4px 2px'}}><X className="w-2.5 h-2.5" strokeWidth={1.25}/></button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Add folder */}
        {addingCategory?(
          <div className="mt-3 flex items-center gap-1 px-2">
            <input
              autoFocus
              value={newCatName}
              onChange={e=>setNewCatName(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')addCategory();else if(e.key==='Escape'){setAddingCategory(false);setNewCatName('');}}}
              placeholder="Folder name…"
              className="flex-1 focus:outline-none text-xs py-1"
              style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`}}
            />
            <button onClick={addCategory} style={{color:IKB}}><Check className="w-3 h-3" strokeWidth={1.25}/></button>
          </div>
        ):(
          <button onClick={()=>setAddingCategory(true)} className="mt-3 px-2 py-1.5 flex items-center gap-1.5 italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>
            <FolderPlus className="w-3 h-3 not-italic" strokeWidth={1.25}/> New folder
          </button>
        )}

        {/* Tag cloud */}
        {allTags.length>0&&(
          <>
            <div className="mt-6 mb-2 uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Tags</div>
            <div className="flex flex-wrap gap-1">
              {allTags.slice(0,20).map(([tag,count])=>(
                <button
                  key={tag}
                  onClick={()=>handleTagClick(tag)}
                  style={{
                    color:tagSearch===tag?TEXT:MUTED,
                    background:tagSearch===tag?IKB_SOFT:'transparent',
                    border:`1px solid ${tagSearch===tag?IKB:LINE_MED}`,
                    fontSize:'10px',padding:'1px 5px',letterSpacing:'0.12em',
                  }}
                >
                  #{tag}
                  <span style={{color:FAINT,marginLeft:'3px'}}>{count}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Dev seed button */}
        {seedTestNotes&&(
          <div className="mt-auto pt-8">
            <button
              onClick={seedTestNotes}
              className="uppercase w-full text-left"
              style={{color:DIM,fontSize:'9px',letterSpacing:'0.18em',paddingTop:'8px',borderTop:`1px solid ${LINE}`}}
            >
              + Seed test notes
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 px-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>
              {isStdView?STD_CATEGORIES.find(c=>c.id===activeCategoryId)?.label:(tagSearch?`#${tagSearch}`:(activeCategoryId==='__all'?'All Notes':activeCategoryId))}
            </div>
            <h1 className="leading-none" style={{fontFamily:serif,fontWeight:300,fontSize:'56px',fontStyle:'italic',letterSpacing:'-0.02em'}}>Notes</h1>
          </div>
          {!isStdView&&(
            <button onClick={addNote} className="uppercase px-3 py-2 flex items-center gap-1.5 shrink-0" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>
              <Plus className="w-3 h-3" strokeWidth={1.25}/> New
            </button>
          )}
        </div>

        {/* Standard category views */}
        {activeCategoryId==='__daily'&&<DailyReflectionsView history={history||[]}/>}
        {activeCategoryId==='__repertoire'&&<RepertoireLogsView items={items||[]}/>}

        {/* Free notes list + editor */}
        {!isStdView&&(
          <>
            {/* Search bar */}
            <div className="flex items-center gap-3 mb-5 py-3" style={{borderTop:`1px solid ${LINE_STR}`,borderBottom:`1px solid ${LINE}`}}>
              <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.25} style={{color:FAINT}}/>
              <input
                type="text"
                value={tagSearch?`#${tagSearch}`:query}
                onChange={e=>{const v=e.target.value;if(v.startsWith('#')){setTagSearch(v.slice(1));setQuery('');}else{setQuery(v);setTagSearch('');}}}
                placeholder="Search notes or type #tag…"
                className="flex-1 text-sm focus:outline-none min-w-0"
                style={{background:'transparent',color:TEXT}}
              />
              {(query||tagSearch)&&<button onClick={()=>{setQuery('');setTagSearch('');}} className="uppercase" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.22em'}}>Clear</button>}
            </div>

            <div className="grid grid-cols-12 gap-10">
              {/* Note list */}
              <div className="col-span-4 space-y-0">
                {freeNotes.length===0&&<div className="italic py-4" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No notes yet.</div>}
                {freeNotes.length>0&&filtered.length===0&&<div className="italic py-4" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No notes match.</div>}
                {filtered.map((n,idx)=>(
                  <div
                    key={n.id}
                    onClick={()=>setActiveNoteId(n.id)}
                    className="py-4 px-3 cursor-pointer"
                    style={{borderTop:idx!==0?`1px solid ${LINE}`:'none',background:activeNoteId===n.id?IKB_SOFT:'transparent',borderLeft:activeNoteId===n.id?`2px solid ${IKB}`:`2px solid transparent`}}
                  >
                    <div className="uppercase mb-1" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.22em'}}>{n.date}{n.category?` · ${n.category}`:''}</div>
                    <div className="text-sm truncate" style={{fontWeight:300}}>{n.title}</div>
                    <div className="text-xs truncate mt-0.5 italic" style={{color:MUTED,fontFamily:serif}}>{n.body.slice(0,60)||'—'}</div>
                    {(n.tags||[]).length>0&&(
                      <div className="flex gap-1 flex-wrap mt-1">
                        {(n.tags||[]).slice(0,3).map(t=>(
                          <span key={t} style={{color:IKB,fontSize:'9px',letterSpacing:'0.12em'}}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Note editor */}
              <div className="col-span-8">
                {activeNote?(
                  <NoteEditor
                    note={activeNote}
                    categories={noteCategories}
                    onUpdate={(patch)=>updateNote(activeNote.id,patch)}
                    onDelete={()=>deleteNote(activeNote.id)}
                    onTagClick={handleTagClick}
                    onWikiLinkClick={handleWikiLinkClick}
                    items={items||[]}
                    history={history||[]}
                  />
                ):(
                  <div className="italic" style={{color:FAINT,fontFamily:serif}}>Select or create a note.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Wiki autocomplete popup ───────────────────────────────────────────────

// ── Note editor ───────────────────────────────────────────────────────────
function NoteEditor({note, categories, onUpdate, onDelete, onTagClick, onWikiLinkClick, items, history}){
  const [catOpen,setCatOpen]=useState(false);
  // MarkdownEditor sends raw [[link]] text; resolve before dispatching
  const handleWikiClick=useCallback((rawText)=>{
    const resolved=resolveWikiLink(rawText,items,history);
    if(resolved)onWikiLinkClick?.(resolved);
  },[items,history,onWikiLinkClick]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <input
          type="text"
          value={note.title}
          onChange={e=>onUpdate({title:e.target.value})}
          className="text-4xl focus:outline-none pb-1 w-full"
          style={{background:'transparent',color:TEXT,fontFamily:serif,fontWeight:300,letterSpacing:'-0.015em'}}
        />
        <button onClick={onDelete} className="shrink-0" style={{color:FAINT}}>
          <Trash2 className="w-4 h-4" strokeWidth={1.25}/>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-5" style={{borderBottom:`1px solid ${LINE}`,paddingBottom:'10px'}}>
        <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>{note.date}</div>

        {/* Category picker */}
        <div className="relative">
          <button onClick={()=>setCatOpen(v=>!v)} className="flex items-center gap-1 italic" style={{color:note.category?TEXT:FAINT,fontFamily:serif,fontSize:'12px'}}>
            <Folder className="w-3 h-3 not-italic" strokeWidth={1.25}/>
            {note.category||'No folder'}
            <ChevronDown className="w-3 h-3 not-italic" strokeWidth={1.25}/>
          </button>
          {catOpen&&(
            <>
              <div className="fixed inset-0 z-20" onClick={()=>setCatOpen(false)}/>
              <div className="absolute top-full mt-1 z-30 min-w-36" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
                <button onClick={()=>{onUpdate({category:''});setCatOpen(false);}} className="w-full text-left px-3 py-2 italic" style={{color:MUTED,borderBottom:`1px solid ${LINE}`,fontFamily:serif,fontSize:'12px'}}>No folder</button>
                {categories.map(c=>(
                  <button key={c} onClick={()=>{onUpdate({category:c});setCatOpen(false);}} className="w-full text-left px-3 py-2 italic" style={{color:note.category===c?TEXT:MUTED,background:note.category===c?IKB_SOFT:'transparent',borderBottom:`1px solid ${LINE}`,fontFamily:serif,fontSize:'12px'}}>{c}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      {(note.tags||[]).length>0&&(
        <div className="flex gap-1.5 flex-wrap mb-4">
          {(note.tags||[]).map(t=>(
            <button key={t} onClick={()=>onTagClick(t)} style={{color:IKB,background:`${IKB}15`,padding:'1px 6px',border:`1px solid ${IKB}30`,fontSize:'11px',cursor:'pointer'}}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Body — WYSIWYG Markdown editor */}
      <MarkdownEditor
        value={note.body||''}
        onChange={val=>onUpdate({body:val,tags:parseTagsFromBody(val)})}
        placeholder={`Write freely…\n\nTips:\n• Use **bold**, _italic_, or # headings\n• Type [[ to link a piece, date, or spot\n• Tag with #tag`}
        minHeight={320}
        fontSize="17px"
        items={items}
        history={history}
        onWikiLinkClick={handleWikiClick}
      />
    </div>
  );
}
