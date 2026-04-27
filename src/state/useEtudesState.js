import {useState,useEffect,useRef,useMemo,useCallback} from 'react';
import {DEFAULT_SESSIONS,TYPES,ROLLOVER_KEY,WEEK_ROLLOVER_KEY,MONTH_ROLLOVER_KEY} from '../constants/config.js';
import {idbPut,idbDel,idbGet,idbAllKeys,storageAvailable,detectStorage,lsGet,lsSet} from '../lib/storage.js';
import {useSupabaseAuth} from '../lib/useSupabaseAuth.js';
import {loadFromCloud,syncToCloud,mergeStates,LS_CLOUD_SYNC_KEY} from '../lib/sync.js';
import {todayDateStr,shiftDate,getWeekStart,getMonthKey} from '../lib/dates.js';
import {mkPdfId,mkAttachId,mkBookmarkId,mkSpotId,mkPerfId,mkNoteLogId,getItemTime,displayTitle,formatByline,buildHistoryItems,makeNewItem,calcStreak} from '../lib/items.js';
import {migrateItems,migrateSessions,migrateRoutines,migrateHistory} from '../lib/migrations.js';
import {buildCompositeDailyReflection,parseTagsFromBody} from '../lib/notes.js';
import useMetronome from '../hooks/useMetronome.js';
import useRecording from '../hooks/useRecording.js';
import useImportExport from '../hooks/useImportExport.js';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts.js';

export default function useEtudesState(){
  // ── UI state ──────────────────────────────────────────────────────────────
  const [view,setView]=useState('today');
  const [showSettings,setShowSettings]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  const [exportMenu,setExportMenu]=useState(false);
  const [confirmModal,setConfirmModal]=useState(null);
  const [promptModal,setPromptModal]=useState(null);
  const [syncConflictModal,setSyncConflictModal]=useState(null);
  const pendingRemoteRef=useRef(null);
  const [quickNoteOpen,setQuickNoteOpen]=useState(false);
  const [restoreBusy,setRestoreBusy]=useState(false);
  const [expandedItemId,setExpandedItemId]=useState(null);
  const [pdfDrawerItemId,setPdfDrawerItemId]=useState(null);
  const [logDrawerDate,setLogDrawerDate]=useState(null);
  const [logDrawerEntry,setLogDrawerEntry]=useState(null);
  const [editingTimeItemId,setEditingTimeItemId]=useState(null);
  const [dragIdx,setDragIdx]=useState(null);
  const [dragOverIdx,setDragOverIdx]=useState(null);

  // ── Storage ───────────────────────────────────────────────────────────────
  const [storageMode]=useState(()=>detectStorage());
  const [storageQuotaHit,setStorageQuotaHit]=useState(!storageAvailable);
  useEffect(()=>{const h=()=>setStorageQuotaHit(true);window.addEventListener('etudes-storage-full',h);return()=>window.removeEventListener('etudes-storage-full',h);},[]);

  // ── Persisted state ───────────────────────────────────────────────────────
  const [items,setItems]=useState(()=>migrateItems(lsGet('etudes-items',[])));
  const [itemTimes,setItemTimes]=useState(()=>lsGet('etudes-itemTimes',{}));
  const [warmupTimeToday,setWarmupTimeToday]=useState(()=>lsGet('etudes-warmupTimeToday',0));
  const [restToday,setRestToday]=useState(()=>lsGet('etudes-restToday',0));
  const [workingOn,setWorkingOn]=useState(()=>lsGet('etudes-workingOn',[]));
  const [todaySessions,setTodaySessions]=useState(()=>{const raw=migrateSessions(lsGet('etudes-todaySessions',DEFAULT_SESSIONS)).map(s=>({...s,itemIds:s.itemIds===null?[]:s.itemIds}));return [...raw].sort((a,b)=>TYPES.indexOf(a.type)-TYPES.indexOf(b.type));});
  const [loadedRoutineId,setLoadedRoutineId]=useState(()=>lsGet('etudes-loadedRoutineId',null));
  const [routines,setRoutines]=useState(()=>migrateRoutines(lsGet('etudes-routines',[])));
  const [programs,setPrograms]=useState(()=>lsGet('etudes-programs',[]));
  const [dailyReflection,setDailyReflection]=useState(()=>lsGet('etudes-dailyReflection',''));
  const [weekReflection,setWeekReflection]=useState(()=>lsGet('etudes-weekReflection',{notes:'',goals:''}));
  const [monthReflection,setMonthReflection]=useState(()=>lsGet('etudes-monthReflection',{notes:'',goals:''}));
  const [settings,setSettings]=useState(()=>lsGet('etudes-settings',{dailyTarget:90,weeklyTarget:600,monthlyTarget:2400}));
  const [freeNotes,setFreeNotes]=useState(()=>lsGet('etudes-freeNotes',[]));
  const [noteCategories,setNoteCategories]=useState(()=>lsGet('etudes-noteCategories',[]));
  const [recordingMeta,setRecordingMeta]=useState(()=>lsGet('etudes-recordingMeta',{}));
  const [pieceRecordingMeta,setPieceRecordingMeta]=useState(()=>lsGet('etudes-pieceRecordingMeta',{}));
  const [pieceRecordingItemId,setPieceRecordingItemId]=useState(null);
  const [history,setHistory]=useState(()=>migrateHistory(lsGet('etudes-history',[])));
  const [dayClosed,setDayClosed]=useState(()=>lsGet('etudes-dayClosed',false));
  const [pdfUrlMap,setPdfUrlMap]=useState({});
  const [pdfLibrary,setPdfLibrary]=useState(()=>lsGet('etudes-pdfLibrary',[]));
  const [trash,setTrash]=useState(null);

  useEffect(()=>{lsSet('etudes-items',items.map(i=>{const {pdfUrl,...r}=i;return r;}));},[items]);
  useEffect(()=>{lsSet('etudes-pdfLibrary',pdfLibrary);},[pdfLibrary]);
  useEffect(()=>{lsSet('etudes-itemTimes',itemTimes);},[itemTimes]);
  useEffect(()=>{lsSet('etudes-warmupTimeToday',warmupTimeToday);},[warmupTimeToday]);
  useEffect(()=>{lsSet('etudes-restToday',restToday);},[restToday]);
  useEffect(()=>{lsSet('etudes-workingOn',workingOn);},[workingOn]);
  useEffect(()=>{lsSet('etudes-todaySessions',todaySessions);},[todaySessions]);
  useEffect(()=>{lsSet('etudes-loadedRoutineId',loadedRoutineId);},[loadedRoutineId]);
  useEffect(()=>{lsSet('etudes-routines',routines);},[routines]);
  useEffect(()=>{lsSet('etudes-programs',programs);},[programs]);
  useEffect(()=>{lsSet('etudes-dailyReflection',dailyReflection);},[dailyReflection]);
  useEffect(()=>{lsSet('etudes-weekReflection',weekReflection);},[weekReflection]);
  useEffect(()=>{lsSet('etudes-monthReflection',monthReflection);},[monthReflection]);
  useEffect(()=>{lsSet('etudes-settings',settings);},[settings]);
  useEffect(()=>{lsSet('etudes-freeNotes',freeNotes);},[freeNotes]);
  useEffect(()=>{lsSet('etudes-noteCategories',noteCategories);},[noteCategories]);
  useEffect(()=>{lsSet('etudes-recordingMeta',recordingMeta);},[recordingMeta]);
  useEffect(()=>{lsSet('etudes-pieceRecordingMeta',pieceRecordingMeta);},[pieceRecordingMeta]);
  useEffect(()=>{lsSet('etudes-history',history);},[history]);
  useEffect(()=>{lsSet('etudes-dayClosed',dayClosed);},[dayClosed]);
  useEffect(()=>{lsSet('etudes-localDirtyAt',Date.now());},[items,routines,programs,history,settings,dailyReflection,weekReflection,monthReflection,freeNotes,recordingMeta,workingOn,todaySessions,dayClosed,loadedRoutineId,warmupTimeToday]);

  // ── Active item / session tracking ────────────────────────────────────────
  const [activeItemId,setActiveItemId]=useState(null);
  const [activeSpotId,setActiveSpotId]=useState(null);
  const [activeSessionId,setActiveSessionId]=useState(null);
  const lastActiveRef=useRef({itemId:null,spotId:null,sessionId:null});
  useEffect(()=>{if(activeItemId)lastActiveRef.current={itemId:activeItemId,spotId:activeSpotId,sessionId:activeSessionId};},[activeItemId,activeSpotId,activeSessionId]);

  // ── Rest / recording state ────────────────────────────────────────────────
  const [isResting,setIsResting]=useState(false);
  const [isRecording,setIsRecording]=useState(false);
  const [recExpanded,setRecExpanded]=useState(false);

  // ── Sub-hooks ─────────────────────────────────────────────────────────────
  const metro=useMetronome();
  const {metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,handleTap}=metro;
  const {user,signIn,signUp,signOut}=useSupabaseAuth();
  const userRef=useRef(null);
  useEffect(()=>{userRef.current=user;},[user]);
  const [syncStatus,setSyncStatus]=useState('idle'); // 'idle'|'syncing'|'error'
  const [lastSyncedAt,setLastSyncedAt]=useState(()=>lsGet(LS_CLOUD_SYNC_KEY,0));

  const sessionRefs=useRef({});
  const reflectionRef=useRef(null);
  const importInputRef=useRef(null);

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalToday=useMemo(()=>{let t=0;items.forEach(i=>{t+=getItemTime(itemTimes,i.id);});return t;},[items,itemTimes]);
  const effectiveTotalToday=Math.max(0,totalToday-warmupTimeToday);
  const sectionTimes=useMemo(()=>{const o={tech:0,piece:0,play:0,study:0};items.forEach(i=>{const t=getItemTime(itemTimes,i.id);if(o[i.type]!==undefined)o[i.type]+=t;});return o;},[items,itemTimes]);

  const todayKey=todayDateStr();
  const weekStart=getWeekStart(todayKey);
  const weekHistSec=history.filter(h=>(h.kind==='day'||!h.kind)&&h.date>=weekStart&&h.date<todayKey).reduce((a,b)=>a+((b.minutes||0)-(b.warmupMinutes||0)),0)*60;
  const weekActualSeconds=weekHistSec+effectiveTotalToday;
  const monthPre=todayKey.slice(0,7);
  const monthHistSec=history.filter(h=>(h.kind==='day'||!h.kind)&&h.date.startsWith(monthPre)&&h.date<todayKey).reduce((a,b)=>a+((b.minutes||0)-(b.warmupMinutes||0)),0)*60;
  const monthActualSeconds=monthHistSec+effectiveTotalToday;
  const streak=useMemo(()=>calcStreak(history,Math.floor(effectiveTotalToday/60)),[history,effectiveTotalToday]);

  const activeItem=useMemo(()=>items.find(i=>i.id===activeItemId),[items,activeItemId]);
  const activeSpot=useMemo(()=>activeItem&&activeSpotId?(activeItem.spots||[]).find(s=>s.id===activeSpotId):null,[activeItem,activeSpotId]);
  const activeSession=activeSessionId?todaySessions.find(s=>s.id===activeSessionId):null;
  const activeIsWarmup=!!(activeSession&&activeSession.isWarmup);
  const pdfItem=items.find(i=>i.id===pdfDrawerItemId);
  const loadedRoutine=routines.find(r=>r.id===loadedRoutineId);

  // ── PDF loading ───────────────────────────────────────────────────────────
  // pdfUrlMap is keyed by libraryId (IDB key); attachments reference libraryId
  useEffect(()=>{let cancelled=false;const urls=[];(async()=>{const keys=await idbAllKeys('pdfs');if(cancelled)return;const keySet=new Set(keys.map(k=>String(k)));const urlsById={};for(const key of keys){const blob=await idbGet('pdfs',key);if(cancelled)return;if(blob){const u=URL.createObjectURL(blob);urlsById[String(key)]=u;urls.push(u);}}if(cancelled){urls.forEach(u=>URL.revokeObjectURL(u));return;}setPdfUrlMap(urlsById);// Remove attachments whose libraryId no longer exists in IDB
  setItems(prev=>prev.map(i=>{if(!i.pdfs||i.pdfs.length===0)return i;const f=i.pdfs.filter(p=>keySet.has(String(p.libraryId||p.id)));if(f.length===i.pdfs.length)return i;const d=f.some(p=>p.id===i.defaultPdfId)?i.defaultPdfId:(f[0]?.id||null);return {...i,pdfs:f,defaultPdfId:d};}));// Rebuild pdfLibrary from IDB keys that exist
  setPdfLibrary(prev=>{const kept=prev.filter(e=>keySet.has(String(e.id)));const existingIds=new Set(kept.map(e=>e.id));// Add any libraryIds that are in IDB but not in pdfLibrary (edge case from old data)
  return kept;});})();return()=>{cancelled=true;};},[]);// eslint-disable-line react-hooks/exhaustive-deps

  // ── Rollover / history snapshot ───────────────────────────────────────────
  useEffect(()=>{if(!lsGet(WEEK_ROLLOVER_KEY,null))lsSet(WEEK_ROLLOVER_KEY,getWeekStart(todayDateStr()));if(!lsGet(MONTH_ROLLOVER_KEY,null))lsSet(MONTH_ROLLOVER_KEY,getMonthKey(todayDateStr()));},[]);
  const rolloverRef=useRef({totalToday,warmupTimeToday,itemTimes,items,dailyReflection,weekReflection,monthReflection});
  useEffect(()=>{rolloverRef.current={totalToday,warmupTimeToday,itemTimes,items,dailyReflection,weekReflection,monthReflection};});

  // ── Cloud sync state ──────────────────────────────────────────────────────
  const coldState=useMemo(()=>({items,routines,programs,history,settings,dailyReflection,weekReflection,monthReflection,freeNotes,recordingMeta,workingOn,todaySessions,dayClosed,loadedRoutineId,warmupTimeToday}),[items,routines,programs,history,settings,dailyReflection,weekReflection,monthReflection,freeNotes,recordingMeta,workingOn,todaySessions,dayClosed,loadedRoutineId,warmupTimeToday]);
  const syncStateRef=useRef({});
  useEffect(()=>{syncStateRef.current={...coldState,itemTimes,restToday};});
  const doSync=useCallback(async()=>{if(!userRef.current)return;setSyncStatus('syncing');const ok=await syncToCloud(userRef.current.id,syncStateRef.current);if(ok){const now=Date.now();setLastSyncedAt(now);lsSet('etudes-localDirtyAt',0);setSyncStatus('idle');}else{setSyncStatus('error');}},[]);// eslint-disable-line
  useEffect(()=>{
    const check=()=>{
      const today=todayDateStr();const cw=getWeekStart(today);const cm=getMonthKey(today);
      const ld=lsGet(ROLLOVER_KEY,null),lw=lsGet(WEEK_ROLLOVER_KEY,null),lm=lsGet(MONTH_ROLLOVER_KEY,null);
      const {totalToday:tt,warmupTimeToday:wt,itemTimes:it,items:iv,dailyReflection:dr,weekReflection:wr,monthReflection:mr}=rolloverRef.current;
      if(!ld){lsSet(ROLLOVER_KEY,today);return;}
      if(ld!==today){
        const hi=buildHistoryItems(it,iv);
        const composite=buildCompositeDailyReflection(dr,iv);
        const prev={kind:'day',date:ld,minutes:Math.floor(tt/60),warmupMinutes:Math.floor((wt||0)/60),items:hi,reflection:composite};
        if(prev.minutes>0||composite.trim()||prev.items.length>0){setHistory(h=>{const i=h.findIndex(x=>x.kind==='day'&&x.date===ld);if(i>=0){const c=[...h];c[i]=prev;return c;}return [...h,prev];});}
        // Push noteLog entries for items with todayNote
        setItems(p=>p.map(i=>{if(!i.todayNote||!i.todayNote.trim())return {...i,todayNote:''};const entry={id:mkNoteLogId(),date:ld,text:i.todayNote.trim(),source:'session'};return {...i,todayNote:'',noteLog:[...(i.noteLog||[]),entry]};}));
        setRestToday(0);setItemTimes({});setWarmupTimeToday(0);setDailyReflection('');setActiveItemId(null);setActiveSpotId(null);setActiveSessionId(null);setIsResting(false);setDayClosed(false);
        lsSet(ROLLOVER_KEY,today);
      }
      if(lw&&lw!==cw){const we=shiftDate(lw,6);if((wr.notes||'').trim()||(wr.goals||'').trim()){const e={kind:'week',weekStart:lw,weekEnd:we,notes:wr.notes||'',goals:wr.goals||''};setHistory(h=>{const i=h.findIndex(x=>x.kind==='week'&&x.weekStart===lw);if(i>=0){const c=[...h];c[i]=e;return c;}return [...h,e];});}setWeekReflection({notes:'',goals:''});lsSet(WEEK_ROLLOVER_KEY,cw);}
      if(lm&&lm!==cm){if((mr.notes||'').trim()||(mr.goals||'').trim()){const e={kind:'month',month:lm,notes:mr.notes||'',goals:mr.goals||''};setHistory(h=>{const i=h.findIndex(x=>x.kind==='month'&&x.month===lm);if(i>=0){const c=[...h];c[i]=e;return c;}return [...h,e];});}setMonthReflection({notes:'',goals:''});lsSet(MONTH_ROLLOVER_KEY,cm);}
    };
    check();const iv=setInterval(check,60000);return()=>clearInterval(iv);
  },[]);// eslint-disable-line react-hooks/exhaustive-deps

  // ── Item timer ────────────────────────────────────────────────────────────
  const activeSessionWarmupRef=useRef(false);
  useEffect(()=>{const s=activeSessionId?todaySessions.find(x=>x.id===activeSessionId):null;activeSessionWarmupRef.current=!!(s&&s.isWarmup);},[activeSessionId,todaySessions]);
  useEffect(()=>{
    if(!activeItemId||dayClosed)return;
    let lastTick=Date.now();
    const id=setInterval(()=>{const now=Date.now();const elapsed=Math.max(1,Math.round((now-lastTick)/1000));lastTick=now;const bucket=activeSpotId?`${activeItemId}:${activeSpotId}`:String(activeItemId);setItemTimes(t=>({...t,[bucket]:(t[bucket]||0)+elapsed}));if(activeSessionWarmupRef.current)setWarmupTimeToday(w=>w+elapsed);},1000);
    return()=>clearInterval(id);
  },[activeItemId,activeSpotId,dayClosed]);
  useEffect(()=>{if(!isResting)return;let lastTick=Date.now();const id=setInterval(()=>{const now=Date.now();const elapsed=Math.max(1,Math.round((now-lastTick)/1000));lastTick=now;setRestToday(t=>t+elapsed);},1000);return()=>clearInterval(id);},[isResting]);

  // ── Formatters ────────────────────────────────────────────────────────────
  const fmt=(s)=>{s=s||0;const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;if(h)return`${h}h${String(m).padStart(2,'0')}′`;if(sec===0)return`${m}′`;return`${m}′${String(sec).padStart(2,'0')}"`;};
  const fmtMin=(s)=>`${Math.floor((s||0)/60)}′`;

  // ── Item actions ──────────────────────────────────────────────────────────
  const updateItem=(id,patch)=>setItems(p=>p.map(i=>i.id===id?{...i,...patch}:i));
  const addItem=(type)=>{const ni=makeNewItem(type);setItems(p=>[...p,ni]);setExpandedItemId(ni.id);return ni;};
  const startItem=(id,spotId=null,sessionId=null)=>{if(dayClosed)return;setActiveItemId(id);setActiveSpotId(spotId||null);setActiveSessionId(sessionId||null);if(isResting)setIsResting(false);setItems(p=>p.map(i=>i.id===id&&!i.startedDate?{...i,startedDate:todayDateStr()}:i));};
  const stopItem=()=>{setActiveItemId(null);setActiveSpotId(null);setActiveSessionId(null);doSync();};
  const toggleWorking=(id)=>setWorkingOn(p=>p.includes(id)?p.filter(w=>w!==id):[...p,id]);
  const toggleRest=()=>{if(isResting){setIsResting(false);return;}if(dayClosed)return;if(activeItemId)stopItem();setIsResting(true);};
  const editItemTime=(id,min)=>{const n=Math.max(0,Math.floor(Number(min)||0));setItemTimes(t=>({...t,[id]:n*60}));};
  const editSpotTime=(id,sid,min)=>{const n=Math.max(0,Math.floor(Number(min)||0));setItemTimes(t=>({...t,[`${id}:${sid}`]:n*60}));};

  // ── Spot actions ──────────────────────────────────────────────────────────
  const addSpot=(id,label)=>{const s={id:mkSpotId(),label:label||'New spot',bpmTarget:null,note:'',bpmLog:[]};setItems(p=>p.map(i=>i.id===id?{...i,spots:[...(i.spots||[]),s]}:i));return s.id;};
  const updateSpot=(id,sid,patch)=>{setItems(p=>p.map(i=>i.id!==id?i:{...i,spots:(i.spots||[]).map(s=>s.id===sid?{...s,...patch}:s)}));};
  const deleteSpot=(id,sid)=>{setItems(p=>p.map(i=>i.id!==id?i:{...i,spots:(i.spots||[]).filter(s=>s.id!==sid)}));setItemTimes(t=>{const c={...t};delete c[`${id}:${sid}`];return c;});if(activeItemId===id&&activeSpotId===sid){setActiveSpotId(null);setActiveSessionId(null);}};
  const moveSpot=(id,sid,dir)=>{setItems(p=>p.map(i=>{if(i.id!==id)return i;const sp=[...(i.spots||[])];const idx=sp.findIndex(s=>s.id===sid);const ni=idx+dir;if(idx<0||ni<0||ni>=sp.length)return i;[sp[idx],sp[ni]]=[sp[ni],sp[idx]];return {...i,spots:sp};}));};

  // ── Performance actions ───────────────────────────────────────────────────
  const addPerformance=(id)=>{const perf={id:mkPerfId(),date:'',label:''};setItems(p=>p.map(i=>i.id===id?{...i,performances:[...(i.performances||[]),perf]}:i));return perf.id;};
  const updatePerformance=(id,pid,patch)=>{setItems(p=>p.map(i=>i.id!==id?i:{...i,performances:(i.performances||[]).map(x=>x.id===pid?{...x,...patch}:x)}));};
  const deletePerformance=(id,pid)=>{setItems(p=>p.map(i=>i.id!==id?i:{...i,performances:(i.performances||[]).filter(x=>x.id!==pid)}));};

  // ── Day close ─────────────────────────────────────────────────────────────
  const closeDay=()=>{setActiveItemId(null);setActiveSpotId(null);setActiveSessionId(null);setIsResting(false);setEditingTimeItemId(null);setDayClosed(true);doSync();};
  const reopenDay=()=>setDayClosed(false);
  const endDay=()=>{closeDay();if(reflectionRef.current){reflectionRef.current.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>reflectionRef.current?.focus(),400);}};

  // ── Delete / undo ─────────────────────────────────────────────────────────
  const deleteItem=(id)=>{
    const item=items.find(i=>i.id===id);if(!item)return;
    if(trash?.timeoutId)clearTimeout(trash.timeoutId);
    const ss=todaySessions.map(s=>({sessionId:s.id,hadId:s.itemIds?s.itemIds.includes(id):false,itemTarget:s.itemTargets?.[id]}));
    const ws=workingOn.includes(id);
    setItems(p=>p.filter(i=>i.id!==id));
    setWorkingOn(p=>p.filter(w=>w!==id));
    setTodaySessions(p=>p.map(s=>{const nt={...(s.itemTargets||{})};delete nt[id];return {...s,itemIds:s.itemIds?s.itemIds.filter(x=>x!==id):s.itemIds,itemTargets:nt};}));
    if(activeItemId===id){setActiveItemId(null);setActiveSpotId(null);setActiveSessionId(null);}
    if(expandedItemId===id)setExpandedItemId(null);
    const tid=setTimeout(()=>{(item.pdfs||[]).forEach(p=>{idbDel('pdfs',String(p.id));});setTrash(null);},8000);
    setTrash({item,sessionsSnapshot:ss,workingSnapshot:ws,timeoutId:tid});
  };
  const undoDelete=()=>{if(!trash)return;clearTimeout(trash.timeoutId);const {item,sessionsSnapshot,workingSnapshot}=trash;setItems(p=>[...p,item]);if(workingSnapshot)setWorkingOn(p=>p.includes(item.id)?p:[...p,item.id]);setTodaySessions(p=>p.map(s=>{const snap=sessionsSnapshot.find(x=>x.sessionId===s.id);if(!snap)return s;const itemIds=snap.hadId&&s.itemIds?[...s.itemIds.filter(x=>x!==item.id),item.id]:s.itemIds;const itemTargets={...(s.itemTargets||{})};if(snap.itemTarget!==undefined)itemTargets[item.id]=snap.itemTarget;return {...s,itemIds,itemTargets};}));setTrash(null);};
  const dismissTrash=()=>{if(!trash)return;clearTimeout(trash.timeoutId);(trash.item.pdfs||[]).forEach(p=>{idbDel('pdfs',String(p.id));});setTrash(null);};

  // ── BPM logging / quick note ──────────────────────────────────────────────
  const BPM_LOG_MAX=200;
  const logTempo=useCallback(()=>{if(!activeItemId)return;const e={ts:Date.now(),bpm:metronome.bpm};if(activeSpotId){setItems(p=>p.map(i=>i.id!==activeItemId?i:{...i,spots:(i.spots||[]).map(s=>s.id===activeSpotId?{...s,bpmLog:[...(s.bpmLog||[]).slice(-BPM_LOG_MAX+1),e]}:s)}));}else{setItems(p=>p.map(i=>i.id===activeItemId?{...i,bpmLog:[...(i.bpmLog||[]).slice(-BPM_LOG_MAX+1),e]}:i));}},[activeItemId,activeSpotId,metronome.bpm]);
  const addQuickNote=useCallback((text)=>{if(!activeItemId||!text.trim())return;const ts=new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});const pre=activeSpot?`(${activeSpot.label}) `:'';const e=`[${ts}] ${pre}${text.trim()}`;setItems(p=>p.map(i=>i.id===activeItemId?{...i,todayNote:(i.todayNote?i.todayNote+'\n':'')+e}:i));},[activeItemId,activeSpot]);

  // ── Note log management ───────────────────────────────────────────────────
  const addNoteLogEntry=(itemId,text,date)=>{const entry={id:mkNoteLogId(),date:date||todayDateStr(),text:text.trim(),source:'manual'};setItems(p=>p.map(i=>i.id===itemId?{...i,noteLog:[...(i.noteLog||[]),entry]}:i));};
  const deleteNoteLogEntry=(itemId,entryId)=>setItems(p=>p.map(i=>i.id===itemId?{...i,noteLog:(i.noteLog||[]).filter(e=>e.id!==entryId)}:i));
  const updateNoteLogEntry=(itemId,entryId,text)=>setItems(p=>p.map(i=>i.id!==itemId?i:{...i,noteLog:(i.noteLog||[]).map(e=>e.id===entryId?{...e,text}:e)}));

  // Also update freeNotes tags on save
  const saveFreeNote=(id,patch)=>{setFreeNotes(prev=>prev.map(n=>{if(n.id!==id)return n;const updated={...n,...patch};if(patch.body!==undefined)updated.tags=parseTagsFromBody(patch.body);return updated;}));};

  // ── Debug: seed test notes ────────────────────────────────────────────────
  const seedTestNotes=()=>{
    const uid=()=>Math.random().toString(36).slice(2,9);
    const raw=[
      {title:'On Intonation — Chromatic Scale Work',date:'2026-04-20',category:'Practice Journal',body:`# Intonation Focus\n\nWorkday 1 of targeted intonation drilling. Main pain points today:\n\n- Descending semitones consistently arrive **sharp** — need more relaxation in the arm weight transfer\n- The \`A♭–G\` semitone in the middle register is particularly slippery\n\n## Method\n\nUsed drone on A, practiced with a tuner displayed — aiming to see the needle before I hear the pitch. Slow bow, near the bridge.\n\n> "Intonation is not a problem of the ear — it is a problem of the body."\n\n[[2026-04-18]] — check yesterday's notes for the arm weight exercise.\n\n#intonation #technique #scale`},
      {title:'Pedaling Philosophy Notes',date:'2026-04-21',category:'Theory Analysis',body:`# Pedal Craft\n\nReturning to the question of harmonic vs. rhythmic pedaling after the masterclass.\n\n## Core Tension\n\n**Harmonic clarity** vs. **tonal warmth** — these are often in conflict.\n\nChopin pedal markings make no sense on a modern Steinway. They were written for instruments with ~2s decay; now decay is 8–10s in the bass.\n\n## Rules I'm testing this week\n\n1. Change pedal *on the melody note*, not the bass\n2. Half-pedal for inner voice movement\n3. Trust resonance in the lower third of the keyboard — don't pedal it away\n\n#pedaling #chopin #interpretation`},
      {title:'Memory Strategy — Structural Mapping',date:'2026-04-22',category:'Practice Journal',body:`# Memorisation Approach\n\nCurrently working on two pieces from memory. Applying **structural mapping**:\n\n## The Method\n\nDivide the piece into:\n- **Macro sections** (A B A′ Coda)\n- **Phrase groups** (4-bar units)\n- **Harmonic waypoints** (I, V, vi, modulation points)\n\nFor each phrase group, I should be able to:\n1. Name the harmonic destination\n2. Play it from any starting point cold\n3. Sing it without the instrument\n\n## Progress\n\n- Mm. 1–32: solid\n- Mm. 33–64: harmonic waypoints learned, fingering still inconsistent\n- Mm. 65–end: NOT started yet\n\n#memorization #practice #structure`},
      {title:'Masterclass Notes — Prof. Chen',date:'2026-04-19',category:'Masterclass Notes',body:`# Masterclass with Prof. Chen\n**April 19, 2026 — Studio 4**\n\n## Key Points\n\n### On Phrasing\nEvery phrase needs a single *destination* note. Everything leads to it, everything departs from it. Currently my phrases feel like *journeys without destinations*.\n\n### On Bow Distribution\n"You have more bow than you think. Use it."\n\nThe tendency is to save bow — this creates a small, tight sound. Trust the full length.\n\n### Specific Correction\nIn the slow movement, mm. 12–16: the ritardando should arrive at the downbeat of m. 17 with **no bow left**. That forces the subsequent phrase to begin quietly.\n\n#masterclass #phrasing #bowcontrol`},
      {title:'Scale Practice Log — Week 17',date:'2026-04-23',category:'Practice Journal',body:`# Scale Log — Week 17\n\n| Scale | BPM | Notes |\n|---|---|---|\n| C major, 3 octaves | 120 | Clean |\n| G minor melodic | 108 | ↓ scale still rough |\n| B♭ major | 116 | Consistent |\n| F# minor harmonic | 96 | Augmented 2nd still awkward |\n\n## Focus for Next Week\n\nG minor and F# minor. Both have issues in the same finger crossing (3→1 in the left hand, ascending).\n\nPractice plan:\n- Slow bow + exaggerated finger independence\n- Rhythmic variants: dotted, reverse dotted\n- Eyes-closed for kinaesthetic feedback\n\n#scale #technique #fingering`},
      {title:'The "Singing Tone" Problem',date:'2026-04-17',category:'Theory Analysis',body:`# On Tone Production\n\nAfter listening back to recordings from [[2026-04-15]], I notice the tone lacks *core*. It sounds pretty but thin — like a fine pencil sketch when I want oils.\n\n## Contributing Factors\n\n1. **Contact point**: too close to the fingerboard; moving toward the bridge next session\n2. **Bow speed**: often too fast — the tone skims rather than grips\n3. **Weight**: relying on bow weight rather than arm weight\n\n## Experiment\n\nTry practicing *sul tasto* for 5 min to relax the bow arm, then immediately move to the bridge. The contrast should reveal the difference in arm engagement.\n\n#tone #bowwork #soundproduction`},
      {title:'Rhythm Accuracy — Subdivisions',date:'2026-04-16',category:'Practice Journal',body:`# Subdivisions\n\nMetronome work today. The goal: feel 16ths internally while playing 8ths.\n\n## Exercises\n\n- **Pizzicato 16ths** → then switch to arco 8ths without changing the internal pulse\n- **"Speak it"**: vocalise the subdivision while playing\n- **Asymmetric groupings**: 3+2+3 and 3+3+2 over a 4/4 bar\n\n## Observation\n\nI rush on the beat immediately *after* a long note. The long note acts as a reset, and I haven't anchored the subdivision through it.\n\nFix: use a **ghost bow** (barely audible) on the last 16th before the long note to maintain the feel.\n\n#rhythm #metronome #technique`},
      {title:'Audition Prep — Program Notes Draft',date:'2026-04-24',category:'Audition Prep',body:`# Program Notes Draft\n\n## Piece 1 — Opening Work\n*For the panel:*\n\nThis opening movement was chosen to demonstrate range of bow technique, from the quiet opening to the dramatic double-stop passage at m. 45. Key challenge: sustaining the pianissimo without loss of resonance.\n\n## Piece 2 — Lyrical Centerpiece  \nThe slow movement provides contrast — here the priority is **melodic line over technical display**. Aim: one continuous phrase from the opening to m. 24.\n\n## Notes for Self\n\n- Don't open with apologies for the venue acoustics\n- Make eye contact with the panel at m. 1 and again at the coda\n- Breathe before playing — actually breathe\n\n#audition #performance #preparation`},
      {title:'Double Stop Tuning — 3rds and 6ths',date:'2026-04-14',category:'Practice Journal',body:`# Double Stop Session\n\n## The Problem\n\nMy 3rds are uneven — the upper note tends sharp when there is a string crossing involved. The 6ths are better but the lower note goes flat in forte passages.\n\n## Today's Work\n\n**Method: "One note at a time"**\n\n1. Play the bottom note alone — verify intonation\n2. Add the top note — listen for the resonance (not the pitch)\n3. If the interval rings, it's in tune. If it "beats," adjust until stillness.\n\n## Scales in 3rds — Observations\n\n- Ascending: flat tendency in upper voice at the string crossing D→E\n- Descending: much more even once I slow down to MM=52\n\nTarget: clean run at MM=72 by end of week.\n\n#doublestops #intonation #stringcrossing`},
      {title:'Quick Idea — Practising in Reverse',date:'2026-04-25',category:'Practice Journal',body:`# Reverse Practice\n\nTried practising a difficult passage **backwards** today (from last note to first, phrase by phrase).\n\n## Why It Works\n\nThe end of a passage is almost never practised as often as the beginning. By working backwards:\n- Every starting point gets equal practice time\n- The difficult moments that usually cause the most anxiety (often toward the end) become the most familiar\n\n## Today's Passage\n\nMm. 45–60 of the Allegro. Started from m. 60, then added m. 58–60, then m. 56–60, etc.\n\n*Result*: the passage felt much more even after 20 minutes — and the final cadence, which I always dreaded, actually felt **easy**.\n\n#practice #method #technique`},
      {title:'Weekly Reflection — Week 17',date:'2026-04-26',category:'Practice Journal',body:`# Week 17 Summary\n\n## What Went Well\n\n- Intonation work is showing measurable improvement — [[2026-04-20]] method is working\n- Finished structural mapping for the first movement (see [[2026-04-22]] for the system)\n- Prof. Chen's advice on bow distribution is already audible in recordings\n\n## What Needs Work\n\n- Still rushing after long notes (#rhythm problem from [[2026-04-16]])\n- Double stop 3rds: not yet clean at target tempo\n- Haven't started memorising mm. 65–end\n\n## Goals for Week 18\n\n1. Mm. 65–end memorised by Thursday\n2. Double stop 3rds at MM=72\n3. Record a full run-through on Friday\n\n#weeklyreview #goals #progress`},
      {title:'Bow Distribution Exercise',date:'2026-04-13',category:'Practice Journal',body:`# Bow Work\n\nFollowing up on Prof. Chen's comment. Today: **full-bow long tones**.\n\n## Exercise\n\nOpen string, whole bow, 4 seconds. Goal: perfect evenness in tone color throughout the stroke. The last 10cm of bow should sound *exactly* like the first 10cm.\n\n## Findings\n\n- The middle section (around the balance point) is the weakest — the arm tends to "fall" here\n- Need more active *lifting* of the elbow in the upper half\n- Lower half: the thumb is gripping — consciously release it every 30 seconds\n\n#bowwork #tone #technique`},
    ];
    const notes=raw.map(n=>({id:`fn_test_${uid()}`,title:n.title,body:n.body,date:n.date,category:n.category||'',tags:parseTagsFromBody(n.body)}));
    setFreeNotes(prev=>[...prev,...notes]);
  };

  // ── PDF management ────────────────────────────────────────────────────────
  // Upload a new file and attach it to an item
  const addPdfToItem=async(id,file,name)=>{
    if(!file)return;
    const libraryId=mkPdfId();
    const attachId=mkAttachId();
    const displayName=name||file.name.replace(/\.pdf$/i,'');
    await idbPut('pdfs',libraryId,file);
    const url=URL.createObjectURL(file);
    setPdfUrlMap(m=>({...m,[libraryId]:url}));
    setPdfLibrary(prev=>[...prev,{id:libraryId,name:displayName}]);
    setItems(p=>p.map(i=>{
      if(i.id!==id)return i;
      const att={id:attachId,libraryId,name:displayName,startPage:null,endPage:null,bookmarks:[]};
      const pdfs=[...(i.pdfs||[]),att];
      const d=i.defaultPdfId||attachId;
      return {...i,pdfs,defaultPdfId:d};
    }));
    return attachId;
  };
  // Attach an existing library PDF to an item (P5)
  const attachLibraryPdf=(itemId,libraryId,name,startPage,endPage)=>{
    const attachId=mkAttachId();
    const libEntry=pdfLibrary.find(e=>e.id===libraryId);
    const displayName=name||libEntry?.name||'Score';
    setItems(p=>p.map(i=>{
      if(i.id!==itemId)return i;
      const att={id:attachId,libraryId,name:displayName,startPage:startPage||null,endPage:endPage||null,bookmarks:[]};
      const pdfs=[...(i.pdfs||[]),att];
      const d=i.defaultPdfId||attachId;
      return {...i,pdfs,defaultPdfId:d};
    }));
    return attachId;
  };
  // Remove an attachment; delete blob only if no other item references the same libraryId
  const removePdfFromItem=async(itemId,attachId)=>{
    const item=items.find(i=>i.id===itemId);
    if(!item)return;
    const att=item.pdfs?.find(p=>p.id===attachId);
    if(!att)return;
    const libraryId=att.libraryId;
    const otherRefs=items.some(i=>i.id!==itemId&&(i.pdfs||[]).some(p=>p.libraryId===libraryId));
    if(!otherRefs){
      await idbDel('pdfs',libraryId);
      setPdfUrlMap(m=>{const c={...m};if(c[libraryId])URL.revokeObjectURL(c[libraryId]);delete c[libraryId];return c;});
      setPdfLibrary(prev=>prev.filter(e=>e.id!==libraryId));
    }
    setItems(p=>p.map(i=>{
      if(i.id!==itemId)return i;
      const pdfs=(i.pdfs||[]).filter(x=>x.id!==attachId);
      const d=i.defaultPdfId===attachId?(pdfs[0]?.id||null):i.defaultPdfId;
      return {...i,pdfs,defaultPdfId:d};
    }));
  };
  const renamePdf=(itemId,attachId,name)=>setItems(p=>p.map(i=>i.id!==itemId?i:{...i,pdfs:i.pdfs.map(x=>x.id===attachId?{...x,name}:x)}));
  const setDefaultPdf=(itemId,attachId)=>setItems(p=>p.map(i=>i.id===itemId?{...i,defaultPdfId:attachId}:i));
  const setPdfPageRange=(itemId,attachId,startPage,endPage)=>setItems(p=>p.map(i=>i.id!==itemId?i:{...i,pdfs:i.pdfs.map(x=>x.id===attachId?{...x,startPage,endPage}:x)}));
  // Bookmark management (P2)
  const addBookmark=(itemId,attachId,name,page)=>{const bm={id:mkBookmarkId(),name,page};setItems(p=>p.map(i=>i.id!==itemId?i:{...i,pdfs:i.pdfs.map(x=>x.id===attachId?{...x,bookmarks:[...(x.bookmarks||[]),bm]}:x)}));return bm.id;};
  const removeBookmark=(itemId,attachId,bmId)=>setItems(p=>p.map(i=>i.id!==itemId?i:{...i,pdfs:i.pdfs.map(x=>x.id===attachId?{...x,bookmarks:(x.bookmarks||[]).filter(b=>b.id!==bmId)}:x)}));
  const renameBookmark=(itemId,attachId,bmId,name)=>setItems(p=>p.map(i=>i.id!==itemId?i:{...i,pdfs:i.pdfs.map(x=>x.id===attachId?{...x,bookmarks:(x.bookmarks||[]).map(b=>b.id===bmId?{...b,name}:b)}:x)}));

  // ── Recording (delegated) ─────────────────────────────────────────────────
  const {startRecording,stopRecording,deleteRecording,startPieceRecording,stopPieceRecording,deletePieceRecording,attachDailyToPiece}=useRecording({dayClosed,recordingMeta,setRecordingMeta,setIsRecording,setConfirmModal,pieceRecordingMeta,setPieceRecordingMeta,setPieceRecordingItemId});

  // ── Session / routine management ──────────────────────────────────────────
  const handleDragStart=(idx)=>setDragIdx(idx);
  const handleDragOver=(e,idx)=>{e.preventDefault();if(idx!==dragOverIdx)setDragOverIdx(idx);};
  const handleDrop=(idx)=>{if(dragIdx===null||dragIdx===idx){setDragIdx(null);setDragOverIdx(null);return;}const a=[...todaySessions];const [m]=a.splice(dragIdx,1);a.splice(idx,0,m);setTodaySessions(a);setDragIdx(null);setDragOverIdx(null);};
  const handleDragEnd=()=>{setDragIdx(null);setDragOverIdx(null);};
  const moveSession=(idx,dir)=>{const a=[...todaySessions];const ni=idx+dir;if(ni<0||ni>=a.length)return;[a[idx],a[ni]]=[a[ni],a[idx]];setTodaySessions(a);};
  const hideSession=(id)=>setTodaySessions(p=>p.filter(s=>s.id!==id));
  const addSessionType=(type)=>setTodaySessions(p=>[...p,{id:`s-${type}-${Date.now()}`,type,itemIds:[],target:null,itemTargets:{},isWarmup:false}]);
  const toggleSessionWarmup=(id)=>setTodaySessions(p=>p.map(s=>s.id===id?{...s,isWarmup:!s.isWarmup}:s));
  const removeItemFromSession=(sid,iid)=>setTodaySessions(p=>p.map(s=>{if(s.id!==sid)return s;const nt={...(s.itemTargets||{})};delete nt[iid];return {...s,itemIds:s.itemIds?s.itemIds.filter(x=>x!==iid):s.itemIds,itemTargets:nt};}));
  const addItemToSession=(sid,iid)=>setTodaySessions(p=>p.map(s=>s.id===sid?{...s,itemIds:[...(s.itemIds||[]),iid]}:s));
  const setSessionTarget=(sid,v)=>setTodaySessions(p=>p.map(s=>s.id===sid?{...s,target:v}:s));
  const setItemTarget=(sid,iid,v)=>setTodaySessions(p=>p.map(s=>{if(s.id!==sid)return s;const nt={...(s.itemTargets||{})};if(v===null||v===undefined)delete nt[iid];else nt[iid]=v;return {...s,itemTargets:nt};}));
  const loadRoutine=(r)=>{setTodaySessions(r.sessions.map((s,i)=>({id:`s-${s.type}-${Date.now()}-${i}`,type:s.type,itemIds:Array.isArray(s.itemIds)?[...s.itemIds]:[],target:typeof s.target==='number'?s.target:null,itemTargets:s.itemTargets?{...s.itemTargets}:{},isWarmup:!!s.isWarmup})));setLoadedRoutineId(r.id);};
  const resetToFree=()=>{setTodaySessions(DEFAULT_SESSIONS.map(s=>({...s,id:`${s.id}-${Date.now()}`,itemTargets:{}})));setLoadedRoutineId(null);};
  const saveRoutine=(name)=>{const nr={id:`r-${Date.now()}`,name,sessions:todaySessions.map(s=>({type:s.type,intention:'',itemIds:Array.isArray(s.itemIds)?[...s.itemIds]:items.filter(i=>i.type===s.type&&i.stage!=='queued').map(i=>i.id),target:s.target??null,itemTargets:{...(s.itemTargets||{})},isWarmup:!!s.isWarmup}))};setRoutines(p=>[...p,nr]);};
  const updateLoadedRoutine=()=>{if(!loadedRoutineId)return;setRoutines(p=>p.map(r=>r.id!==loadedRoutineId?r:{...r,sessions:todaySessions.map(s=>({type:s.type,intention:(r.sessions.find(rs=>rs.type===s.type)||{}).intention||'',itemIds:Array.isArray(s.itemIds)?[...s.itemIds]:[],target:s.target??null,itemTargets:{...(s.itemTargets||{})},isWarmup:!!s.isWarmup}))}));};

  // ── Log drawer ────────────────────────────────────────────────────────────
  const todayHistoryEntry={kind:'day',date:todayKey,minutes:Math.floor(totalToday/60),warmupMinutes:Math.floor(warmupTimeToday/60),items:buildHistoryItems(itemTimes,items),reflection:dailyReflection};
  const openLogEntry=(e)=>{setLogDrawerEntry(e);setLogDrawerDate(e.kind==='day'?e.date:e.kind==='week'?e.weekStart:e.month);};
  const closeLogDrawer=()=>{setLogDrawerDate(null);setLogDrawerEntry(null);};
  const resolveDayEntry=(date)=>{if(date===todayKey)return todayHistoryEntry;return history.find(h=>(h.kind==='day'||!h.kind)&&h.date===date);};

  // ── Import/export (delegated) ─────────────────────────────────────────────
  const {exportLog,exportJson,importJsonFile,handleChipDrag,handleChipDragEnd}=useImportExport({
    todayKey,items,itemTimes,warmupTimeToday,restToday,workingOn,todaySessions,loadedRoutineId,routines,
    dailyReflection,weekReflection,monthReflection,settings,freeNotes,recordingMeta,history,dayClosed,
    pdfUrlMap,todayHistoryEntry,
    setItems,setItemTimes,setWarmupTimeToday,setRestToday,setWorkingOn,setTodaySessions,setLoadedRoutineId,
    setRoutines,setDailyReflection,setWeekReflection,setMonthReflection,setSettings,setFreeNotes,
    setRecordingMeta,setHistory,setDayClosed,setPdfUrlMap,
    setActiveItemId,setActiveSpotId,setActiveSessionId,setIsResting,setExpandedItemId,setPdfDrawerItemId,
    setRestoreBusy,setExportMenu,setConfirmModal,importInputRef,
  });

  // ── Cloud sync effects ─────────────────────────────────────────────────────
  const applyCloudStateRef=useRef(null);
  applyCloudStateRef.current=(s)=>{if(!s)return;setItems(migrateItems(s.items||[]));setRoutines(migrateRoutines(s.routines||[]));setPrograms(s.programs||[]);setHistory(migrateHistory(s.history||[]));setSettings(s.settings||{dailyTarget:90,weeklyTarget:600,monthlyTarget:2400});setDailyReflection(s.dailyReflection||'');setWeekReflection(s.weekReflection||{notes:'',goals:''});setMonthReflection(s.monthReflection||{notes:'',goals:''});setFreeNotes(s.freeNotes||[]);setRecordingMeta(s.recordingMeta||{});setWorkingOn(s.workingOn||[]);setTodaySessions([...migrateSessions(s.todaySessions||DEFAULT_SESSIONS).map(s=>({...s,itemIds:s.itemIds===null?[]:s.itemIds}))].sort((a,b)=>TYPES.indexOf(a.type)-TYPES.indexOf(b.type)));setDayClosed(!!s.dayClosed);setLoadedRoutineId(s.loadedRoutineId||null);setWarmupTimeToday(s.warmupTimeToday||0);setItemTimes(s.itemTimes||{});setRestToday(s.restToday||0);};
  // Load or first-run migration on sign-in
  useEffect(()=>{if(!user)return;(async()=>{try{setSyncStatus('syncing');const result=await loadFromCloud(user.id);

    // ── Real network/RLS error — do not touch local data ──
    if(result.kind==='error'){setSyncStatus('error');return;}

    // ── First sign-in ever: no cloud row yet ──
    if(result.kind==='not_found'){
      setConfirmModal({message:'Upload your existing data to your account?\n\nYour practice history, repertoire, and settings will be stored securely and available on all your devices.',confirmLabel:'Upload',onConfirm:async()=>{setConfirmModal(null);await syncToCloud(user.id,syncStateRef.current);setSyncStatus('idle');},onCancel:()=>{setConfirmModal(null);setSyncStatus('idle');}});
      return;
    }

    // ── Cloud row exists ──
    const remoteState=result.state||{};
    const remoteItems=remoteState.items||[];
    const localItems=syncStateRef.current.items||[];
    const localHistory=syncStateRef.current.history||[];

    // Device has no meaningful local data — just apply cloud directly
    const localEmpty=localItems.length===0&&localHistory.length===0;
    if(localEmpty){applyCloudStateRef.current(remoteState);setLastSyncedAt(Date.now());setSyncStatus('idle');return;}

    // Device has local data: check if it was mutated since last confirmed cloud sync
    const lastCloudSync=lsGet(LS_CLOUD_SYNC_KEY,0);
    const localDirtyAt=lsGet('etudes-localDirtyAt',0);
    const localDirty=lastCloudSync===0||localDirtyAt>lastCloudSync;

    if(!localDirty){
      // Local matches last sync — safe to pull remote
      applyCloudStateRef.current(remoteState);setLastSyncedAt(Date.now());setSyncStatus('idle');return;
    }

    // Both sides have data and local has unsaved changes — decide what to do
    const remoteIds=new Set(remoteItems.map(i=>i.id));
    const localIds=new Set(localItems.map(i=>i.id));
    const localOnlyItems=localItems.filter(i=>!remoteIds.has(i.id));
    const remoteOnlyItems=remoteItems.filter(i=>!localIds.has(i.id));
    const hasOverlap=localItems.some(i=>remoteIds.has(i.id)&&remoteItems.find(r=>r.id===i.id&&JSON.stringify(r)!==JSON.stringify(i)));

    // No conflicting ids on either side — auto-merge silently, no user decision needed
    if(!hasOverlap&&(localOnlyItems.length===0||remoteOnlyItems.length===0)){
      if(remoteOnlyItems.length>0){
        // Remote has items local doesn't — merge in remote's extras
        const merged=mergeStates(syncStateRef.current,remoteState);
        applyCloudStateRef.current(merged);await syncToCloud(user.id,merged);
      }
      setLastSyncedAt(Date.now());setSyncStatus('idle');return;
    }

    // Conflict: both sides have data that differs — give user a choice
    pendingRemoteRef.current=remoteState;
    setSyncConflictModal({
      localCount:localOnlyItems.length||localItems.length,
      remoteCount:remoteOnlyItems.length||remoteItems.length,
      hasOverlap,
      onMerge:async()=>{const merged=mergeStates(syncStateRef.current,pendingRemoteRef.current);applyCloudStateRef.current(merged);await syncToCloud(user.id,merged);setLastSyncedAt(Date.now());setSyncStatus('idle');setSyncConflictModal(null);},
      onKeepLocal:async()=>{await syncToCloud(user.id,syncStateRef.current);setLastSyncedAt(Date.now());setSyncStatus('idle');setSyncConflictModal(null);},
      onKeepCloud:()=>{applyCloudStateRef.current(pendingRemoteRef.current);setLastSyncedAt(Date.now());setSyncStatus('idle');setSyncConflictModal(null);},
    });
  }catch{setSyncStatus('error');}})();},[user]);// eslint-disable-line
  // Debounced cold-state sync (5 s)
  useEffect(()=>{if(!user)return;const t=setTimeout(doSync,5000);return()=>clearTimeout(t);},[coldState,user]);// eslint-disable-line
  // Flush on tab hide and reconnect
  useEffect(()=>{const onHide=()=>{if(document.visibilityState!=='hidden')return;doSync();};const onOnline=()=>doSync();document.addEventListener('visibilitychange',onHide);window.addEventListener('online',onOnline);return()=>{document.removeEventListener('visibilitychange',onHide);window.removeEventListener('online',onOnline);};},[]);// eslint-disable-line

  // ── Keyboard shortcuts (delegated) ────────────────────────────────────────
  useKeyboardShortcuts({
    activeItemId,activeSpotId,activeSessionId,workingOn,items,view,todaySessions,isResting,
    showHelp,showSettings,pdfDrawerItemId,logDrawerDate,promptModal,confirmModal,exportMenu,
    quickNoteOpen,logTempo,dayClosed,editingTimeItemId,droneExpanded,metroExpanded,
    startItem,stopItem,toggleRest,toggleDrone,handleTap,
    setShowHelp,setShowSettings,setPdfDrawerItemId,closeLogDrawer,setPromptModal,setConfirmModal,
    setExportMenu,setQuickNoteOpen,setEditingTimeItemId,setDroneExpanded,setMetroExpanded,setMetronome,
    sessionRefs,lastActiveRef,
  });

  // ── Return everything ─────────────────────────────────────────────────────
  return {
    view,setView,showSettings,setShowSettings,showHelp,setShowHelp,
    exportMenu,setExportMenu,confirmModal,setConfirmModal,promptModal,setPromptModal,syncConflictModal,
    quickNoteOpen,setQuickNoteOpen,restoreBusy,
    expandedItemId,setExpandedItemId,pdfDrawerItemId,setPdfDrawerItemId,
    logDrawerDate,logDrawerEntry,editingTimeItemId,setEditingTimeItemId,
    dragIdx,dragOverIdx,
    storageMode,storageQuotaHit,setStorageQuotaHit,
    items,setItems,itemTimes,warmupTimeToday,restToday,workingOn,
    todaySessions,setTodaySessions,loadedRoutineId,routines,setRoutines,
    dailyReflection,setDailyReflection,weekReflection,setWeekReflection,
    monthReflection,setMonthReflection,settings,setSettings,
    freeNotes,setFreeNotes,noteCategories,setNoteCategories,recordingMeta,history,dayClosed,trash,
    activeItemId,activeSpotId,activeSessionId,activeItem,activeSpot,activeIsWarmup,
    isResting,isRecording,recExpanded,setRecExpanded,
    metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,
    drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,
    sessionRefs,reflectionRef,importInputRef,
    totalToday,effectiveTotalToday,sectionTimes,
    weekActualSeconds,monthActualSeconds,streak,
    todayKey,pdfItem,loadedRoutine,todayHistoryEntry,
    fmt,fmtMin,
    updateItem,addItem,startItem,stopItem,toggleWorking,toggleRest,
    editItemTime,editSpotTime,
    addSpot,updateSpot,deleteSpot,moveSpot,
    addPerformance,updatePerformance,deletePerformance,
    closeDay,reopenDay,endDay,
    deleteItem,undoDelete,dismissTrash,
    logTempo,addQuickNote,
    addNoteLogEntry,deleteNoteLogEntry,updateNoteLogEntry,saveFreeNote,seedTestNotes,
    pdfLibrary,pdfUrlMap,
    addPdfToItem,attachLibraryPdf,removePdfFromItem,renamePdf,setDefaultPdf,setPdfPageRange,
    addBookmark,removeBookmark,renameBookmark,
    startRecording,stopRecording,deleteRecording,
    pieceRecordingMeta,pieceRecordingItemId,startPieceRecording,stopPieceRecording,deletePieceRecording,attachDailyToPiece,
    handleDragStart,handleDragOver,handleDrop,handleDragEnd,
    moveSession,hideSession,addSessionType,toggleSessionWarmup,
    removeItemFromSession,addItemToSession,setSessionTarget,setItemTarget,
    programs,setPrograms,
    loadRoutine,resetToFree,saveRoutine,updateLoadedRoutine,
    openLogEntry,closeLogDrawer,resolveDayEntry,
    exportLog,exportJson,importJsonFile,
    handleChipDrag,handleChipDragEnd,
    handleTap,
    user,signIn,signUp,signOut,syncStatus,lastSyncedAt,syncNow:doSync,
  };
}
