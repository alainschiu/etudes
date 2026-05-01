import React, {useState, useMemo, useCallback, useEffect} from 'react';
import useViewport from '../hooks/useViewport.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Folder from 'lucide-react/dist/esm/icons/folder';
import FolderPlus from 'lucide-react/dist/esm/icons/folder-plus';
import X from 'lucide-react/dist/esm/icons/x';
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Check from 'lucide-react/dist/esm/icons/check';
import Eye from 'lucide-react/dist/esm/icons/eye';
import {TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, SURFACE, SURFACE2, BG, serif, serifText, sans, LINK} from '../constants/theme.js';
const Z_SHEET_NOTES = 40;
import {todayDateStr} from '../lib/dates.js';
import {displayTitle, formatByline} from '../lib/items.js';
import {resolveWikiLink, parseTagsFromBody} from '../lib/notes.js';
import {MarkdownEditor} from '../components/MarkdownEditor.jsx';

// ── Standard categories (read-only views) ────────────────────────────────
const STD_CATEGORIES=[
  {id:'__daily',label:'Daily Reflections',icon:<Calendar className="w-3 h-3" strokeWidth={1.25}/>},
  {id:'__repertoire',label:'Repertoire Logs',icon:<BookOpen className="w-3 h-3" strokeWidth={1.25}/>},
];

// ── Daily Reflections standard view ──────────────────────────────────────
function DailyReflectionsView({history}){
  const days=useMemo(()=>[...history].filter(h=>(h.kind==='day'||!h.kind)&&h.reflection&&h.reflection.trim()).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30),[history]);
  if(days.length===0)return <div className="italic py-8 text-center" style={{color:FAINT,fontFamily:serif,fontSize:'15px'}}>No daily reflections yet.</div>;
  return (
    <div className="space-y-8">
      {days.map(h=>{
        const d=new Date(h.date);
        return (
          <div key={h.date} style={{borderBottom:`1px solid ${LINE}`,paddingBottom:'24px'}}>
            <div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>{d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
            <div style={{fontFamily:serifText,fontSize:'16px',lineHeight:1.8,fontWeight:300}}>
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
      <div className="flex items-center gap-2 mb-5 py-2" style={{borderBottom:`1px solid ${LINE_STR}`}}>
        <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.25} style={{color:FAINT}}/>
        <input type="text" value={pieceFilter} onChange={e=>setPieceFilter(e.target.value)} placeholder="Filter by piece…" className="flex-1 text-sm focus:outline-none" style={{background:'transparent',color:TEXT}}/>
        {pieceFilter&&<button onClick={()=>setPieceFilter('')} style={{color:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Clear</button>}
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
                <div style={{fontFamily:serifText,fontSize:'13px',lineHeight:1.65,color:TEXT,whiteSpace:'pre-wrap'}}>{entry.text}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Collapsible sidebar section header ────────────────────────────────────
function SidebarSection({label,open,onToggle,count,children}){
  return (
    <div className="mt-5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-2 group"
        style={{color:open?MUTED:FAINT,cursor:'pointer'}}
      >
        <span className="uppercase flex items-center gap-1.5" style={{fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans}}>
          {label}
          {count!=null&&count>0&&<span style={{color:DIM,fontFamily:'ui-monospace,monospace',fontSize:'9px',letterSpacing:'0.1em'}}>{count}</span>}
        </span>
        {open
          ?<ChevronUp className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.25}/>
          :<ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.25}/>
        }
      </button>
      {open&&<div style={{borderTop:`1px solid ${LINE}`}}>{children}</div>}
    </div>
  );
}

// ── Main NotesView ────────────────────────────────────────────────────────
export default function NotesView({freeNotes,setFreeNotes,noteCategories,setNoteCategories,items,history,setView,setExpandedItemId,openLogEntry,seedTestNotes,programs,setSelectedProgramId,requestedNoteId,setRequestedNoteId}){
  const {isMobile}=useViewport();
  const [activeCategoryId,setActiveCategoryId]=useState('__all');
  const [activeNoteId,setActiveNoteId]=useState(freeNotes[0]?.id);

  // Consume external navigation requests (e.g. from Programs body wiki-links)
  useEffect(()=>{
    if(requestedNoteId){
      setActiveNoteId(requestedNoteId);
      if(setRequestedNoteId)setRequestedNoteId(null);
    }
  },[requestedNoteId]);
  const [query,setQuery]=useState('');
  const [tagSearch,setTagSearch]=useState('');
  const [addingCategory,setAddingCategory]=useState(false);
  const [newCatName,setNewCatName]=useState('');
  const [editingCatId,setEditingCatId]=useState(null);
  const [editingCatName,setEditingCatName]=useState('');
  const [hoveredNoteId,setHoveredNoteId]=useState(null);

  // Sidebar open/close
  const [sidebarOpen,setSidebarOpen]=useState(false);

  // Collapsible sidebar sections
  const [archivesOpen,setArchivesOpen]=useState(true);
  const [foldersOpen,setFoldersOpen]=useState(true);
  const [tagsOpen,setTagsOpen]=useState(true);

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
  const filtered=useMemo(()=>{
    let list=freeNotes;
    if(activeCategoryId&&activeCategoryId!=='__all'&&!activeCategoryId.startsWith('__')){
      list=list.filter(n=>n.category===activeCategoryId);
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

  const handleTagClick=(tag)=>setTagSearch(tag===tagSearch?'':tag);

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
    }else if(resolved.type==='program'){
      if(setSelectedProgramId)setSelectedProgramId(resolved.target);
      if(setView)setView('programs');
    }else if(resolved.type==='note'){
      setActiveNoteId(resolved.target);
    }
  },[history,openLogEntry,setExpandedItemId,setView,setSelectedProgramId]);

  const isStdView=activeCategoryId==='__daily'||activeCategoryId==='__repertoire';

  // Dynamic view title
  const viewTitle=
    tagSearch?`#${tagSearch}`
    :activeCategoryId==='__daily'?'Daily Reflections'
    :activeCategoryId==='__repertoire'?'Repertoire Logs'
    :activeCategoryId==='__all'?'Notes'
    :activeCategoryId;

  // ── Mobile: note list + expand-in-place + edit sheet ──────────────────
  if(isMobile){
    return <NotesMobile
      freeNotes={freeNotes}
      filtered={filtered}
      noteCategories={noteCategories}
      allTags={allTags}
      activeCategoryId={activeCategoryId}
      setActiveCategoryId={setActiveCategoryId}
      query={query}
      setQuery={setQuery}
      tagSearch={tagSearch}
      setTagSearch={setTagSearch}
      addNote={addNote}
      updateNote={updateNote}
      deleteNote={deleteNote}
      seedTestNotes={seedTestNotes}
      items={items}
      history={history}
      onWikiLinkClick={handleWikiLinkClick}
    />;
  }

  // ── Desktop view (unchanged) ───────────────────────────────────────────
  return (
    <div className="flex max-w-6xl mx-auto h-full">
      {/* ── Left sidebar — identical structure to Répertoire ── */}
      {sidebarOpen&&(<aside className="w-52 shrink-0 px-5 pt-8 pb-14 flex flex-col overflow-y-auto etudes-scroll" style={{borderRight:`1px solid ${LINE}`}}>
        <div className="flex justify-end mb-2">
          <button
            onClick={()=>setSidebarOpen(false)}
            className="group flex items-center gap-1"
            style={{color:DIM,cursor:'pointer',transition:'color 120ms'}}
            onMouseEnter={e=>e.currentTarget.style.color=MUTED}
            onMouseLeave={e=>e.currentTarget.style.color=DIM}
          >
            <span className="opacity-0 group-hover:opacity-100 uppercase" style={{fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em',transition:'opacity 120ms'}}>Collapse</span>
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.25}/>
          </button>
        </div>

        {/* All notes */}
        <button
          onClick={()=>{setActiveCategoryId('__all');setTagSearch('');}}
          className="text-left py-2 px-2 flex items-center justify-between"
          style={{color:activeCategoryId==='__all'&&!tagSearch?TEXT:MUTED,background:activeCategoryId==='__all'&&!tagSearch?IKB_SOFT:'transparent',borderLeft:activeCategoryId==='__all'&&!tagSearch?`2px solid ${IKB}`:'2px solid transparent',fontSize:'13px',fontWeight:300}}
        >
          <span style={{fontFamily:serif,fontStyle:'italic'}}>All notes</span>
          <span style={{color:FAINT,fontSize:'10px',fontFamily:'ui-monospace,monospace'}}>{freeNotes.length}</span>
        </button>

        {/* Archives — collapsible */}
        <SidebarSection label="Archives" open={archivesOpen} onToggle={()=>setArchivesOpen(v=>!v)}>
          {STD_CATEGORIES.map(cat=>(
            <button
              key={cat.id}
              onClick={()=>{setActiveCategoryId(cat.id);setTagSearch('');}}
              className="w-full text-left py-1.5 px-2 flex items-center gap-2"
              style={{color:activeCategoryId===cat.id?TEXT:MUTED,background:activeCategoryId===cat.id?IKB_SOFT:'transparent',borderBottom:`1px solid ${LINE}`,borderLeft:activeCategoryId===cat.id?`2px solid ${IKB}`:'2px solid transparent',fontSize:'12px',fontWeight:300,paddingLeft:activeCategoryId===cat.id?'6px':'8px'}}
            >
              <span style={{color:activeCategoryId===cat.id?IKB:FAINT,flexShrink:0}}>{cat.icon}</span>
              <span style={{fontFamily:serif,fontStyle:'italic'}}>{cat.label}</span>
            </button>
          ))}
        </SidebarSection>

        {/* Folders — collapsible */}
        <SidebarSection label="Folders" open={foldersOpen} onToggle={()=>setFoldersOpen(v=>!v)} count={noteCategories.length}>
          {noteCategories.map(cat=>(
            <div key={cat} className="group flex items-center" style={{borderBottom:`1px solid ${LINE}`}}>
              {editingCatId===cat?(
                <div className="flex-1 flex items-center gap-1 py-1.5 px-2">
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
                  className="flex-1 text-left py-1.5 px-2 flex items-center gap-1.5"
                  style={{color:activeCategoryId===cat?TEXT:MUTED,background:activeCategoryId===cat?IKB_SOFT:'transparent',borderLeft:activeCategoryId===cat?`2px solid ${IKB}`:'2px solid transparent',fontSize:'12px',fontWeight:300,paddingLeft:activeCategoryId===cat?'6px':'8px'}}
                >
                  <Folder className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:activeCategoryId===cat?IKB:FAINT}}/>
                  <span className="truncate" style={{fontFamily:serif,fontStyle:'italic'}}>{cat}</span>
                  <span className="ml-auto shrink-0" style={{color:FAINT,fontSize:'10px',fontFamily:'ui-monospace,monospace'}}>{freeNotes.filter(n=>n.category===cat).length}</span>
                </button>
              )}
              {editingCatId!==cat&&(
                <div className="opacity-0 group-hover:opacity-100 flex items-center shrink-0 pr-1">
                  <button onClick={()=>{setEditingCatId(cat);setEditingCatName(cat);}} style={{color:FAINT,padding:'4px 2px'}}><Pencil className="w-2.5 h-2.5" strokeWidth={1.25}/></button>
                  <button onClick={()=>deleteCategory(cat)} style={{color:FAINT,padding:'4px 2px'}}><X className="w-2.5 h-2.5" strokeWidth={1.25}/></button>
                </div>
              )}
            </div>
          ))}
          {/* New folder — inside expanded folders section */}
          {addingCategory?(
            <div className="flex items-center gap-1 px-2 py-2">
              <input
                autoFocus
                value={newCatName}
                onChange={e=>setNewCatName(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')addCategory();else if(e.key==='Escape'){setAddingCategory(false);setNewCatName('');}}}
                placeholder="Folder name…"
                className="flex-1 focus:outline-none text-xs py-0.5"
                style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`}}
              />
              <button onClick={addCategory} style={{color:IKB}}><Check className="w-3 h-3" strokeWidth={1.25}/></button>
            </div>
          ):(
            <button
              onClick={()=>{setFoldersOpen(true);setAddingCategory(true);}}
              className="px-2 py-2 flex items-center gap-1.5"
              style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}
            >
              <FolderPlus className="w-3 h-3" strokeWidth={1.25}/>
              <span className="uppercase">New folder</span>
            </button>
          )}
        </SidebarSection>

        {/* Tags — collapsible */}
        {allTags.length>0&&(
          <SidebarSection label="Tags" open={tagsOpen} onToggle={()=>setTagsOpen(v=>!v)} count={allTags.length}>
            <div className="flex flex-wrap gap-1 pt-2 pb-1">
              {allTags.slice(0,20).map(([tag,count])=>(
                <button
                  key={tag}
                  onClick={()=>handleTagClick(tag)}
                  style={{
                    color:tagSearch===tag?TEXT:MUTED,
                    background:tagSearch===tag?IKB_SOFT:'transparent',
                    border:`1px solid ${tagSearch===tag?IKB:LINE_MED}`,
                    fontSize:'10px',padding:'1px 6px',
                    letterSpacing:'0.14em',
                    borderRadius:'3px',
                    transition:'color 120ms, border-color 120ms, background 120ms',
                  }}
                >
                  #{tag}<span style={{color:FAINT,marginLeft:'3px',fontFamily:'ui-monospace,monospace',fontSize:'9px'}}>{count}</span>
                </button>
              ))}
            </div>
          </SidebarSection>
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
      </aside>)}

      {/* ── Main content column — matches Répertoire structure ── */}
      <div className={`flex-1 min-w-0 ${sidebarOpen?'px-10':'px-12'} pt-14 pb-14 flex flex-col min-h-0`}>
        {/* Filter button — above heading, only when sidebar closed (identical to Répertoire) */}
        <div className="flex items-center gap-2 mb-3">
          {!sidebarOpen&&<button onClick={()=>setSidebarOpen(true)} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}><BookOpen className="w-3 h-3" strokeWidth={1.25}/> Filter</button>}
        </div>

        {/* Heading — inside content column, no paddingLeft hack */}
        <div className="mb-6">
          <div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em',fontFamily:sans}}>Notes</div>
          <h1 className="leading-none" style={{fontFamily:serif,fontWeight:400,fontSize:'clamp(32px,6vw,56px)',fontStyle:'italic',letterSpacing:'-0.02em'}}>{viewTitle}</h1>
        </div>

        {/* Standard category views */}
        {activeCategoryId==='__daily'&&<div className="overflow-y-auto etudes-scroll flex-1 min-h-0"><DailyReflectionsView history={history||[]}/></div>}
        {activeCategoryId==='__repertoire'&&<div className="overflow-y-auto etudes-scroll flex-1 min-h-0"><RepertoireLogsView items={items||[]}/></div>}

        {/* Free notes list + editor */}
        {!isStdView&&(
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search bar — single bottom border */}
            <div className="flex items-center gap-3 mb-5 py-2 shrink-0" style={{borderBottom:`1px solid ${LINE_STR}`}}>
              <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.25} style={{color:FAINT}}/>
              <input
                type="text"
                value={tagSearch?`#${tagSearch}`:query}
                onChange={e=>{const v=e.target.value;if(v.startsWith('#')){setTagSearch(v.slice(1));setQuery('');}else{setQuery(v);setTagSearch('');}}}
                placeholder="Search or #tag…"
                className="flex-1 text-sm focus:outline-none min-w-0"
                style={{background:'transparent',color:TEXT}}
              />
              {(query||tagSearch)&&<button onClick={()=>{setQuery('');setTagSearch('');}} className="uppercase" style={{color:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Clear</button>}
            </div>

            <div className="flex gap-0 flex-1 min-h-0">
              {/* Note list — with New button + count at top */}
              <div className="w-72 shrink-0 pr-8 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="uppercase" style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>
                    {filtered.length} note{filtered.length!==1?'s':''}
                  </span>
                  <button
                    onClick={addNote}
                    className="flex items-center gap-1 px-2 py-1 uppercase"
                    style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',borderRadius:'3px',transition:'color 120ms, border-color 120ms'}}
                    onMouseEnter={e=>{e.currentTarget.style.color=TEXT;e.currentTarget.style.borderColor=LINE_STR;}}
                    onMouseLeave={e=>{e.currentTarget.style.color=MUTED;e.currentTarget.style.borderColor=LINE_MED;}}
                  >
                    <Plus className="w-3 h-3" strokeWidth={1.25}/> New
                  </button>
                </div>
                <div className="overflow-y-auto etudes-scroll flex-1 min-h-0" style={{borderTop:`1px solid ${LINE}`}}>
                  {freeNotes.length===0&&<div className="italic py-4" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No notes yet.</div>}
                  {freeNotes.length>0&&filtered.length===0&&<div className="italic py-4" style={{color:FAINT,fontFamily:serif,fontSize:'13px'}}>No notes match.</div>}
                  {filtered.map((n,idx)=>{
                    const isActive=activeNoteId===n.id;
                    const isHov=hoveredNoteId===n.id&&!isActive;
                    return (
                      <div
                        key={n.id}
                        onClick={()=>setActiveNoteId(n.id)}
                        onMouseEnter={()=>setHoveredNoteId(n.id)}
                        onMouseLeave={()=>setHoveredNoteId(null)}
                        className="py-3 px-3 cursor-pointer"
                        style={{
                          borderBottom:`1px solid ${LINE}`,
                          background:isActive?IKB_SOFT:isHov?'rgba(0,47,167,0.04)':'transparent',
                          borderLeft:isActive?`2px solid ${IKB}`:'2px solid transparent',
                          paddingLeft:isActive?'10px':'12px',
                          transition:'background 120ms',
                        }}
                      >
                        <div className="uppercase mb-1" style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>{n.date}{n.category?` · ${n.category}`:''}</div>
                        <div className="text-sm truncate" style={{fontWeight:300,color:isActive||isHov?TEXT:MUTED}}>{n.title}</div>
                        <div className="text-xs truncate mt-0.5" style={{color:FAINT,fontFamily:sans,fontWeight:300}}>{n.body.replace(/[#*_\[\]`]/g,'').slice(0,60)||'—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Note editor */}
              <div className="flex-1 min-w-0 pl-8 overflow-y-auto etudes-scroll" style={{borderLeft:`1px solid ${LINE}`}}>
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
                    programs={programs||[]}
                    notes={freeNotes||[]}
                  />
                ):(
                  <div className="italic" style={{color:FAINT,fontFamily:serif}}>Select or create a note.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Note editor ───────────────────────────────────────────────────────────
function NoteEditor({note, categories, onUpdate, onDelete, onTagClick, onWikiLinkClick, items, history, programs, notes}){
  const [catOpen,setCatOpen]=useState(false);
  const [viewMode,setViewMode]=useState(false);
  const handleWikiClick=useCallback((rawText)=>{
    const resolved=resolveWikiLink(rawText,items,history,programs,notes);
    if(resolved)onWikiLinkClick?.(resolved);
  },[items,history,programs,notes,onWikiLinkClick]);

  return (
    <div>
      {/* Title */}
      {viewMode?(
        <div className="pb-1 mb-3 leading-none" style={{fontFamily:serif,fontWeight:300,fontSize:'36px',letterSpacing:'-0.015em',color:TEXT}}>{note.title||'Untitled'}</div>
      ):(
        <input
          type="text"
          value={note.title}
          onChange={e=>onUpdate({title:e.target.value})}
          className="text-4xl focus:outline-none pb-1 w-full mb-3"
          style={{background:'transparent',color:TEXT,fontFamily:serif,fontWeight:300,letterSpacing:'-0.015em'}}
        />
      )}

      {/* Meta row: date + folder picker + view/edit toggle */}
      <div className="flex items-center gap-4 mb-5" style={{borderBottom:`1px solid ${LINE}`,paddingBottom:'10px'}}>
        <div className="uppercase" style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.28em'}}>{note.date}</div>

        {/* Category picker — hidden in view mode */}
        {!viewMode&&(
          <div className="relative">
            <button
              onClick={()=>setCatOpen(v=>!v)}
              className="flex items-center gap-1"
              style={{color:note.category?MUTED:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}
            >
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
        )}
        {note.category&&viewMode&&(
          <span className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>{note.category}</span>
        )}

        {/* View / edit toggle — ml-auto pushes to right */}
        <button
          onClick={()=>setViewMode(v=>!v)}
          className="ml-auto flex items-center gap-1 uppercase"
          style={{color:viewMode?IKB:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',transition:'color 120ms'}}
          title={viewMode?'Switch to edit':'Switch to preview'}
        >
          {viewMode
            ?<Pencil className="w-3 h-3" strokeWidth={1.25}/>
            :<Eye className="w-3 h-3" strokeWidth={1.25}/>
          }
          {viewMode?'Edit':'Preview'}
        </button>
      </div>

      {/* Inline tags (clickable, from body parsing) */}
      {(note.tags||[]).length>0&&(
        <div className="flex gap-1.5 flex-wrap mb-4">
          {(note.tags||[]).map(t=>(
            <button
              key={t}
              onClick={()=>onTagClick(t)}
              style={{color:IKB,background:`${IKB}15`,padding:'1px 6px',border:`1px solid ${IKB}30`,fontSize:'10px',letterSpacing:'0.14em',borderRadius:'3px',cursor:'pointer'}}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Body — preview or editor */}
      {viewMode?(
        <div style={{fontFamily:serifText,fontSize:'17px',lineHeight:1.75,fontWeight:300,color:TEXT}}>
          {note.body?(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              p:({children})=><p style={{marginBottom:'1em'}}>{children}</p>,
              h1:({children})=><h1 style={{fontFamily:serif,fontWeight:500,fontSize:'1.5em',marginBottom:'0.4em',marginTop:'1.2em',fontStyle:'italic'}}>{children}</h1>,
              h2:({children})=><h2 style={{fontFamily:serif,fontWeight:500,fontSize:'1.25em',marginBottom:'0.4em',marginTop:'1em',fontStyle:'italic'}}>{children}</h2>,
              h3:({children})=><h3 style={{fontFamily:sans,fontWeight:500,fontSize:'0.75em',letterSpacing:'0.2em',textTransform:'uppercase',color:FAINT,marginBottom:'0.4em',marginTop:'1em'}}>{children}</h3>,
              strong:({children})=><strong style={{fontWeight:500,color:TEXT}}>{children}</strong>,
              em:({children})=><em style={{fontStyle:'italic'}}>{children}</em>,
              ul:({children})=><ul style={{paddingLeft:'1.2em',marginBottom:'0.8em',listStyleType:'disc'}}>{children}</ul>,
              ol:({children})=><ol style={{paddingLeft:'1.2em',marginBottom:'0.8em',listStyleType:'decimal'}}>{children}</ol>,
              li:({children})=><li style={{marginBottom:'0.25em'}}>{children}</li>,
              blockquote:({children})=><blockquote style={{borderLeft:`2px solid ${IKB}40`,paddingLeft:'1em',margin:'0.8em 0',color:MUTED,fontStyle:'italic'}}>{children}</blockquote>,
              hr:()=><hr style={{border:'none',borderTop:`1px solid ${LINE}`,margin:'1.5em 0'}}/>,
              a:({href,children})=>{
                // Internal wiki links (pre-processed from [[text]] → wiki://text)
                if(href?.startsWith('wiki://')){
                  const raw=decodeURIComponent(href.slice(7));
                  return <span onClick={()=>handleWikiClick(raw)} style={{color:IKB,borderBottom:`1px solid ${IKB}40`,cursor:'pointer'}}>{children}</span>;
                }
                // External links — ensure protocol present, open in new tab
                const url=href&&!href.match(/^https?:\/\/|^mailto:|^#/)? `https://${href}`:href;
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{color:IKB,borderBottom:`1px solid ${IKB}40`}}>{children}</a>;
              },
              code:({children})=><code style={{fontFamily:'ui-monospace,monospace',fontSize:'0.85em',background:'rgba(244,238,227,0.06)',padding:'1px 5px',borderRadius:'2px'}}>{children}</code>,
            }}>
              {/* Pre-process [[wiki links]] → [text](wiki://text) so ReactMarkdown can render them */}
              {note.body.replace(/\[\[([^\]\n]+)\]\]/g,(_,t)=>`[${t}](wiki://${encodeURIComponent(t)})`)}
            </ReactMarkdown>
          ):(
            <span className="italic" style={{color:FAINT}}>No content yet.</span>
          )}
        </div>
      ):(
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
      )}

      {/* Delete — bottom of editor, away from title */}
      {!viewMode&&(
        <div className="mt-8 pt-4" style={{borderTop:`1px solid ${LINE}`}}>
          <button
            onClick={onDelete}
            className="uppercase"
            style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',transition:'color 120ms'}}
            onMouseEnter={e=>e.currentTarget.style.color=MUTED}
            onMouseLeave={e=>e.currentTarget.style.color=FAINT}
          >
            Delete note
          </button>
        </div>
      )}
    </div>
  );
}

// ── Mobile notes view ─────────────────────────────────────────────────────
function NotesMobile({freeNotes,filtered,noteCategories,allTags,activeCategoryId,setActiveCategoryId,query,setQuery,tagSearch,setTagSearch,addNote,updateNote,deleteNote,seedTestNotes,items,history,onWikiLinkClick}){
  const [expandedId,setExpandedId]=useState(null);
  const [editSheetId,setEditSheetId]=useState(null);
  const [filterSheetOpen,setFilterSheetOpen]=useState(false);
  const ZSHEET=40;

  const ALL_CHIPS=[
    {id:'__all',label:'All notes'},
    {id:'__daily',label:'Daily'},
    {id:'__repertoire',label:'Logs'},
    ...noteCategories.map(c=>({id:c,label:c})),
    ...allTags.slice(0,12).map(t=>({id:`#${t}`,label:`#${t}`,isTag:true})),
  ];

  const handleChip=(chip)=>{
    if(chip.isTag){setTagSearch(tagSearch===chip.id.slice(1)?'':chip.id.slice(1));setActiveCategoryId('__all');}
    else{setActiveCategoryId(chip.id);setTagSearch('');}
  };

  const editNote=freeNotes.find(n=>n.id===editSheetId);

  const sheetStyle={
    position:'fixed',bottom:0,left:0,right:0,height:'85vh',
    background:BG,borderTop:`1px solid ${LINE_STR}`,zIndex:ZSHEET,
    transform:editSheetId?'translateY(0)':'translateY(100%)',
    transition:editSheetId?'transform 240ms ease-out':'transform 200ms ease-in',
    display:'flex',flexDirection:'column',
  };

  return(
    <div style={{paddingBottom:'calc(var(--footer-height,160px) + 24px)'}}>
      {/* Heading row — first */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',padding:'20px 20px 12px'}}>
        <div style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,fontSize:'clamp(48px,13vw,56px)',letterSpacing:'-0.02em',lineHeight:1.05,color:TEXT}}>
          {activeCategoryId==='__all'&&!tagSearch?'Notes':activeCategoryId==='__daily'?'Daily':activeCategoryId==='__repertoire'?'Logs':tagSearch?`#${tagSearch}`:activeCategoryId}
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center',paddingBottom:'8px'}}>
          {seedTestNotes&&<button onClick={seedTestNotes} style={{color:FAINT,fontFamily:sans,fontSize:'9px',letterSpacing:'0.18em',textTransform:'uppercase',background:'transparent',border:`1px solid ${LINE_MED}`,padding:'4px 8px',cursor:'pointer'}}>Seed</button>}
          <button onClick={()=>setFilterSheetOpen(true)} style={{width:'36px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${activeCategoryId!=='__all'||tagSearch?IKB:LINE_MED}`,borderRadius:'4px',cursor:'pointer',color:activeCategoryId!=='__all'||tagSearch?IKB:MUTED}} aria-label="Filter notes"><SlidersHorizontal size={14} strokeWidth={1.25}/></button>
          <button onClick={addNote} style={{minWidth:'36px',minHeight:'36px',display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${LINE_MED}`,cursor:'pointer',color:MUTED}}><Plus className="w-3.5 h-3.5" strokeWidth={1.25}/></button>
        </div>
      </div>
      {/* Search bar — after heading */}
      <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 20px',borderBottom:`1px solid ${LINE}`}}>
        <Search className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:FAINT}}/>
        <input type="text" value={tagSearch?`#${tagSearch}`:query} onChange={e=>{const v=e.target.value;if(v.startsWith('#')){setTagSearch(v.slice(1));setQuery('');}else{setQuery(v);setTagSearch('');}}} placeholder="Search or #tag…" style={{flex:1,background:'transparent',border:'none',color:TEXT,fontFamily:serifText,fontStyle:'italic',fontSize:'14px',outline:'none'}}/>
        {(query||tagSearch)&&<button onClick={()=>{setQuery('');setTagSearch('');}} style={{color:MUTED,background:'transparent',border:'none',cursor:'pointer',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase'}}>Clear</button>}
      </div>
      {/* Folder chip strip — after search, edge-to-edge */}
      <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',WebkitScrollbarWidth:'none',padding:'12px 20px',borderBottom:`1px solid ${LINE}`}}>
        <div style={{display:'flex',gap:'8px',flexShrink:0,minWidth:'max-content'}}>
          {ALL_CHIPS.map(chip=>{
            const active=chip.isTag?tagSearch===chip.id.slice(1):activeCategoryId===chip.id&&!tagSearch;
            return(
              <button key={chip.id} onClick={()=>handleChip(chip)} style={{flexShrink:0,padding:'4px 12px',border:`1px solid ${active?IKB:LINE_STR}`,borderRadius:'999px',background:active?IKB_SOFT:'transparent',cursor:'pointer',fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.22em',textTransform:'uppercase',color:active?TEXT:FAINT,whiteSpace:'nowrap'}}>
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Note list */}
      <div>
        {filtered.length===0&&<div style={{padding:'32px 20px',fontFamily:serifText,fontStyle:'italic',fontSize:'14px',color:FAINT,textAlign:'center'}}>No notes yet.</div>}
        {filtered.map(note=>{
          const isExpanded=expandedId===note.id;
          const preview=(note.body||'').replace(/^#+\s*/gm,'').replace(/[*_`#\[\]]/g,'').trim();
          return(
            <div key={note.id} style={{borderBottom:`1px solid ${LINE}`,padding:'18px 20px 14px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',marginBottom:'6px',cursor:'pointer'}} onClick={()=>setExpandedId(isExpanded?null:note.id)}>
                <div style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'20px',color:TEXT,lineHeight:1.2,flex:1,minWidth:0}}>{note.title||'Untitled'}</div>
                <span style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.22em',textTransform:'uppercase',color:FAINT,flexShrink:0,paddingTop:'4px'}}>{note.date}</span>
              </div>
              {!isExpanded&&preview&&<div onClick={()=>setExpandedId(note.id)} style={{fontFamily:serifText,fontSize:'14px',lineHeight:1.6,color:FAINT,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',cursor:'pointer'}}>{preview}</div>}
              {isExpanded&&(
                <div>
                  <div style={{fontFamily:serifText,fontStyle:'italic',fontSize:'14px',lineHeight:1.7,color:TEXT,marginTop:'4px'}}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      p:({children})=><p style={{marginBottom:'0.7em'}}>{children}</p>,
                      h1:({children})=><h1 style={{fontSize:'1.2em',fontWeight:500,marginBottom:'0.4em',marginTop:'0.8em'}}>{children}</h1>,
                      h2:({children})=><h2 style={{fontSize:'1.1em',fontWeight:500,marginBottom:'0.3em',marginTop:'0.7em'}}>{children}</h2>,
                      h3:({children})=><h3 style={{fontSize:'1em',fontWeight:400,marginBottom:'0.3em',marginTop:'0.6em',opacity:0.8}}>{children}</h3>,
                      a:({href,children})=>{
                        const isWiki=href&&href.startsWith('etudes://');
                        if(isWiki){
                          // Never render a real <a> with etudes:// — iOS would try to open it as a URL scheme
                          return <span onClick={e=>{e.stopPropagation();if(onWikiLinkClick)onWikiLinkClick({type:'note',target:decodeURIComponent(href.replace('etudes://',''))});}} style={{color:IKB,cursor:'pointer',textDecoration:'underline'}}>{children}</span>;
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer" style={{color:LINK,textDecoration:'underline'}}>{children}</a>;
                      },
                    }}>
                      {(note.body||'').replace(/\[\[(.+?)\]\]/g,(_,t)=>`[${t}](etudes://${t})`)}
                    </ReactMarkdown>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'12px'}}>
                    <button onClick={()=>setEditSheetId(note.id)} style={{display:'flex',alignItems:'center',gap:'4px',background:'transparent',border:`1px solid ${LINE_MED}`,padding:'5px 10px',cursor:'pointer',color:MUTED}}>
                      <Pencil className="w-2.5 h-2.5" strokeWidth={1.25}/><span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Edit</span>
                    </button>
                    <button onClick={()=>deleteNote(note.id)} style={{display:'flex',alignItems:'center',gap:'4px',background:'transparent',border:'none',cursor:'pointer',color:FAINT,padding:'5px 0'}}>
                      <Trash2 className="w-2.5 h-2.5" strokeWidth={1.25}/><span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Filter bottom sheet */}
      {filterSheetOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:ZSHEET-1}} onClick={()=>setFilterSheetOpen(false)}/>}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:BG,borderTop:`1px solid ${LINE_STR}`,borderRadius:'12px 12px 0 0',zIndex:ZSHEET,paddingBottom:'env(safe-area-inset-bottom,16px)',transform:filterSheetOpen?'translateY(0)':'translateY(100%)',transition:filterSheetOpen?'transform 240ms ease-out':'transform 200ms ease-in',maxHeight:'70vh',overflowY:'auto'}}>
        <div style={{width:'36px',height:'3px',background:LINE_STR,borderRadius:'999px',margin:'12px auto 0'}}/>
        <div style={{padding:'16px 24px 12px',borderBottom:`1px solid ${LINE}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.28em',color:FAINT}}>Filter notes</span>
          {(activeCategoryId!=='__all'||tagSearch)&&<button onClick={()=>{setActiveCategoryId('__all');setTagSearch('');setFilterSheetOpen(false);}} style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:MUTED,background:'transparent',border:'none',cursor:'pointer'}}>Clear</button>}
        </div>
        {/* Folders */}
        {[
          {id:'__all',label:'All notes'},
          {id:'__daily',label:'Daily Reflections'},
          {id:'__repertoire',label:'Repertoire Logs'},
          ...noteCategories.map(c=>({id:c,label:c})),
        ].map(folder=>{
          const active=activeCategoryId===folder.id&&!tagSearch;
          return(
            <button key={folder.id} onClick={()=>{setActiveCategoryId(folder.id);setTagSearch('');setFilterSheetOpen(false);}} style={{display:'flex',alignItems:'center',width:'100%',padding:'12px 24px',minHeight:'44px',background:active?IKB_SOFT:'transparent',borderLeft:`2px solid ${active?IKB:'transparent'}`,border:'none',borderLeftWidth:'2px',borderLeftStyle:'solid',borderLeftColor:active?IKB:'transparent',cursor:'pointer',textAlign:'left',fontFamily:sans,fontSize:'13px',fontWeight:500,color:active?TEXT:MUTED}}>
              {folder.label}
            </button>
          );
        })}
        {/* Tags */}
        {allTags.length>0&&(
          <div style={{padding:'12px 24px 0',borderTop:`1px solid ${LINE}`}}>
            <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans,marginBottom:'10px'}}>Tags</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',paddingBottom:'12px'}}>
              {allTags.map(t=>{
                const active=tagSearch===t;
                return(
                  <button key={t} onClick={()=>{setTagSearch(active?'':t);setActiveCategoryId('__all');setFilterSheetOpen(false);}} style={{padding:'4px 12px',border:`1px solid ${active?IKB:LINE_STR}`,borderRadius:'999px',background:active?IKB_SOFT:'transparent',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:active?TEXT:FAINT,cursor:'pointer'}}>#{t}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit bottom sheet */}
      {editSheetId&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:ZSHEET-1}} onClick={()=>setEditSheetId(null)}/>}
      <div style={sheetStyle}>
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}><div style={{width:'36px',height:'3px',background:LINE_STR,borderRadius:'999px'}}/></div>
        {editNote&&(
          <>
            <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'8px 20px',borderBottom:`1px solid ${LINE}`,flexShrink:0}}>
              <input value={editNote.title||''} onChange={e=>updateNote(editNote.id,{title:e.target.value})} style={{flex:1,background:'transparent',border:'none',borderBottom:`1px solid ${LINE_MED}`,color:TEXT,fontFamily:serifText,fontStyle:'italic',fontSize:'20px',outline:'none',paddingBottom:'2px',minWidth:0}} placeholder="Untitled"/>
              <button onClick={()=>setEditSheetId(null)} style={{flexShrink:0,minWidth:'44px',minHeight:'44px',display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'none',cursor:'pointer'}}>
                <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.22em',color:IKB}}>Done</span>
              </button>
            </div>
            <div style={{flex:1,overflow:'hidden'}}>
              <MarkdownEditor value={editNote.body||''} onChange={val=>updateNote(editNote.id,{body:val,tags:parseTagsFromBody(val)})} placeholder={`Write freely…\n\nTips:\n• Use **bold**, _italic_, or # headings\n• Type [[ to link a piece, date, or spot\n• Tag with #tag`} minHeight={400} fontSize="16px" items={items} history={history} onWikiLinkClick={onWikiLinkClick}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
