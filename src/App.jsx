import React,{useState,useEffect,useCallback,useRef,Suspense,lazy} from 'react';
import useViewport from './hooks/useViewport.js';
import TopBar from './components/TopBar.jsx';
import Drawer from './components/Drawer.jsx';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Square from 'lucide-react/dist/esm/icons/square';
import Coffee from 'lucide-react/dist/esm/icons/coffee';
import Crosshair from 'lucide-react/dist/esm/icons/crosshair';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Waves from 'lucide-react/dist/esm/icons/waves';
import Archive from 'lucide-react/dist/esm/icons/archive';
import UploadIcon from 'lucide-react/dist/esm/icons/upload';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Keyboard from 'lucide-react/dist/esm/icons/keyboard';

import {BG,SURFACE,TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,WARM,serif,serifText,sans,mono} from './constants/theme.js';
import {SECTION_CONFIG,APP_VERSION} from './constants/config.js';
import {getItemTime,displayTitle,formatByline} from './lib/items.js';
import {resolveWikiLink} from './lib/notes.js';
import {DisplayHeader,Ring,StageLabels,Waveform,ItemPickerPopup,TargetEdit,TimeWithTarget,ItemTimeEditor,fmtSpotTime,PerformanceChip,SpotRow,SpotsBlock,Tooltip} from './components/shared.jsx';
import {idbGet} from './lib/storage.js';
import TodayView from './views/TodayView.jsx';
import ReviewView from './views/ReviewView.jsx';
import RepertoireView from './views/RepertoireView.jsx';
import RoutinesView from './views/RoutinesView.jsx';
import {LogsView,LogDrawer} from './views/LogsView.jsx';
import NotesView from './views/NotesView.jsx';
import ProgramsView from './views/ProgramsView.jsx';
import Footer from './components/Footer.jsx';
import UndoToast from './components/UndoToast.jsx';
import UpdatePrompt from './components/UpdatePrompt.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import {SettingsModal,ConfirmModal,PromptModal,SyncConflictModal,DriveConflictModal} from './components/modals.jsx';
const PdfDrawer = lazy(() => import('./components/PdfDrawer.jsx'));
import useEtudesState from './state/useEtudesState.js';
import {seedAll, clearAll} from './dev/DevToolsBar.jsx';

const tabs=[{id:'today',label:'Today'},{id:'review',label:'Review'},{id:'repertoire',label:'Répertoire'},{id:'routines',label:'Routines'},{id:'logs',label:'Logs'},{id:'notes',label:'Notes'},{id:'programs',label:'Programs'}];

export default function Etudes(){
  const {isMobile}=useViewport();
  const s=useEtudesState();
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [selectedProgramId,setSelectedProgramId]=useState(null);
  const [requestedNoteId,setRequestedNoteId]=useState(null);
  const [clockTime,setClockTime]=useState(()=>{const n=new Date();return`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;});
  useEffect(()=>{const tick=()=>{const n=new Date();setClockTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);};const id=setInterval(tick,10000);return()=>clearInterval(id);},[]);
  const mainScrollRef=useRef(null);
  const scrollToTop=()=>mainScrollRef.current?.scrollTo({top:0,behavior:'smooth'});
  const [refBarVisible,setRefBarVisible]=useState(false);
  const [refBarSpeed,setRefBarSpeed]=useState(1.0);
  useEffect(()=>{if(s.refBarItemId){setRefBarSpeed(1.0);const id=requestAnimationFrame(()=>setRefBarVisible(true));return()=>cancelAnimationFrame(id);}else{setRefBarVisible(false);};},[s.refBarItemId]);
  const closeRefBar=()=>{setRefBarVisible(false);setTimeout(()=>s.setRefBarItemId(null),280);};
  const {view,setView,showSettings,setShowSettings,settingsInitialTab,openSettings,exportMenu,setExportMenu,confirmModal,setConfirmModal,promptModal,setPromptModal,syncConflictModal,driveConflictModal,quickNoteOpen,setQuickNoteOpen,restoreBusy,expandedItemId,setExpandedItemId,pdfDrawerItemId,setPdfDrawerItemId,logDrawerDate,logDrawerEntry,editingTimeItemId,setEditingTimeItemId,dragIdx,dragOverIdx,storageMode,storageQuotaHit,setStorageQuotaHit,items,itemTimes,warmupTimeToday,restToday,workingOn,todaySessions,setTodaySessions,loadedRoutineId,routines,setRoutines,programs,setPrograms,dailyReflection,setDailyReflection,weekReflection,setWeekReflection,monthReflection,setMonthReflection,settings,setSettings,freeNotes,setFreeNotes,noteCategories,setNoteCategories,recordingMeta,history,dayClosed,dayJustRolled,setDayJustRolled,trash,activeItemId,activeSpotId,activeSessionId,activeItem,activeSpot,activeIsWarmup,isResting,isRecording,recExpanded,setRecExpanded,metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,sessionRefs,reflectionRef,importInputRef,totalToday,effectiveTotalToday,sectionTimes,weekActualSeconds,monthActualSeconds,todayKey,pdfItem,loadedRoutine,todayHistoryEntry,fmt,fmtMin,updateItem,addItem,startItem,stopItem,toggleWorking,toggleRest,editItemTime,editSpotTime,addSpot,updateSpot,deleteSpot,moveSpot,addPerformance,updatePerformance,deletePerformance,closeDay,reopenDay,endDay,deleteItem,undoDelete,dismissTrash,logTempo,addQuickNote,pdfLibrary,pdfUrlMap,addPdfToItem,attachLibraryPdf,removePdfFromItem,renamePdf,setDefaultPdf,setPdfPageRange,addBookmark,removeBookmark,renameBookmark,startRecording,stopRecording,deleteRecording,handleDragStart,handleDragOver,handleDrop,handleDragEnd,moveSession,hideSession,addSessionType,toggleSessionWarmup,removeItemFromSession,addItemToSession,setSessionTarget,setItemTarget,loadRoutine,resetToFree,saveRoutine,updateLoadedRoutine,openLogEntry,closeLogDrawer,resolveDayEntry,exportJson,importJsonFile,buildZip,exportProgress,handleTap,addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry,saveFreeNote,seedTestNotes,maybePullDriveOnSyncTab,connectDrive,disconnectDrive,backupDriveNow,restoreFromDrive,driveBackgroundError,setDriveBackgroundError,driveBlobRestoreProgress,driveBlobFailedCount}=s;

  // ── Recording soft mutex ──────────────────────────────────────────────────
  const [mutexPrompt,setMutexPrompt]=useState(null); // null | {to:'piece'|'daily', toId:string|null}

  const handleStartRecording=(type,itemId)=>{
    if(type==='piece'){
      if(s.pieceRecordingItemId===itemId){s.stopPieceRecording();return;}
      if(s.pieceRecordingItemId||isRecording){setMutexPrompt({to:'piece',toId:itemId});return;}
      s.startPieceRecording(itemId,metronome.bpm,items.find(i=>i.id===itemId)?.stage);
    }else{
      if(isRecording){stopRecording();return;}
      if(s.pieceRecordingItemId){setMutexPrompt({to:'daily',toId:null});return;}
      startRecording();
    }
  };

  const confirmMutex=()=>{
    if(!mutexPrompt)return;
    if(s.pieceRecordingItemId)s.stopPieceRecording();
    if(isRecording)stopRecording();
    const {to,toId}=mutexPrompt;
    setMutexPrompt(null);
    // slight delay so stop has time to flush before new start
    setTimeout(()=>{
      if(to==='piece'&&toId)s.startPieceRecording(toId,metronome.bpm,items.find(i=>i.id===toId)?.stage);
      else if(to==='daily')startRecording();
    },80);
  };

  const handleWikiLinkClick=useCallback((rawText)=>{
    const resolved=resolveWikiLink(rawText,items,history,programs,freeNotes);
    if(!resolved)return;
    if(resolved.type==='day'){
      const entry=history.find(h=>(h.kind==='day'||!h.kind)&&h.date===resolved.target);
      if(entry&&openLogEntry)openLogEntry(entry);
    }else if(resolved.type==='item'){
      setExpandedItemId(resolved.target);
      setView('repertoire');
    }else if(resolved.type==='spot'){
      setExpandedItemId(resolved.target.itemId);
      setView('repertoire');
    }else if(resolved.type==='program'){
      setSelectedProgramId(resolved.target);
      setView('programs');
    }else if(resolved.type==='note'){
      setRequestedNoteId(resolved.target);
      setView('notes');
    }
  },[items,history,programs,freeNotes,openLogEntry,setExpandedItemId,setView,setSelectedProgramId,setRequestedNoteId]);

  const wikiCompletionData={items,history,programs,notes:freeNotes};
  const commonProps={items,history,settings,itemTimes,fmt,fmtMin,recordingMeta,onWikiLinkClick:handleWikiLinkClick,wikiCompletionData};

  return (
    <div className="h-screen flex flex-col" style={{background:BG,color:TEXT,fontFamily:sans}}>
      <style>{`.etudes-scroll::-webkit-scrollbar{height:4px;width:4px}.etudes-scroll::-webkit-scrollbar-track{background:transparent}.etudes-scroll::-webkit-scrollbar-thumb{background:rgba(244,238,227,0.15);border-radius:0}.etudes-scroll::-webkit-scrollbar-thumb:hover{background:rgba(244,238,227,0.32)}.etudes-scroll{scrollbar-width:thin;scrollbar-color:rgba(244,238,227,0.15) transparent}.drag-ghost{opacity:0.35}.target-hover-reveal{opacity:0;transition:opacity 0.15s}.group:hover .target-hover-reveal{opacity:1}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}.toast-enter{animation:slideUp 0.25s ease-out}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield;appearance:textfield}`}</style>
      {storageQuotaHit&&(<div className="shrink-0 px-10 py-2 flex items-center gap-3" style={{background:'#3D1A00',borderBottom:`1px solid rgba(201,126,74,0.4)`}}><span style={{color:WARM,fontSize:'11px',letterSpacing:'0.12em'}}>⚠ Storage full — new data is kept in memory only and will be lost when the tab closes. Export a backup to preserve your session.</span><button onClick={()=>setStorageQuotaHit(false)} style={{color:WARM,marginLeft:'auto',opacity:0.7,fontSize:'11px'}}>✕</button></div>)}
      {/* Mobile: TopBar is fixed-position, input hidden separately */}
      {isMobile&&<TopBar onMenu={()=>setDrawerOpen(true)} activeItemId={activeItemId} onSettings={()=>openSettings()} onScrollToTop={scrollToTop}/>}
      {isMobile&&<input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importJsonFile(f);e.target.value='';}}/>}
      <header className="shrink-0" style={isMobile?{display:'none'}:{borderBottom:`1px solid ${LINE_MED}`}}>
        {isMobile?null:(
          <>
          <div className="flex items-center px-10 h-16">
            <div className="flex items-baseline gap-3"><div className="w-1.5 h-1.5 rounded-full" style={{background:IKB}}/><span className="text-3xl tracking-tight" style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,letterSpacing:'-0.01em'}}>Études</span><span className="text-xs uppercase tracking-widest ml-2" style={{color:FAINT,fontWeight:300,fontSize:'10px',letterSpacing:'0.28em'}}>a practice journal</span></div>
            <div className="ml-auto flex items-center gap-5 relative">
              <span className="tabular-nums" style={{fontFamily:mono,color:MUTED,fontSize:'13px',letterSpacing:'0.04em'}}>{clockTime}</span>
              <Tooltip shortcut="?" label="Réglages"><button onClick={()=>openSettings()} className="uppercase flex items-center gap-2 transition" style={{color:MUTED,fontSize:'10px',letterSpacing:'0.25em'}}><Settings className="w-3 h-3" strokeWidth={1.25}/> Réglages</button></Tooltip>
              <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importJsonFile(f);e.target.value='';}}/>
            </div>
          </div>
          {storageMode==='memory'&&(<div className="px-10 py-2 flex items-center justify-center" style={{borderTop:`1px dashed ${LINE_MED}`,background:SURFACE}}><span className="uppercase tabular-nums" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.28em'}}>Storage unavailable · this session will not be saved</span></div>)}
          <nav className="flex px-10" style={{borderTop:`1px solid ${LINE}`}}>
            {tabs.map(t=>(<button key={t.id} onClick={()=>setView(t.id)} className="relative py-3.5 mr-10 uppercase transition" style={{color:view===t.id?TEXT:FAINT,fontWeight:400,fontSize:'10px',letterSpacing:'0.28em'}}>{t.label}{view===t.id&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}</button>))}
          </nav>
          </>
        )}
      </header>
      {isMobile&&storageMode==='memory'&&(<div className="shrink-0 px-4 py-1.5 flex items-center justify-center" style={{background:SURFACE,borderBottom:`1px dashed ${LINE_MED}`}}><span className="uppercase tabular-nums" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.28em'}}>Storage unavailable · session will not be saved</span></div>)}
      <div className="flex-1 flex overflow-hidden">
        <main ref={mainScrollRef} className="flex-1 overflow-auto etudes-scroll" style={isMobile?{paddingTop:'calc(44px + env(safe-area-inset-top, 0px))',overscrollBehavior:'contain'}:{overscrollBehavior:'contain'}}>
          <ErrorBoundary onExport={exportJson}>
          {view==='today'&&<TodayView {...{...commonProps,view,setView,todaySessions,setTodaySessions,moveSession,hideSession,addSessionType,toggleSessionWarmup,removeItemFromSession,addItemToSession,setSessionTarget,setItemTarget,routines,loadedRoutine,loadRoutine,resetToFree,saveRoutine,updateLoadedRoutine,sectionTimes,activeItemId,activeSpotId,activeSessionId,expandedItemId,setExpandedItemId,startItem,stopItem,updateItem,deleteItem,addItem,workingOn,toggleWorking,setPdfDrawerItemId,dailyReflection,setDailyReflection,totalToday,effectiveTotalToday,warmupTimeToday,restToday,setPromptModal,dragIdx,dragOverIdx,handleDragStart,handleDragOver,handleDrop,handleDragEnd,deleteRecording,sessionRefs,reflectionRef,endDay,dayClosed,reopenDay,editingTimeItemId,setEditingTimeItemId,editItemTime,editSpotTime,addSpot,updateSpot,deleteSpot,handleStartRecording,startPieceRecording:s.startPieceRecording,stopPieceRecording:s.stopPieceRecording,pieceRecordingItemId:s.pieceRecordingItemId,pieceRecordingMeta:s.pieceRecordingMeta,isRecording,currentBpm:metronome.bpm,refTrackMeta:s.refTrackMeta,refBarItemId:s.refBarItemId,setRefBarItemId:s.setRefBarItemId}}/>}
          {view==='review'&&<ReviewView {...{...commonProps,weekActualSeconds,weekReflection,setWeekReflection,monthActualSeconds,monthReflection,setMonthReflection,effectiveTotalToday,warmupTimeToday,openLogEntry}}/>}
          {view==='repertoire'&&<RepertoireView {...{...commonProps,view,setItems:s.setItems,updateItem,deleteItem,setPdfDrawerItemId,activeItemId,activeSpotId,startItem,stopItem,addItem,dayClosed,addSpot,updateSpot,deleteSpot,moveSpot,editSpotTime,addPerformance,updatePerformance,deletePerformance,pieceRecordingMeta:s.pieceRecordingMeta,startPieceRecording:s.startPieceRecording,stopPieceRecording:s.stopPieceRecording,deletePieceRecording:s.deletePieceRecording,lockPieceRecording:s.lockPieceRecording,pieceRecordingItemId:s.pieceRecordingItemId,isRecording,currentBpm:metronome.bpm,expandedItemId,setExpandedItemId,addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry,refTrackMeta:s.refTrackMeta,uploadRefTrack:s.uploadRefTrack,deleteRefTrack:s.deleteRefTrack,pdfUrlMap:s.pdfUrlMap,localPieceRecordingIds:s.localPieceRecordingIds,localRefTrackIds:s.localRefTrackIds}}/>}
          {view==='programs'&&<ProgramsView items={items} programs={programs} setPrograms={setPrograms} selectedProgramId={selectedProgramId} setSelectedProgramId={setSelectedProgramId} setView={setView} freeNotes={freeNotes} setActiveNoteId={(id)=>{setRequestedNoteId(id);}}/>}
          {view==='routines'&&<RoutinesView {...{routines,setRoutines,loadRoutine,setPromptModal,todaySessions,setView,items,loadedRoutineId}}/>}
          {view==='logs'&&<LogsView {...{...commonProps,openLogEntry,freeNotes}}/>}
          {view==='notes'&&<NotesView {...{freeNotes,setFreeNotes,noteCategories,setNoteCategories,items,history,setView,setExpandedItemId,openLogEntry,seedTestNotes,programs,setSelectedProgramId,requestedNoteId,setRequestedNoteId}}/>}
          </ErrorBoundary>
        </main>
        {view==='today'&&!isMobile&&(
          <aside className="w-72 shrink-0 overflow-auto etudes-scroll" style={{borderLeft:`1px solid ${LINE_MED}`,background:BG}}>
            <div className="p-8">
              <div className="flex items-baseline justify-between mb-5"><div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>En cours</div><div className="tabular-nums" style={{color:DIM,fontSize:'10px'}}>{workingOn.length}</div></div>
              <h3 className="text-2xl mb-7" style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,letterSpacing:'-0.01em'}}>Working on</h3>
              <div className="space-y-0">
                {workingOn.length===0&&<div className="text-sm italic" style={{color:FAINT,fontFamily:serif}}>Pin items to keep them close.</div>}
                {items.filter(i=>workingOn.includes(i.id)).map((i,idx)=>{const isActive=activeItemId===i.id;const asl=isActive&&activeSpotId?(i.spots||[]).find(s=>s.id===activeSpotId)?.label:null;return (
                  <div key={i.id} className="py-4" style={idx!==0?{borderTop:`1px solid ${LINE}`}:{}}>
                    <div className="flex items-start justify-between gap-2 mb-1.5"><div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.25em'}}>{SECTION_CONFIG[i.type].label}</div><button onClick={()=>toggleWorking(i.id)} className="shrink-0" style={{color:DIM}}><X className="w-3 h-3" strokeWidth={1.25}/></button></div>
                    <div className="leading-snug mb-0.5" style={{fontFamily:serifText,fontStyle:'italic',fontWeight:400,fontSize:'15px',lineHeight:1.2}}>{displayTitle(i)}</div>
                    {formatByline(i)&&<div className="text-xs italic mb-2" style={{color:MUTED,fontFamily:serif}}>{formatByline(i)}</div>}
                    {asl&&<div className="italic mt-1 flex items-center gap-1" style={{color:IKB,fontFamily:serif,fontSize:'11px'}}><Crosshair className="w-2.5 h-2.5" strokeWidth={1.25}/>{asl}</div>}
                    <div className="flex items-center justify-between mt-3"><span className="font-mono tabular-nums" style={{color:MUTED,fontSize:'11px'}}>{fmt(getItemTime(itemTimes,i.id))}</span><button onClick={()=>isActive?stopItem():startItem(i.id)} disabled={dayClosed&&!isActive} className="uppercase flex items-center gap-1.5" style={{color:isActive?IKB:(dayClosed?FAINT:TEXT),fontSize:'10px',letterSpacing:'0.22em',cursor:(dayClosed&&!isActive)?'not-allowed':'pointer'}}>{isActive?<><Pause className="w-3 h-3" strokeWidth={1.25}/> Pause</>:<><Play className="w-3 h-3" strokeWidth={1.25}/> Start</>}</button></div>
                  </div>);})}
              </div>
            </div>
          </aside>
        )}
      </div>
      {/* ── Reference track pull-up bar ───────────────────────────────────── */}
      {s.refBarItemId&&(()=>{
        const refMeta=s.refTrackMeta?.[s.refBarItemId];if(!refMeta)return null;
        const refItem=items.find(i=>i.id===s.refBarItemId);
        const speedAction=(
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 14px',border:`1px solid ${LINE_MED}`,marginLeft:'-1px'}}>
            <input type="range" min="0.25" max="1" step="0.01" value={refBarSpeed} onChange={e=>setRefBarSpeed(parseFloat(e.target.value))} style={{width:'140px',accentColor:MUTED,cursor:'pointer'}} title={`Speed: ${Math.round(refBarSpeed*100)}%`}/>
            <span className="tabular-nums" style={{fontFamily:mono,color:FAINT,fontSize:'9px',minWidth:'32px'}}>{Math.round(refBarSpeed*100)}%</span>
          </div>
        );
        return(
          <div style={{overflow:'hidden',maxHeight:refBarVisible?'280px':'0',transition:'max-height 280ms cubic-bezier(0.32,0.72,0,1)'}}>
            <div style={{transform:refBarVisible?'translateY(0)':'translateY(100%)',transition:'transform 280ms cubic-bezier(0.32,0.72,0,1)',background:SURFACE,borderTop:`1px solid ${LINE_MED}`}}>
              <div style={{display:'flex',justifyContent:'center',paddingTop:'8px',cursor:'pointer'}} onClick={closeRefBar}>
                <div style={{width:'32px',height:'3px',borderRadius:'2px',background:LINE_STR}}/>
              </div>
              <div className="px-10 py-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="uppercase flex items-center gap-2" style={{color:MUTED,fontSize:'10px',letterSpacing:'0.32em'}}>
                      Reference for
                      {refItem&&<span className="normal-case italic" style={{fontFamily:serif,fontSize:'13px',letterSpacing:0,color:MUTED,marginLeft:'4px'}}>{refItem.title}{refItem.movement&&` — ${refItem.movement}`}</span>}
                    </div>
                  </div>
                  <button onClick={closeRefBar} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button>
                </div>
                <Waveform blobLoader={()=>idbGet('refTracks',s.refBarItemId)} meta={refMeta} playbackRate={refBarSpeed} actions={speedAction} accentColor={MUTED} accentSoft="rgba(200,193,179,0.12)"/>
              </div>
            </div>
          </div>
        );
      })()}
      {/* TODO: mobile-etudes/ reference files are now obsolete — archive or delete in a subsequent cleanup commit */}
      {isMobile&&(
        <Drawer
          open={drawerOpen}
          onClose={()=>setDrawerOpen(false)}
          view={view}
          setView={(v)=>{setView(v);setDrawerOpen(false);}}
          buildZip={buildZip}
          openSettings={openSettings}
          totalToday={totalToday}
          settings={settings}
        />
      )}
      {mutexPrompt&&(
        <div style={{background:SURFACE,borderTop:`1px solid ${LINE_MED}`,padding:'10px 18px',display:'flex',alignItems:'center',gap:'10px',zIndex:50,position:'relative',flexShrink:0}}>
          <span style={{fontFamily:sans,fontSize:'10px',color:MUTED,letterSpacing:'0.12em',flex:1}}>
            Stop current recording and start {mutexPrompt.to==='piece'?'piece recording':'daily recording'}?
          </span>
          <button onClick={()=>setMutexPrompt(null)} style={{background:'transparent',border:`1px solid ${LINE_MED}`,color:FAINT,padding:'4px 10px',cursor:'pointer',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase'}}>Cancel</button>
          <button onClick={confirmMutex} style={{background:IKB_SOFT,border:`1px solid ${IKB}`,color:TEXT,padding:'4px 10px',cursor:'pointer',fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase'}}>Confirm</button>
        </div>
      )}
      <Footer {...{isMobile,metronome,setMetronome,metroExpanded,setMetroExpanded,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,currentBeat,currentSub,activeItemId,activeSpotId,activeItem,activeSpot,activeIsWarmup,sectionTimes,totalToday,effectiveTotalToday,warmupTimeToday,restToday,isResting,toggleRest,itemTimes,fmt,fmtMin,stopItem,handleTap,isRecording,startRecording,stopRecording,logTempo,quickNoteOpen,setQuickNoteOpen,addQuickNote,dayClosed,dayJustRolled,recExpanded,setRecExpanded,recordingMeta,deleteRecording,todayKey,startPieceRecording:s.startPieceRecording,stopPieceRecording:s.stopPieceRecording,pieceRecordingItemId:s.pieceRecordingItemId,pieceRecordingMeta:s.pieceRecordingMeta,attachDailyToPiece:s.attachDailyToPiece,todaySessions,items,settings,handleStartRecording}}/>
      {trash&&<UndoToast item={trash.item} onUndo={undoDelete} onDismiss={dismissTrash}/>}
      <UpdatePrompt />
      {showSettings&&<SettingsModal initialTab={settingsInitialTab} settings={settings} setSettings={setSettings} storageMode={storageMode} onExportZip={buildZip} exportProgress={exportProgress} onExportJson={exportJson} onImportClick={()=>importInputRef.current?.click()} onClose={()=>setShowSettings(false)} user={s.user} signIn={s.signIn} signUp={s.signUp} signOut={s.signOut} signInWithGoogle={s.signInWithGoogle} syncStatus={s.syncStatus} lastSyncedAt={s.lastSyncedAt} syncNow={s.syncNow} syncPayloadWarning={s.syncPayloadWarning} seedTestNotes={seedTestNotes} devSeedAll={seedAll} devClearAll={clearAll} onSyncTabVisible={maybePullDriveOnSyncTab} driveBackgroundError={driveBackgroundError} onDismissDriveError={()=>setDriveBackgroundError(null)} driveBlobRestoreProgress={driveBlobRestoreProgress} driveBlobFailedCount={driveBlobFailedCount} onBackupDrive={backupDriveNow} onRestoreFromDrive={restoreFromDrive} onDriveDisconnectSession={disconnectDrive} onDriveConnect={connectDrive} setConfirmModal={setConfirmModal}/>}
      {pdfItem&&<Suspense fallback={null}><PdfDrawer {...{pdfItem,items,pdfUrlMap,pdfLibrary,itemTimes,activeItemId,activeSpotId,startItem,stopItem,updateItem,addPdfToItem,attachLibraryPdf,removePdfFromItem,renamePdf,setDefaultPdf,setPdfPageRange,addBookmark,removeBookmark,renameBookmark,fmt,setPromptModal,setConfirmModal,onClose:()=>setPdfDrawerItemId(null),dayClosed,addSpot,updateSpot,deleteSpot,editSpotTime}}/></Suspense>}
      {logDrawerDate&&<LogDrawer entry={logDrawerEntry} dayData={logDrawerEntry?.kind==='day'?logDrawerEntry:(logDrawerEntry?null:resolveDayEntry(logDrawerDate))} items={items} recordingMeta={recordingMeta} freeNotes={freeNotes} onClose={closeLogDrawer} deleteRecording={deleteRecording}/>}
      {confirmModal&&<ConfirmModal {...confirmModal} onCancel={()=>setConfirmModal(null)}/>}
      {promptModal&&<PromptModal {...promptModal} onCancel={()=>setPromptModal(null)}/>}
      {syncConflictModal&&<SyncConflictModal {...syncConflictModal}/>}
      {driveConflictModal&&<DriveConflictModal {...driveConflictModal}/>}
      {restoreBusy&&<div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}><div className="px-6 py-4 flex items-center gap-3" style={{background:SURFACE,border:`1px solid ${LINE_STR}`}}><div className="w-2 h-2 rounded-full animate-pulse" style={{background:IKB,boxShadow:`0 0 8px ${IKB}`}}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Working — do not close</span></div></div>}
      {!isMobile&&<div className="fixed bottom-3 right-4 pointer-events-none" style={{zIndex:10}}><span className="tabular-nums" style={{color:DIM,fontSize:'10px',letterSpacing:'0.18em',fontFamily:mono}}>v{APP_VERSION}</span></div>}
    </div>
  );
}
