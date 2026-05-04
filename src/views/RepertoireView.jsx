import React, {useState, useMemo, useEffect} from 'react';
import useViewport from '../hooks/useViewport.js';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Crosshair from 'lucide-react/dist/esm/icons/crosshair';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Users from 'lucide-react/dist/esm/icons/users';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Search from 'lucide-react/dist/esm/icons/search';
import Layers from 'lucide-react/dist/esm/icons/layers';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import Music from 'lucide-react/dist/esm/icons/music';
import Guitar from 'lucide-react/dist/esm/icons/guitar';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Check from 'lucide-react/dist/esm/icons/check';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Mic from 'lucide-react/dist/esm/icons/mic';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, WARM_SOFT, WARN, serif, serifText, sans, mono} from '../constants/theme.js';
import {TYPES, SECTION_CONFIG, STAGES} from '../constants/config.js';
import {daysUntil, todayDateStr} from '../lib/dates.js';
import {idbGet} from '../lib/storage.js';
import {getItemTime, getSpotTime, displayTitle, formatByline, normalizeComposerKey, nextPerformance, mkSpotId} from '../lib/items.js';
import {getEmbedInfo} from '../lib/media.js';
import {toRoman} from '../lib/music.js';
import {DisplayHeader, StageLabels, PerformanceChip, ItemTimeEditor, MarkdownField, Waveform, DebouncedField} from '../components/shared.jsx';
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

function SpotEditor({spot,itemId,itemTimes,isActive,onStart,onStop,onUpdate,onDelete,onMoveUp,onMoveDown,canMoveUp,canMoveDown,onEditTime,dayClosed,itemPdfs=[]}){const [label,setLabel]=useState(spot.label);const [bpm,setBpm]=useState(spot.bpmTarget||'');const [note,setNote]=useState(spot.note||'');const [editingTime,setEditingTime]=useState(false);useEffect(()=>{setLabel(spot.label);setBpm(spot.bpmTarget||'');setNote(spot.note||'');},[spot.label,spot.bpmTarget,spot.note]);const time=getSpotTime(itemTimes,itemId,spot.id);const hbl=(spot.bpmLog||[]).length>=2;const cL=()=>{if(label.trim()&&label.trim()!==spot.label)onUpdate({label:label.trim()});else setLabel(spot.label);};const cB=()=>{const n=parseInt(bpm,10);const v=Number.isFinite(n)&&n>0?n:null;if(v!==spot.bpmTarget)onUpdate({bpmTarget:v});};const cN=()=>{if(note!==(spot.note||''))onUpdate({note});};return (<div className="group px-3 py-3 space-y-2" style={{background:isActive?IKB_SOFT:SURFACE2,borderLeft:isActive?`2px solid ${IKB}`:`2px solid transparent`}}><div className="flex items-center gap-3"><button onClick={()=>isActive?onStop():onStart()} disabled={dayClosed&&!isActive} className="shrink-0" style={{color:isActive?IKB:(dayClosed?FAINT:TEXT),filter:isActive?`drop-shadow(0 0 4px ${IKB})`:'none',cursor:(dayClosed&&!isActive)?'not-allowed':'pointer'}}>{isActive?<Pause className="w-4 h-4" strokeWidth={1.25} fill="currentColor"/>:<Play className="w-4 h-4" strokeWidth={1.25} fill="currentColor"/>}</button><Crosshair className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:isActive?IKB:FAINT}}/><input value={label==='New spot'?'':label} onFocus={selectOnFocus} onChange={e=>setLabel(e.target.value)} onBlur={cL} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} placeholder="New spot" className="flex-1 focus:outline-none pb-0.5" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_MED}`,fontFamily:serif,fontSize:'14px',fontWeight:300}}/><div className="flex items-center gap-1 shrink-0"><span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>♩</span><input value={bpm} onFocus={selectOnFocus} onChange={e=>setBpm(e.target.value.replace(/[^0-9]/g,''))} onBlur={cB} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} placeholder="—" className="w-12 text-right font-mono tabular-nums focus:outline-none pb-0.5" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_MED}`,fontSize:'11px'}}/></div>{editingTime?(<ItemTimeEditor seconds={time} onCommit={(v)=>{onEditTime(v);setEditingTime(false);}} onCancel={()=>setEditingTime(false)} small/>):(<><span className="font-mono tabular-nums shrink-0 w-14 text-right" style={{color:time>0?MUTED:FAINT,fontSize:'11px'}}>{time>0?fmtSpotTime(time):'—'}</span>{!dayClosed&&<button onClick={()=>setEditingTime(true)} className="target-hover-reveal shrink-0" style={{color:FAINT}}><Pencil className="w-3 h-3" strokeWidth={1.25}/></button>}</>)}<button onClick={onMoveUp} disabled={!canMoveUp} className="target-hover-reveal shrink-0" style={{color:canMoveUp?FAINT:DIM}}><ArrowUp className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={onMoveDown} disabled={!canMoveDown} className="target-hover-reveal shrink-0" style={{color:canMoveDown?FAINT:DIM}}><ArrowDown className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={onDelete} className="target-hover-reveal shrink-0" style={{color:FAINT}}><Trash2 className="w-3 h-3" strokeWidth={1.25}/></button></div>{hbl&&(<div className="pl-9 pt-1 flex items-center gap-3"><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Tempo</span><BpmSparkline log={spot.bpmLog} target={spot.bpmTarget} compact/><span className="tabular-nums shrink-0" style={{color:DIM,fontSize:'9px',letterSpacing:'0.22em'}}>{spot.bpmLog.length} log{spot.bpmLog.length===1?'':'s'}</span></div>)}<textarea value={note} onChange={e=>setNote(e.target.value)} onBlur={cN} placeholder="Persistent note…" className="w-full p-2 resize-none focus:outline-none" style={{background:BG,color:TEXT,border:`1px solid ${LINE}`,fontFamily:serifText,fontSize:'12px',lineHeight:1.55,fontWeight:300,minHeight:'42px'}}/>{itemPdfs.length>0&&(()=>{const allBm=itemPdfs.flatMap(att=>(att.bookmarks||[]).map(bm=>({attId:att.id,bm})));const cur=spot.bookmarkId&&spot.pdfAttachmentId?allBm.find(x=>x.attId===spot.pdfAttachmentId&&x.bm.id===spot.bookmarkId):null;const val=cur?`${cur.attId}::${cur.bm.id}`:'';return(<div className="pl-0 flex items-center gap-2"><span className="uppercase shrink-0" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>→ bookmark</span><select value={val} onChange={e=>{const v=e.target.value;if(!v){onUpdate({bookmarkId:null,pdfAttachmentId:null});return;}const[attId,bmId]=v.split('::');onUpdate({bookmarkId:bmId,pdfAttachmentId:attId});}} className="focus:outline-none" style={{background:BG,color:val?TEXT:FAINT,border:`1px solid ${LINE_MED}`,fontSize:'11px',padding:'1px 4px',cursor:'pointer'}}><option value="">— none —</option>{allBm.map(({attId,bm})=>(<option key={`${attId}::${bm.id}`} value={`${attId}::${bm.id}`}>{bm.name} · p.{bm.page}</option>))}</select></div>)})()}</div>);}

function SidebarFacet({title,icon,open,setOpen,entries,activeValue,onSelect,emptyText}){return (<div><button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between mb-3 group" style={{color:open?MUTED:FAINT,cursor:'pointer'}}><span className="uppercase flex items-center gap-1.5" style={{fontSize:'10px',letterSpacing:'0.28em'}}>{icon} {title}{entries.length>0&&<span style={{color:DIM,fontFamily:'ui-monospace,monospace',fontSize:'9px',letterSpacing:'0.1em',marginLeft:'2px'}}>{entries.length}</span>}</span>{open?<ChevronUp className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.25}/>}</button>{open&&(<div className="space-y-0" style={{borderTop:`1px solid ${LINE}`}}>{entries.length===0&&<div className="py-3 italic text-xs" style={{color:FAINT,fontFamily:serif}}>{emptyText}</div>}{entries.map(({key,display,count})=>{const active=activeValue===display;return (<button key={key} onClick={()=>onSelect(active?'':display)} className="w-full text-left py-1.5 flex items-baseline justify-between gap-2" style={{borderBottom:`1px solid ${LINE}`,color:active?TEXT:MUTED,borderLeft:active?`2px solid ${IKB}`:'2px solid transparent',paddingLeft:active?'8px':'10px',paddingRight:'4px'}}><span className="italic truncate" style={{fontFamily:serif,fontSize:'13px',fontWeight:300}}>{display}</span><span className="tabular-nums shrink-0" style={{color:FAINT,fontSize:'10px'}}>{count}</span></button>);})}</div>)}</div>);}

function EditorRow({label,icon,children,hint}){return (<div className="flex items-baseline gap-6 py-2.5" style={{borderBottom:`1px solid ${LINE}`}}><div className="w-36 shrink-0 uppercase flex items-center justify-end gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.22em',whiteSpace:'nowrap'}}>{icon}{label}</div><div className="flex-1 min-w-0">{children}{hint&&<div className="italic mt-1" style={{color:FAINT,fontFamily:serif,fontSize:'11px'}}>{hint}</div>}</div></div>);}
const eIn={background:'transparent',color:TEXT,border:'none',padding:'2px 0',width:'100%',outline:'none',fontSize:'15px',fontWeight:300};
const eInI={...eIn,fontFamily:serif,fontStyle:'italic'};
const eInM={...eIn,fontFamily:'ui-monospace,monospace',fontSize:'13px'};
const selectOnFocus=(e)=>e.currentTarget.select();

export default function RepertoireView(p){
  const {isMobile}=useViewport();
  const {view,items,setItems,updateItem,deleteItem,setPdfDrawerItemId,itemTimes,fmt,fmtMin,activeItemId,activeSpotId,startItem,stopItem,history,addItem,dayClosed,addSpot,updateSpot,deleteSpot,moveSpot,editSpotTime,addPerformance,updatePerformance,deletePerformance,pieceRecordingMeta,startPieceRecording,stopPieceRecording,deletePieceRecording,lockPieceRecording,pieceRecordingItemId,isRecording,currentBpm,expandedItemId,setExpandedItemId,addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry,refTrackMeta,uploadRefTrack,deleteRefTrack,pdfUrlMap,localPieceRecordingIds,localRefTrackIds,onWikiLinkClick,wikiCompletionData}=p;
  // Mobile piece detail state
  const [mobileDetailId,setMobileDetailId]=useState(null);
  // Reset when navigating away from repertoire
  useEffect(()=>{if(view!=='repertoire')setMobileDetailId(null);},[view]);
  const [search,setSearch]=useState('');const [filterType,setFilterType]=useState('');const [filterComposer,setFilterComposer]=useState('');const [filterStyle,setFilterStyle]=useState('');const [filterStatus,setFilterStatus]=useState('');const [filterInstrument,setFilterInstrument]=useState('');
  const [sortBy,setSortBy]=useState('');
  const [groupByCollection,setGroupByCollection]=useState(false);const [sidebarOpen,setSidebarOpen]=useState(false);const [composerOpen,setComposerOpen]=useState(true);const [instrumentOpen,setInstrumentOpen]=useState(true);const [expandedId,setExpandedId]=useState(()=>expandedItemId||null);const [showMoreIds,setShowMoreIds]=useState({});
  const [globalAbA,setGlobalAbA]=useState(null);
  const [globalAbB,setGlobalAbB]=useState(null);
  // Cleanup: if the referenced piece or recording is deleted, drop the slot.
  useEffect(()=>{
    const stillThere=(ab)=>!!(ab && items.some(i=>i.id===ab.itemId) && pieceRecordingMeta?.[ab.itemId]?.[ab.date]);
    if(globalAbA&&!stillThere(globalAbA))setGlobalAbA(null);
    if(globalAbB&&!stillThere(globalAbB))setGlobalAbB(null);
  },[items,pieceRecordingMeta,globalAbA,globalAbB]);
  const [spotsOpen,setSpotsOpen]=useState({});
  const isSpotsOpen=(id)=>spotsOpen[id]===true;
  const toggleSpots=(id)=>setSpotsOpen(p=>({...p,[id]:!p[id]}));
  const [bpmOpen,setBpmOpen]=useState({});
  const isBpmOpen=(id)=>bpmOpen[id]===true;
  const toggleBpm=(id)=>setBpmOpen(p=>({...p,[id]:!p[id]}));
  // Deep-link from wiki click / external navigation. On mobile, push the piece
  // detail screen directly so the user lands in the editor, not the list.
  useEffect(()=>{
    if(!expandedItemId)return;
    if(isMobile){setMobileDetailId(expandedItemId);}
    else{setExpandedId(expandedItemId);}
    if(setExpandedItemId)setExpandedItemId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[expandedItemId,isMobile]);
  useEffect(()=>{if(!expandedId)return;const t=setTimeout(()=>{const el=document.querySelector(`[data-rep-id="${expandedId}"]`);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},80);return()=>clearTimeout(t);},[expandedId]);
  useEffect(()=>{
    if(!expandedId)return;
    const handler=(e)=>{
      const el=document.querySelector(`[data-rep-id="${expandedId}"]`);
      if(el&&!el.contains(e.target))setExpandedId(null);
    };
    document.addEventListener('mousedown',handler);
    return()=>document.removeEventListener('mousedown',handler);
  },[expandedId]);
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
    const hasPdfMeta=(i.pdfs||[]).length>0;
    const hasLocalPdf=hasPdfMeta&&(i.pdfs||[]).some(p=>pdfUrlMap?.[p.libraryId]);
    const hasLocalRec=recCount>0&&(localPieceRecordingIds?.has(String(i.id))??true);
    const hasRefMeta=!!(refTrackMeta?.[i.id]);
    const hasLocalRef=hasRefMeta&&(localRefTrackIds?.has(String(i.id))??true);
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
            <span style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'15px',lineHeight:1.2}}>{displayTitle(i)}</span>
            {i.catalog&&<span className="tabular-nums" style={{color:FAINT,fontSize:'13px',fontFamily:serif,fontStyle:'italic'}}>{i.catalog}</span>}
            {formatByline(i)&&<span className="italic" style={{color:MUTED,fontFamily:serif,fontSize:'13px',fontWeight:300}}>{formatByline(i)}</span>}
            {perf&&<PerformanceChip perf={perf} compact/>}
          </div>
          <div className="mt-1.5 flex items-center gap-4">
            <StageDots stage={i.stage}/>
            <div className="flex items-center gap-2.5 shrink-0">
              {hasPdfMeta&&<span title={hasLocalPdf?undefined:'PDF not on this device'} className="flex items-center gap-1" style={{color:FAINT,fontSize:'11px',opacity:hasLocalPdf?1:0.4}}><FileText className="w-3 h-3" strokeWidth={1.25} style={hasLocalPdf?{}:{strokeDasharray:'2 1.5'}}/>{i.pdfs.length}</span>}
              {recCount>0&&<span title={hasLocalRec?undefined:'Recording not on this device'} className="flex items-center gap-1" style={{color:FAINT,fontSize:'11px',opacity:hasLocalRec?1:0.4}}><Mic className="w-3 h-3" strokeWidth={1.25} style={hasLocalRec?{}:{strokeDasharray:'2 1.5'}}/>{recCount}</span>}
              {hasRefMeta&&<span title={hasLocalRef?undefined:'Ref track not on this device'} className="flex items-center gap-1" style={{color:FAINT,fontSize:'11px',opacity:hasLocalRef?1:0.4}}><Music className="w-3 h-3" strokeWidth={1.25} style={hasLocalRef?{}:{strokeDasharray:'2 1.5'}}/></span>}
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
              <EditorRow label="Work title" hint="Leave blank if this is a movement of a collection."><DebouncedField type="text" value={titleValue} onFocus={selectOnFocus} onChange={v=>updateItem(i.id,{title:v})} placeholder="Untitled" style={{...eIn,fontFamily:serif}}/></EditorRow>
              <EditorRow label="Movement / part"><DebouncedField type="text" value={i.movement||''} onFocus={selectOnFocus} onChange={v=>updateItem(i.id,{movement:v})} placeholder="I. Prélude" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Collection"><DebouncedField type="text" value={i.collection||''} onFocus={selectOnFocus} onChange={v=>updateItem(i.id,{collection:v})} placeholder="Suite Bergamasque" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Catalog"><DebouncedField type="text" value={i.catalog||''} onFocus={selectOnFocus} onChange={v=>updateItem(i.id,{catalog:v})} placeholder="Op. 110" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Composer"><DebouncedField list="rep-composer-list" type="text" value={i.composer||''} onChange={v=>updateItem(i.id,{composer:v})} placeholder="Composer" style={eInI}/></EditorRow>
              <EditorRow label="Author" hint="For books, textbooks, or study materials."><DebouncedField type="text" value={i.author||''} onFocus={selectOnFocus} onChange={v=>updateItem(i.id,{author:v})} placeholder="—" style={eInI}/></EditorRow>
              <EditorRow label="Instrument" icon={<Guitar className="w-3 h-3" strokeWidth={1.25}/>}><DebouncedField list="rep-instrument-list" type="text" value={i.instrument||''} onChange={v=>updateItem(i.id,{instrument:v})} placeholder="Instrument" style={{...eIn,fontFamily:serif,fontSize:'13px'}}/></EditorRow>
              <EditorRow label="Status"><StageLabels stage={i.stage} onChange={st=>updateItem(i.id,{stage:st})} compact/></EditorRow>
              {showArranger&&(showMore?(<EditorRow label="Arranger"><DebouncedField type="text" value={i.arranger||''} onFocus={selectOnFocus} onChange={v=>updateItem(i.id,{arranger:v})} placeholder="—" style={eInI}/></EditorRow>):(<div className="flex items-baseline gap-6 py-2" style={{borderBottom:`1px solid ${LINE}`}}><div className="w-36 shrink-0"/><button onClick={()=>toggleShowMore(i.id)} className="uppercase italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}>+ arranger</button></div>))}
              <EditorRow label="Started"><input type="date" value={i.startedDate||''} onChange={e=>updateItem(i.id,{startedDate:e.target.value||null})} style={{...eInM,colorScheme:'dark'}}/></EditorRow>
              <LengthEditorRow i={i} updateItem={updateItem}/>
              {showBpmTarget&&<EditorRow label="Tempo target" icon={<TrendingUp className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/>}><input type="number" min="40" max="300" value={i.bpmTarget??''} onChange={e=>{const v=e.target.value;const n=parseInt(v,10);updateItem(i.id,{bpmTarget:Number.isFinite(n)&&n>0?n:null});}} placeholder="— bpm" style={eInM}/></EditorRow>}
              <EditorRow label="Reference" icon={<Music className="w-3 h-3" strokeWidth={1.25}/>}><div className="flex items-center gap-3"><input type="text" value={i.referenceUrl||''} onFocus={selectOnFocus} onChange={e=>updateItem(i.id,{referenceUrl:e.target.value})} placeholder="Link" style={{...eIn,fontSize:'13px'}}/>{i.referenceUrl&&<a href={i.referenceUrl} target="_blank" rel="noopener noreferrer" className="uppercase flex items-center gap-1 shrink-0" style={{color:IKB,fontSize:'10px',letterSpacing:'0.22em'}}><LinkIcon className="w-3 h-3" strokeWidth={1.25}/> Open ↗</a>}</div></EditorRow>
              {(()=>{if(!i.referenceUrl)return null;const embed=getEmbedInfo(i.referenceUrl);if(!embed)return null;return(<div className="flex items-start gap-3 py-3" style={{borderBottom:`1px solid ${LINE}`}}><div className="w-36 shrink-0"/><div className="flex-1">{embed.type==='youtube'?(<div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',background:SURFACE2,borderRadius:2}}><iframe src={embed.src} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}} allowFullScreen loading="lazy" title="Reference"/></div>):embed.type==='spotify'?(<iframe src={embed.src} width="100%" height={embed.compact?152:352} style={{border:'none',borderRadius:2,display:'block'}} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="eager" title="Reference"/>):(<iframe src={embed.src} width="100%" height={175} style={{border:'none',borderRadius:2,display:'block'}} allow="autoplay *; encrypted-media *; fullscreen *" loading="eager" title="Reference"/>)}</div></div>);})()}
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
            {pieceRecordingMeta&&<PieceRecordingsPanel item={i} pieceRecordingMeta={pieceRecordingMeta} deletePieceRecording={deletePieceRecording} lockPieceRecording={lockPieceRecording} pieceRecordingItemId={pieceRecordingItemId} dayClosed={dayClosed} globalAbA={globalAbA} globalAbB={globalAbB} setGlobalAbA={setGlobalAbA} setGlobalAbB={setGlobalAbB} refTrackMeta={refTrackMeta} uploadRefTrack={uploadRefTrack} deleteRefTrack={deleteRefTrack}/>}
            <LogBookPanel item={i} updateItem={updateItem} addNoteLogEntry={addNoteLogEntry} deleteNoteLogEntry={deleteNoteLogEntry} updateNoteLogEntry={updateNoteLogEntry} onWikiLinkClick={onWikiLinkClick} wikiCompletionData={wikiCompletionData}/>
          </div>
          <div className="col-span-4 space-y-4 min-w-0">
            <div><div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Total time</div><div className="tabular-nums" style={{fontFamily:serif,fontWeight:300,letterSpacing:'-0.01em',fontSize:'32px'}}>{fmt(getItemTime(itemTimes,i.id))}</div>{hasSpots&&<div className="italic mt-1" style={{color:FAINT,fontFamily:serif,fontSize:'11px'}}>whole piece + spots</div>}</div>
            <div><div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Last practiced</div><div style={{fontFamily:serif,fontStyle:'italic',fontSize:'15px',fontWeight:300,color:rel?TEXT:FAINT}}>{rel||'—'}</div></div>
            {perf&&<div><div className="uppercase mb-2 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}><Calendar className="w-3 h-3" strokeWidth={1.25}/> Next performance</div><div style={{fontFamily:serif,fontStyle:'italic',fontSize:'15px',fontWeight:300}}>{perf.label||'performance'} <span style={{color:FAINT,fontSize:'13px'}}>· {perf.date}</span></div></div>}
            <div className="p-3 space-y-2" style={{border:`1px solid ${LINE}`}}>
              <button onClick={()=>isActiveAny?stopItem():startItem(i.id)} disabled={dayClosed&&!isActiveAny} className="w-full uppercase px-3 py-2.5 flex items-center justify-center gap-2" style={isActiveWhole?{background:IKB,color:TEXT,border:`1px solid ${IKB}`,boxShadow:`0 0 15px ${IKB}60`,fontSize:'10px',letterSpacing:'0.22em'}:{background:'transparent',color:dayClosed?FAINT:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em',cursor:(dayClosed&&!isActiveAny)?'not-allowed':'pointer'}}>{isActiveAny?<><Pause className="w-3 h-3" strokeWidth={1.25}/> Pause</>:<><Play className="w-3 h-3" strokeWidth={1.25}/> {dayClosed?'Day closed':'Practice'}</>}</button>
              <div className="pt-1" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',alignItems:'center'}}>
                <div><button onClick={()=>setPdfDrawerItemId(i.id)} title={hasPdfMeta&&!hasLocalPdf?'PDF not on this device — open to upload':undefined} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:MUTED,border:`1px ${hasPdfMeta&&!hasLocalPdf?'dashed':'solid'} ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em',opacity:hasPdfMeta&&!hasLocalPdf?0.55:1}}><FileText className="w-3 h-3" strokeWidth={1.25} style={hasPdfMeta&&!hasLocalPdf?{strokeDasharray:'2 1.5'}:{}}/> {hasPdfMeta?`Scores (${i.pdfs.length})`:'Scores'}</button></div>
                <div className="flex justify-center">{(i.type==='piece'||i.type==='play')&&<button onClick={()=>updateItem(i.id,{type:i.type==='piece'?'play':'piece'})} className="uppercase px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em'}}>→ {i.type==='piece'?'Play':'Pieces'}</button>}</div>
                <div className="flex justify-end"><button onClick={()=>{deleteItem(i.id);setExpandedId(null);}} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:WARN,border:`1px solid ${WARN}80`,fontSize:'9px',letterSpacing:'0.22em',background:'transparent'}}><Trash2 className="w-3 h-3" strokeWidth={1.25}/> Delete</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>)}
    </div>);
  };

  // ── Mobile: list → detail ─────────────────────────────────────────────
  if(isMobile){
    if(mobileDetailId){
      const detailItem=items.find(i=>i.id===mobileDetailId);
      if(detailItem){
        return <PieceDetailScreen
          item={detailItem}
          onBack={()=>setMobileDetailId(null)}
          updateItem={updateItem}
          deleteItem={deleteItem}
          dayClosed={dayClosed}
          activeItemId={activeItemId}
          activeSpotId={activeSpotId}
          startItem={startItem}
          stopItem={stopItem}
          itemTimes={itemTimes}
          fmt={fmt}
          fmtMin={fmtMin}
          addSpot={addSpot}
          updateSpot={updateSpot}
          deleteSpot={deleteSpot}
          editSpotTime={editSpotTime}
          addPerformance={addPerformance}
          updatePerformance={updatePerformance}
          deletePerformance={deletePerformance}
          pieceRecordingMeta={pieceRecordingMeta}
          setPdfDrawerItemId={setPdfDrawerItemId}
          history={history}
          globalAbA={globalAbA}
          globalAbB={globalAbB}
          setGlobalAbA={setGlobalAbA}
          setGlobalAbB={setGlobalAbB}
          startPieceRecording={startPieceRecording}
          stopPieceRecording={stopPieceRecording}
          deletePieceRecording={deletePieceRecording}
          lockPieceRecording={lockPieceRecording}
          pieceRecordingItemId={pieceRecordingItemId}
          refTrackMeta={refTrackMeta}
          uploadRefTrack={uploadRefTrack}
          deleteRefTrack={deleteRefTrack}
          pdfUrlMap={pdfUrlMap}
          localPieceRecordingIds={localPieceRecordingIds}
          localRefTrackIds={localRefTrackIds}
          addNoteLogEntry={addNoteLogEntry}
          deleteNoteLogEntry={deleteNoteLogEntry}
          updateNoteLogEntry={updateNoteLogEntry}
          setExpandedItemId={setExpandedItemId}
          onWikiLinkClick={onWikiLinkClick}
          wikiCompletionData={wikiCompletionData}
        />;
      }
    }
    return <MobileRepertoireList
      items={items}
      sorted={sorted}
      grouped={grouped}
      groupByCollection={groupByCollection}
      setGroupByCollection={setGroupByCollection}
      search={search}
      setSearch={setSearch}
      filterType={filterType}
      setFilterType={setFilterType}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      filterComposer={filterComposer}
      setFilterComposer={setFilterComposer}
      filterInstrument={filterInstrument}
      setFilterInstrument={setFilterInstrument}
      hasFilters={hasFilters}
      clearFilters={clearFilters}
      allComposers={allComposers}
      allInstruments={allInstruments}
      activeItemId={activeItemId}
      dayClosed={dayClosed}
      handleAdd={handleAdd}
      onTapItem={setMobileDetailId}
      itemTimes={itemTimes}
      fmtMin={fmtMin}
      history={history}
      globalAbA={globalAbA}
      globalAbB={globalAbB}
      setGlobalAbA={setGlobalAbA}
      setGlobalAbB={setGlobalAbB}
      pieceRecordingMeta={pieceRecordingMeta}
      refTrackMeta={refTrackMeta}
    />;
  }

  // ── Desktop view (unchanged) ──────────────────────────────────────────
  return (<><div className="flex max-w-6xl mx-auto">
    <datalist id="rep-composer-list">{uniqueComposerNames.map(c=>(<option key={c} value={c}/>))}</datalist>
    <datalist id="rep-instrument-list">{uniqueInstrumentNames.map(c=>(<option key={c} value={c}/>))}</datalist>
    {sidebarOpen&&(isMobile?(
      <div className="fixed inset-0 z-50 flex" style={{background:'rgba(0,0,0,0.55)'}} onClick={()=>setSidebarOpen(false)}>
        <aside className="w-72 h-full overflow-auto etudes-scroll px-5 pt-8 pb-14 space-y-6" style={{background:BG,borderRight:`1px solid ${LINE}`}} onClick={e=>e.stopPropagation()}>
          <div className="mb-4 flex justify-end"><button onClick={()=>setSidebarOpen(false)} style={{color:DIM}}><X className="w-4 h-4" strokeWidth={1.25}/></button></div>
          <SidebarFacet title="Composers" icon={<Users className="w-3 h-3" strokeWidth={1.25}/>} open={composerOpen} setOpen={setComposerOpen} entries={allComposers} activeValue={filterComposer} onSelect={setFilterComposer} emptyText="No composers yet."/>
          <SidebarFacet title="Instruments" icon={<Guitar className="w-3 h-3" strokeWidth={1.25}/>} open={instrumentOpen} setOpen={setInstrumentOpen} entries={allInstruments} activeValue={filterInstrument} onSelect={setFilterInstrument} emptyText="No instruments set."/>
        </aside>
      </div>
    ) : (
      <aside className="w-52 shrink-0 px-5 pt-8 pb-14 space-y-6" style={{borderRight:`1px solid ${LINE}`}}><div className="mb-4 flex justify-end"><button onClick={()=>setSidebarOpen(false)} className="group flex items-center gap-1" style={{color:DIM,cursor:'pointer',transition:'color 120ms'}} onMouseEnter={e=>e.currentTarget.style.color=MUTED} onMouseLeave={e=>e.currentTarget.style.color=DIM}><span className="opacity-0 group-hover:opacity-100 uppercase" style={{fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em',transition:'opacity 120ms'}}>Collapse</span><ChevronDown className="w-3.5 h-3.5" strokeWidth={1.25}/></button></div><SidebarFacet title="Composers" icon={<Users className="w-3 h-3" strokeWidth={1.25}/>} open={composerOpen} setOpen={setComposerOpen} entries={allComposers} activeValue={filterComposer} onSelect={setFilterComposer} emptyText="No composers yet."/><SidebarFacet title="Instruments" icon={<Guitar className="w-3 h-3" strokeWidth={1.25}/>} open={instrumentOpen} setOpen={setInstrumentOpen} entries={allInstruments} activeValue={filterInstrument} onSelect={setFilterInstrument} emptyText="No instruments set."/></aside>
    ))}
    <div className={`flex-1 min-w-0 ${isMobile?'px-4 py-8':(sidebarOpen?'px-10':'px-12')+' py-14'}`}>
      <div className="flex items-center gap-2 mb-3">{!sidebarOpen&&<button onClick={()=>setSidebarOpen(true)} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}><Users className="w-3 h-3" strokeWidth={1.25}/> Filter</button>}</div>
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
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="flex-1 text-xs focus:outline-none" style={{background:'transparent',color:TEXT}}/>
          {search&&<button onClick={()=>setSearch('')} style={{color:FAINT,fontSize:'10px',lineHeight:1}}>✕</button>}
        </div>
      </div>
      <div style={{borderTop:`1px solid ${LINE_STR}`}}>
        {hasFilters&&sorted.length>0&&(
          <div className="flex items-baseline gap-2 px-2 py-2" style={{borderBottom:`1px solid ${LINE}`}}>
            <span className="italic" style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>Filtered · {sorted.length} piece{sorted.length===1?'':'s'} ·</span>
            <button onClick={clearFilters} className="italic" style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px',background:'transparent',border:'none',padding:0,cursor:'pointer',textDecoration:'underline'}}>clear</button>
          </div>
        )}
        {items.length===0&&<div className="py-16 text-center italic" style={{color:DIM,fontFamily:serif,fontSize:'15px'}}>No pieces yet.</div>}
        {!groupByCollection&&sorted.map(renderItem)}
        {groupByCollection&&grouped&&(<>{grouped.collections.map(({name,list})=>(<div key={name}><div className="px-2 pt-5 pb-2 flex items-baseline gap-3" style={{borderBottom:`1px solid ${LINE_MED}`,background:SURFACE}}><Layers className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/><span className="italic" style={{fontFamily:serif,fontSize:'18px',fontWeight:300}}>{name}</span><span className="tabular-nums ml-auto" style={{color:FAINT,fontSize:'10px'}}>{list.length} movement{list.length===1?'':'s'}</span></div>{list.map(renderItem)}</div>))}{grouped.standalone.length>0&&(<><div className="px-2 pt-5 pb-2" style={{borderBottom:`1px solid ${LINE_MED}`,background:SURFACE}}><span className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.3em'}}>Standalone</span></div>{grouped.standalone.map(renderItem)}</>)}</>)}
        {items.length>0&&sorted.length===0&&(<div className="py-12 text-center"><div className="italic mb-3" style={{color:FAINT,fontFamily:serif,fontSize:'15px'}}>No pieces match.</div><button onClick={clearFilters} className="uppercase px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Clear filters</button></div>)}
      </div>
    </div>
  </div>
  {/* ── Global A/B comparison bar (cross-piece only) ──────────────────── */}
  {globalAbA&&globalAbB&&globalAbA.itemId!==globalAbB.itemId&&(
    <div style={{position:'fixed',bottom:isMobile?'calc(var(--footer-height,160px))':0,left:0,right:0,zIndex:40,background:BG,borderTop:`1px solid ${LINE_STR}`,boxShadow:'0 -4px 24px rgba(0,0,0,0.5)'}}>
      <div className="max-w-6xl mx-auto px-12">
        {/* Header */}
        <div className="flex items-center gap-3 py-2" style={{borderBottom:`1px solid ${LINE}`}}>
          <span className="uppercase" style={{fontFamily:mono,color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>
            <span style={{color:IKB}}>A</span>
            <span style={{margin:'0 5px',color:DIM}}>—</span>
            <span style={{color:WARM}}>B</span>
            {' '}Comparison
          </span>
          <span style={{color:DIM,fontSize:'9px',fontFamily:mono}}>·</span>
          <span className="italic truncate" style={{fontFamily:serif,color:MUTED,fontSize:'12px',flex:1,minWidth:0}}>
            <span style={{color:IKB}}>A</span> {globalAbA.title} <span style={{color:FAINT,fontSize:'10px'}}>{globalAbA.date}</span>
            <span style={{margin:'0 8px',color:DIM}}>vs</span>
            <span style={{color:WARM}}>B</span> {globalAbB.title} <span style={{color:FAINT,fontSize:'10px'}}>{globalAbB.date}</span>
          </span>
          <button onClick={()=>{setGlobalAbA(null);setGlobalAbB(null);}} className="uppercase shrink-0" style={{fontFamily:mono,color:DIM,fontSize:'8px',letterSpacing:'0.18em',cursor:'pointer'}}>clear</button>
        </div>
        {/* Two waveforms */}
        <div className="flex gap-0 py-3">
          {[{slot:'A',ab:globalAbA,accent:IKB,soft:IKB_SOFT},{slot:'B',ab:globalAbB,accent:WARM,soft:WARM_SOFT}].map(({slot,ab,accent,soft},i)=>(
            <div key={slot} className="flex-1 min-w-0 px-4 py-2" style={{borderRight:i===0?`1px solid ${LINE}`:'none',background:soft}}>
              <div className="flex items-baseline gap-2 mb-2">
                <span style={{fontFamily:mono,color:accent,fontSize:'10px',letterSpacing:'0.22em',fontWeight:600}}>{slot}</span>
                <span className="italic truncate" style={{fontFamily:serif,color:MUTED,fontSize:'12px'}}>{ab.title}</span>
                <span style={{fontFamily:mono,color:FAINT,fontSize:'9px',letterSpacing:'0.06em'}}>{ab.date}</span>
                {ab.meta?.bpm&&<span style={{fontFamily:mono,color:FAINT,fontSize:'9px'}}>↓ {ab.meta.bpm}</span>}
              </div>
              <Waveform blobLoader={()=>idbGet('pieceRecordings',ab.meta?.idbKey??`${ab.itemId}__${ab.date}`)} meta={ab.meta}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
  </>);
}

function LogBookPanel({item,updateItem,addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry,onWikiLinkClick,wikiCompletionData}){
  const [logSearch,setLogSearch]=useState('');
  const [addingNote,setAddingNote]=useState(false);
  const [newNoteText,setNewNoteText]=useState('');
  const [pinnedOpen,setPinnedOpen]=useState(false);
  const [logOpen,setLogOpen]=useState(false);
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
            onWikiLinkClick={onWikiLinkClick}
            completionData={wikiCompletionData}
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
                placeholder="A note on this session."
                className="w-full resize-none focus:outline-none"
                style={{background:'transparent',color:TEXT,fontFamily:serifText,fontSize:'13px',lineHeight:1.65,minHeight:'60px',fontWeight:300}}
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
            <div className="italic py-2" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>No entries yet.</div>
          )}

          <div className="space-y-0">
            {filteredLog.map((entry,idx)=>(
              <LogEntry key={entry.id} entry={entry} itemId={item.id} isLast={idx===filteredLog.length-1} onDelete={()=>deleteNoteLogEntry&&deleteNoteLogEntry(item.id,entry.id)} onUpdate={(text)=>updateNoteLogEntry&&updateNoteLogEntry(item.id,entry.id,text)} onWikiLinkClick={onWikiLinkClick}/>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}

function LogEntry({entry,itemId,isLast,onDelete,onUpdate,onWikiLinkClick}){
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
        <MarkdownField value={entry.text||''} readOnly minHeight={0} style={{border:'none',padding:0,fontSize:'13px',background:'transparent'}} onWikiLinkClick={onWikiLinkClick}/>
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

// ── Mobile: Répertoire list ───────────────────────────────────────────────
function MobileRepertoireList({items,sorted,grouped,groupByCollection,setGroupByCollection,search,setSearch,filterType,setFilterType,filterStatus,setFilterStatus,filterComposer,setFilterComposer,filterInstrument,setFilterInstrument,hasFilters,clearFilters,allComposers,allInstruments,activeItemId,dayClosed,handleAdd,onTapItem,itemTimes,fmtMin,history,globalAbA,globalAbB,setGlobalAbA,setGlobalAbB,pieceRecordingMeta,refTrackMeta}){
  const [filterSheetOpen,setFilterSheetOpen]=useState(false);
  const [composerOpen,setComposerOpen]=useState(true);
  const [instrumentOpen,setInstrumentOpen]=useState(true);

  const filterSheetStyle={
    position:'fixed',bottom:0,left:0,right:0,height:'70vh',
    background:'rgba(17,16,16,0.95)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',
    borderTop:`1px solid ${LINE_STR}`,zIndex:40,
    transform:filterSheetOpen?'translateY(0)':'translateY(100%)',
    transition:filterSheetOpen?'transform 240ms ease-out':'transform 200ms ease-in',
    display:'flex',flexDirection:'column',overflowY:'auto',
  };

  return(
    <div style={{paddingBottom:'calc(var(--footer-height,160px) + 24px)'}}>
      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 8px'}}>
        <div style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,fontSize:'clamp(48px,13vw,56px)',letterSpacing:'-0.02em',lineHeight:1.05,color:TEXT}}>Répertoire</div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>setFilterSheetOpen(true)} style={{minWidth:'36px',minHeight:'36px',display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${hasFilters?IKB:LINE_MED}`,background:hasFilters?IKB_SOFT:'transparent',color:hasFilters?IKB:MUTED,cursor:'pointer'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          </button>
          <button onClick={()=>setGroupByCollection(v=>!v)} style={{minWidth:'36px',minHeight:'36px',display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${groupByCollection?IKB:LINE_MED}`,background:groupByCollection?IKB_SOFT:'transparent',color:groupByCollection?IKB:MUTED,cursor:'pointer'}}>
            <Layers size={14} strokeWidth={1.25}/>
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 20px',borderBottom:`1px solid ${LINE}`}}>
        <Search size={13} strokeWidth={1.25} style={{color:FAINT,flexShrink:0}}/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{flex:1,background:'transparent',border:'none',color:TEXT,fontSize:'14px',outline:'none'}}/>
        {search&&<button onClick={()=>setSearch('')} style={{color:FAINT,fontSize:'12px',background:'transparent',border:'none',cursor:'pointer'}}>✕</button>}
      </div>

      {/* Add row */}
      <div style={{display:'flex',gap:'4px',padding:'10px 20px',borderBottom:`1px solid ${LINE}`,flexWrap:'wrap'}}>
        <span className="uppercase" style={{color:DIM,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans,alignSelf:'center',marginRight:'4px'}}>Add</span>
        {TYPES.map(t=>(
          <button key={t} onClick={()=>handleAdd(t)} style={{display:'flex',alignItems:'baseline',gap:'4px',padding:'4px 8px',background:'transparent',border:`1px solid ${LINE_MED}`,cursor:'pointer',color:TEXT}}>
            <span style={{fontFamily:serif,fontStyle:'italic',color:DIM,fontSize:'11px'}}>{SECTION_CONFIG[t].roman}.</span>
            <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.18em'}}>{SECTION_CONFIG[t].label}</span>
          </button>
        ))}
        {hasFilters&&<button onClick={clearFilters} style={{marginLeft:'auto',padding:'4px 8px',border:`1px solid ${LINE_MED}`,color:MUTED,fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em',textTransform:'uppercase',cursor:'pointer',background:'transparent'}}>Clear</button>}
      </div>

      {/* List */}
      <div style={{borderTop:`1px solid ${LINE_STR}`}}>
        {hasFilters&&sorted.length>0&&(
          <div style={{display:'flex',alignItems:'baseline',gap:'8px',padding:'10px 20px',borderBottom:`1px solid ${LINE}`}}>
            <span style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>Filtered · {sorted.length} piece{sorted.length===1?'':'s'} ·</span>
            <button onClick={clearFilters} style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px',background:'transparent',border:'none',padding:0,cursor:'pointer',textDecoration:'underline'}}>clear</button>
          </div>
        )}
        {items.length===0&&<div style={{padding:'48px 20px',textAlign:'center',fontFamily:serif,fontStyle:'italic',fontSize:'15px',color:DIM}}>No pieces yet.</div>}
        {!groupByCollection&&sorted.map(item=><MobileRepItem key={item.id} item={item} onTap={()=>onTapItem(item.id)} activeItemId={activeItemId} history={history} pieceRecordingMeta={pieceRecordingMeta} refTrackMeta={refTrackMeta}/>)}
        {groupByCollection&&grouped&&(<>
          {grouped.collections.map(({name,list})=>(
            <div key={name}>
              <div style={{padding:'12px 20px 8px',borderBottom:`1px solid ${LINE_MED}`,background:SURFACE,display:'flex',alignItems:'baseline',gap:'8px'}}>
                <span style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,fontSize:'16px',color:MUTED}}>{name}</span>
                <span style={{color:FAINT,fontSize:'10px',marginLeft:'auto'}}>{list.length} mvt{list.length===1?'':'s'}</span>
              </div>
              {list.map(item=><MobileRepItem key={item.id} item={item} onTap={()=>onTapItem(item.id)} activeItemId={activeItemId} history={history} pieceRecordingMeta={pieceRecordingMeta} refTrackMeta={refTrackMeta}/>)}
            </div>
          ))}
          {grouped.standalone.length>0&&(<>
            <div style={{padding:'12px 20px 8px',borderBottom:`1px solid ${LINE_MED}`,background:SURFACE}}><span className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.3em'}}>Standalone</span></div>
            {grouped.standalone.map(item=><MobileRepItem key={item.id} item={item} onTap={()=>onTapItem(item.id)} activeItemId={activeItemId} history={history} pieceRecordingMeta={pieceRecordingMeta} refTrackMeta={refTrackMeta}/>)}
          </>)}
        </>)}
        {items.length>0&&sorted.length===0&&(<div style={{padding:'32px 20px',textAlign:'center'}}><div style={{fontFamily:serif,fontStyle:'italic',fontSize:'14px',color:FAINT,marginBottom:'12px'}}>No pieces match.</div><button onClick={clearFilters} className="uppercase" style={{padding:'6px 14px',border:`1px solid ${LINE_MED}`,color:MUTED,fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',background:'transparent',cursor:'pointer'}}>Clear filters</button></div>)}
      </div>

      {/* Filter sheet */}
      {filterSheetOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:39}} onClick={()=>setFilterSheetOpen(false)}/>}
      <div style={filterSheetStyle}>
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}><div style={{width:'36px',height:'3px',background:LINE_STR,borderRadius:'999px'}}/></div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 20px',flexShrink:0,borderBottom:`1px solid ${LINE}`}}>
          <span className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em',fontFamily:sans}}>Filter</span>
          <button onClick={()=>setFilterSheetOpen(false)} style={{color:FAINT,background:'transparent',border:'none',cursor:'pointer',minWidth:'36px',minHeight:'36px',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={16} strokeWidth={1.25}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px 32px',display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans,marginBottom:'8px'}}>Type</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {[{value:'',label:'All'},...TYPES.map(t=>({value:t,label:SECTION_CONFIG[t].label}))].map(o=>(
                <button key={o.value} onClick={()=>setFilterType(o.value)} style={{padding:'6px 12px',border:`1px solid ${filterType===o.value?IKB:LINE_MED}`,background:filterType===o.value?IKB_SOFT:'transparent',color:filterType===o.value?TEXT:MUTED,fontFamily:sans,fontSize:'10px',letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer'}}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans,marginBottom:'8px'}}>Status</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {[{value:'',label:'All'},...STAGES.map(s=>({value:s.key,label:s.label}))].map(o=>(
                <button key={o.value} onClick={()=>setFilterStatus(o.value)} style={{padding:'6px 12px',border:`1px solid ${filterStatus===o.value?IKB:LINE_MED}`,background:filterStatus===o.value?IKB_SOFT:'transparent',color:filterStatus===o.value?TEXT:MUTED,fontFamily:sans,fontSize:'10px',letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer'}}>{o.label}</button>
              ))}
            </div>
          </div>
          <SidebarFacet title="Composers" icon={<Users size={11} strokeWidth={1.25}/>} open={composerOpen} setOpen={setComposerOpen} entries={allComposers} activeValue={filterComposer} onSelect={setFilterComposer} emptyText="No composers yet."/>
          <SidebarFacet title="Instruments" icon={<Guitar size={11} strokeWidth={1.25}/>} open={instrumentOpen} setOpen={setInstrumentOpen} entries={allInstruments} activeValue={filterInstrument} onSelect={setFilterInstrument} emptyText="No instruments set."/>
          {hasFilters&&<button onClick={()=>{clearFilters();setFilterSheetOpen(false);}} style={{padding:'10px',border:`1px solid ${LINE_MED}`,color:MUTED,fontFamily:sans,fontSize:'10px',letterSpacing:'0.22em',textTransform:'uppercase',cursor:'pointer',background:'transparent',marginTop:'8px'}}>Clear all filters</button>}
        </div>
      </div>
    </div>
  );
}

function MobileRepItem({item,onTap,activeItemId,history,pieceRecordingMeta,refTrackMeta}){
  const isActive=activeItemId===item.id;
  const perf=nextPerformance(item.performances);
  const spotCount=(item.spots||[]).length;
  const hasPdf=(item.pdfs||[]).length>0;
  const hasRecordings=!!(pieceRecordingMeta?.[item.id]&&Object.keys(pieceRecordingMeta[item.id]).length>0);
  const hasRefTrack=!!(refTrackMeta?.[item.id]);
  return(
    <button onClick={onTap} style={{display:'flex',alignItems:'center',gap:'12px',width:'100%',padding:'14px 20px',background:isActive?IKB_SOFT:'transparent',minHeight:'52px',textAlign:'left',cursor:'pointer',border:'none',borderBottomWidth:'1px',borderBottomStyle:'solid',borderBottomColor:LINE}}>
      <div style={{flexShrink:0,width:'24px'}}>
        <span style={{fontFamily:serif,fontStyle:'italic',fontSize:'11px',color:MUTED}}>{SECTION_CONFIG[item.type].roman}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'16px',color:isActive?TEXT:'rgba(212,206,195,0.9)',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayTitle(item)}</div>
        {formatByline(item)&&<div style={{fontFamily:serifText,fontStyle:'italic',fontSize:'12px',color:FAINT,marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{formatByline(item)}</div>}
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'5px',flexWrap:'wrap'}}>
          <StageDots stage={item.stage}/>
          {spotCount>0&&<span style={{display:'flex',alignItems:'center',gap:'3px',color:FAINT}}><Crosshair size={9} strokeWidth={1.25}/><span style={{fontFamily:mono,fontSize:'9px'}}>{spotCount}</span></span>}
          {hasRecordings&&<Mic size={9} strokeWidth={1.25} style={{color:FAINT}}/>}
          {hasRefTrack&&<Music size={9} strokeWidth={1.25} style={{color:FAINT}}/>}
          {hasPdf&&<FileText size={9} strokeWidth={1.25} style={{color:FAINT}}/>}
          {perf&&<span style={{marginLeft:'auto'}}><PerformanceChip perf={perf} compact/></span>}
        </div>
      </div>
    </button>
  );
}

// ── Mobile: Piece detail screen ───────────────────────────────────────────
function PieceDetailScreen({item,onBack,updateItem,deleteItem,dayClosed,activeItemId,activeSpotId,startItem,stopItem,itemTimes,fmt,fmtMin,addSpot,updateSpot,deleteSpot,editSpotTime,addPerformance,updatePerformance,deletePerformance,pieceRecordingMeta,setPdfDrawerItemId,history,globalAbA,globalAbB,setGlobalAbA,setGlobalAbB,startPieceRecording,stopPieceRecording,deletePieceRecording,lockPieceRecording,pieceRecordingItemId,refTrackMeta,uploadRefTrack,deleteRefTrack,pdfUrlMap,localPieceRecordingIds,localRefTrackIds,addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry,setExpandedItemId,onWikiLinkClick,wikiCompletionData}){
  const [tab,setTab]=useState('recordings');
  const isActive=activeItemId===item.id;
  const stage=STAGES.find(s=>s.key===item.stage)||STAGES[0];
  const perf=nextPerformance(item.performances);
  const totalTime=getItemTime(itemTimes,item.id);
  const TABS=[{id:'spots',label:'Spots'},{id:'info',label:'Info'},{id:'recordings',label:'Recordings'},{id:'score',label:'Score'}];

  return(
    <div style={{paddingBottom:'calc(var(--footer-height,160px) + 24px)'}}>
      {/* Back button */}
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'6px',padding:'12px 20px',minHeight:'44px',background:'transparent',border:'none',cursor:'pointer',borderBottom:`1px solid ${LINE}`,width:'100%'}}>
        <ChevronLeft size={12} strokeWidth={1.5} style={{color:'rgba(196,188,179,0.7)',flexShrink:0}}/>
        <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.22em',color:'rgba(196,188,179,0.7)'}}>Répertoire</span>
      </button>

      {/* Header */}
      <div style={{padding:'16px 20px'}}>
        <div className="uppercase" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.28em',color:FAINT,marginBottom:'4px'}}>
          {stage.label}{item.instrument?` · ${item.instrument}`:''}
        </div>
        <div style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'32px',letterSpacing:'-0.01em',color:TEXT,lineHeight:1.1,marginTop:'6px'}}>{displayTitle(item)}</div>
        {formatByline(item)&&<div style={{fontFamily:serifText,fontStyle:'italic',fontSize:'14px',color:FAINT,marginTop:'4px'}}>{formatByline(item)}</div>}
        <div style={{marginTop:'12px'}}>
          <StageLabels stage={item.stage} onChange={st=>updateItem(item.id,{stage:st})} compact/>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{display:'flex',alignItems:'stretch',padding:'12px 20px',borderTop:`1px solid ${LINE_STR}`,borderBottom:`1px solid ${LINE}`,margin:'0',gap:'16px'}}>
        <div style={{flex:1,minWidth:0}}>
          <div className="uppercase" style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.28em',marginBottom:'4px'}}>Total time</div>
          <div style={{fontFamily:mono,fontSize:'18px',color:TEXT}}>{fmtMin(totalTime)}</div>
        </div>
        {perf&&(<>
          <div style={{width:'1px',background:LINE,alignSelf:'stretch'}}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="uppercase" style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.28em',marginBottom:'4px'}}>Next perf.</div>
            <div style={{fontFamily:serifText,fontStyle:'italic',fontSize:'13px',color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{perf.label||'performance'}</div>
            <div style={{fontFamily:mono,fontSize:'10px',color:WARM}}>{daysUntil(perf.date)===0?'today':`${daysUntil(perf.date)} days`}</div>
          </div>
        </>)}
      </div>

      {/* Tab strip */}
      <div style={{display:'flex',borderBottom:`1px solid ${LINE}`}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'12px 0',minHeight:'44px',background:'transparent',border:'none',cursor:'pointer',borderBottom:`1px solid ${tab===t.id?IKB:'transparent'}`,marginBottom:'-1px'}}>
            <span className="uppercase" style={{fontFamily:sans,fontSize:'11px',fontWeight:500,letterSpacing:'0.22em',color:tab===t.id?TEXT:FAINT}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Spots tab */}
      {tab==='spots'&&(
        <div style={{padding:'0 0 16px'}}>
          {(item.spots||[]).length===0&&<div style={{padding:'24px 20px',fontFamily:serif,fontStyle:'italic',fontSize:'13px',color:FAINT}}>No spots yet.</div>}
          {(item.spots||[]).map((spot,idx)=>(
            <div key={spot.id} style={{borderBottom:`1px solid ${LINE}`}}>
              <SpotEditor spot={spot} itemId={item.id} itemTimes={itemTimes} isActive={activeItemId===item.id&&activeSpotId===spot.id} onStart={()=>startItem(item.id,spot.id)} onStop={stopItem} onUpdate={patch=>updateSpot(item.id,spot.id,patch)} onDelete={()=>deleteSpot(item.id,spot.id)} onMoveUp={()=>{}} onMoveDown={()=>{}} canMoveUp={idx>0} canMoveDown={idx<(item.spots||[]).length-1} onEditTime={v=>editSpotTime(item.id,spot.id,v)} dayClosed={dayClosed} itemPdfs={item.pdfs||[]}/>
            </div>
          ))}
          <div style={{padding:'12px 20px'}}>
            <button onClick={()=>addSpot(item.id,'New spot')} style={{display:'flex',alignItems:'center',gap:'6px',background:'transparent',border:'none',cursor:'pointer',color:MUTED}}>
              <Plus size={11} strokeWidth={1.25}/>
              <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Add spot</span>
            </button>
          </div>
        </div>
      )}

      {/* Info tab */}
      {tab==='info'&&(
        <div style={{padding:'0 20px 24px'}}>
          {[
            {label:'Work title',field:'title',type:'text',placeholder:'Untitled'},
            {label:'Movement / part',field:'movement',type:'text',placeholder:'I. Prélude'},
            {label:'Collection',field:'collection',type:'text',placeholder:'Suite Bergamasque'},
            {label:'Composer',field:'composer',type:'text',placeholder:'Composer'},
            {label:'Catalog',field:'catalog',type:'text',placeholder:'Op. 110'},
            {label:'Instrument',field:'instrument',type:'text',placeholder:'Instrument'},
          ].map(f=>(
            <div key={f.field} style={{padding:'20px 0',borderBottom:`1px solid ${LINE}`}}>
              <div className="uppercase" style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.28em',marginBottom:'6px'}}>{f.label}</div>
              <input
                type={f.type}
                value={item[f.field]||''}
                onChange={e=>updateItem(item.id,{[f.field]:e.target.value})}
                placeholder={f.placeholder}
                style={{width:'100%',background:'transparent',border:'none',borderBottom:`1px solid ${LINE_MED}`,color:TEXT,fontFamily:serifText,fontSize:'15px',padding:'8px 0',outline:'none',boxSizing:'border-box'}}
              />
            </div>
          ))}
          {/* Length + BPM side by side */}
          <div style={{display:'flex',gap:'16px',padding:'20px 0',borderBottom:`1px solid ${LINE}`}}>
            <div style={{flex:1}}>
              <div className="uppercase" style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.28em',marginBottom:'6px'}}>Length</div>
              <input type="text" value={item.lengthSecs!=null?formatLengthForInput(item.lengthSecs):''} onChange={e=>{const s=parseLengthInput(e.target.value);updateItem(item.id,{lengthSecs:s});}} placeholder="—" style={{width:'100%',background:'transparent',border:'none',borderBottom:`1px solid ${LINE_MED}`,color:TEXT,fontFamily:mono,fontSize:'14px',padding:'8px 0',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{flex:1}}>
              <div className="uppercase" style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.28em',marginBottom:'6px'}}>Tempo</div>
              <input type="number" min="40" max="300" value={item.bpmTarget??''} onChange={e=>{const n=parseInt(e.target.value,10);updateItem(item.id,{bpmTarget:Number.isFinite(n)&&n>0?n:null});}} placeholder="— bpm" style={{width:'100%',background:'transparent',border:'none',borderBottom:`1px solid ${LINE_MED}`,color:TEXT,fontFamily:mono,fontSize:'14px',padding:'8px 0',outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>
          {/* Tags */}
          <div style={{padding:'20px 0',borderBottom:`1px solid ${LINE}`}}>
            <div className="uppercase" style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.28em',marginBottom:'8px'}}>Tags</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'8px'}}>
              {(item.tags||[]).map(t=>(
                <span key={t} style={{display:'flex',alignItems:'center',gap:'4px',padding:'3px 8px',background:SURFACE2,border:`1px solid ${LINE}`,fontSize:'9px',letterSpacing:'0.18em',textTransform:'uppercase',color:MUTED}}>
                  {t}
                  <button onClick={()=>updateItem(item.id,{tags:item.tags.filter(x=>x!==t)})} style={{color:FAINT,background:'transparent',border:'none',cursor:'pointer',padding:0,lineHeight:1}}><X size={10} strokeWidth={1.25}/></button>
                </span>
              ))}
            </div>
            <input type="text" placeholder="add + enter" onKeyDown={e=>{if(e.key==='Enter'&&e.target.value.trim()){const tag=e.target.value.trim().replace(/^#/,'');if(!(item.tags||[]).includes(tag))updateItem(item.id,{tags:[...(item.tags||[]),tag]});e.target.value='';}}} style={{background:SURFACE2,border:`1px solid ${LINE_MED}`,color:TEXT,padding:'6px 10px',fontSize:'12px',outline:'none',width:'100%',boxSizing:'border-box'}}/>
          </div>
          {/* Notes */}
          <div style={{padding:'20px 0'}}>
            <div className="uppercase" style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.28em',marginBottom:'8px'}}>Notes</div>
            <MarkdownField value={item.detail||''} onChange={v=>updateItem(item.id,{detail:v})} placeholder="Long-running notes…" minHeight={120} style={{background:SURFACE2,border:`1px solid ${LINE}`,fontSize:'15px'}} onWikiLinkClick={onWikiLinkClick} completionData={wikiCompletionData}/>
          </div>
          {/* Delete */}
          <button onClick={()=>{deleteItem(item.id);onBack();}} style={{display:'flex',alignItems:'center',gap:'6px',padding:'10px 0',color:WARN,background:'transparent',border:'none',cursor:'pointer',marginTop:'8px'}}>
            <Trash2 size={12} strokeWidth={1.25}/>
            <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em'}}>Delete</span>
          </button>
        </div>
      )}

      {/* Recordings tab */}
      {tab==='recordings'&&(
        <div style={{padding:'16px 20px'}}>
          <PieceRecordingsPanel
            item={item}
            pieceRecordingMeta={pieceRecordingMeta}
            deletePieceRecording={deletePieceRecording}
            lockPieceRecording={lockPieceRecording}
            pieceRecordingItemId={pieceRecordingItemId}
            dayClosed={dayClosed}
            globalAbA={globalAbA}
            globalAbB={globalAbB}
            setGlobalAbA={setGlobalAbA}
            setGlobalAbB={setGlobalAbB}
            refTrackMeta={refTrackMeta}
            uploadRefTrack={uploadRefTrack}
            deleteRefTrack={deleteRefTrack}
          />
        </div>
      )}

      {/* Score tab */}
      {tab==='score'&&(
        <div style={{padding:'16px 20px'}}>
          {(item.pdfs||[]).length>0?(
            <button onClick={()=>setPdfDrawerItemId(item.id)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',border:`1px solid ${LINE_MED}`,background:SURFACE2,cursor:'pointer',width:'100%',color:TEXT}}>
              <FileText size={14} strokeWidth={1.25} style={{color:IKB}}/>
              <span style={{fontFamily:sans,fontSize:'12px'}}>Open score viewer</span>
            </button>
          ):(
            <button onClick={()=>setPdfDrawerItemId(item.id)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',border:`1px dashed ${LINE_STR}`,background:'transparent',cursor:'pointer',width:'100%',color:FAINT}}>
              <FileText size={14} strokeWidth={1.25}/>
              <span style={{fontFamily:sans,fontSize:'12px'}}>Upload a PDF score</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
