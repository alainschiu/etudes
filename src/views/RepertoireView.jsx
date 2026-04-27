import React, {useState, useMemo, useEffect} from 'react';
import {Play, Pause, Plus, X, ChevronDown, ChevronUp, FileText, ArrowUp, ArrowDown, Crosshair, Pencil, Trash2, TrendingUp, Users, GripVertical, Search, Layers, Link as LinkIcon, Music, Guitar, Calendar, Check, BookOpen, Mic} from 'lucide-react';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, WARM_SOFT, serif, sans} from '../constants/theme.js';
import {TYPES, SECTION_CONFIG, STAGES} from '../constants/config.js';
import {daysUntil, todayDateStr} from '../lib/dates.js';
import {getItemTime, getSpotTime, displayTitle, formatByline, normalizeComposerKey, nextPerformance, mkSpotId} from '../lib/items.js';
import {toRoman} from '../lib/music.js';
import {DisplayHeader, StageLabels, PerformanceChip, ItemTimeEditor, MarkdownField} from '../components/shared.jsx';
import {fmtSpotTime} from '../components/shared.jsx';
import PieceRecordingsPanel from '../components/PieceRecordingsPanel.jsx';

function FilterDropdown({label,value,options,onChange}){const [open,setOpen]=useState(false);const current=options.find(o=>o.value===value);return (<div className="relative shrink-0"><button onClick={()=>setOpen(v=>!v)} className="flex items-center gap-1 px-2 py-1 uppercase" style={{background:value?IKB_SOFT:'transparent',border:`1px solid ${value?IKB:LINE_MED}`,color:value?TEXT:MUTED,fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em'}}>{label}{value&&<>: <span style={{color:TEXT,fontWeight:400}}>{current?.label}</span></>}<ChevronDown className="w-2.5 h-2.5" strokeWidth={1.25}/></button>{open&&(<><div className="fixed inset-0 z-20" onClick={()=>setOpen(false)}/><div className="absolute top-full mt-1 z-30 min-w-40 max-h-64 overflow-auto etudes-scroll" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>{options.map(o=>(<button key={o.value||'_all'} onClick={()=>{onChange(o.value);setOpen(false);}} className="w-full text-left px-3 py-2" style={{background:value===o.value?IKB_SOFT:'transparent',color:value===o.value?TEXT:MUTED,borderBottom:`1px solid ${LINE}`,fontFamily:serif,fontSize:'13px',fontStyle:'italic',fontWeight:300}}>{o.label}</button>))}</div></>)}</div>);}

function SortDropdown({value,onChange}){
  const [open,setOpen]=useState(false);
  const opts=[
    {value:'',label:'Default'},
    {value:'composer',label:'Composer'},
    {value:'title',label:'Title'},
    {value:'stage',label:'Stage'},
    {value:'type',label:'Type'},
    {value:'lastPracticed',label:'Last Practiced'},
    {value:'timeInvested',label:'Time Invested'},
    {value:'length',label:'Piece Length'},
  ];
  const current=opts.find(o=>o.value===value);
  return (<div className="relative"><button onClick={()=>setOpen(v=>!v)} className="flex items-center gap-1 px-2 py-1 uppercase" style={{background:value?IKB_SOFT:'transparent',border:`1px solid ${value?IKB:LINE_MED}`,color:value?TEXT:MUTED,fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em'}}>SORT{value&&<>: <span style={{color:TEXT,fontWeight:400}}>{current?.label}</span></>}<ChevronDown className="w-2.5 h-2.5" strokeWidth={1.25}/></button>{open&&(<><div className="fixed inset-0 z-20" onClick={()=>setOpen(false)}/><div className="absolute top-full mt-1 z-30 min-w-40" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>{opts.map(o=>(<button key={o.value||'_def'} onClick={()=>{onChange(o.value);setOpen(false);}} className="w-full text-left px-3 py-2" style={{background:value===o.value?IKB_SOFT:'transparent',color:value===o.value?TEXT:MUTED,borderBottom:`1px solid ${LINE}`,fontFamily:serif,fontSize:'13px',fontStyle:'italic',fontWeight:300}}>{o.label}</button>))}</div></>)}</div>);}

function lastPracticedLabel(id,history){for(let i=history.length-1;i>=0;i--){const h=history[i];if((h.kind==='day'||!h.kind)&&h.items?.some(it=>it.id===id))return h.date;}return null;}
function relativeDay(ds){if(!ds)return null;const d=new Date(ds);const t=new Date();t.setHours(0,0,0,0);const dc=new Date(d);dc.setHours(0,0,0,0);const days=Math.round((t-dc)/86400000);if(days===0)return'today';if(days===1)return'yesterday';if(days<7)return`${days} days ago`;if(days<14)return'last week';if(days<30)return`${Math.floor(days/7)} weeks ago`;return`${Math.floor(days/30)} months ago`;}

function parseLengthInput(v){v=(v||'').trim();if(!v)return null;if(v.includes(':')){const[m,s]=v.split(':').map(Number);return(isNaN(m)||isNaN(s))?null:m*60+s;}const n=parseFloat(v);return isNaN(n)?null:Math.round(n*60);}
function formatLength(secs){if(!secs)return null;const m=Math.floor(secs/60),s=secs%60;return`${m}′${String(s).padStart(2,'0')}″`;}

function BpmSparkline({log,target,compact=false}){if(!log||log.length<2)return null;const bpms=log.map(e=>e.bpm);const values=target?[...bpms,target]:bpms;const min=Math.min(...values);const max=Math.max(...values);const range=Math.max(1,max-min);const w=compact?140:200,h=compact?28:40;const pts=log.map((e,i)=>{const x=(i/(log.length-1))*w;const y=h-((e.bpm-min)/range)*h;return `${x.toFixed(1)},${y.toFixed(1)}`;}).join(' ');const first=log[0].bpm;const last=log[log.length-1].bpm;const tY=target?h-((target-min)/range)*h:null;const reached=target&&last>=target;return (<div className="flex items-center gap-3"><span className="tabular-nums" style={{color:MUTED,fontSize:'10px'}}>{first}</span><svg width={w} height={h} className="shrink-0">{tY!==null&&(<><line x1="0" y1={tY} x2={w} y2={tY} stroke={IKB} strokeWidth="0.75" strokeDasharray="3 2" opacity="0.5"/>{!compact&&<text x={w-2} y={tY-3} fill={IKB} opacity="0.7" fontSize="8" textAnchor="end">target {target}</text>}</>)}<polyline points={pts} fill="none" stroke={IKB} strokeWidth="1.25" style={{filter:`drop-shadow(0 0 3px ${IKB}80)`}}/>{log.map((e,i)=>{const x=(i/(log.length-1))*w;const y=h-((e.bpm-min)/range)*h;const iL=i===log.length-1;return <circle key={i} cx={x} cy={y} r={iL&&reached?2.5:1.5} fill={IKB} style={iL&&reached?{filter:`drop-shadow(0 0 4px ${IKB})`}:{}}/>;})}</svg><span className="tabular-nums" style={{color:reached?IKB:TEXT,fontSize:'10px',textShadow:reached?`0 0 6px ${IKB}80`:'none'}}>{last}</span><span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>bpm</span></div>);}

function StageDots({stage}){const idx=STAGES.findIndex(s=>s.key===stage);const retired=stage==='retired';return(<span className="flex items-center gap-1">{STAGES.map((_,i)=>(<span key={i} style={{width:'7px',height:'7px',borderRadius:'50%',flexShrink:0,background:i<=idx?(retired?DIM:IKB):'transparent',border:`1px solid ${i<=idx?(retired?DIM:IKB):DIM}`,opacity:i<=idx?1:0.3}}/>))}</span>);}

function SpotEditor({spot,itemId,itemTimes,isActive,onStart,onStop,onUpdate,onDelete,onMoveUp,onMoveDown,canMoveUp,canMoveDown,onEditTime,dayClosed,itemPdfs=[]}){const [label,setLabel]=useState(spot.label);const [bpm,setBpm]=useState(spot.bpmTarget||'');const [note,setNote]=useState(spot.note||'');const [editingTime,setEditingTime]=useState(false);useEffect(()=>{setLabel(spot.label);setBpm(spot.bpmTarget||'');setNote(spot.note||'');},[spot.label,spot.bpmTarget,spot.note]);const time=getSpotTime(itemTimes,itemId,spot.id);const hbl=(spot.bpmLog||[]).length>=2;const cL=()=>{if(label.trim()&&label.trim()!==spot.label)onUpdate({label:label.trim()});else setLabel(spot.label);};const cB=()=>{const n=parseInt(bpm,10);const v=Number.isFinite(n)&&n>0?n:null;if(v!==spot.bpmTarget)onUpdate({bpmTarget:v});};const cN=()=>{if(note!==(spot.note||''))onUpdate({note});};return (<div className="group px-3 py-3 space-y-2" style={{background:isActive?IKB_SOFT:SURFACE2,borderLeft:isActive?`2px solid ${IKB}`:`2px solid transparent`}}><div className="flex items-center gap-3"><button onClick={()=>isActive?onStop():onStart()} disabled={dayClosed&&!isActive} className="shrink-0" style={{color:isActive?IKB:(dayClosed?FAINT:TEXT),filter:isActive?`drop-shadow(0 0 4px ${IKB})`:'none',cursor:(dayClosed&&!isActive)?'not-allowed':'pointer'}}>{isActive?<Pause className="w-4 h-4" strokeWidth={1.25} fill="currentColor"/>:<Play className="w-4 h-4" strokeWidth={1.25} fill="currentColor"/>}</button><Crosshair className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:isActive?IKB:FAINT}}/><input value={label==='New spot'?'':label} onFocus={selectOnFocus} onChange={e=>setLabel(e.target.value)} onBlur={cL} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} placeholder="New spot" className="flex-1 focus:outline-none pb-0.5" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_MED}`,fontFamily:serif,fontSize:'14px',fontWeight:300}}/><div className="flex items-center gap-1 shrink-0"><span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>♩</span><input value={bpm} onFocus={selectOnFocus} onChange={e=>setBpm(e.target.value.replace(/[^0-9]/g,''))} onBlur={cB} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} placeholder="—" className="w-12 text-right font-mono tabular-nums focus:outline-none pb-0.5" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_MED}`,fontSize:'11px'}}/></div>{editingTime?(<ItemTimeEditor seconds={time} onCommit={(v)=>{onEditTime(v);setEditingTime(false);}} onCancel={()=>setEditingTime(false)} small/>):(<><span className="font-mono tabular-nums shrink-0 w-14 text-right" style={{color:time>0?MUTED:FAINT,fontSize:'11px'}}>{time>0?fmtSpotTime(time):'—'}</span>{!dayClosed&&<button onClick={()=>setEditingTime(true)} className="target-hover-reveal shrink-0" style={{color:FAINT}}><Pencil className="w-3 h-3" strokeWidth={1.25}/></button>}</>)}<button onClick={onMoveUp} disabled={!canMoveUp} className="target-hover-reveal shrink-0" style={{color:canMoveUp?FAINT:DIM}}><ArrowUp className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={onMoveDown} disabled={!canMoveDown} className="target-hover-reveal shrink-0" style={{color:canMoveDown?FAINT:DIM}}><ArrowDown className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={onDelete} className="target-hover-reveal shrink-0" style={{color:FAINT}}><Trash2 className="w-3 h-3" strokeWidth={1.25}/></button></div>{hbl&&(<div className="pl-9 pt-1 flex items-center gap-3"><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Tempo</span><BpmSparkline log={spot.bpmLog} target={spot.bpmTarget} compact/><span className="tabular-nums shrink-0" style={{color:DIM,fontSize:'9px',letterSpacing:'0.22em'}}>{spot.bpmLog.length} log{spot.bpmLog.length===1?'':'s'}</span></div>)}<textarea value={note} onChange={e=>setNote(e.target.value)} onBlur={cN} placeholder="Persistent note…" className="w-full p-2 resize-none focus:outline-none" style={{background:BG,color:TEXT,border:`1px solid ${LINE}`,fontFamily:serif,fontSize:'12px',lineHeight:1.55,fontWeight:300,minHeight:'42px'}}/>{itemPdfs.length>0&&(()=>{const allBm=itemPdfs.flatMap(att=>(att.bookmarks||[]).map(bm=>({attId:att.id,bm})));const cur=spot.bookmarkId&&spot.pdfAttachmentId?allBm.find(x=>x.attId===spot.pdfAttachmentId&&x.bm.id===spot.bookmarkId):null;const val=cur?`${cur.attId}::${cur.bm.id}`:'';return(<div className="pl-0 flex items-center gap-2"><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>→ bookmark</span><select value={val} onChange={e=>{const v=e.target.value;if(!v){onUpdate({bookmarkId:null,pdfAttachmentId:null});return;}const[attId,bmId]=v.split('::');onUpdate({bookmarkId:bmId,pdfAttachmentId:attId});}} className="focus:outline-none" style={{background:BG,color:val?TEXT:FAINT,border:`1px solid ${LINE_MED}`,fontSize:'11px',padding:'1px 4px',cursor:'pointer'}}><option value="">— none —</option>{allBm.map(({attId,bm})=>(<option key={`${attId}::${bm.id}`} value={`${attId}::${bm.id}`}>{bm.name} · p.{bm.page}</option>))}</select></div>)})()}</div>);}

function SidebarFacet({title,icon,open,setOpen,entries,activeValue,onSelect,emptyText}){return (<div><button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between mb-3 group" style={{color:open?MUTED:FAINT,cursor:'pointer'}}><span className="uppercase flex items-center gap-1.5" style={{fontSize:'10px',letterSpacing:'0.28em'}}>{icon} {title}{entries.length>0&&<span style={{color:DIM,fontFamily:'ui-monospace,monospace',fontSize:'9px',letterSpacing:'0.1em',marginLeft:'2px'}}>{entries.length}</span>}</span>{open?<ChevronUp className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.25}/>}</button>{open&&(<div className="space-y-0" style={{borderTop:`1px solid ${LINE}`}}>{entries.length===0&&<div className="py-3 italic text-xs" style={{color:FAINT,fontFamily:serif}}>{emptyText}</div>}{entries.map(({key,display,count})=>{const active=activeValue===display;return (<button key={key} onClick={()=>onSelect(active?'':display)} className="w-full text-left py-1.5 flex items-baseline justify-between gap-2" style={{borderBottom:`1px solid ${LINE}`,color:active?TEXT:MUTED,borderLeft:active?`2px solid ${IKB}`:'2px solid transparent',paddingLeft:active?'8px':'10px',paddingRight:'4px'}}><span className="italic truncate" style={{fontFamily:serif,fontSize:'13px',fontWeight:300}}>{display}</span><span className="tabular-nums shrink-0" style={{color:FAINT,fontSize:'10px'}}>{count}</span></button>);})}</div>)}</div>);}

function EditorRow({label,icon,children,hint}){return (<div className="flex items-baseline gap-6 py-2.5" style={{borderBottom:`1px solid ${LINE}`}}><div className="w-36 shrink-0 uppercase flex items-center justify-end gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.22em',whiteSpace:'nowrap'}}>{icon}{label}</div><div className="flex-1 min-w-0">{children}{hint&&<div className="italic mt-1" style={{color:FAINT,fontFamily:serif,fontSize:'11px'}}>{hint}</div>}</div></div>);}
const eIn={background:'transparent',color:TEXT,border:'none',padding:'2px 0',width:'100%',outline:'none',fontSize:'15px',fontWeight:300};
const eInI={...eIn,fontFamily:serif,fontStyle:'italic'};
const eInM={...eIn,fontFamily:'ui-monospace,monospace',fontSize:'13px'};
const selectOnFocus=(e)=>e.currentTarget.select();

export default function RepertoireView(p){
  const {items,setItems,updateItem,deleteItem,setPdfDrawerItemId,itemTimes,fmt,fmtMin,activeItemId,activeSpotId,startItem,stopItem,history,addItem,dayClosed,addSpot,updateSpot,deleteSpot,moveSpot,editSpotTime,addPerformance,updatePerformance,deletePerformance,pieceRecordingMeta,startPieceRecording,stopPieceRecording,deletePieceRecording,pieceRecordingItemId,isRecording,currentBpm,expandedItemId,setExpandedItemId,addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry}=p;
  const [search,setSearch]=useState('');const [filterType,setFilterType]=useState('');const [filterComposer,setFilterComposer]=useState('');const [filterStyle,setFilterStyle]=useState('');const [filterStatus,setFilterStatus]=useState('');const [filterInstrument,setFilterInstrument]=useState('');
  const [sortBy,setSortBy]=useState('');
  const [groupByCollection,setGroupByCollection]=useState(false);const [sidebarOpen,setSidebarOpen]=useState(true);const [composerOpen,setComposerOpen]=useState(true);const [instrumentOpen,setInstrumentOpen]=useState(true);const [expandedId,setExpandedId]=useState(()=>expandedItemId||null);const [showMoreIds,setShowMoreIds]=useState({});
  const [spotsOpen,setSpotsOpen]=useState({});
  const isSpotsOpen=(id)=>spotsOpen[id]!==false;
  const toggleSpots=(id)=>setSpotsOpen(p=>({...p,[id]:p[id]===false}));
  const [bpmOpen,setBpmOpen]=useState({});
  const isBpmOpen=(id)=>bpmOpen[id]!==false;
  const toggleBpm=(id)=>setBpmOpen(p=>({...p,[id]:p[id]===false}));
  useEffect(()=>{if(expandedItemId){setExpandedId(expandedItemId);if(setExpandedItemId)setExpandedItemId(null);}},[]);
  useEffect(()=>{if(!expandedId)return;const t=setTimeout(()=>{const el=document.querySelector(`[data-rep-id="${expandedId}"]`);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},80);return()=>clearTimeout(t);},[expandedId]);
  const toggleShowMore=(id)=>setShowMoreIds(p=>({...p,[id]:!p[id]}));

  const allComposers=useMemo(()=>{const g={};items.forEach(i=>{const raw=(i.composer||'').trim()||'(unspecified)';const key=normalizeComposerKey(raw)||'(unspecified)';if(!g[key])g[key]={variants:{},count:0};g[key].variants[raw]=(g[key].variants[raw]||0)+1;g[key].count++;});return Object.entries(g).map(([key,gg])=>{const d=Object.entries(gg.variants).sort((a,b)=>b[1]-a[1])[0][0];return {key,display:d,count:gg.count};}).sort((a,b)=>a.display.localeCompare(b.display));},[items]);
  const uniqueComposerNames=useMemo(()=>{const s=new Set();const o=[];items.forEach(i=>{const c=(i.composer||'').trim();if(c&&!s.has(c.toLowerCase())){s.add(c.toLowerCase());o.push(c);}});return o.sort();},[items]);
  const allTags=useMemo(()=>[...new Set(items.flatMap(i=>i.tags))].sort(),[items]);
  const allInstruments=useMemo(()=>{const g={};items.forEach(i=>{if(!i.instrument)return;const raw=i.instrument.trim();if(!raw)return;const key=normalizeComposerKey(raw);if(!g[key])g[key]={variants:{},count:0};g[key].variants[raw]=(g[key].variants[raw]||0)+1;g[key].count++;});return Object.entries(g).map(([key,gg])=>{const d=Object.entries(gg.variants).sort((a,b)=>b[1]-a[1])[0][0];return {key,display:d,count:gg.count};}).sort((a,b)=>a.display.localeCompare(b.display));},[items]);
  const uniqueInstrumentNames=useMemo(()=>{const s=new Set();const o=[];items.forEach(i=>{const c=(i.instrument||'').trim();if(c&&!s.has(c.toLowerCase())){s.add(c.toLowerCase());o.push(c);}});return o.sort();},[items]);

  const filtered=items.filter(i=>{if(filterType&&i.type!==filterType)return false;if(filterComposer){const k=normalizeComposerKey(filterComposer);const ik=normalizeComposerKey(i.composer||'(unspecified)');if(k!==ik)return false;}if(filterStyle&&!i.tags.includes(filterStyle))return false;if(filterStatus&&i.stage!==filterStatus)return false;if(filterInstrument){const k=normalizeComposerKey(filterInstrument);const ik=normalizeComposerKey(i.instrument||'');if(k!==ik)return false;}if(search){const s=search.toLowerCase();const b=[i.title,i.composer,i.author,i.arranger,i.catalog,i.collection,i.movement,i.instrument,...(i.tags||[])].join(' ').toLowerCase();if(!b.includes(s))return false;}return true;});

  const sorted=useMemo(()=>{const arr=[...filtered];if(!sortBy)return arr;return arr.sort((a,b)=>{if(sortBy==='composer')return(a.composer||'').localeCompare(b.composer||'');if(sortBy==='title')return displayTitle(a).localeCompare(displayTitle(b));if(sortBy==='stage')return STAGES.findIndex(s=>s.key===a.stage)-STAGES.findIndex(s=>s.key===b.stage);if(sortBy==='type')return TYPES.indexOf(a.type)-TYPES.indexOf(b.type);if(sortBy==='lastPracticed'){const la=lastPracticedLabel(a.id,history);const lb=lastPracticedLabel(b.id,history);return(lb||'').localeCompare(la||'');}if(sortBy==='timeInvested')return getItemTime(itemTimes,b.id)-getItemTime(itemTimes,a.id);if(sortBy==='length')return(b.lengthSecs||0)-(a.lengthSecs||0);return 0;});},[filtered,sortBy,itemTimes,history]);

  const grouped=useMemo(()=>{if(!groupByCollection)return null;const m={};const sa=[];sorted.forEach(i=>{if(i.collection){(m[i.collection]=m[i.collection]||[]).push(i);}else sa.push(i);});const s=Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])).map(([name,list])=>({name,list:list.sort((a,b)=>(a.movement||a.title).localeCompare(b.movement||b.title))}));return {collections:s,standalone:sa};},[sorted,groupByCollection]);

  const handleAdd=(t)=>{const ni=addItem(t);setExpandedId(ni.id);};
  const clearFilters=()=>{setFilterType('');setFilterComposer('');setFilterStyle('');setFilterStatus('');setFilterInstrument('');setSearch('');};
  const hasFilters=!!(filterType||filterComposer||filterStyle||filterStatus||filterInstrument||search);

  const renderItem=(i)=>{
    const expanded=expandedId===i.id;const isActiveWhole=activeItemId===i.id&&!activeSpotId;const isActiveAny=activeItemId===i.id;
    const si=STAGES.findIndex(s=>s.key===i.stage);const stage=STAGES[si>=0?si:0];
    const ld=lastPracticedLabel(i.id,history);const rel=relativeDay(ld);const hasSpots=(i.spots||[]).length>0;
    const perf=nextPerformance(i.performances);const hmf=!!(i.arranger);const showMore=showMoreIds[i.id]||hmf;
    const recCount=Object.keys(pieceRecordingMeta?.[i.id]||{}).length;
    const titleValue=i.title==='Untitled'?'':(i.title||'');
    const len=formatLength(i.lengthSecs);
    // Type-based field visibility
    const showBpmTarget=i.type!=='play'&&i.type!=='study';
    const showPerformances=i.type==='piece';
    const showArranger=i.type==='piece';
    return (<div key={i.id} data-rep-id={i.id} style={{borderBottom:`1px solid ${LINE}`}}>
      <div onClick={()=>setExpandedId(expanded?null:i.id)} className="py-2.5 px-2 flex items-start gap-2 cursor-pointer" style={{background:expanded?SURFACE:'transparent'}}>
        <div className="shrink-0 mt-0.5 tabular-nums" style={{color:MUTED,fontFamily:serif,fontStyle:'italic',fontSize:'14px',width:'28px'}}>{SECTION_CONFIG[i.type].roman}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span style={{fontFamily:sans,fontWeight:300,fontSize:'14px'}}>{displayTitle(i)}</span>
            {i.catalog&&<span className="tabular-nums" style={{color:FAINT,fontSize:'13px',fontFamily:serif,fontStyle:'italic'}}>{i.catalog}</span>}
            {formatByline(i)&&<span className="italic" style={{color:MUTED,fontFamily:serif,fontSize:'13px',fontWeight:300}}>{formatByline(i)}</span>}
            {perf&&<PerformanceChip perf={perf} compact/>}
          </div>
          <div className="mt-1.5 flex items-center gap-4">
            <StageDots stage={i.stage}/>
            <div className="flex items-center gap-2.5 shrink-0">
              {(i.pdfs||[]).length>0&&<span className="flex items-center gap-1" style={{color:FAINT,fontSize:'11px'}}><FileText className="w-3 h-3" strokeWidth={1.25}/>{i.pdfs.length}</span>}
              {recCount>0&&<span className="flex items-center gap-1" style={{color:FAINT,fontSize:'11px'}}><Mic className="w-3 h-3" strokeWidth={1.25}/>{recCount}</span>}
              {hasSpots&&<span className="flex items-center gap-1" style={{color:FAINT,fontSize:'11px'}}><Crosshair className="w-3 h-3" strokeWidth={1.25}/>{i.spots.length}</span>}
              {len&&<span className="tabular-nums" style={{color:FAINT,fontSize:'11px'}}>{len}</span>}
            </div>
          </div>
        </div>
        <span className="font-mono tabular-nums shrink-0 mt-0.5" style={{color:MUTED,fontWeight:300,fontSize:'11px'}}>{fmtMin(getItemTime(itemTimes,i.id))}</span>
        {expanded?<ChevronUp className="w-3 h-3 shrink-0 mt-1" strokeWidth={1.25} style={{color:DIM}}/>:<ChevronDown className="w-3 h-3 shrink-0 mt-1" strokeWidth={1.25} style={{color:DIM}}/>}
      </div>
      {expanded&&(<div className="px-6 py-6" style={{background:SURFACE,borderTop:`1px solid ${LINE}`}}>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8">
            <div className="mb-5">
              <EditorRow label="Work title" hint="Leave blank if this is a movement of a collection."><input type="text" value={titleValue} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{title:e.target.value})} placeholder="Untitled" style={{...eIn,fontFamily:serif}}/></EditorRow>
              <EditorRow label="Movement / part"><input type="text" value={i.movement||''} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{movement:e.target.value})} placeholder="I. Prélude" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Collection"><input type="text" value={i.collection||''} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{collection:e.target.value})} placeholder="Suite Bergamasque, WTC I…" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Catalog"><input type="text" value={i.catalog||''} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{catalog:e.target.value})} placeholder="Op. 110, BWV 846…" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Composer"><input list="rep-composer-list" type="text" value={i.composer||''} onChange={e=>updateItem(i.id,{composer:e.target.value})} placeholder="—" style={eInI}/></EditorRow>
              <EditorRow label="Author" hint="For books, textbooks, or study materials."><input type="text" value={i.author||''} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{author:e.target.value})} placeholder="—" style={eInI}/></EditorRow>
              <EditorRow label="Instrument" icon={<Guitar className="w-3 h-3" strokeWidth={1.25}/>}><input list="rep-instrument-list" type="text" value={i.instrument||''} onChange={e=>updateItem(i.id,{instrument:e.target.value})} placeholder="piano, violin…" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Status"><StageLabels stage={i.stage} onChange={st=>updateItem(i.id,{stage:st})} compact/></EditorRow>
              {showArranger&&(showMore?(<EditorRow label="Arranger"><input type="text" value={i.arranger||''} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{arranger:e.target.value})} placeholder="—" style={eInI}/></EditorRow>):(<div className="flex items-baseline gap-6 py-2" style={{borderBottom:`1px solid ${LINE}`}}><div className="w-36 shrink-0"/><button onClick={()=>toggleShowMore(i.id)} className="uppercase italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}>+ arranger</button></div>))}
              <EditorRow label="Started"><input type="date" value={i.startedDate||''} onChange={e=>updateItem(i.id,{startedDate:e.target.value||null})} style={{...eInM,colorScheme:'dark'}}/></EditorRow>
              <LengthEditorRow i={i} updateItem={updateItem}/>
              {showBpmTarget&&<EditorRow label="Tempo target" icon={<TrendingUp className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/>}><input type="number" min="40" max="300" value={i.bpmTarget??''} onChange={e=>{const v=e.target.value;const n=parseInt(v,10);updateItem(i.id,{bpmTarget:Number.isFinite(n)&&n>0?n:null});}} placeholder="— bpm" style={eInM}/></EditorRow>}
              <EditorRow label="Reference" icon={<Music className="w-3 h-3" strokeWidth={1.25}/>}><div className="flex items-center gap-3"><input type="text" value={i.referenceUrl||''} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{referenceUrl:e.target.value})} placeholder="paste a link" style={{...eIn,fontSize:'13px'}}/>{i.referenceUrl&&<a href={i.referenceUrl} target="_blank" rel="noopener noreferrer" className="uppercase flex items-center gap-1 shrink-0" style={{color:IKB,fontSize:'10px',letterSpacing:'0.22em'}}><LinkIcon className="w-3 h-3" strokeWidth={1.25}/> Open ↗</a>}</div></EditorRow>
              {showPerformances&&(<EditorRow label="Performances" icon={<Calendar className="w-3 h-3" strokeWidth={1.25}/>}>
                <div className="space-y-2">
                  {(i.performances||[]).length===0&&<div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>No dates set.</div>}
                  {(i.performances||[]).map(p=>(<div key={p.id} className="flex items-center gap-3"><input type="date" value={p.date||''} onChange={e=>updatePerformance(i.id,p.id,{date:e.target.value})} className="focus:outline-none font-mono tabular-nums" style={{background:'transparent',color:TEXT,border:'none',fontSize:'12px',colorScheme:'dark',padding:'2px 0'}}/><input type="text" value={p.label||''} onFocus={selectOnFocus} onChange={e=>updatePerformance(i.id,p.id,{label:e.target.value})} placeholder="recital, lesson, audition…" className="flex-1 focus:outline-none italic" style={{background:'transparent',color:TEXT,border:'none',fontFamily:serif,fontSize:'13px',padding:'2px 0'}}/><PerformanceChip perf={p} compact/><button onClick={()=>deletePerformance(i.id,p.id)} style={{color:FAINT}}><X className="w-3 h-3" strokeWidth={1.25}/></button></div>))}
                  <button onClick={()=>addPerformance(i.id)} className="uppercase italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}>+ Add performance</button>
                </div>
              </EditorRow>)}
              <EditorRow label="Tags">{(()=>{const tagSuggestId=`tag-sug-${i.id}`;const suggested=[...(i.composer?[i.composer.split(' ').pop()]:[]),(i.instrument||''),(i.type||''),...allTags].map(s=>s.trim().toLowerCase()).filter(s=>s&&!i.tags.includes(s));const uniqueSug=[...new Set(suggested)];return(<div className="flex items-center gap-2 flex-wrap"><datalist id={tagSuggestId}>{uniqueSug.map(s=>(<option key={s} value={s}/>))}</datalist><input type="text" list={tagSuggestId} placeholder="add + enter" onKeyDown={e=>{if(e.key==='Enter'&&e.target.value.trim()){const tag=e.target.value.trim().replace(/^#/,'');if(!i.tags.includes(tag))updateItem(i.id,{tags:[...i.tags,tag]});e.target.value='';}}} className="px-2 py-1 text-xs focus:outline-none" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`}}/>{i.tags.map(t=>(<span key={t} className="px-2 py-1 flex items-center gap-1" style={{background:SURFACE2,border:`1px solid ${LINE}`,fontSize:'9px',letterSpacing:'0.18em'}}>{t.toUpperCase()}<button onClick={()=>updateItem(i.id,{tags:i.tags.filter(x=>x!==t)})}><X className="w-2.5 h-2.5" strokeWidth={1.25}/></button></span>))}</div>);})()}</EditorRow>
            </div>
            {i.type==='piece'&&(<div className="mb-6 pt-6" style={{borderTop:`1px solid ${LINE_STR}`}}>
              <button onClick={()=>toggleSpots(i.id)} className="w-full uppercase mb-2 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>
                <Crosshair className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/>
                Spots
                {hasSpots&&<span style={{color:DIM,letterSpacing:'0.22em'}}>· {i.spots.length}</span>}
                {isSpotsOpen(i.id)?<ChevronUp className="w-3 h-3 ml-auto" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 ml-auto" strokeWidth={1.25}/>}
              </button>
              {isSpotsOpen(i.id)&&(<>
                {hasSpots&&(<div className="space-y-1" style={{border:`1px solid ${LINE}`}}>{i.spots.map((s,idx)=>(<div key={s.id} style={{borderTop:idx>0?`1px solid ${LINE}`:'none'}}><SpotEditor spot={s} itemId={i.id} itemTimes={itemTimes} isActive={activeItemId===i.id&&activeSpotId===s.id} onStart={()=>startItem(i.id,s.id)} onStop={stopItem} onUpdate={(patch)=>updateSpot(i.id,s.id,patch)} onDelete={()=>deleteSpot(i.id,s.id)} onMoveUp={()=>moveSpot(i.id,s.id,-1)} onMoveDown={()=>moveSpot(i.id,s.id,1)} canMoveUp={idx>0} canMoveDown={idx<i.spots.length-1} onEditTime={(v)=>editSpotTime(i.id,s.id,v)} dayClosed={dayClosed} itemPdfs={i.pdfs||[]}/></div>))}</div>)}
                <button onClick={()=>addSpot(i.id,'New spot')} className="uppercase flex items-center gap-1.5 mt-2 italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}><Plus className="w-3 h-3 not-italic" strokeWidth={1.25}/> Add spot</button>
              </>)}
            </div>)}
            {(i.bpmLog||[]).length>=2&&(<div className="mb-6">
              <button onClick={()=>toggleBpm(i.id)} className="w-full uppercase mb-2 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>
                <TrendingUp className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/>
                Tempo history
                <span style={{color:DIM,letterSpacing:'0.1em'}}>· {i.bpmLog.length}</span>
                {isBpmOpen(i.id)?<ChevronUp className="w-3 h-3 ml-auto" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 ml-auto" strokeWidth={1.25}/>}
              </button>
              {isBpmOpen(i.id)&&<BpmSparkline log={i.bpmLog} target={i.bpmTarget}/>}
            </div>)}
            {pieceRecordingMeta&&<PieceRecordingsPanel item={i} pieceRecordingMeta={pieceRecordingMeta} startPieceRecording={startPieceRecording} stopPieceRecording={stopPieceRecording} deletePieceRecording={deletePieceRecording} pieceRecordingItemId={pieceRecordingItemId} isRecording={isRecording} currentBpm={currentBpm} dayClosed={dayClosed}/>}
            <LogBookPanel item={i} updateItem={updateItem} addNoteLogEntry={addNoteLogEntry} deleteNoteLogEntry={deleteNoteLogEntry} updateNoteLogEntry={updateNoteLogEntry}/>
          </div>
          <div className="col-span-4 space-y-4 min-w-0">
            <div><div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Total time</div><div className="tabular-nums" style={{fontFamily:serif,fontWeight:300,letterSpacing:'-0.01em',fontSize:'32px'}}>{fmt(getItemTime(itemTimes,i.id))}</div>{hasSpots&&<div className="italic mt-1" style={{color:FAINT,fontFamily:serif,fontSize:'11px'}}>whole piece + spots</div>}</div>
            <div><div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Last practiced</div><div style={{fontFamily:serif,fontStyle:'italic',fontSize:'15px',fontWeight:300,color:rel?TEXT:FAINT}}>{rel||'—'}</div></div>
            {perf&&<div><div className="uppercase mb-2 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}><Calendar className="w-3 h-3" strokeWidth={1.25}/> Next performance</div><div style={{fontFamily:serif,fontStyle:'italic',fontSize:'15px',fontWeight:300}}>{perf.label||'performance'} <span style={{color:FAINT,fontSize:'13px'}}>· {perf.date}</span></div></div>}
            <div className="p-3 space-y-2" style={{border:`1px solid ${LINE}`}}>
              <button onClick={()=>isActiveAny?stopItem():startItem(i.id)} disabled={dayClosed&&!isActiveAny} className="w-full uppercase px-3 py-2.5 flex items-center justify-center gap-2" style={isActiveWhole?{background:IKB,color:TEXT,border:`1px solid ${IKB}`,boxShadow:`0 0 15px ${IKB}60`,fontSize:'10px',letterSpacing:'0.22em'}:{background:'transparent',color:dayClosed?FAINT:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em',cursor:(dayClosed&&!isActiveAny)?'not-allowed':'pointer'}}>{isActiveAny?<><Pause className="w-3 h-3" strokeWidth={1.25}/> Pause</>:<><Play className="w-3 h-3" strokeWidth={1.25}/> {dayClosed?'Day closed':'Practice'}</>}</button>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button onClick={()=>setPdfDrawerItemId(i.id)} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}><FileText className="w-3 h-3" strokeWidth={1.25}/> {(i.pdfs||[]).length>0?`Scores (${i.pdfs.length})`:'Scores'}</button>
                {(i.type==='piece'||i.type==='play')&&<button onClick={()=>updateItem(i.id,{type:i.type==='piece'?'play':'piece'})} className="uppercase px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}>→ {i.type==='piece'?'Play':'Pieces'}</button>}
                <button onClick={()=>{deleteItem(i.id);setExpandedId(null);}} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}><Trash2 className="w-3 h-3" strokeWidth={1.25}/> Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>)}
    </div>);
  };

  return (<div className="flex max-w-6xl mx-auto">
    <datalist id="rep-composer-list">{uniqueComposerNames.map(c=>(<option key={c} value={c}/>))}</datalist>
    <datalist id="rep-instrument-list">{uniqueInstrumentNames.map(c=>(<option key={c} value={c}/>))}</datalist>
    {sidebarOpen&&(<aside className="w-52 shrink-0 px-5 pt-8 pb-14 space-y-6" style={{borderRight:`1px solid ${LINE}`}}><div className="mb-4 flex justify-end"><button onClick={()=>setSidebarOpen(false)} style={{color:DIM,cursor:'pointer'}}><ChevronDown className="w-3 h-3" strokeWidth={1.25}/></button></div><SidebarFacet title="Composers" icon={<Users className="w-3 h-3" strokeWidth={1.25}/>} open={composerOpen} setOpen={setComposerOpen} entries={allComposers} activeValue={filterComposer} onSelect={setFilterComposer} emptyText="No composers yet."/><SidebarFacet title="Instruments" icon={<Guitar className="w-3 h-3" strokeWidth={1.25}/>} open={instrumentOpen} setOpen={setInstrumentOpen} entries={allInstruments} activeValue={filterInstrument} onSelect={setFilterInstrument} emptyText="No instruments set."/></aside>)}
    <div className={`flex-1 min-w-0 ${sidebarOpen?'px-10':'px-12'} py-14`}>
      <div className="flex items-center gap-2 mb-3">{!sidebarOpen&&<button onClick={()=>setSidebarOpen(true)} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}><Users className="w-3 h-3" strokeWidth={1.25}/> Facets</button>}</div>
      <DisplayHeader eyebrow="Library" title="Repertoire"/>
      <div className="mb-5" style={{borderTop:`1px solid ${LINE_STR}`}}>
        {/* Row 1: Add new (left 50%) + filters/sort (right 50%) */}
        <div className="flex items-center py-2" style={{borderBottom:`1px solid ${LINE}`}}>
          {/* Add new — left half, prominent */}
          <div className="flex items-center gap-0.5 shrink-0" style={{width:'50%'}}>
            <span className="uppercase shrink-0 pr-1" style={{fontFamily:sans,fontSize:'8px',letterSpacing:'0.28em',color:DIM}}>Add</span>
            {TYPES.map(t=>(<button key={t} onClick={()=>handleAdd(t)} className="flex items-baseline gap-1 uppercase px-2 py-1" style={{fontFamily:sans,fontSize:'10px',letterSpacing:'0.18em',color:TEXT,cursor:'pointer',background:'none',border:'none'}}>
              <span style={{fontFamily:serif,fontStyle:'italic',color:DIM,fontSize:'12px',fontWeight:400}}>{SECTION_CONFIG[t].roman}.</span>
              {SECTION_CONFIG[t].label}
            </button>))}
          </div>
          {/* Filters + sort — all packed tight, floated right */}
          <div className="ml-auto flex items-center gap-1 shrink-0 pl-2">
            <FilterDropdown label="Type" value={filterType} options={[{value:'',label:'All'},...TYPES.map(t=>({value:t,label:SECTION_CONFIG[t].label}))]} onChange={setFilterType}/>
            <FilterDropdown label="Status" value={filterStatus} options={[{value:'',label:'All'},...STAGES.map(s=>({value:s.key,label:s.label}))]} onChange={setFilterStatus}/>
            {(filterComposer||filterInstrument)&&<span className="italic shrink-0" style={{color:FAINT,fontFamily:serif,fontSize:'10px'}}>{filterComposer||filterInstrument}</span>}
            {hasFilters&&<button onClick={clearFilters} className="uppercase px-2 py-1 shrink-0" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em'}}>Clear</button>}
            <div style={{width:'1px',height:'12px',background:LINE_STR,margin:'0 2px',flexShrink:0}}/>
            <SortDropdown value={sortBy} onChange={setSortBy}/>
            <button onClick={()=>setGroupByCollection(v=>!v)} className="uppercase flex items-center gap-1 px-2 py-1 shrink-0" style={{color:groupByCollection?TEXT:MUTED,border:`1px solid ${groupByCollection?IKB:LINE_MED}`,background:groupByCollection?IKB_SOFT:'transparent',fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em'}}><Layers className="w-2.5 h-2.5" strokeWidth={1.25}/> Group</button>
          </div>
        </div>
        {/* Row 2: Search — full width */}
        <div className="flex items-center gap-2 py-1.5 px-1" style={{borderBottom:`1px solid ${LINE}`}}>
          <Search className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:FAINT}}/>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pieces, composers, tags…" className="flex-1 text-xs focus:outline-none" style={{background:'transparent',color:TEXT}}/>
          {search&&<button onClick={()=>setSearch('')} style={{color:FAINT,fontSize:'10px',lineHeight:1}}>✕</button>}
        </div>
      </div>
      <div style={{borderTop:`1px solid ${LINE_STR}`}}>
        {items.length===0&&<div className="py-16 text-center italic" style={{color:FAINT,fontFamily:serif,fontSize:'15px'}}>Your repertoire is empty. Add your first piece above.</div>}
        {!groupByCollection&&sorted.map(renderItem)}
        {groupByCollection&&grouped&&(<>{grouped.collections.map(({name,list})=>(<div key={name}><div className="px-2 pt-5 pb-2 flex items-baseline gap-3" style={{borderBottom:`1px solid ${LINE_MED}`,background:SURFACE}}><Layers className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/><span className="italic" style={{fontFamily:serif,fontSize:'18px',fontWeight:300}}>{name}</span><span className="tabular-nums ml-auto" style={{color:FAINT,fontSize:'10px'}}>{list.length} movement{list.length===1?'':'s'}</span></div>{list.map(renderItem)}</div>))}{grouped.standalone.length>0&&(<><div className="px-2 pt-5 pb-2" style={{borderBottom:`1px solid ${LINE_MED}`,background:SURFACE}}><span className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.3em'}}>Standalone</span></div>{grouped.standalone.map(renderItem)}</>)}</>)}
        {items.length>0&&sorted.length===0&&(<div className="py-12 text-center"><div className="italic mb-3" style={{color:FAINT,fontFamily:serif,fontSize:'15px'}}>Nothing matches these filters.</div><button onClick={clearFilters} className="uppercase px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Clear all filters</button></div>)}
      </div>
    </div>
  </div>);
}

function LogBookPanel({item,updateItem,addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry}){
  const [logSearch,setLogSearch]=useState('');
  const [addingNote,setAddingNote]=useState(false);
  const [newNoteText,setNewNoteText]=useState('');
  const [pinnedOpen,setPinnedOpen]=useState(true);
  const [logOpen,setLogOpen]=useState(true);
  const log=(item.noteLog||[]).slice().reverse(); // newest first
  const q=logSearch.trim().toLowerCase();
  const filteredLog=q?log.filter(e=>(e.text||'').toLowerCase().includes(q)):log;

  const handleAdd=()=>{if(!newNoteText.trim())return;addNoteLogEntry&&addNoteLogEntry(item.id,newNoteText.trim());setNewNoteText('');setAddingNote(false);};

  return (
    <div>
      {/* Pinned notes (detail) */}
      <div className="mb-6">
        <button onClick={()=>setPinnedOpen(v=>!v)} className="w-full uppercase mb-2 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>
          <BookOpen className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/>
          Pinned notes
          {item.detail&&<span style={{color:DIM,letterSpacing:'0.1em'}}>·</span>}
          {pinnedOpen?<ChevronUp className="w-3 h-3 ml-auto" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 ml-auto" strokeWidth={1.25}/>}
        </button>
        {pinnedOpen&&(
          <MarkdownField
            value={item.detail||''}
            onChange={v=>updateItem(item.id,{detail:v})}
            placeholder="Fingerings, tempi, interpretive ideas…"
            minHeight={80}
            style={{background:BG,border:`1px solid ${LINE}`,padding:'10px 12px'}}
            showDeepLinkHint
          />
        )}
      </div>

      {/* Session log */}
      <div>
        <button onClick={()=>{setLogOpen(v=>!v);if(logOpen)setAddingNote(false);}} className="w-full uppercase mb-2 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>
          <BookOpen className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/>
          Log book
          {log.length>0&&<span style={{color:DIM}}>· {log.length}</span>}
          {logOpen?<ChevronUp className="w-3 h-3 ml-auto" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 ml-auto" strokeWidth={1.25}/>}
        </button>

        {logOpen&&(<>
          <div className="flex justify-end mb-2">
            <button onClick={()=>setAddingNote(v=>!v)} className="uppercase flex items-center gap-1 italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}>
              <Plus className="w-3 h-3 not-italic" strokeWidth={1.25}/> Add note
            </button>
          </div>
          {addingNote&&(
            <div className="mb-3 p-3" style={{background:SURFACE2,border:`1px solid ${LINE}`}}>
              <textarea
                autoFocus
                value={newNoteText}
                onChange={e=>setNewNoteText(e.target.value)}
                placeholder="Write a retrospective note…"
                className="w-full resize-none focus:outline-none"
                style={{background:'transparent',color:TEXT,fontFamily:serif,fontSize:'13px',lineHeight:1.65,minHeight:'60px',fontWeight:300}}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleAdd} className="uppercase px-2 py-1 flex items-center gap-1" style={{color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,fontSize:'9px',letterSpacing:'0.22em'}}><Check className="w-2.5 h-2.5" strokeWidth={1.25}/> Save</button>
                <button onClick={()=>{setAddingNote(false);setNewNoteText('');}} className="uppercase px-2 py-1" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}>Cancel</button>
              </div>
            </div>
          )}

          {log.length>1&&(
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:FAINT}}/>
              <input
                type="text"
                value={logSearch}
                onChange={e=>setLogSearch(e.target.value)}
                placeholder="Filter log entries…"
                className="flex-1 text-xs focus:outline-none"
                style={{background:'transparent',color:TEXT}}
              />
              {logSearch&&<button onClick={()=>setLogSearch('')} style={{color:FAINT,fontSize:'10px'}}>✕</button>}
            </div>
          )}

          {filteredLog.length===0&&log.length>0&&q&&(
            <div className="italic py-2" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>No entries match.</div>
          )}
          {log.length===0&&(
            <div className="italic py-2" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>No session notes yet. Notes from Today view are added here after day rollover.</div>
          )}

          <div className="space-y-0">
            {filteredLog.map((entry,idx)=>(
              <LogEntry key={entry.id} entry={entry} itemId={item.id} isLast={idx===filteredLog.length-1} onDelete={()=>deleteNoteLogEntry&&deleteNoteLogEntry(item.id,entry.id)} onUpdate={(text)=>updateNoteLogEntry&&updateNoteLogEntry(item.id,entry.id,text)}/>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}

function LogEntry({entry,itemId,isLast,onDelete,onUpdate}){
  const [editing,setEditing]=useState(false);
  const [text,setText]=useState(entry.text||'');
  useEffect(()=>{setText(entry.text||'');},[entry.text]);
  const commit=()=>{if(text.trim()&&text.trim()!==entry.text){onUpdate&&onUpdate(text.trim());}else{setText(entry.text||'');}setEditing(false);};
  return (
    <div className="group py-3" style={{borderTop:`1px solid ${LINE}`,borderBottom:isLast?`1px solid ${LINE_MED}`:'none'}}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="flex items-baseline gap-2">
          <span className="uppercase tabular-nums" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>{entry.date}</span>
          {entry.source==='manual'&&<span className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'9px'}}>manual</span>}
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={()=>setEditing(v=>!v)} style={{color:FAINT}} title="Edit"><Pencil className="w-3 h-3" strokeWidth={1.25}/></button>
          <button onClick={onDelete} style={{color:FAINT}} title="Delete"><Trash2 className="w-3 h-3" strokeWidth={1.25}/></button>
        </div>
      </div>
      {editing?(
        <div>
          <textarea
            autoFocus
            value={text}
            onChange={e=>setText(e.target.value)}
            onBlur={commit}
            onKeyDown={e=>{if(e.key==='Escape'){setText(entry.text||'');setEditing(false);}}}
            className="w-full resize-none focus:outline-none"
            style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE}`,fontFamily:serif,fontSize:'13px',lineHeight:1.65,minHeight:'60px',fontWeight:300,padding:'8px'}}
          />
          <div className="flex gap-2 mt-1">
            <button onClick={commit} className="uppercase px-2 py-1" style={{color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,fontSize:'9px',letterSpacing:'0.22em'}}>Save</button>
            <button onClick={()=>{setText(entry.text||'');setEditing(false);}} className="uppercase px-2 py-1" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}>Cancel</button>
          </div>
        </div>
      ):(
        <MarkdownField value={entry.text||''} readOnly minHeight={0} style={{border:'none',padding:0,fontSize:'13px',background:'transparent'}}/>
      )}
    </div>
  );
}

function LengthEditorRow({i,updateItem}){
  const [val,setVal]=useState(i.lengthSecs!=null?formatLengthForInput(i.lengthSecs):'');
  useEffect(()=>{setVal(i.lengthSecs!=null?formatLengthForInput(i.lengthSecs):'');},[i.lengthSecs]);
  const commit=()=>{const s=parseLengthInput(val);updateItem(i.id,{lengthSecs:s});if(s!=null)setVal(formatLengthForInput(s));else setVal('');};
  return(<EditorRow label="Length" hint="e.g. 3:45 or 4 (minutes)"><input type="text" value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} placeholder="—" style={{...eInM,fontSize:'14px'}}/></EditorRow>);
}
function formatLengthForInput(secs){if(!secs)return'';const m=Math.floor(secs/60),s=secs%60;return`${m}:${String(s).padStart(2,'0')}`;}
