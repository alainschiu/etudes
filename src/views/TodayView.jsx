import React, {useState, useEffect, useRef, useCallback} from 'react';
import useViewport from '../hooks/useViewport.js';
import {useLongPress} from '../hooks/useLongPress.js';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Plus from 'lucide-react/dist/esm/icons/plus';
import FilePlus from 'lucide-react/dist/esm/icons/file-plus';
import X from 'lucide-react/dist/esm/icons/x';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Target from 'lucide-react/dist/esm/icons/target';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Unlock from 'lucide-react/dist/esm/icons/unlock';
import Crosshair from 'lucide-react/dist/esm/icons/crosshair';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Check from 'lucide-react/dist/esm/icons/check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Coffee from 'lucide-react/dist/esm/icons/coffee';
import Music from 'lucide-react/dist/esm/icons/music';
import MessageSquarePlus from 'lucide-react/dist/esm/icons/message-square-plus';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Square from 'lucide-react/dist/esm/icons/square';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, WARM_SOFT, REC, serif, serifText, sans, mono, Z_SHEET} from '../constants/theme.js';
import {TYPES, SECTION_CONFIG, STAGES} from '../constants/config.js';
import {todayDateStr, daysUntil} from '../lib/dates.js';
import {getItemTime, displayTitle, formatByline, nextPerformance, getParentBucket} from '../lib/items.js';
import {getEmbedInfo} from '../lib/media.js';
import {toRoman} from '../lib/music.js';
import {DisplayHeader, TargetEdit, TimeWithTarget, ItemTimeEditor, ItemPickerPopup, PerformanceChip, SpotsBlock, Waveform, MarkdownField} from '../components/shared.jsx';
import {idbGet} from '../lib/storage.js';

function AnalogClock({size=40}){
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id);},[]);
  const h=now.getHours()%12,m=now.getMinutes(),s=now.getSeconds();
  const hDeg=(h+m/60)*30,mDeg=(m+s/60)*6;
  const CX=size/2,CY=size/2,R=size/2-2;
  const handPath=(deg,len)=>{const rad=(deg-90)*Math.PI/180;return`M${CX},${CY} L${(CX+Math.cos(rad)*len).toFixed(2)},${(CY+Math.sin(rad)*len).toFixed(2)}`;};
  return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><circle cx={CX} cy={CY} r={R} fill="none" stroke={LINE_STR} strokeWidth="1"/><path d={handPath(hDeg,R*0.5)} stroke={MUTED} strokeWidth="1.5" strokeLinecap="round"/><path d={handPath(mDeg,R*0.72)} stroke={TEXT} strokeWidth="1" strokeLinecap="round"/><circle cx={CX} cy={CY} r="1.5" fill={MUTED}/></svg>);
}

export default function TodayView(p){
  const {isMobile}=useViewport();
  const {items,view,setView,todaySessions,moveSession,hideSession,addSessionType,toggleSessionWarmup,removeItemFromSession,addItemToSession,setSessionTarget,setItemTarget,routines,loadedRoutine,loadRoutine,resetToFree,saveRoutine,updateLoadedRoutine,sectionTimes,activeItemId,activeSpotId,activeSessionId,itemTimes,expandedItemId,setExpandedItemId,startItem,stopItem,updateItem,deleteItem,addItem,workingOn,toggleWorking,setPdfDrawerItemId,dailyReflection,setDailyReflection,settings,totalToday,effectiveTotalToday,warmupTimeToday,restToday,fmt,fmtMin,setPromptModal,dragIdx,dragOverIdx,handleDragStart,handleDragOver,handleDrop,handleDragEnd,sessionRefs,reflectionRef,endDay,dayClosed,reopenDay,editingTimeItemId,setEditingTimeItemId,editItemTime,editSpotTime,addSpot,updateSpot,deleteSpot,startPieceRecording,stopPieceRecording,pieceRecordingItemId,pieceRecordingMeta,isRecording,currentBpm,refTrackMeta,refBarItemId,setRefBarItemId}=p;
  const today=new Date();const todayKey=todayDateStr();
  const [routineMenu,setRoutineMenu]=useState(false);const [addMenu,setAddMenu]=useState(false);const [pickerSessionId,setPickerSessionId]=useState(null);const [quickAdd,setQuickAdd]=useState(null);const [confirmClose,setConfirmClose]=useState(false);
  // Click-outside to collapse expanded item panel
  useEffect(()=>{
    if(!expandedItemId)return;
    const handler=(e)=>{
      const el=document.querySelector(`[data-today-item="${expandedItemId}"]`);
      if(el&&!el.contains(e.target))setExpandedItemId(null);
    };
    document.addEventListener('mousedown',handler);
    return()=>document.removeEventListener('mousedown',handler);
  },[expandedItemId]);
  const handleFilePlus=(type,session)=>{const ni=addItem(type);updateItem(ni.id,{stage:'learning'});if(session.itemIds!==null)addItemToSession(session.id,ni.id);setCollapsedSessions(prev=>{const next=new Set(prev);next.delete(session.id);return next;});setQuickAdd({itemId:ni.id,sessionId:session.id});};

  const piecePlayTypes=(t)=>(t==='piece'||t==='play')?['piece','play']:[t];
  const getSessionItems=(session)=>{if(session.itemIds===null){const types=piecePlayTypes(session.type);const list=items.filter(i=>types.includes(i.type)&&i.stage!=='queued');return [...list].sort((a,b)=>{const pa=nextPerformance(a.performances);const pb=nextPerformance(b.performances);const da=pa?daysUntil(pa.date):null;const db=pb?daysUntil(pb.date):null;const ua=(da!==null&&da>=0&&da<=30)?da:Infinity;const ub=(db!==null&&db>=0&&db<=30)?db:Infinity;return ua-ub;});}return session.itemIds.map(id=>items.find(i=>i.id===id)).filter(Boolean);};
  const getAvailableItems=(s)=>{const t=new Set(s.itemIds||[]);const types=piecePlayTypes(s.type);return items.filter(i=>types.includes(i.type)&&!t.has(i.id));};
  const warmupMin=Math.floor((warmupTimeToday||0)/60);const effectiveMin=Math.floor(effectiveTotalToday/60);
  const sumSessionTargets=todaySessions.reduce((acc,s)=>acc+(s.target||0),0);
  const effectiveDailyTarget=sumSessionTargets>0?sumSessionTargets:settings.dailyTarget;

  // Collapsible sessions: default open if has time logged or active item, else collapsed
  const [collapsedSessions,setCollapsedSessions]=useState(()=>{
    const collapsed=new Set();
    todaySessions.forEach(s=>{
      const sessionItems=s.itemIds===null?items.filter(i=>i.type===s.type&&i.stage!=='queued'):s.itemIds.map(id=>items.find(i=>i.id===id)).filter(Boolean);
      const hasTime=sessionItems.some(item=>getItemTime(itemTimes,item.id)>0);
      const hasActive=sessionItems.some(item=>item.id===activeItemId);
      if(!hasTime&&!hasActive)collapsed.add(s.id);
    });
    return collapsed;
  });
  const toggleCollapsed=(id)=>setCollapsedSessions(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});
  // Auto-open a section when a new session is added
  useEffect(()=>{
    todaySessions.forEach(s=>{
      // If activeItemId is in this session, ensure it's open
      if(activeItemId){const sItems=getSessionItems(s);if(sItems.some(it=>it.id===activeItemId)){setCollapsedSessions(prev=>{const next=new Set(prev);next.delete(s.id);return next;});}}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeItemId]);

  const hiddenTypes=TYPES.filter(t=>!todaySessions.some(s=>s.type===t));

  // ── Mobile accordion view ──────────────────────────────────────────────
  if(isMobile){
    return <TodayMobile {...p} isMobile={true} getSessionItems={getSessionItems} getAvailableItems={getAvailableItems} warmupMin={warmupMin} effectiveMin={effectiveMin} effectiveDailyTarget={effectiveDailyTarget} hiddenTypes={hiddenTypes} collapsedSessions={collapsedSessions} setCollapsedSessions={setCollapsedSessions} toggleCollapsed={toggleCollapsed} handleFilePlus={handleFilePlus} piecePlayTypes={piecePlayTypes} routines={p.routines} loadedRoutine={p.loadedRoutine} loadRoutine={p.loadRoutine} resetToFree={p.resetToFree} setPromptModal={p.setPromptModal} saveRoutine={p.saveRoutine} setItemTarget={p.setItemTarget}/>;
  }

  // ── Desktop view (unchanged) ───────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-12 py-14">
      <DisplayHeader eyebrow={`${today.toLocaleDateString('en-US',{weekday:'long'})} · ${today.toLocaleDateString('en-US',{month:'long',day:'numeric'})}`} title="Today" titleRight={<AnalogClock size={40}/>} right={
        <div className="flex items-center gap-5">
          <div className="flex items-end gap-5">
            <div className="relative"><button onClick={()=>setRoutineMenu(v=>!v)} className="flex items-baseline gap-2 pb-1.5 italic" style={{color:loadedRoutine?TEXT:MUTED,fontFamily:serif,fontSize:'14px',borderBottom:`1px solid ${loadedRoutine?IKB:LINE_MED}`}}><Bookmark className="w-3 h-3 not-italic" strokeWidth={1.25}/><span>{loadedRoutine?loadedRoutine.name:'Load routine'}</span><ChevronDown className="w-3 h-3 not-italic" strokeWidth={1.25}/></button>
              {routineMenu&&(<><div className="fixed inset-0 z-20" onClick={()=>setRoutineMenu(false)}/><div className="absolute right-0 mt-2 z-30 min-w-56" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
                {routines.length===0&&<div className="px-4 py-3 text-xs italic" style={{color:FAINT,fontFamily:serif}}>No routines yet.</div>}{routines.map(r=>(<button key={r.id} onClick={()=>{loadRoutine(r);setRoutineMenu(false);}} className="w-full text-left px-4 py-2.5" style={{borderBottom:`1px solid ${LINE}`,fontSize:'13px',background:loadedRoutine?.id===r.id?IKB_SOFT:'transparent'}}><div style={{fontFamily:serif,fontStyle:'italic',fontWeight:300,color:loadedRoutine?.id===r.id?IKB:TEXT}}>{r.name}</div><div className="mt-0.5" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.2em'}}>{r.sessions.map(s=>SECTION_CONFIG[s.type].label.toUpperCase()).join(' · ')}</div></button>))}
                {loadedRoutine&&<button onClick={()=>{resetToFree();setRoutineMenu(false);}} className="w-full text-left px-4 py-2.5 flex items-center gap-2 uppercase" style={{color:MUTED,borderBottom:`1px solid ${LINE}`,fontSize:'10px',letterSpacing:'0.22em'}}><RotateCcw className="w-3 h-3" strokeWidth={1.25}/> Unload routine</button>}
                {loadedRoutine&&<button onClick={()=>{updateLoadedRoutine();setRoutineMenu(false);}} className="w-full text-left px-4 py-2.5 flex items-center gap-2 uppercase" style={{color:IKB,borderBottom:`1px solid ${LINE}`,fontSize:'10px',letterSpacing:'0.22em'}}><Check className="w-3 h-3" strokeWidth={1.25}/> Update "{loadedRoutine.name}"</button>}
                <button onClick={()=>{setRoutineMenu(false);setPromptModal({title:'Save current arrangement as routine',placeholder:'Name',onConfirm:(name)=>{if(name?.trim())saveRoutine(name.trim());}});}} className="w-full text-left px-4 py-2.5 flex items-center gap-2 uppercase" style={{color:IKB,fontSize:'10px',letterSpacing:'0.22em'}}><Plus className="w-3 h-3" strokeWidth={1.25}/> Save current as…</button>
              </div></>)}
            </div>
          </div>
        </div>
      }/>
      {dayClosed&&(<div className="mb-8 px-5 py-4 flex items-center justify-between gap-4" style={{background:IKB_SOFT,border:`1px solid ${IKB}`,boxShadow:`0 0 20px ${IKB}20`}}><div className="flex items-center gap-3"><Lock className="w-4 h-4 shrink-0" strokeWidth={1.25} style={{color:IKB}}/><div><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em',color:TEXT}}>Day closed</div><div className="italic mt-0.5" style={{color:MUTED,fontFamily:serif,fontSize:'13px'}}>Timer edits locked until midnight or reopen. Reflections remain editable.</div></div></div><button onClick={reopenDay} className="uppercase flex items-center gap-1.5 px-3 py-2 shrink-0" style={{color:TEXT,border:`1px solid ${LINE_STR}`,background:BG,fontSize:'10px',letterSpacing:'0.22em'}}><Unlock className="w-3 h-3" strokeWidth={1.25}/> Reopen</button></div>)}

      <div className="py-4 flex items-center justify-between gap-6" style={{borderTop:`1px solid ${LINE_STR}`,borderBottom:`1px solid ${LINE}`}}>
        <div className="flex items-center gap-3 shrink-0"><Target className="w-3.5 h-3.5" strokeWidth={1.25} style={{color:IKB}}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Target</span></div>
        <div className="flex-1 h-px relative" style={{background:LINE_MED}}><div className="absolute inset-y-0 left-0" style={{background:IKB,width:`${Math.min(100,(effectiveTotalToday/60/effectiveDailyTarget)*100)}%`,boxShadow:`0 0 6px ${IKB}`}}/></div>
        <div className="font-mono tabular-nums text-xs shrink-0 flex items-baseline gap-3" style={{fontWeight:300}}><span>{effectiveMin} / {effectiveDailyTarget}′</span>{restToday>0&&<span style={{color:FAINT,fontSize:'10px'}}>· rest {Math.floor(restToday/60)}′</span>}</div>
      </div>
      {dayClosed&&<div className="py-2 flex items-center justify-between" style={{borderBottom:`1px solid ${LINE}`}}><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em',color:FAINT}}>Session total <span style={{textTransform:'none',letterSpacing:0,fontFamily:serif,fontStyle:'italic'}}>incl. rest</span></span><span className="font-mono tabular-nums" style={{fontSize:'11px',fontWeight:300,color:MUTED}}>{Math.floor((effectiveTotalToday+(restToday||0))/60)}′</span></div>}
      {warmupMin>0&&(<div className="py-2.5 flex items-center gap-3" style={{borderBottom:`1px solid ${LINE}`}}><span style={{color:WARM,fontSize:'13px',lineHeight:1,width:'18px',textAlign:'center'}}>◔</span><span className="uppercase" style={{color:WARM,fontSize:'10px',letterSpacing:'0.28em'}}>Warm-up today</span><span className="font-mono tabular-nums" style={{color:WARM,fontSize:'11px',fontWeight:300}}>{warmupMin}′</span><span className="italic ml-auto" style={{color:FAINT,fontFamily:serif,fontSize:'11px'}}>excluded from target</span></div>)}

      {items.length===0&&(
        <div className="mt-10 px-6 py-8 text-center" style={{border:`1px dashed ${LINE_STR}`}}>
          <div className="italic mb-2" style={{color:MUTED,fontFamily:serif,fontSize:'16px'}}>Start here.</div>
          <div style={{color:FAINT,fontSize:'12px',lineHeight:1.7}}>Add a piece in <button onClick={()=>setView('repertoire')} style={{color:IKB,textDecoration:'underline',cursor:'pointer'}}>Répertoire</button>, then press play next to it on this page.</div>
        </div>
      )}

      <div className="mt-8" style={{borderTop:`1px solid ${LINE_STR}`}}>
        {todaySessions.map((session,idx)=>{
          const type=session.type;const sessionItems=getSessionItems(session);const prescribed=session.itemIds!==null;
          const isDragging=dragIdx===idx;const isDragOver=dragOverIdx===idx&&dragIdx!==null&&dragIdx!==idx;
          const sectionSec=sectionTimes[type]||0;const st=session.target;const se=!!st&&sectionSec>=st*60;const isWarmup=!!session.isWarmup;
          const isCollapsed=collapsedSessions.has(session.id);
          const itemsToShow=isCollapsed?sessionItems.filter(item=>item.id===activeItemId):sessionItems;
          return (<div key={session.id} ref={el=>{if(sessionRefs?.current)sessionRefs.current[session.id]=el;}} className={isDragging?'drag-ghost':''} onDragOver={e=>handleDragOver(e,idx)} onDrop={()=>handleDrop(idx)} style={isDragOver?{boxShadow:`inset 0 2px 0 ${IKB}`}:{}}>
            {/* Section header — click to collapse/expand */}
            <div className="group flex items-center justify-between py-3 px-2 cursor-pointer" style={{borderBottom:`1px solid ${LINE}`}} onClick={()=>toggleCollapsed(session.id)}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span onClick={e=>{e.stopPropagation();}} draggable onDragStart={()=>handleDragStart(idx)} onDragEnd={handleDragEnd} className="cursor-grab active:cursor-grabbing inline-flex items-center shrink-0" style={{color:FAINT,padding:'0 2px'}}><GripVertical className="w-3.5 h-3.5" strokeWidth={1.25}/></span>
                <span className="tabular-nums shrink-0" style={{color:DIM,fontFamily:serif,fontStyle:'italic',fontSize:'11px',minWidth:'16px'}}>{toRoman(idx+1)}</span>
                {isWarmup&&<span className="shrink-0" style={{color:WARM,fontSize:'13px',lineHeight:1}} title="Warm-up · excluded from target">◔</span>}
                <span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em',fontFamily:sans}}>{SECTION_CONFIG[type].label}</span>
                {session.intention&&<span className="italic truncate" style={{color:DIM,fontFamily:serif,fontSize:'11px',letterSpacing:0,maxWidth:'200px'}} title={session.intention}>— {session.intention}</span>}
                {isCollapsed&&<span style={{color:FAINT,fontSize:'9px',letterSpacing:'0.15em'}}>· {sessionItems.length} piece{sessionItems.length===1?'':'s'}</span>}
              </div>
              {/* Right: hover controls → fixed time col → fixed target col → chevron */}
              <div className="flex items-center gap-2 shrink-0" onClick={e=>e.stopPropagation()}>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  <button onClick={()=>toggleSessionWarmup(session.id)} style={{color:isWarmup?WARM:FAINT,fontSize:'13px',lineHeight:1,padding:'0 2px'}} title={isWarmup?'Unmark warm-up':'Mark as warm-up'}>◔</button>
                  <button onClick={()=>moveSession(idx,-1)} disabled={idx===0} style={{color:idx===0?DIM:FAINT}}><ArrowUp className="w-3 h-3" strokeWidth={1.25}/></button>
                  <button onClick={()=>moveSession(idx,1)} disabled={idx===todaySessions.length-1} style={{color:idx===todaySessions.length-1?DIM:FAINT}}><ArrowDown className="w-3 h-3" strokeWidth={1.25}/></button>
                  <button onClick={()=>hideSession(session.id)} style={{color:FAINT}}><EyeOff className="w-3 h-3" strokeWidth={1.25}/></button>
                  <button onClick={()=>{setCollapsedSessions(prev=>{const next=new Set(prev);next.delete(session.id);return next;});setPickerSessionId(pickerSessionId===session.id?null:session.id);}} style={{color:FAINT}} title="Add piece from repertoire"><Plus className="w-3.5 h-3.5" strokeWidth={1.25}/></button>
                  <button onClick={()=>handleFilePlus(type,session)} style={{color:FAINT}} title="New repertoire item"><FilePlus className="w-3.5 h-3.5" strokeWidth={1.25}/></button>
                </span>
                {/* ── fixed columns shared with item rows ── */}
                <span className="font-mono tabular-nums" style={{width:'44px',textAlign:'right',fontSize:'11px',fontWeight:300,whiteSpace:'nowrap',letterSpacing:0,color:se?IKB:FAINT,textShadow:se?`0 0 6px ${IKB}70`:'none'}}>{fmtMin(sectionSec)}</span>
                <span style={{width:'56px',display:'inline-flex',alignItems:'baseline',whiteSpace:'nowrap',overflow:'hidden',letterSpacing:0,fontSize:'11px',fontWeight:300}}><TargetEdit target={st} onChange={(v)=>setSessionTarget(session.id,v)} small/></span>
                <span onClick={()=>toggleCollapsed(session.id)} style={{width:'20px',display:'inline-flex',justifyContent:'center',color:MUTED,cursor:'pointer'}}>{isCollapsed?<ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5}/>:<ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5}/>}</span>
              </div>
            </div>
            {!isCollapsed&&sessionItems.length===0&&pickerSessionId!==session.id&&<div className="px-2 py-3 text-xs italic" style={{color:FAINT,fontFamily:serif,borderBottom:`1px solid ${LINE}`}}>No pieces selected for this session.</div>}
            {itemsToShow.map(item=>{
              const isActiveWhole=activeItemId===item.id&&!activeSpotId&&activeSessionId===session.id;
              const isActiveAny=activeItemId===item.id&&activeSessionId===session.id;
              const expanded=expandedItemId===item.id;const time=getItemTime(itemTimes,item.id);
              const tnp=item.todayNote?item.todayNote.split('\n')[0].slice(0,90)+(item.todayNote.length>90?'…':''):'';
              const it=(session.itemTargets||{})[item.id]||null;const hasPdf=(item.pdfs||[]).length>0;const hasSpots=(item.spots||[]).length>0;
              const isEditingTime=editingTimeItemId===item.id;const asl=isActiveAny&&activeSpotId?(item.spots||[]).find(s=>s.id===activeSpotId)?.label:null;
              const perf=nextPerformance(item.performances);
              // When collapsed, show a compact active strip
              if(isCollapsed&&isActiveAny){return(<div key={`${session.id}-${item.id}`} style={{borderBottom:`1px solid ${LINE}`,background:IKB_SOFT}}><div className="py-2.5 px-2 flex items-center gap-4"><button onClick={e=>{e.stopPropagation();if(isActiveAny)stopItem();else startItem(item.id,null,session.id);}} className="shrink-0" style={{color:IKB,filter:`drop-shadow(0 0 6px ${IKB})`}}><Pause className="w-4 h-4" strokeWidth={1.25} fill="currentColor"/></button><span style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'15px',lineHeight:1.2,color:TEXT,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayTitle(item)}</span></div></div>);}
              return (<div key={`${session.id}-${item.id}`} data-today-item={item.id} style={{borderBottom:`1px solid ${LINE}`}}>
                <div onClick={()=>{if(!isEditingTime)setExpandedItemId(expanded?null:item.id);}} className="group py-2.5 px-2 flex items-center gap-4 cursor-pointer" style={{background:isActiveAny?IKB_SOFT:'transparent'}}>
                  <button onClick={e=>{e.stopPropagation();if(isActiveAny)stopItem();else startItem(item.id,null,session.id);}} disabled={dayClosed&&!isActiveAny} className="shrink-0" style={{color:isActiveWhole?IKB:(isActiveAny?MUTED:(dayClosed?FAINT:TEXT)),filter:isActiveWhole?`drop-shadow(0 0 6px ${IKB})`:'none',cursor:(dayClosed&&!isActiveAny)?'not-allowed':'pointer'}}>{isActiveAny?<Pause className="w-4 h-4" strokeWidth={1.25} fill="currentColor"/>:<Play className="w-4 h-4" strokeWidth={1.25} fill="currentColor"/>}</button>
                  {(()=>{const isPieceRec=pieceRecordingItemId===item.id;const blocked=(dayClosed&&!isPieceRec)||(pieceRecordingItemId&&!isPieceRec)||isRecording;return(<button onClick={e=>{e.stopPropagation();isPieceRec?stopPieceRecording():startPieceRecording(item.id,currentBpm,item.stage);}} disabled={!!blocked} className="shrink-0" title={isPieceRec?'Stop recording':'Record this piece'} style={{color:isPieceRec?REC:blocked?DIM:FAINT,cursor:blocked?'not-allowed':'pointer'}}>{isPieceRec?<Square className="w-3.5 h-3.5" strokeWidth={1.25} fill="currentColor" style={{animation:'pulse 1s infinite'}}/>:<Mic className="w-3.5 h-3.5" strokeWidth={1.25}/>}</button>);})()}
                  {refTrackMeta?.[item.id]&&(<button onClick={e=>{e.stopPropagation();setRefBarItemId(prev=>prev===item.id?null:item.id);}} className="shrink-0" title="Reference track" style={{color:refBarItemId===item.id?MUTED:FAINT,cursor:'pointer'}}><Music className="w-3.5 h-3.5" strokeWidth={1.25}/></button>)}
                  <div className="flex-1 min-w-0">
                    {/* Title + byline on one line */}
                    <div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      <span style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'15px',lineHeight:1.2}}>{displayTitle(item)}</span>
                      {formatByline(item)&&<span className="italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px',marginLeft:'6px'}}>{formatByline(item)}{item.catalog?` · ${item.catalog}`:''}{item.instrument?` · ${item.instrument}`:''}</span>}
                      {item.type==='piece'&&hasPdf&&<button onClick={e=>{e.stopPropagation();setPdfDrawerItemId(item.id);}} className="inline-flex items-center" style={{color:TEXT,padding:'0 2px',marginLeft:'4px',verticalAlign:'middle'}} title={`${item.pdfs.length} score${item.pdfs.length===1?'':'s'}`}><FileText className="w-3 h-3" strokeWidth={1.25}/></button>}
                      {perf&&<span style={{marginLeft:'4px',display:'inline-block',verticalAlign:'middle'}}><PerformanceChip perf={perf} compact/></span>}
                    </div>
                    {/* Secondary: active spot label, spots hint, note preview */}
                    {asl&&<div className="italic mt-0.5 flex items-center gap-1" style={{color:IKB,fontFamily:serif,fontSize:'11px'}}><Crosshair className="w-2.5 h-2.5" strokeWidth={1.25}/>{asl}</div>}
                    {hasSpots&&!asl&&!expanded&&<div className="flex items-center gap-1 mt-0.5" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}><Crosshair className="w-2.5 h-2.5" strokeWidth={1.25}/>{item.spots.length} SPOT{item.spots.length===1?'':'S'}</div>}
                    {tnp&&!expanded&&<div className="italic mt-0.5 truncate flex items-center gap-1.5" style={{color:MUTED,fontFamily:serif,fontSize:'11px'}}><MessageSquarePlus className="w-2.5 h-2.5 shrink-0" strokeWidth={1.25} style={{color:IKB}}/>{tnp}</div>}
                  </div>
                  {/* ── fixed columns matching section header ── */}
                  {isEditingTime?(
                    <div className="shrink-0" onClick={e=>e.stopPropagation()}><ItemTimeEditor seconds={getParentBucket(itemTimes,item.id)} onCommit={(v)=>{editItemTime(item.id,v);setEditingTimeItemId(null);}} onCancel={()=>setEditingTimeItemId(null)}/></div>
                  ):(
                    <div className="flex items-center gap-2 shrink-0" onClick={e=>e.stopPropagation()}>
                      {/* reserved X slot — always takes space, visible only for prescribed */}
                      <button onClick={e=>{e.stopPropagation();removeItemFromSession(session.id,item.id);}} style={{color:DIM,visibility:prescribed?'visible':'hidden'}} title="Remove from this session"><X className="w-3 h-3" strokeWidth={1.25}/></button>
                      {/* time col — click to edit */}
                      <span onClick={()=>{if(!dayClosed)setEditingTimeItemId(item.id);}} className="font-mono tabular-nums" style={{width:'44px',textAlign:'right',fontSize:'11px',fontWeight:300,whiteSpace:'nowrap',letterSpacing:0,cursor:dayClosed?'default':'pointer',color:(it&&time>=it*60)?IKB:time>0?MUTED:FAINT,textShadow:(it&&time>=it*60)?`0 0 6px ${IKB}70`:'none'}}>{time>0?fmt(time):'—'}</span>
                      {/* target col */}
                      <span style={{width:'56px',display:'inline-flex',alignItems:'baseline',whiteSpace:'nowrap',overflow:'hidden',letterSpacing:0,fontSize:'11px',fontWeight:300}}><TargetEdit target={it} onChange={(v)=>setItemTarget(session.id,item.id,v)} small/></span>
                      {/* chevron */}
                      <span style={{width:'20px',display:'inline-flex',justifyContent:'center',color:FAINT}}>{expanded?<ChevronUp className="w-3 h-3" strokeWidth={1.25}/>:<ChevronDown className="w-3 h-3" strokeWidth={1.25}/>}</span>
                    </div>
                  )}
                </div>
                {expanded&&(<div className="px-6 py-5 space-y-4" style={{background:SURFACE,borderTop:`1px solid ${LINE}`}}>
                  {quickAdd?.itemId===item.id&&(<div className="space-y-3 pb-4" style={{borderBottom:`1px solid ${LINE}`}}><input autoFocus value={item.title==='Untitled'?'':item.title} onChange={e=>updateItem(item.id,{title:e.target.value})} placeholder="Title" onKeyDown={e=>{if(e.key==='Escape')setQuickAdd(null);}} className="w-full focus:outline-none pb-0.5" style={{background:'transparent',color:TEXT,fontFamily:sans,fontWeight:300,fontSize:'15px',borderBottom:`1px solid ${LINE_MED}`}}/><input value={item.composer||''} onChange={e=>updateItem(item.id,{composer:e.target.value})} placeholder="Composer" onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setQuickAdd(null);}} className="w-full focus:outline-none pb-0.5" style={{background:'transparent',color:TEXT,fontFamily:sans,fontWeight:300,fontSize:'13px',borderBottom:`1px solid ${LINE_MED}`}}/><div className="flex justify-end"><button onClick={()=>setQuickAdd(null)} className="uppercase flex items-center gap-1.5 px-3 py-1" style={{color:IKB,border:`1px solid ${IKB}40`,background:IKB_SOFT,fontSize:'9px',letterSpacing:'0.22em'}}><Check className="w-3 h-3" strokeWidth={1.25}/> Done</button></div></div>)}
                  {/* Recording — shown first if present */}
                  {(()=>{const todayEntry=pieceRecordingMeta?.[item.id]?.[todayKey];if(!todayEntry)return null;const bkey=todayEntry.idbKey??`${item.id}__${todayKey}`;return(<Waveform key={todayEntry.ts} compact blobLoader={()=>idbGet('pieceRecordings',bkey)} meta={todayEntry}/>);})()}
                  <div><div className="uppercase mb-1.5 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em'}}><MessageSquarePlus className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/> Today</div><MarkdownField value={item.todayNote||''} onChange={v=>updateItem(item.id,{todayNote:v})} placeholder="What happened." minHeight={80} style={{background:SURFACE2,border:`1px solid ${IKB}40`}} showDeepLinkHint/></div>
                  {item.type==='piece'&&<SpotsBlock item={item} itemTimes={itemTimes} activeItemId={activeItemId} activeSpotId={activeSpotId} startItem={(id,sid)=>startItem(id,sid,session.id)} stopItem={stopItem} addSpot={addSpot} updateSpot={updateSpot} deleteSpot={deleteSpot} editSpotTime={editSpotTime} dayClosed={dayClosed}/>}
                  {item.referenceUrl&&(()=>{const embed=getEmbedInfo(item.referenceUrl);return(<div><div className="uppercase mb-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em'}}>Reference</div>{embed?.type==='youtube'?(<div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',background:SURFACE2,borderRadius:2}}><iframe src={embed.src} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}} allowFullScreen loading="lazy" title="Reference"/></div>):embed?.type==='spotify'?(<iframe src={embed.src} width="100%" height={embed.compact?152:352} style={{border:'none',borderRadius:2,display:'block'}} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Reference"/>):embed?.type==='apple'?(<iframe src={embed.src} width="100%" height={175} style={{border:'none',borderRadius:2,display:'block'}} allow="autoplay *; encrypted-media *; fullscreen *" loading="lazy" title="Reference"/>):(<a href={item.referenceUrl} target="_blank" rel="noopener noreferrer" className="uppercase flex items-center gap-1" style={{color:IKB,fontSize:'10px',letterSpacing:'0.22em'}}>Open reference ↗</a>)}</div>);})()}
                  <div><div className="uppercase mb-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em'}}>Notes <span style={{color:DIM,letterSpacing:'0.2em'}}>· persistent</span></div><MarkdownField value={item.detail||''} onChange={v=>updateItem(item.id,{detail:v})} placeholder="Long-running notes…" minHeight={80} style={{background:SURFACE2}} showDeepLinkHint/></div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <button onClick={()=>{setExpandedItemId(item.id);setView('repertoire');}} className="uppercase px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Edit in Repertoire</button>
                    <button onClick={()=>toggleWorking(item.id)} className="ml-auto px-3 py-1 uppercase" style={workingOn.includes(item.id)?{background:IKB,color:TEXT,border:`1px solid ${IKB}`,fontSize:'10px',letterSpacing:'0.22em'}:{background:'transparent',color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>{workingOn.includes(item.id)?'★ En cours':'Pin'}</button>
                  </div>
                </div>)}
              </div>);
            })}
            {!isCollapsed&&(<div className="relative py-3 px-2" style={{borderBottom:`1px solid ${LINE}`}}><button onClick={()=>setPickerSessionId(pickerSessionId===session.id?null:session.id)} className="uppercase flex items-center gap-1.5" style={{color:MUTED,fontFamily:sans,fontSize:'10px',letterSpacing:'0.22em'}}><Plus className="w-3 h-3" strokeWidth={1.25}/> Add piece for today</button>{pickerSessionId===session.id&&<ItemPickerPopup availableItems={getAvailableItems(session)} onPick={(id)=>addItemToSession(session.id,id)} onClose={()=>setPickerSessionId(null)}/>}</div>)}
          </div>);
        })}
        {hiddenTypes.length>0&&(<div className="relative py-4 flex items-center justify-center" style={{borderBottom:`1px solid ${LINE}`}}><button onClick={()=>setAddMenu(v=>!v)} className="uppercase flex items-center gap-2 italic" style={{color:MUTED,fontFamily:serif,fontSize:'13px'}}><Plus className="w-3 h-3" strokeWidth={1.25}/> Add session</button>{addMenu&&(<><div className="fixed inset-0 z-20" onClick={()=>setAddMenu(false)}/><div className="absolute top-full mt-2 z-30 min-w-48" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>{hiddenTypes.map(t=>(<button key={t} onClick={()=>{addSessionType(t);setAddMenu(false);}} className="w-full text-left px-4 py-2.5 uppercase" style={{fontSize:'10px',letterSpacing:'0.28em',borderBottom:`1px solid ${LINE}`}}>{SECTION_CONFIG[t].label}</button>))}</div></>)}</div>)}
      </div>
      <div className="mt-12 flex flex-col items-center gap-4">
        {dayClosed?(
          <button onClick={reopenDay} className="uppercase flex items-center gap-2 px-4 py-2.5" style={{color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,fontSize:'10px',letterSpacing:'0.28em'}}><Unlock className="w-3 h-3" strokeWidth={1.25}/> Reopen the day</button>
        ):confirmClose?(
          <div className="w-full max-w-sm" style={{border:`1px solid ${LINE_MED}`,background:SURFACE,padding:'20px 24px'}}>
            <div className="uppercase mb-2" style={{fontSize:'10px',letterSpacing:'0.28em',color:MUTED}}>Log today?</div>
            <p style={{fontFamily:serifText,fontStyle:'italic',fontWeight:300,fontSize:'14px',lineHeight:1.65,color:TEXT,marginBottom:'14px'}}>
              Today's session notes will be sent to each piece's log book, and the day will be locked. Practice timers cannot be edited after closing — you can reopen if needed.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={()=>setConfirmClose(false)} className="uppercase px-3 py-1.5" style={{color:FAINT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Cancel</button>
              <button onClick={()=>{setConfirmClose(false);endDay();}} className="uppercase flex items-center gap-1.5 px-3 py-1.5" style={{color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,fontSize:'10px',letterSpacing:'0.22em'}}><Lock className="w-3 h-3" strokeWidth={1.25}/> Log &amp; Close</button>
            </div>
          </div>
        ):(
          <button onClick={()=>setConfirmClose(true)} className="uppercase flex items-center gap-2 px-4 py-2.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'10px',letterSpacing:'0.28em'}} title="Finalize today and lock timer edits"><Lock className="w-3 h-3" strokeWidth={1.25}/> Close the day</button>
        )}
      </div>
      <div className="mt-16"><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Reflection</div><h3 className="text-4xl mb-6 leading-none" style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,letterSpacing:'-0.015em'}}>Journal du jour</h3><MarkdownField value={dailyReflection||''} onChange={setDailyReflection} placeholder="How today felt. What surprised you." minHeight={176} style={{background:SURFACE,fontSize:'16px'}} showDeepLinkHint/><div ref={reflectionRef}/></div>
    </div>
  );
}

// ── Mobile item row — extracted so useLongPress is called at component top-level
function MobileItemRow({item,session,activeItemId,activeSpotId,activeSessionId,itemTimes,dayClosed,startItem,stopItem,fmt,onLongPress,startPieceRecording,stopPieceRecording,pieceRecordingItemId,isRecording,pieceRecordingMeta,todayKey,setPdfDrawerItemId,handleStartRecording,updateItem,refTrackMeta}){
  const isActiveAny = activeItemId === item.id && activeSessionId === session.id;
  const isActiveWhole = isActiveAny && !activeSpotId;
  const time = getItemTime(itemTimes, item.id);
  const it = (session.itemTargets || {})[item.id] || null;
  const asl = isActiveAny && activeSpotId ? (item.spots||[]).find(s=>s.id===activeSpotId)?.label : null;
  const perf = nextPerformance(item.performances);
  const hasSpots = (item.spots||[]).length > 0;
  const timeColor = (it && time >= it*60) ? IKB : time > 0 ? MUTED : FAINT;
  const longPress = useLongPress(() => onLongPress({...item, sessionId: session.id, it}));
  const isPieceRec = pieceRecordingItemId === item.id;
  const recBlocked = (dayClosed && !isPieceRec) || (pieceRecordingItemId && !isPieceRec) || isRecording;
  const todayRecEntry = pieceRecordingMeta?.[item.id]?.[todayKey];
  const hasPdf = (item.pdfs||[]).length > 0;
  const hasRefTrack = !!(refTrackMeta?.[item.id]);
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{borderBottom:`1px solid ${LINE}`,background:isActiveAny?IKB_SOFT:'transparent'}}>
      {/* Main row — tapping the title area toggles expand */}
      <div {...longPress} style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'8px',minHeight:'44px',userSelect:'none',touchAction:'none'}}>
        {/* Play / pulse dot */}
        <button
          onClick={e=>{e.stopPropagation();isActiveAny?stopItem():startItem(item.id,null,session.id);}}
          disabled={dayClosed&&!isActiveAny}
          style={{flexShrink:0,minWidth:'20px',minHeight:'20px',display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'none',cursor:dayClosed&&!isActiveAny?'not-allowed':'pointer',padding:0}}
        >
          {isActiveWhole
            ? <div className="animate-pulse" style={{width:'8px',height:'8px',borderRadius:'999px',background:IKB,boxShadow:`0 0 6px ${IKB}`}}/>
            : <Play size={11} strokeWidth={1.25} style={{color:FAINT,opacity:dayClosed?0.4:0.7}}/>
          }
        </button>
        {/* Per-item record button */}
        <button
          onTouchStart={e=>e.stopPropagation()}
          onMouseDown={e=>e.stopPropagation()}
          onClick={e=>{e.stopPropagation();if(handleStartRecording){handleStartRecording('piece',item.id);}else if(isPieceRec){stopPieceRecording&&stopPieceRecording();}else{startPieceRecording&&startPieceRecording(item.id,null,item.stage);}}}
          disabled={!!recBlocked&&!handleStartRecording}
          aria-label={isPieceRec?'Stop recording':'Record'}
          style={{flexShrink:0,width:'26px',height:'26px',display:'flex',alignItems:'center',justifyContent:'center',background:isPieceRec?REC:'transparent',border:`1px solid ${isPieceRec?REC:LINE_STR}`,borderRadius:'999px',cursor:recBlocked&&!handleStartRecording?'not-allowed':'pointer',opacity:recBlocked&&!isPieceRec&&!handleStartRecording?0.35:1}}
        >
          {isPieceRec
            ? <Square size={8} strokeWidth={1.25} style={{color:BG}} fill={BG}/>
            : <Mic size={11} strokeWidth={1.25} style={{color:MUTED}}/>
          }
        </button>
        {/* Title + meta — tapping this area opens/closes expand */}
        <div
          style={{flex:1,minWidth:0,cursor:'pointer'}}
          onClick={e=>{e.stopPropagation();setExpanded(v=>!v);}}
        >
          <div style={{display:'flex',alignItems:'center',gap:'5px',minWidth:0}}>
            <span style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'17px',color:isActiveAny?TEXT:'rgba(212,206,195,0.9)',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,minWidth:0}}>
              {displayTitle(item)}
            </span>
            {hasPdf&&setPdfDrawerItemId&&(
              <button
                onTouchStart={e=>e.stopPropagation()}
                onMouseDown={e=>e.stopPropagation()}
                onClick={e=>{e.stopPropagation();setPdfDrawerItemId(item.id);}}
                style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'none',padding:'2px',cursor:'pointer'}}
              >
                <FileText size={12} strokeWidth={1.25} style={{color:FAINT}}/>
              </button>
            )}
          </div>
          {formatByline(item) && (
            <div style={{fontFamily:serifText,fontStyle:'italic',fontSize:'12px',color:FAINT,marginTop:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {formatByline(item)}
            </div>
          )}
          {(hasSpots || perf || asl) && (
            <div style={{marginTop:'4px',display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
              {asl && <span style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:IKB}}>{asl}</span>}
              {hasSpots && !asl && <span style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:FAINT}}>{item.spots.length} spot{item.spots.length===1?'':'s'}</span>}
              {perf && <span style={{marginLeft:'auto'}}><PerformanceChip perf={perf} compact/></span>}
            </div>
          )}
        </div>
        {/* Time + target + chevron */}
        <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:'4px'}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:mono,fontSize:'12px',color:timeColor}}>{time>0?fmt(time):'—'}</div>
            {it && <div style={{fontFamily:mono,fontSize:'9px',color:FAINT,marginTop:'2px'}}>/ {it}′</div>}
          </div>
          <button
            onTouchStart={e=>e.stopPropagation()}
            onMouseDown={e=>e.stopPropagation()}
            onClick={e=>{e.stopPropagation();setExpanded(v=>!v);}}
            style={{flexShrink:0,width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'none',cursor:'pointer',padding:0}}
          >
            <ChevronDown size={12} strokeWidth={1.5} style={{color:FAINT,transform:expanded?'rotate(180deg)':'rotate(0deg)',transition:'transform 150ms ease'}}/>
          </button>
        </div>
      </div>
      {/* Expand panel */}
      {expanded&&(
        <div style={{padding:'12px 16px 16px',background:SURFACE,borderTop:`1px solid ${LINE}`,display:'flex',flexDirection:'column',gap:'14px'}}>
          {/* Reference track — inline waveform */}
          {hasRefTrack&&(
            <div>
              <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans,marginBottom:'6px'}}>Reference</div>
              <Waveform
                blobLoader={()=>idbGet('refTracks',item.id)}
                meta={refTrackMeta[item.id]}
                compact
                accentColor={MUTED}
                accentSoft="rgba(200,193,179,0.12)"
              />
            </div>
          )}
          {/* Today's recording waveform */}
          {todayRecEntry&&(()=>{
            const bkey=todayRecEntry.idbKey??`${item.id}__${todayKey}`;
            return(
              <div>
                <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans,marginBottom:'6px'}}>Recording · today</div>
                <Waveform key={todayRecEntry.ts} compact blobLoader={()=>idbGet('pieceRecordings',bkey)} meta={todayRecEntry}/>
              </div>
            );
          })()}
          {/* Today's note */}
          {updateItem&&(
            <div>
              <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans,marginBottom:'6px'}}>Today</div>
              <MarkdownField
                value={item.todayNote||''}
                onChange={v=>updateItem(item.id,{todayNote:v})}
                placeholder="What happened."
                minHeight={60}
                style={{background:SURFACE2,border:`1px solid ${IKB}40`,fontSize:'13px'}}
              />
            </div>
          )}
          {/* Persistent notes */}
          {updateItem&&(
            <div>
              <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans,marginBottom:'6px'}}>Notes <span style={{color:DIM,letterSpacing:'0.2em'}}>· persistent</span></div>
              <MarkdownField
                value={item.detail||''}
                onChange={v=>updateItem(item.id,{detail:v})}
                placeholder="Long-running notes…"
                minHeight={60}
                style={{background:SURFACE2,border:`1px solid ${LINE}`,fontSize:'13px'}}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mobile accordion component ─────────────────────────────────────────────
function TodayMobile(p){
  const {
    items,setView,todaySessions,activeItemId,activeSpotId,activeSessionId,
    itemTimes,startItem,stopItem,updateItem,addItem,dayClosed,reopenDay,endDay,
    dailyReflection,setDailyReflection,settings,effectiveTotalToday,
    warmupTimeToday,restToday,fmt,fmtMin,reflectionRef,
    addItemToSession,removeItemFromSession,addSessionType,
    sectionTimes,startPieceRecording,stopPieceRecording,pieceRecordingItemId,
    pieceRecordingMeta,isRecording,currentBpm,
    getSessionItems,getAvailableItems,warmupMin,effectiveMin,
    effectiveDailyTarget,hiddenTypes,collapsedSessions,setCollapsedSessions,
    toggleCollapsed,handleFilePlus,addSpot,updateSpot,deleteSpot,editSpotTime,
    routines,loadedRoutine,loadRoutine,resetToFree,setPromptModal,saveRoutine,setItemTarget,
    handleStartRecording,
  } = p;
  const [actionSheetItem, setActionSheetItem] = useState(null);
  const [routineMenuOpen, setRoutineMenuOpen] = useState(false);

  const today = new Date();
  const todayKey = todayDateStr();
  const [openSections, setOpenSections] = useState(() => {
    const open = new Set();
    // Open section containing active item, else open 'piece' by default
    let found = false;
    todaySessions.forEach(s => {
      const sItems = getSessionItems(s);
      if(sItems.some(it => it.id === activeItemId)){ open.add(s.id); found = true; }
    });
    if(!found){
      const pieceSession = todaySessions.find(s => s.type === 'piece');
      if(pieceSession) open.add(pieceSession.id);
      else if(todaySessions[0]) open.add(todaySessions[0].id);
    }
    return open;
  });
  const [reflOpen, setReflOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [pickerSessionId, setPickerSessionId] = useState(null);

  // Auto-open section when active item changes
  useEffect(() => {
    if(!activeItemId) return;
    todaySessions.forEach(s => {
      const sItems = getSessionItems(s);
      if(sItems.some(it => it.id === activeItemId)){
        setOpenSections(prev => { const n = new Set(prev); n.add(s.id); return n; });
      }
    });
  }, [activeItemId]);

  const toggleSection = (id) => setOpenSections(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const totalMin = Math.floor(effectiveTotalToday / 60);
  const target = effectiveDailyTarget;
  const pct = target ? Math.min(100, (totalMin / target) * 100) : 0;

  return (
    <div style={{paddingBottom:'calc(var(--footer-height,160px) + 24px)',paddingTop:'8px',touchAction:'pan-y'}}>
      {/* Day closed banner */}
      {dayClosed && (
        <div style={{padding:'12px 16px',background:IKB_SOFT,borderBottom:`1px solid ${IKB}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <Lock size={14} strokeWidth={1.25} style={{color:IKB,flexShrink:0}}/>
            <span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em',color:TEXT}}>Day closed</span>
          </div>
          <button onClick={reopenDay} className="uppercase" style={{color:IKB,fontSize:'9px',letterSpacing:'0.22em',border:`1px solid ${IKB}`,padding:'4px 10px'}}>Reopen</button>
        </div>
      )}

      {/* Date header */}
      <div style={{padding:'16px 20px 8px'}}>
        {/* Eyebrow row: DAY · DATE on left, Load Routine on right */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
          <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans}}>
            {today.toLocaleDateString('en-US',{weekday:'long'}).toUpperCase()}
            {' · '}
            {today.toLocaleDateString('en-US',{month:'long',day:'numeric'}).toUpperCase()}
          </div>
          {/* Load routine */}
          <div style={{position:'relative'}}>
            <button
              onClick={()=>setRoutineMenuOpen(v=>!v)}
              style={{display:'flex',alignItems:'center',gap:'4px',background:'none',border:'none',padding:'4px 0',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:loadedRoutine?IKB:FAINT,cursor:'pointer',minHeight:'44px'}}
            >
              <Bookmark size={9} strokeWidth={1.5}/>
              {loadedRoutine ? loadedRoutine.name : 'Load Routine'}
              <ChevronDown size={8} strokeWidth={1.5}/>
            </button>
            {routineMenuOpen && (
              <>
                <div style={{position:'fixed',inset:0,zIndex:Z_SHEET-1}} onClick={()=>setRoutineMenuOpen(false)}/>
                <div style={{position:'absolute',right:0,top:'100%',zIndex:Z_SHEET,background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)',minWidth:'200px',maxHeight:'320px',overflowY:'auto'}}>
                  {routines.length===0 && <div style={{padding:'12px 16px',fontFamily:serif,fontStyle:'italic',fontSize:'13px',color:FAINT}}>No routines yet.</div>}
                  {routines.map(r=>(
                    <button key={r.id} onClick={()=>{loadRoutine(r);setRoutineMenuOpen(false);}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 16px',background:loadedRoutine?.id===r.id?IKB_SOFT:'transparent',border:'none',borderBottom:`1px solid ${LINE}`,cursor:'pointer'}}>
                      <div style={{fontFamily:serif,fontStyle:'italic',fontWeight:300,color:loadedRoutine?.id===r.id?IKB:TEXT,fontSize:'14px'}}>{r.name}</div>
                    </button>
                  ))}
                  {loadedRoutine && (
                    <button onClick={()=>{resetToFree();setRoutineMenuOpen(false);}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 16px',background:'transparent',border:'none',borderTop:`1px solid ${LINE_STR}`,cursor:'pointer',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:MUTED}}>Unload routine</button>
                  )}
                  {setPromptModal && (
                    <button onClick={()=>{setRoutineMenuOpen(false);setPromptModal({title:'Save current arrangement as routine',placeholder:'Name',onConfirm:(name)=>{if(name?.trim())saveRoutine(name.trim());}});}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 16px',background:'transparent',border:'none',borderTop:`1px solid ${LINE}`,cursor:'pointer',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:IKB}}>Save current as…</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {/* "Today" display heading */}
        <div style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,fontSize:'clamp(48px,13vw,56px)',letterSpacing:'-0.02em',lineHeight:1,color:TEXT,paddingBottom:'12px'}}>
          Today
        </div>
      </div>

      {/* Target progress bar */}
      <div style={{padding:'14px 20px',borderTop:`1px solid ${LINE_STR}`,borderBottom:`1px solid ${LINE}`,margin:'0 0 0 0'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
          <span className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em',fontFamily:sans}}>Target</span>
          <span style={{fontFamily:mono,fontSize:'11px',color:MUTED}}>
            {totalMin} / {target}′
            {restToday > 0 && <span style={{color:FAINT,fontSize:'9px',marginLeft:'6px'}}>· rest {Math.floor(restToday/60)}′</span>}
          </span>
        </div>
        <div style={{height:'3px',background:LINE,borderRadius:'1px',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:IKB,borderRadius:'1px',transition:'width 0.4s ease'}}/>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div style={{margin:'24px 20px',padding:'24px',border:`1px dashed ${LINE_STR}`,textAlign:'center'}}>
          <div style={{fontFamily:serif,fontStyle:'italic',fontSize:'16px',color:MUTED,marginBottom:'8px'}}>Start here.</div>
          <div style={{fontSize:'12px',color:FAINT,lineHeight:1.7}}>
            Add a piece in <button onClick={()=>setView('repertoire')} style={{color:IKB,textDecoration:'underline',cursor:'pointer'}}>Répertoire</button>
          </div>
        </div>
      )}

      {/* Accordion sections */}
      {todaySessions.map(session => {
        const sessionItems = getSessionItems(session);
        const sectionSec = sectionTimes[session.type] || 0;
        const isOpen = openSections.has(session.id);
        const isWarmup = !!session.isWarmup;
        const chevronStyle = {
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 200ms cubic-bezier(0.2,0.7,0.2,1)',
          flexShrink: 0,
        };

        return (
          <div key={session.id}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(session.id)}
              style={{
                display:'flex',alignItems:'center',width:'100%',padding:'0 20px',
                minHeight:'52px',borderBottom:`1px solid ${isOpen ? LINE_STR : LINE}`,
                background:'transparent',border:'none',
                borderBottomWidth:'1px',borderBottomStyle:'solid',
                borderBottomColor: isOpen ? LINE_STR : LINE,
                cursor:'pointer',textAlign:'left',gap:'10px',
              }}
            >
              <ChevronRight size={11} strokeWidth={1.5} style={{...chevronStyle,color:DIM}}/>
              <span className="uppercase" style={{fontFamily:sans,fontSize:'10px',fontWeight:500,letterSpacing:'0.28em',color:MUTED,flex:1,textAlign:'left'}}>
                {SECTION_CONFIG[session.type].label}
                {isWarmup && <span style={{color:WARM,marginLeft:'4px'}}>◔</span>}
                {!isOpen && sessionItems.length > 0 && (
                  <span style={{color:FAINT,fontSize:'9px',letterSpacing:'0.15em',marginLeft:'6px'}}>· {sessionItems.length}</span>
                )}
              </span>
              <span style={{fontFamily:mono,fontSize:'11px',color:MUTED}}>{fmtMin(sectionSec)}</span>
            </button>

            {/* Section items */}
            {isOpen && (
              <div>
                {sessionItems.length === 0 && (
                  <div style={{padding:'12px 20px',fontFamily:serif,fontStyle:'italic',fontSize:'13px',color:FAINT,borderBottom:`1px solid ${LINE}`}}>
                    No pieces selected.
                  </div>
                )}
                {sessionItems.map(item => (
                  <MobileItemRow
                    key={item.id}
                    item={item}
                    session={session}
                    activeItemId={activeItemId}
                    activeSpotId={activeSpotId}
                    activeSessionId={activeSessionId}
                    itemTimes={itemTimes}
                    dayClosed={dayClosed}
                    startItem={startItem}
                    stopItem={stopItem}
                    fmt={fmt}
                    onLongPress={setActionSheetItem}
                    startPieceRecording={startPieceRecording}
                    stopPieceRecording={stopPieceRecording}
                    pieceRecordingItemId={pieceRecordingItemId}
                    isRecording={isRecording}
                    pieceRecordingMeta={pieceRecordingMeta}
                    todayKey={todayKey}
                    setPdfDrawerItemId={p.setPdfDrawerItemId}
                    handleStartRecording={handleStartRecording}
                    updateItem={p.updateItem}
                    refTrackMeta={p.refTrackMeta}
                  />
                ))}

                {/* Quick add row */}
                <div style={{padding:'10px 20px',borderBottom:`1px solid ${LINE}`,display:'flex',alignItems:'center',gap:'8px',minHeight:'44px'}}>
                  <button
                    onClick={()=>setPickerSessionId(pickerSessionId===session.id?null:session.id)}
                    style={{display:'flex',alignItems:'center',gap:'6px',background:'transparent',border:'none',cursor:'pointer',padding:0}}
                  >
                    <Plus size={11} strokeWidth={1.25} style={{color:FAINT}}/>
                    <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',fontWeight:500,letterSpacing:'0.22em',color:FAINT}}>
                      Add to {SECTION_CONFIG[session.type].label}
                    </span>
                  </button>
                  {pickerSessionId===session.id && (
                    <ItemPickerPopup
                      availableItems={getAvailableItems(session)}
                      onPick={id=>{addItemToSession(session.id,id);setPickerSessionId(null);}}
                      onClose={()=>setPickerSessionId(null)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Reflection block */}
      <div style={{borderTop:`1px solid ${LINE}`,marginTop:'8px'}}>
        <button
          onClick={()=>setReflOpen(v=>!v)}
          style={{display:'flex',alignItems:'center',width:'100%',padding:'0 20px',minHeight:'52px',background:'transparent',border:'none',cursor:'pointer',gap:'10px'}}
        >
          <ChevronRight size={11} strokeWidth={1.5} style={{transform:reflOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform 200ms cubic-bezier(0.2,0.7,0.2,1)',color:DIM,flexShrink:0}}/>
          <span className="uppercase" style={{fontFamily:sans,fontSize:'10px',fontWeight:500,letterSpacing:'0.28em',color:MUTED,flex:1,textAlign:'left'}}>Reflection</span>
          <span style={{fontFamily:serif,fontStyle:'italic',fontSize:'14px',color:FAINT}}>Journal du jour</span>
          <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',color:(dailyReflection||'').trim()?IKB:FAINT}}>
            {(dailyReflection||'').trim()?'Saved':'Empty'}
          </span>
        </button>
        {reflOpen && (
          <div style={{padding:'0 20px 20px'}}>
            <MarkdownField
              value={dailyReflection||''}
              onChange={setDailyReflection}
              placeholder="How today felt. What surprised you."
              minHeight={100}
              style={{background:SURFACE2,border:`1px solid ${LINE}`,fontSize:'14px'}}
              showDeepLinkHint
            />
          </div>
        )}
      </div>

      {/* Action sheet (long-press on item row) */}
      {actionSheetItem && (
        <>
          <div onClick={()=>setActionSheetItem(null)} style={{position:'fixed',inset:0,background:'rgba(11,10,8,0.6)',zIndex:Z_SHEET-1}}/>
          <div style={{position:'fixed',bottom:0,left:0,right:0,background:BG,borderTop:`1px solid ${LINE_STR}`,borderRadius:'12px 12px 0 0',zIndex:Z_SHEET,paddingBottom:'env(safe-area-inset-bottom,16px)'}}>
            <div style={{width:'36px',height:'3px',background:LINE_STR,borderRadius:'999px',margin:'12px auto 0'}}/>
            {/* Item name header */}
            <div style={{padding:'16px 24px 12px',borderBottom:`1px solid ${LINE}`,fontFamily:serifText,fontStyle:'italic',fontSize:'15px',color:TEXT}}>{displayTitle(actionSheetItem)}</div>
            {/* Set target */}
            <div style={{padding:'16px 24px',borderBottom:`1px solid ${LINE}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',letterSpacing:'0.28em',color:FAINT}}>Target</span>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input
                  type="number" min={0} max={300}
                  value={actionSheetItem.it ?? ''}
                  onChange={e=>{const val=parseInt(e.target.value,10)||null;setItemTarget&&setItemTarget(actionSheetItem.sessionId,actionSheetItem.id,val||null);setActionSheetItem(prev=>({...prev,it:val}));}}
                  style={{width:'48px',textAlign:'right',background:'transparent',border:'none',borderBottom:`1px solid ${LINE_MED}`,fontFamily:mono,fontSize:'14px',color:TEXT,outline:'none',padding:'2px 0'}}
                />
                <span className="uppercase" style={{fontFamily:sans,fontSize:'9px',color:FAINT}}>min</span>
              </div>
            </div>
            {/* Remove from today */}
            <button onClick={()=>{removeItemFromSession(actionSheetItem.sessionId,actionSheetItem.id);setActionSheetItem(null);}} style={{width:'100%',padding:'16px 24px',background:'none',border:'none',textAlign:'left',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase',color:FAINT,cursor:'pointer'}}>
              Remove from today
            </button>
          </div>
        </>
      )}

      {/* Close the day pill */}
      <div style={{margin:'32px 0 24px',display:'flex',justifyContent:'center'}}>
        {dayClosed ? (
          <button onClick={reopenDay} className="uppercase" style={{display:'flex',alignItems:'center',gap:'6px',color:IKB,border:`1px solid ${IKB}`,background:IKB_SOFT,padding:'8px 18px',fontSize:'9px',letterSpacing:'0.28em'}}>
            <Unlock size={12} strokeWidth={1.25}/> Reopen the day
          </button>
        ) : confirmClose ? (
          <div style={{width:'100%',maxWidth:'320px',background:SURFACE,border:`1px solid ${LINE_MED}`,padding:'16px 20px',margin:'0 20px'}}>
            <div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em',color:MUTED,marginBottom:'8px'}}>Log today?</div>
            <p style={{fontFamily:serifText,fontStyle:'italic',fontSize:'13px',lineHeight:1.65,color:TEXT,marginBottom:'14px'}}>
              Today's notes go to each piece's log book and the day locks. Reopen any time.
            </p>
            <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
              <button onClick={()=>setConfirmClose(false)} className="uppercase" style={{color:FAINT,border:`1px solid ${LINE_STR}`,padding:'6px 12px',fontSize:'10px',letterSpacing:'0.22em'}}>Cancel</button>
              <button onClick={()=>{setConfirmClose(false);endDay();}} className="uppercase" style={{display:'flex',alignItems:'center',gap:'6px',color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,padding:'6px 12px',fontSize:'10px',letterSpacing:'0.22em'}}>
                <Lock size={11} strokeWidth={1.25}/> Log & Close
              </button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setConfirmClose(true)} className="uppercase" style={{display:'flex',alignItems:'center',gap:'6px',color:MUTED,border:`1px solid ${LINE_MED}`,padding:'8px 18px',fontSize:'9px',letterSpacing:'0.28em'}}>
            <Lock size={12} strokeWidth={1.25}/> Close the day
          </button>
        )}
      </div>
      <div ref={reflectionRef}/>
    </div>
  );
}
