import {useState,useEffect,useRef,useMemo,useCallback} from 'react';
import {DEFAULT_SESSIONS,ROLLOVER_KEY,WEEK_ROLLOVER_KEY,MONTH_ROLLOVER_KEY} from '../constants/config.js';
import {idbPut,idbDel,idbGet,idbAllKeys,storageAvailable,detectStorage,lsGet,lsSet} from '../lib/storage.js';
import {useSupabaseAuth} from '../lib/useSupabaseAuth.js';
import {loadFromCloud,syncToCloud,mergeStates} from '../lib/sync.js';
import {todayDateStr,shiftDate,getWeekStart,getMonthKey} from '../lib/dates.js';
import {mkPdfId,mkSpotId,mkPerfId,getItemTime,displayTitle,formatByline,buildHistoryItems,makeNewItem,calcStreak} from '../lib/items.js';
import {migrateItems,migrateSessions,migrateRoutines,migrateHistory} from '../lib/migrations.js';
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
  const [todaySessions,setTodaySessions]=useState(()=>migrateSessions(lsGet('etudes-todaySessions',DEFAULT_SESSIONS)));
  const [loadedRoutineId,setLoadedRoutineId]=useState(()=>lsGet('etudes-loadedRoutineId',null));
  const [routines,setRoutines]=useState(()=>migrateRoutines(lsGet('etudes-routines',[])));
  const [programs,setPrograms]=useState(()=>lsGet('etudes-programs',[]));
  const [dailyReflection,setDailyReflection]=useState(()=>lsGet('etudes-dailyReflection',''));
  const [weekReflection,setWeekReflection]=useState(()=>lsGet('etudes-weekReflection',{notes:'',goals:''}));
  const [monthReflection,setMonthReflection]=useState(()=>lsGet('etudes-monthReflection',{notes:'',goals:''}));
  const [settings,setSettings]=useState(()=>lsGet('etudes-settings',{dailyTarget:90,weeklyTarget:600,monthlyTarget:2400}));
  const [freeNotes,setFreeNotes]=useState(()=>lsGet('etudes-freeNotes',[]));
  const [recordingMeta,setRecordingMeta]=useState(()=>lsGet('etudes-recordingMeta',{}));
  const [history,setHistory]=useState(()=>migrateHistory(lsGet('etudes-history',[])));
  const [dayClosed,setDayClosed]=useState(()=>lsGet('etudes-dayClosed',false));
  const [pdfUrlMap,setPdfUrlMap]=useState({});
  const [trash,setTrash]=useState(null);

  useEffect(()=>{lsSet('etudes-items',items.map(i=>{const {pdfUrl,...r}=i;return r;}));},[items]);
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
  useEffect(()=>{lsSet('etudes-recordingMeta',recordingMeta);},[recordingMeta]);
  useEffect(()=>{lsSet('etudes-history',history);},[history]);
  useEffect(()=>{lsSet('etudes-dayClosed',dayClosed);},[dayClosed]);
  useEffect(()=>{lsSet('etudes-lastSyncedAt',Date.now());},[items,routines,programs,history,settings,dailyReflection,weekReflection,monthReflection,freeNotes,recordingMeta,workingOn,todaySessions,dayClosed,loadedRoutineId,warmupTimeToday]);

  // ── Active item / session tracking ────────────────────────────────────────
  const [activeItemId,setActiveItemId]=useState(null);
  const [activeSpotId,setActiveSpotId]=useState(null);
  const [activeSessionId,setActiveSessionId]=useState(null);
  const lastActiveRef=useRef({itemId:null,spotId:null,sessionId:null});
  useEffect(()=>{if(activeItemId)lastActiveRef.current={itemId:activeItemId,spotId:activeSpotId,sessionId:activeSessionId};},[activeItemId,activeSpotId,activeSessionId]);

  // ── Rest / recording state ────────────────────────────────────────────────
  const [isResting,setIsResting]=useState(false);
  const [isRecording,setIsRecording]=useState(false);

  // ── Sub-hooks ─────────────────────────────────────────────────────────────
  const metro=useMetronome();
  const {metronome,setMetronome,metroExpanded,setMetroExpanded,currentBeat,currentSub,drone,setDrone,droneExpanded,setDroneExpanded,toggleDrone,handleTap}=metro;
  const {user,signIn,signUp,signOut}=useSupabaseAuth();
  const userRef=useRef(null);
  useEffect(()=>{userRef.current=user;},[user]);
  const [syncStatus,setSyncStatus]=useState('idle'); // 'idle'|'syncing'|'error'
  const [lastSyncedAt,setLastSyncedAt]=useState(()=>lsGet('etudes-lastSyncedAt',0));

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
  useEffect(()=>{let cancelled=false;const urls=[];(async()=>{const keys=await idbAllKeys('pdfs');if(cancelled)return;const keySet=new Set(keys.map(k=>String(k)));const urlsById={};for(const key of keys){const blob=await idbGet('pdfs',key);if(cancelled)return;if(blob){const u=URL.createObjectURL(blob);urlsById[String(key)]=u;urls.push(u);}}if(cancelled){urls.forEach(u=>URL.revokeObjectURL(u));return;}setPdfUrlMap(urlsById);setItems(prev=>prev.map(i=>{if(!i.pdfs||i.pdfs.length===0)return i;const f=i.pdfs.filter(p=>keySet.has(String(p.id)));if(f.length===i.pdfs.length&&i.defaultPdfId&&keySet.has(String(i.defaultPdfId)))return i;const d=f.some(p=>p.id===i.defaultPdfId)?i.defaultPdfId:(f[0]?.id||null);return {...i,pdfs:f,defaultPdfId:d};}));})();return()=>{cancelled=true;};},[]);// eslint-disable-line react-hooks/exhaustive-deps

  // ── Rollover / history snapshot ───────────────────────────────────────────
  useEffect(()=>{if(!lsGet(WEEK_ROLLOVER_KEY,null))lsSet(WEEK_ROLLOVER_KEY,getWeekStart(todayDateStr()));if(!lsGet(MONTH_ROLLOVER_KEY,null))lsSet(MONTH_ROLLOVER_KEY,getMonthKey(todayDateStr()));},[]);
  const rolloverRef=useRef({totalToday,warmupTimeToday,itemTimes,items,dailyReflection,weekReflection,monthReflection});
  useEffect(()=>{rolloverRef.current={totalToday,warmupTimeToday,itemTimes,items,dailyReflection,weekReflection,monthReflection};});

  // ── Cloud sync state ──────────────────────────────────────────────────────
  const coldState=useMemo(()=>({items,routines,programs,history,settings,dailyReflection,weekReflection,monthReflection,freeNotes,recordingMeta,workingOn,todaySessions,dayClosed,loadedRoutineId,warmupTimeToday}),[items,routines,programs,history,settings,dailyReflection,weekReflection,monthReflection,freeNotes,recordingMeta,workingOn,todaySessions,dayClosed,loadedRoutineId,warmupTimeToday]);
  const syncStateRef=useRef({});
  useEffect(()=>{syncStateRef.current={...coldState,itemTimes,restToday};});
  const doSync=useCallback(async()=>{if(!userRef.current)return;setSyncStatus('syncing');const ok=await syncToCloud(userRef.current.id,syncStateRef.current);if(ok){setLastSyncedAt(Date.now());setSyncStatus('idle');}else{setSyncStatus('error');}},[]);// eslint-disable-line
  useEffect(()=>{
    const check=()=>{
      const today=todayDateStr();const cw=getWeekStart(today);const cm=getMonthKey(today);
      const ld=lsGet(ROLLOVER_KEY,null),lw=lsGet(WEEK_ROLLOVER_KEY,null),lm=lsGet(MONTH_ROLLOVER_KEY,null);
      const {totalToday:tt,warmupTimeToday:wt,itemTimes:it,items:iv,dailyReflection:dr,weekReflection:wr,monthReflection:mr}=rolloverRef.current;
      if(!ld){lsSet(ROLLOVER_KEY,today);return;}
      if(ld!==today){
        const hi=buildHistoryItems(it,iv);
        const prev={kind:'day',date:ld,minutes:Math.floor(tt/60),warmupMinutes:Math.floor((wt||0)/60),items:hi,reflection:dr||''};
        if(prev.minutes>0||prev.reflection.trim()||prev.items.length>0){setHistory(h=>{const i=h.findIndex(x=>x.kind==='day'&&x.date===ld);if(i>=0){const c=[...h];c[i]=prev;return c;}return [...h,prev];});}
        setRestToday(0);setItemTimes({});setWarmupTimeToday(0);setDailyReflection('');setActiveItemId(null);setActiveSpotId(null);setActiveSessionId(null);setIsResting(false);setDayClosed(false);
        setItems(p=>p.map(i=>i.todayNote?{...i,todayNote:''}:i));
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
  const fmt=(s)=>{s=s||0;const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;if(h)return`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;return`${m}:${String(sec).padStart(2,'0')}`;};
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

  // ── PDF management ────────────────────────────────────────────────────────
  const addPdfToItem=async(id,file,name)=>{if(!file)return;const pid=mkPdfId();await idbPut('pdfs',pid,file);const url=URL.createObjectURL(file);setPdfUrlMap(m=>({...m,[pid]:url}));setItems(p=>p.map(i=>{if(i.id!==id)return i;const pdfs=[...(i.pdfs||[]),{id:pid,name:name||file.name.replace(/\.pdf$/i,'')}];const d=i.defaultPdfId||pid;return {...i,pdfs,defaultPdfId:d};}));return pid;};
  const removePdfFromItem=async(id,pid)=>{await idbDel('pdfs',pid);setPdfUrlMap(m=>{const c={...m};if(c[pid])URL.revokeObjectURL(c[pid]);delete c[pid];return c;});setItems(p=>p.map(i=>{if(i.id!==id)return i;const pdfs=(i.pdfs||[]).filter(x=>x.id!==pid);const d=i.defaultPdfId===pid?(pdfs[0]?.id||null):i.defaultPdfId;return {...i,pdfs,defaultPdfId:d};}));};
  const renamePdf=(id,pid,name)=>setItems(p=>p.map(i=>i.id!==id?i:{...i,pdfs:i.pdfs.map(x=>x.id===pid?{...x,name}:x)}));
  const setDefaultPdf=(id,pid)=>setItems(p=>p.map(i=>i.id===id?{...i,defaultPdfId:pid}:i));

  // ── Recording (delegated) ─────────────────────────────────────────────────
  const {startRecording,stopRecording,deleteRecording}=useRecording({dayClosed,recordingMeta,setRecordingMeta,setIsRecording,setConfirmModal});

  // ── Session / routine management ──────────────────────────────────────────
  const handleDragStart=(idx)=>setDragIdx(idx);
  const handleDragOver=(e,idx)=>{e.preventDefault();if(idx!==dragOverIdx)setDragOverIdx(idx);};
  const handleDrop=(idx)=>{if(dragIdx===null||dragIdx===idx){setDragIdx(null);setDragOverIdx(null);return;}const a=[...todaySessions];const [m]=a.splice(dragIdx,1);a.splice(idx,0,m);setTodaySessions(a);setDragIdx(null);setDragOverIdx(null);};
  const handleDragEnd=()=>{setDragIdx(null);setDragOverIdx(null);};
  const moveSession=(idx,dir)=>{const a=[...todaySessions];const ni=idx+dir;if(ni<0||ni>=a.length)return;[a[idx],a[ni]]=[a[ni],a[idx]];setTodaySessions(a);};
  const hideSession=(id)=>setTodaySessions(p=>p.filter(s=>s.id!==id));
  const addSessionType=(type)=>setTodaySessions(p=>[...p,{id:`s-${type}-${Date.now()}`,type,itemIds:null,target:null,itemTargets:{},isWarmup:false}]);
  const toggleSessionWarmup=(id)=>setTodaySessions(p=>p.map(s=>s.id===id?{...s,isWarmup:!s.isWarmup}:s));
  const removeItemFromSession=(sid,iid)=>setTodaySessions(p=>p.map(s=>{if(s.id!==sid)return s;const nt={...(s.itemTargets||{})};delete nt[iid];return {...s,itemIds:s.itemIds?s.itemIds.filter(x=>x!==iid):s.itemIds,itemTargets:nt};}));
  const addItemToSession=(sid,iid)=>setTodaySessions(p=>p.map(s=>s.id===sid?{...s,itemIds:[...(s.itemIds||[]),iid]}:s));
  const setSessionTarget=(sid,v)=>setTodaySessions(p=>p.map(s=>s.id===sid?{...s,target:v}:s));
  const setItemTarget=(sid,iid,v)=>setTodaySessions(p=>p.map(s=>{if(s.id!==sid)return s;const nt={...(s.itemTargets||{})};if(v===null||v===undefined)delete nt[iid];else nt[iid]=v;return {...s,itemTargets:nt};}));
  const loadRoutine=(r)=>{setTodaySessions(r.sessions.map((s,i)=>({id:`s-${s.type}-${Date.now()}-${i}`,type:s.type,itemIds:Array.isArray(s.itemIds)?[...s.itemIds]:[],target:typeof s.target==='number'?s.target:null,itemTargets:s.itemTargets?{...s.itemTargets}:{},isWarmup:!!s.isWarmup})));setLoadedRoutineId(r.id);};
  const resetToFree=()=>{setTodaySessions(DEFAULT_SESSIONS.map(s=>({...s,id:`${s.id}-${Date.now()}`,itemTargets:{}})));setLoadedRoutineId(null);};
  const saveRoutine=(name)=>{const nr={id:`r-${Date.now()}`,name,sessions:todaySessions.map(s=>({type:s.type,intention:'',itemIds:Array.isArray(s.itemIds)?[...s.itemIds]:items.filter(i=>i.type===s.type&&i.stage!=='queued').map(i=>i.id),target:s.target??null,itemTargets:{...(s.itemTargets||{})},isWarmup:!!s.isWarmup}))};setRoutines(p=>[...p,nr]);};

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
  applyCloudStateRef.current=(s)=>{if(!s)return;setItems(migrateItems(s.items||[]));setRoutines(migrateRoutines(s.routines||[]));setPrograms(s.programs||[]);setHistory(migrateHistory(s.history||[]));setSettings(s.settings||{dailyTarget:90,weeklyTarget:600,monthlyTarget:2400});setDailyReflection(s.dailyReflection||'');setWeekReflection(s.weekReflection||{notes:'',goals:''});setMonthReflection(s.monthReflection||{notes:'',goals:''});setFreeNotes(s.freeNotes||[]);setRecordingMeta(s.recordingMeta||{});setWorkingOn(s.workingOn||[]);setTodaySessions(migrateSessions(s.todaySessions||DEFAULT_SESSIONS));setDayClosed(!!s.dayClosed);setLoadedRoutineId(s.loadedRoutineId||null);setWarmupTimeToday(s.warmupTimeToday||0);setItemTimes(s.itemTimes||{});setRestToday(s.restToday||0);};
  // Load or first-run migration on sign-in
  useEffect(()=>{if(!user)return;(async()=>{try{setSyncStatus('syncing');const remote=await loadFromCloud(user.id);
    // ── First sign-in ever: no cloud data ──
    if(!remote){setConfirmModal({message:'Upload your existing data to your account?\n\nYour practice history, repertoire, and settings will be stored securely and available on all your devices.',confirmLabel:'Upload',onConfirm:async()=>{setConfirmModal(null);await syncToCloud(user.id,syncStateRef.current);setSyncStatus('idle');},onCancel:()=>{setConfirmModal(null);lsSet('etudes-lastSyncedAt',Date.now());setSyncStatus('idle');}});return;}
    // ── Conflict: local has unsynced items AND cloud has different items ──
    const localTs=lsGet('etudes-lastSyncedAt',0);
    const localItems=syncStateRef.current.items||[];
    const remoteItems=remote.state?.items||[];
    const remoteIds=new Set(remoteItems.map(i=>i.id));
    const unsyncedLocal=localItems.filter(i=>!remoteIds.has(i.id));
    if(localTs===0&&unsyncedLocal.length>0&&remoteItems.length>0){
      pendingRemoteRef.current=remote.state;
      setSyncConflictModal({
        localCount:unsyncedLocal.length,
        remoteCount:remoteItems.length,
        onMerge:async()=>{const merged=mergeStates(syncStateRef.current,pendingRemoteRef.current);applyCloudStateRef.current(merged);await syncToCloud(user.id,merged);setSyncStatus('idle');setSyncConflictModal(null);},
        onKeepLocal:async()=>{await syncToCloud(user.id,syncStateRef.current);setSyncStatus('idle');setSyncConflictModal(null);},
        onKeepCloud:()=>{applyCloudStateRef.current(pendingRemoteRef.current);setSyncStatus('idle');setSyncConflictModal(null);},
      });
      return;
    }
    // ── Normal: apply remote if newer ──
    if(remote.updated_at&&new Date(remote.updated_at).getTime()>localTs){applyCloudStateRef.current(remote.state);}
    setSyncStatus('idle');}catch{setSyncStatus('error');}})();},[user]);// eslint-disable-line
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
    freeNotes,setFreeNotes,recordingMeta,history,dayClosed,pdfUrlMap,trash,
    activeItemId,activeSpotId,activeSessionId,activeItem,activeSpot,activeIsWarmup,
    isResting,isRecording,
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
    addPdfToItem,removePdfFromItem,renamePdf,setDefaultPdf,
    startRecording,stopRecording,deleteRecording,
    handleDragStart,handleDragOver,handleDrop,handleDragEnd,
    moveSession,hideSession,addSessionType,toggleSessionWarmup,
    removeItemFromSession,addItemToSession,setSessionTarget,setItemTarget,
    programs,setPrograms,
    loadRoutine,resetToFree,saveRoutine,
    openLogEntry,closeLogDrawer,resolveDayEntry,
    exportLog,exportJson,importJsonFile,
    handleChipDrag,handleChipDragEnd,
    handleTap,
    user,signIn,signUp,signOut,syncStatus,lastSyncedAt,syncNow:doSync,
  };
}
