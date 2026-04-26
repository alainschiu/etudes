import React,{useState,useEffect} from 'react';
import {Play, Pause, Plus, X, FileText, Download, Mic, Square, Coffee, Flame, Crosshair, Zap, Waves, Archive, Upload as UploadIcon, Lock, Settings, Keyboard} from 'lucide-react';

import {BG,SURFACE,TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,WARM,serif,sans,mono} from './constants/theme.js';
import {SECTION_CONFIG,APP_VERSION} from './constants/config.js';
import {getItemTime,displayTitle,formatByline} from './lib/items.js';
import {DisplayHeader,Ring,StageLabels,Waveform,ItemPickerPopup,TargetEdit,TimeWithTarget,ItemTimeEditor,fmtSpotTime,PerformanceChip,SpotRow,SpotsBlock,Tooltip} from './components/shared.jsx';
import TodayView from './views/TodayView.jsx';
import WeekView from './views/WeekView.jsx';
import MonthView from './views/MonthView.jsx';
import RepertoireView from './views/RepertoireView.jsx';
import RoutinesView from './views/RoutinesView.jsx';
import {LogsView,LogDrawer} from './views/LogsView.jsx';
import NotesView from './views/NotesView.jsx';
import ProgramsView from './views/ProgramsView.jsx';
import Footer from './components/Footer.jsx';
import UndoToast from './components/UndoToast.jsx';
import {SettingsModal,HelpModal,ConfirmModal,PromptModal,SyncConflictModal} from './components/modals.jsx';
import PdfDrawer from './components/PdfDrawer.jsx';
import useEtudesState from './state/useEtudesState.js';

const tabs=[{id:'today',label:'Today'},{id:'week',label:'Week'},{id:'month',label:'Month'},{id:'repertoire',label:'Repertoire'},{id:'programs',label:'Programs'},{id:'routines',label:'Routines'},{id:'logs',label:'Logs'},{id:'notes',label:'Notes'}];

export default function Etudes(){
  const s=useEtudesState();
  const [clockTime,setClockTime]=useState(()=>{const n=new Date();return`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;});
  useEffect(()=>{const tick=()=>{const n=new Date();setClockTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);};const id=setInterval(tick,10000);return()=>clearInterval(id);},[]);
  const {view,setView,showSettings,setShowSettings,showHelp,setShowHelp,exportMenu,setExportMenu,confirmModal,setConfirmModal,promptModal,setPromptModal,syncConflictModal,quickNoteOpen,setQuickNoteOpen,restoreBusy,expandedItemId,setExpandedItemId,pdfDrawerItemId,setPdfDrawerItemId,logDrawerDate,logDrawerEntry,editingTimeItemId,setEditingTimeItemId,dragIdx,dragOverIdx,storageMode,storageQuotaHit,setStorageQuotaHit,items,itemTimes,warmupTimeToday,restToday,workingOn,todaySessions,setTodaySessions,loadedRoutineId,routines,setRoutines,programs,setPrograms,dailyReflection,setDailyReflection,weekReflection,setWeekReflection,monthReflection,setMonthReflection,settings,setSettings,freeNotes,setFreeNotes,recordingMeta,history,dayClosed,trash,activeItemId,activeSpotId,activeSessionId,activeItem,activeSpot,activeIsWarmup,isResting,isRecording,recExpanded,setRecExpanded,metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,sessionRefs,reflectionRef,importInputRef,totalToday,effectiveTotalToday,sectionTimes,weekActualSeconds,monthActualSeconds,streak,todayKey,pdfItem,loadedRoutine,todayHistoryEntry,fmt,fmtMin,updateItem,addItem,startItem,stopItem,toggleWorking,toggleRest,editItemTime,editSpotTime,addSpot,updateSpot,deleteSpot,moveSpot,addPerformance,updatePerformance,deletePerformance,closeDay,reopenDay,endDay,deleteItem,undoDelete,dismissTrash,logTempo,addQuickNote,pdfLibrary,pdfUrlMap,addPdfToItem,attachLibraryPdf,removePdfFromItem,renamePdf,setDefaultPdf,setPdfPageRange,addBookmark,removeBookmark,renameBookmark,startRecording,stopRecording,deleteRecording,handleDragStart,handleDragOver,handleDrop,handleDragEnd,moveSession,hideSession,addSessionType,toggleSessionWarmup,removeItemFromSession,addItemToSession,setSessionTarget,setItemTarget,loadRoutine,resetToFree,saveRoutine,updateLoadedRoutine,openLogEntry,closeLogDrawer,resolveDayEntry,exportLog,exportJson,importJsonFile,handleChipDrag,handleChipDragEnd,handleTap}=s;

  const commonProps={items,history,settings,itemTimes,fmt,fmtMin,recordingMeta};

  return (
    <div className="h-screen flex flex-col" style={{background:BG,color:TEXT,fontFamily:sans}}>
      <style>{`.etudes-scroll::-webkit-scrollbar{height:4px;width:4px}.etudes-scroll::-webkit-scrollbar-track{background:transparent}.etudes-scroll::-webkit-scrollbar-thumb{background:rgba(244,238,227,0.15);border-radius:0}.etudes-scroll::-webkit-scrollbar-thumb:hover{background:rgba(244,238,227,0.32)}.etudes-scroll{scrollbar-width:thin;scrollbar-color:rgba(244,238,227,0.15) transparent}.drag-ghost{opacity:0.35}.target-hover-reveal{opacity:0;transition:opacity 0.15s}.group:hover .target-hover-reveal{opacity:1}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}.toast-enter{animation:slideUp 0.25s ease-out}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield;appearance:textfield}`}</style>
      {storageQuotaHit&&(<div className="shrink-0 px-10 py-2 flex items-center gap-3" style={{background:'#3D1A00',borderBottom:`1px solid rgba(201,126,74,0.4)`}}><span style={{color:WARM,fontSize:'11px',letterSpacing:'0.12em'}}>⚠ Storage full — new data is kept in memory only and will be lost when the tab closes. Export a backup to preserve your session.</span><button onClick={()=>setStorageQuotaHit(false)} style={{color:WARM,marginLeft:'auto',opacity:0.7,fontSize:'11px'}}>✕</button></div>)}
      <header className="shrink-0" style={{borderBottom:`1px solid ${LINE_MED}`}}>
        <div className="flex items-center px-10 h-16">
          <div className="flex items-baseline gap-3"><div className="w-1.5 h-1.5 rounded-full" style={{background:IKB}}/><span className="text-3xl tracking-tight" style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,letterSpacing:'-0.01em'}}>Études</span><span className="text-xs uppercase tracking-widest ml-2" style={{color:FAINT,fontWeight:300,fontSize:'10px',letterSpacing:'0.28em'}}>a practice journal</span></div>
          <div className="ml-auto flex items-center gap-5 relative">
            <span className="tabular-nums" style={{fontFamily:mono,color:MUTED,fontSize:'13px',letterSpacing:'0.04em'}}>{clockTime}</span>
            <div draggable onDragStart={handleChipDrag} onDragEnd={handleChipDragEnd} className="uppercase flex items-center gap-2 cursor-grab active:cursor-grabbing select-none px-2 py-1 transition" style={{color:MUTED,fontSize:'10px',letterSpacing:'0.25em',border:`1px dashed ${LINE_MED}`}} title="Drag to desktop to save as .md"><FileText className="w-3 h-3" strokeWidth={1.25}/> .md</div>
            <Tooltip shortcut="?" label="Réglages"><button onClick={()=>setShowSettings(true)} className="uppercase flex items-center gap-2 transition" style={{color:MUTED,fontSize:'10px',letterSpacing:'0.25em'}}><Settings className="w-3 h-3" strokeWidth={1.25}/> Réglages</button></Tooltip>
            <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importJsonFile(f);e.target.value='';}}/>
          </div>
        </div>
        {storageMode==='memory'&&(<div className="px-10 py-2 flex items-center justify-center" style={{borderTop:`1px dashed ${LINE_MED}`,background:SURFACE}}><span className="uppercase tabular-nums" style={{color:MUTED,fontSize:'9px',letterSpacing:'0.28em'}}>Storage unavailable · this session will not be saved</span></div>)}
        <nav className="flex px-10" style={{borderTop:`1px solid ${LINE}`}}>
          {tabs.map(t=>(<button key={t.id} onClick={()=>setView(t.id)} className="relative py-3.5 mr-10 uppercase transition" style={{color:view===t.id?TEXT:FAINT,fontWeight:400,fontSize:'10px',letterSpacing:'0.28em'}}>{t.label}{view===t.id&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}</button>))}
        </nav>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto etudes-scroll">
          {view==='today'&&<TodayView {...{...commonProps,view,setView,todaySessions,setTodaySessions,moveSession,hideSession,addSessionType,toggleSessionWarmup,removeItemFromSession,addItemToSession,setSessionTarget,setItemTarget,routines,loadedRoutine,loadRoutine,resetToFree,saveRoutine,updateLoadedRoutine,sectionTimes,activeItemId,activeSpotId,activeSessionId,expandedItemId,setExpandedItemId,startItem,stopItem,updateItem,deleteItem,addItem,workingOn,toggleWorking,setPdfDrawerItemId,dailyReflection,setDailyReflection,totalToday,effectiveTotalToday,warmupTimeToday,restToday,setPromptModal,dragIdx,dragOverIdx,handleDragStart,handleDragOver,handleDrop,handleDragEnd,deleteRecording,sessionRefs,reflectionRef,endDay,dayClosed,reopenDay,editingTimeItemId,setEditingTimeItemId,editItemTime,editSpotTime,addSpot,updateSpot,deleteSpot,startPieceRecording:s.startPieceRecording,stopPieceRecording:s.stopPieceRecording,pieceRecordingItemId:s.pieceRecordingItemId,pieceRecordingMeta:s.pieceRecordingMeta,isRecording,currentBpm:metronome.bpm}}/>}
          {view==='week'&&<WeekView {...{...commonProps,weekActualSeconds,weekReflection,setWeekReflection,effectiveTotalToday,warmupTimeToday,openLogEntry,streak}}/>}
          {view==='month'&&<MonthView {...{...commonProps,monthActualSeconds,monthReflection,setMonthReflection,openLogEntry,effectiveTotalToday,streak}}/>}
          {view==='repertoire'&&<RepertoireView {...{...commonProps,setItems:s.setItems,updateItem,deleteItem,setPdfDrawerItemId,activeItemId,activeSpotId,startItem,stopItem,addItem,dayClosed,addSpot,updateSpot,deleteSpot,moveSpot,editSpotTime,addPerformance,updatePerformance,deletePerformance,pieceRecordingMeta:s.pieceRecordingMeta,startPieceRecording:s.startPieceRecording,stopPieceRecording:s.stopPieceRecording,deletePieceRecording:s.deletePieceRecording,pieceRecordingItemId:s.pieceRecordingItemId,isRecording,currentBpm:metronome.bpm,expandedItemId,setExpandedItemId}}/>}
          {view==='programs'&&<ProgramsView items={items} programs={programs} setPrograms={setPrograms}/>}
          {view==='routines'&&<RoutinesView {...{routines,setRoutines,loadRoutine,setPromptModal,todaySessions,setView,items,loadedRoutineId}}/>}
          {view==='logs'&&<LogsView {...{...commonProps,openLogEntry,freeNotes}}/>}
          {view==='notes'&&<NotesView {...{freeNotes,setFreeNotes}}/>}
        </main>
        {view==='today'&&(
          <aside className="w-72 shrink-0 overflow-auto etudes-scroll" style={{borderLeft:`1px solid ${LINE_MED}`,background:BG}}>
            <div className="p-8">
              <div className="flex items-baseline justify-between mb-5"><div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>En cours</div><div className="tabular-nums" style={{color:DIM,fontSize:'10px'}}>{workingOn.length}</div></div>
              <h3 className="text-2xl mb-7" style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,letterSpacing:'-0.01em'}}>Working on</h3>
              <div className="space-y-0">
                {workingOn.length===0&&<div className="text-sm italic" style={{color:FAINT,fontFamily:serif}}>Pin items to keep them close.</div>}
                {items.filter(i=>workingOn.includes(i.id)).map((i,idx)=>{const isActive=activeItemId===i.id;const asl=isActive&&activeSpotId?(i.spots||[]).find(s=>s.id===activeSpotId)?.label:null;return (
                  <div key={i.id} className="py-4" style={idx!==0?{borderTop:`1px solid ${LINE}`}:{}}>
                    <div className="flex items-start justify-between gap-2 mb-1.5"><div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.25em'}}>{SECTION_CONFIG[i.type].label}</div><button onClick={()=>toggleWorking(i.id)} className="shrink-0" style={{color:DIM}}><X className="w-3 h-3" strokeWidth={1.25}/></button></div>
                    <div className="text-sm leading-snug mb-0.5">{displayTitle(i)}</div>
                    {formatByline(i)&&<div className="text-xs italic mb-2" style={{color:MUTED,fontFamily:serif}}>{formatByline(i)}</div>}
                    {asl&&<div className="italic mt-1 flex items-center gap-1" style={{color:IKB,fontFamily:serif,fontSize:'11px'}}><Crosshair className="w-2.5 h-2.5" strokeWidth={1.25}/>{asl}</div>}
                    <div className="flex items-center justify-between mt-3"><span className="font-mono tabular-nums" style={{color:MUTED,fontSize:'11px'}}>{fmt(getItemTime(itemTimes,i.id))}</span><button onClick={()=>isActive?stopItem():startItem(i.id)} disabled={dayClosed&&!isActive} className="uppercase flex items-center gap-1.5" style={{color:isActive?IKB:(dayClosed?FAINT:TEXT),fontSize:'10px',letterSpacing:'0.22em',cursor:(dayClosed&&!isActive)?'not-allowed':'pointer'}}>{isActive?<><Pause className="w-3 h-3" strokeWidth={1.25}/> Pause</>:<><Play className="w-3 h-3" strokeWidth={1.25}/> Start</>}</button></div>
                  </div>);})}
              </div>
            </div>
          </aside>
        )}
      </div>
      <Footer {...{metronome,setMetronome,metroExpanded,setMetroExpanded,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,currentBeat,currentSub,activeItemId,activeSpotId,activeItem,activeSpot,activeIsWarmup,sectionTimes,totalToday,effectiveTotalToday,warmupTimeToday,restToday,isResting,toggleRest,itemTimes,fmt,fmtMin,stopItem,handleTap,isRecording,startRecording,stopRecording,logTempo,streak,quickNoteOpen,setQuickNoteOpen,addQuickNote,dayClosed,recExpanded,setRecExpanded,recordingMeta,deleteRecording,todayKey,startPieceRecording:s.startPieceRecording,stopPieceRecording:s.stopPieceRecording,pieceRecordingItemId:s.pieceRecordingItemId,pieceRecordingMeta:s.pieceRecordingMeta,attachDailyToPiece:s.attachDailyToPiece,todaySessions,items}}/>
      {trash&&<UndoToast item={trash.item} onUndo={undoDelete} onDismiss={dismissTrash}/>}
      {showSettings&&<SettingsModal settings={settings} setSettings={setSettings} storageMode={storageMode} onExportMd={()=>exportLog('md')} onExportTxt={()=>exportLog('txt')} onExportJson={exportJson} onImportClick={()=>importInputRef.current?.click()} onClose={()=>setShowSettings(false)} user={s.user} signIn={s.signIn} signUp={s.signUp} signOut={s.signOut} syncStatus={s.syncStatus} lastSyncedAt={s.lastSyncedAt} syncNow={s.syncNow}/>}
      {showHelp&&<HelpModal onClose={()=>setShowHelp(false)}/>}
      {pdfItem&&<PdfDrawer {...{pdfItem,items,pdfUrlMap,pdfLibrary,itemTimes,activeItemId,activeSpotId,startItem,stopItem,updateItem,addPdfToItem,attachLibraryPdf,removePdfFromItem,renamePdf,setDefaultPdf,setPdfPageRange,addBookmark,removeBookmark,renameBookmark,fmt,setPromptModal,setConfirmModal,onClose:()=>setPdfDrawerItemId(null),dayClosed,addSpot,updateSpot,deleteSpot,editSpotTime}}/>}
      {logDrawerDate&&<LogDrawer entry={logDrawerEntry} dayData={logDrawerEntry?.kind==='day'?logDrawerEntry:(logDrawerEntry?null:resolveDayEntry(logDrawerDate))} items={items} recordingMeta={recordingMeta} freeNotes={freeNotes} onClose={closeLogDrawer} deleteRecording={deleteRecording}/>}
      {confirmModal&&<ConfirmModal {...confirmModal} onCancel={()=>setConfirmModal(null)}/>}
      {promptModal&&<PromptModal {...promptModal} onCancel={()=>setPromptModal(null)}/>}
      {syncConflictModal&&<SyncConflictModal {...syncConflictModal}/>}
      {restoreBusy&&<div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}><div className="px-6 py-4 flex items-center gap-3" style={{background:SURFACE,border:`1px solid ${LINE_STR}`}}><div className="w-2 h-2 rounded-full animate-pulse" style={{background:IKB,boxShadow:`0 0 8px ${IKB}`}}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Working — do not close</span></div></div>}
      <div className="fixed bottom-3 right-4 pointer-events-none" style={{zIndex:10}}><span className="tabular-nums" style={{color:DIM,fontSize:'10px',letterSpacing:'0.18em',fontFamily:mono}}>v{APP_VERSION}</span></div>
    </div>
  );
}
