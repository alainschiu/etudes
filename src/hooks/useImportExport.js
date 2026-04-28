import {useRef,useEffect} from 'react';
import {APP_VERSION,SCHEMA_VERSION,TYPES,SECTION_CONFIG,DEFAULT_SESSIONS,ROLLOVER_KEY,WEEK_ROLLOVER_KEY,MONTH_ROLLOVER_KEY} from '../constants/config.js';
import {idbPut,idbDel,idbGet,idbAllKeys,lsGet,lsSet} from '../lib/storage.js';
import {blobToBase64,base64ToBlob,triggerDownload} from '../lib/media.js';
import {todayDateStr,getWeekStart,getMonthKey} from '../lib/dates.js';
import {formatForMarkdown,resolveHistoryItem,buildHistoryItems} from '../lib/items.js';
import {migrateImport,migrateItems,migrateSessions,migrateRoutines,migrateHistory} from '../lib/migrations.js';

export default function useImportExport({
  todayKey,items,itemTimes,warmupTimeToday,restToday,workingOn,todaySessions,loadedRoutineId,routines,
  dailyReflection,weekReflection,monthReflection,settings,freeNotes,recordingMeta,history,dayClosed,
  pieceRecordingMeta,noteCategories,refTrackMeta,
  pdfUrlMap,todayHistoryEntry,
  setItems,setItemTimes,setWarmupTimeToday,setRestToday,setWorkingOn,setTodaySessions,setLoadedRoutineId,
  setRoutines,setDailyReflection,setWeekReflection,setMonthReflection,setSettings,setFreeNotes,
  setRecordingMeta,setHistory,setDayClosed,setPdfUrlMap,
  setPieceRecordingMeta,setNoteCategories,setRefTrackMeta,
  setLocalPieceRecordingIds,setLocalRefTrackIds,
  setActiveItemId,setActiveSpotId,setActiveSessionId,setIsResting,setExpandedItemId,setPdfDrawerItemId,
  setRestoreBusy,setExportMenu,setConfirmModal,
  importInputRef,
}){

  const buildLogString=(format)=>{
    const days=[...history.filter(h=>h.kind==='day'||!h.kind)];
    if(todayHistoryEntry.minutes>0||todayHistoryEntry.items.length>0||todayHistoryEntry.reflection.trim())days.push(todayHistoryEntry);
    days.sort((a,b)=>b.date.localeCompare(a.date));
    const md=format==='md';const L=[];
    L.push(md?'# Études — Practice Journal':'ÉTUDES — PRACTICE JOURNAL');L.push(md?`_Exported ${todayKey}_`:`Exported ${todayKey}`);L.push('');
    if(days.length===0)L.push(md?'_No sessions yet._':'No sessions yet.');
    for(const s of days){
      if(!s.minutes&&!s.reflection?.trim()&&(!s.items||s.items.length===0))continue;
      const d=new Date(s.date);const wd=d.toLocaleDateString('en-US',{weekday:'long'});const dl=d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
      const wn=s.warmupMinutes?` · ${s.warmupMinutes} min warm-up`:'';
      L.push('');L.push(md?'---':'================================');L.push('');
      L.push(md?`# Daily Journal — ${s.date}`:`DAILY JOURNAL — ${s.date}`);
      L.push(md?`_${wd}, ${dl} · ${s.minutes} min total${wn}_`:`${wd}, ${dl} · ${s.minutes} min total${wn}`);L.push('');
      const g={tech:[],piece:[],play:[],study:[]};
      (s.items||[]).forEach(e=>{const r=resolveHistoryItem(e,items);if(r&&g[r.type])g[r.type].push({it:r,minutes:e.minutes,note:e.note||'',spotMinutes:e.spotMinutes||{},spotsSnapshot:e.spotsSnapshot||[]});});
      for(const t of TYPES){const list=g[t];if(!list||list.length===0)continue;const total=list.reduce((a,b)=>a+b.minutes,0);L.push(md?`## ${SECTION_CONFIG[t].label} (${total} min)`:`${SECTION_CONFIG[t].label.toUpperCase()} (${total} min)`);L.push('');
        for(const {it,minutes,note,spotMinutes,spotsSnapshot} of list){const name=formatForMarkdown(it);
          if(md){L.push(`### ${name}`);L.push(`_${minutes} min_`);if(spotsSnapshot?.length){for(const sp of spotsSnapshot){const sm=spotMinutes[sp.id]||0;if(sm>0)L.push(`- ${sp.label}: _${sm} min_`);}}if(note)L.push(note);L.push('');}
          else{L.push(`  ${name} (${minutes} min)`);if(spotsSnapshot?.length){for(const sp of spotsSnapshot){const sm=spotMinutes[sp.id]||0;if(sm>0)L.push(`    · ${sp.label} (${sm} min)`);}}if(note)note.split('\n').forEach(l=>L.push(`    ${l}`));}
        }}
      if(s.reflection){L.push(md?'## Reflection':'REFLECTION');L.push('');L.push(s.reflection);L.push('');}
    }
    const weeks=history.filter(h=>h.kind==='week').sort((a,b)=>b.weekStart.localeCompare(a.weekStart));
    const months=history.filter(h=>h.kind==='month').sort((a,b)=>b.month.localeCompare(a.month));
    if(weeks.length||months.length){L.push('');L.push(md?'---':'================================');L.push('');L.push(md?'# Weekly & Monthly Reflections':'WEEKLY & MONTHLY REFLECTIONS');L.push('');}
    for(const w of weeks){L.push(md?`## Week of ${w.weekStart}`:`WEEK OF ${w.weekStart}`);if(w.notes){L.push(md?'**Notes**':'NOTES');L.push(w.notes);L.push('');}if(w.goals){L.push(md?'**Goals**':'GOALS');L.push(w.goals);L.push('');}}
    for(const mo of months){L.push(md?`## ${mo.month}`:mo.month);if(mo.notes){L.push(md?'**Notes**':'NOTES');L.push(mo.notes);L.push('');}if(mo.goals){L.push(md?'**Goals**':'GOALS');L.push(mo.goals);L.push('');}}
    return L.join('\n');
  };

  const exportLog=(fmt)=>{const c=buildLogString(fmt);const b=new Blob([c],{type:fmt==='md'?'text/markdown':'text/plain'});triggerDownload(b,`etudes-journal-${todayKey}.${fmt==='md'?'md':'txt'}`);setExportMenu(false);};

  const exportJson=async()=>{
    try{
      setRestoreBusy(true);
      const pk=await idbAllKeys('pdfs');const pb={};for(const k of pk){const b=await idbGet('pdfs',k);if(b)pb[String(k)]=await blobToBase64(b);}
      const rk=await idbAllKeys('recordings');const rb={};for(const k of rk){const b=await idbGet('recordings',k);if(b)rb[String(k)]=await blobToBase64(b);}
      const prk=await idbAllKeys('pieceRecordings');const prb={};for(const k of prk){const b=await idbGet('pieceRecordings',k);if(b)prb[String(k)]=await blobToBase64(b);}
      const rtk=await idbAllKeys('refTracks');const rtb={};for(const k of rtk){const b=await idbGet('refTracks',k);if(b)rtb[String(k)]={d:await blobToBase64(b),t:b.type||'audio/mpeg'};}
      const payload={app:'Etudes',appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,exportedAt:new Date().toISOString(),state:{items:items.map(i=>{const {pdfUrl,...r}=i;return r;}),itemTimes,warmupTimeToday,restToday,workingOn,todaySessions,loadedRoutineId,routines,dailyReflection,weekReflection,monthReflection,settings,freeNotes,recordingMeta,pieceRecordingMeta,noteCategories,refTrackMeta,history,dayClosed,rolloverKeys:{day:lsGet(ROLLOVER_KEY,null),week:lsGet(WEEK_ROLLOVER_KEY,null),month:lsGet(MONTH_ROLLOVER_KEY,null)}},blobs:{pdfs:pb,recordings:rb,pieceRecordings:prb,refTracks:rtb}};
      const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
      triggerDownload(blob,`etudes-backup-${todayKey}.json`);setExportMenu(false);
    }catch(e){setConfirmModal({message:'Export failed: '+(e.message||'unknown error'),confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});}
    finally{setRestoreBusy(false);}
  };

  const applyImport=async(data)=>{
    try{
      setRestoreBusy(true);
      const npb={};for(const [k,b] of Object.entries(data.blobs?.pdfs||{})){const bl=base64ToBlob(b,'application/pdf');if(bl)npb[k]=bl;}
      const nrb={};for(const [k,b] of Object.entries(data.blobs?.recordings||{})){const bl=base64ToBlob(b,'audio/webm');if(bl)nrb[k]=bl;}
      const nprb={};for(const [k,b] of Object.entries(data.blobs?.pieceRecordings||{})){const bl=base64ToBlob(b,'audio/webm');if(bl)nprb[k]=bl;}
      const nrtb={};for(const [k,v] of Object.entries(data.blobs?.refTracks||{})){const entry=typeof v==='object'?v:{d:v,t:'audio/mpeg'};const bl=base64ToBlob(entry.d,entry.t||'audio/mpeg');if(bl)nrtb[k]=bl;}
      Object.values(pdfUrlMap).forEach(u=>{try{URL.revokeObjectURL(u);}catch{}});
      for(const k of await idbAllKeys('pdfs'))await idbDel('pdfs',k);
      for(const k of await idbAllKeys('recordings'))await idbDel('recordings',k);
      for(const k of await idbAllKeys('pieceRecordings'))await idbDel('pieceRecordings',k);
      for(const k of await idbAllKeys('refTracks'))await idbDel('refTracks',k);
      const newUrl={};for(const [k,b] of Object.entries(npb)){await idbPut('pdfs',k,b);newUrl[k]=URL.createObjectURL(b);}
      for(const [k,b] of Object.entries(nrb)){await idbPut('recordings',k,b);}
      for(const [k,b] of Object.entries(nprb)){await idbPut('pieceRecordings',k,b);}
      for(const [k,b] of Object.entries(nrtb)){await idbPut('refTracks',k,b);}
      const st=data.state||{};
      const importedRecKeys=new Set(Object.keys(nrb));
      const reconciledMeta=Object.fromEntries(Object.entries(st.recordingMeta||{}).filter(([k])=>importedRecKeys.has(k)));
      setItems(migrateItems(st.items||[]));setItemTimes(st.itemTimes||{});setWarmupTimeToday(st.warmupTimeToday||0);setRestToday(st.restToday||0);setWorkingOn(Array.isArray(st.workingOn)?st.workingOn:[]);setTodaySessions(migrateSessions(st.todaySessions||DEFAULT_SESSIONS));setLoadedRoutineId(st.loadedRoutineId||null);setRoutines(migrateRoutines(st.routines||[]));setDailyReflection(st.dailyReflection||'');setWeekReflection(st.weekReflection||{notes:'',goals:''});setMonthReflection(st.monthReflection||{notes:'',goals:''});setSettings(st.settings||{dailyTarget:90,weeklyTarget:600,monthlyTarget:2400});setFreeNotes(Array.isArray(st.freeNotes)?st.freeNotes:[]);setNoteCategories(Array.isArray(st.noteCategories)?st.noteCategories:[]);setRecordingMeta(reconciledMeta);setPieceRecordingMeta(st.pieceRecordingMeta||{});setRefTrackMeta(st.refTrackMeta||{});setHistory(migrateHistory(st.history||[]));setDayClosed(!!st.dayClosed);setPdfUrlMap(newUrl);
      setLocalPieceRecordingIds(new Set(Object.keys(nprb).map(k=>k.split('__')[0])));
      setLocalRefTrackIds(new Set(Object.keys(nrtb)));
      setActiveItemId(null);setActiveSpotId(null);setActiveSessionId(null);setIsResting(false);setExpandedItemId(null);setPdfDrawerItemId(null);
      if(st.rolloverKeys?.day)lsSet(ROLLOVER_KEY,st.rolloverKeys.day);else lsSet(ROLLOVER_KEY,todayDateStr());
      if(st.rolloverKeys?.week)lsSet(WEEK_ROLLOVER_KEY,st.rolloverKeys.week);else lsSet(WEEK_ROLLOVER_KEY,getWeekStart(todayDateStr()));
      if(st.rolloverKeys?.month)lsSet(MONTH_ROLLOVER_KEY,st.rolloverKeys.month);else lsSet(MONTH_ROLLOVER_KEY,getMonthKey(todayDateStr()));
      setRestoreBusy(false);setConfirmModal({message:'Backup restored successfully.',confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});
    }catch(e){setRestoreBusy(false);setConfirmModal({message:'Restore failed: '+(e.message||'unknown error'),confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});}
  };

  const readImport=(file)=>{
    setRestoreBusy(true);
    const r=new FileReader();
    r.onload=(e)=>{
      setRestoreBusy(false);
      try{
        const parsed=JSON.parse(e.target.result);
        if(parsed.app!=='Etudes')throw new Error('Not an Études backup file.');
        if(typeof parsed.schemaVersion!=='number')throw new Error('Invalid backup file: missing schema version.');
        const m=migrateImport(parsed);const st=m.state||{};
        const ic=(st.items||[]).length;const rc=(st.routines||[]).length;const hd=(st.history||[]).filter(h=>h.kind==='day'||!h.kind).length;const we=(st.history||[]).filter(h=>h.kind==='week').length;const me=(st.history||[]).filter(h=>h.kind==='month').length;const pc=Object.keys(m.blobs?.pdfs||{}).length;const rec=Object.keys(m.blobs?.recordings||{}).length;const prec=Object.keys(m.blobs?.pieceRecordings||{}).length;const rt=Object.keys(m.blobs?.refTracks||{}).length;const nc=(st.freeNotes||[]).length;const es=m.exportedAt?m.exportedAt.slice(0,10):'unknown';
        const sum=[`Replace all current data with this backup?`,``,`${ic} repertoire item${ic===1?'':'s'}`,`${rc} routine${rc===1?'':'s'}`,`${hd} day${hd===1?'':'s'} of practice history`,`${we} weekly · ${me} monthly reflections`,`${pc} PDF${pc===1?'':'s'} · ${rec} day recording${rec===1?'':'s'} · ${prec} piece recording${prec===1?'':'s'} · ${rt} ref track${rt===1?'':'s'} · ${nc} free note${nc===1?'':'s'}`,``,`Exported ${es} (schema v${m.schemaVersion||1})`,``,`This will overwrite everything and cannot be undone.`].join('\n');
        setConfirmModal({message:sum,confirmLabel:'Replace everything',onConfirm:async()=>{setConfirmModal(null);await applyImport(m);}});
      }catch(err){setConfirmModal({message:'Could not read backup file: '+(err.message||'invalid format'),confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});}
    };
    r.onerror=()=>{setRestoreBusy(false);setConfirmModal({message:'Could not read file.',confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});};
    r.readAsText(file);
  };

  const importJsonFile=(file)=>{
    const MAX=200*1024*1024;
    if(file.size>MAX){setConfirmModal({message:`File is ${Math.round(file.size/1024/1024)}MB. Proceed?`,confirmLabel:'Proceed',onConfirm:()=>{setConfirmModal(null);readImport(file);}});return;}
    readImport(file);
  };

  // Drag chip (.md export)
  const dragChipUrlRef=useRef(null);
  const handleChipDrag=(e)=>{try{const c=buildLogString('md');const fn=`etudes-journal-${todayKey}.md`;const b=new Blob([c],{type:'text/markdown'});if(dragChipUrlRef.current){try{URL.revokeObjectURL(dragChipUrlRef.current);}catch{}}const u=URL.createObjectURL(b);dragChipUrlRef.current=u;e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('DownloadURL',`text/markdown:${fn}:${u}`);e.dataTransfer.setData('text/plain',c);e.dataTransfer.setData('text/uri-list',u);}catch{}};
  const handleChipDragEnd=()=>{const u=dragChipUrlRef.current;if(u){setTimeout(()=>{try{URL.revokeObjectURL(u);}catch{}},60000);dragChipUrlRef.current=null;}};
  useEffect(()=>()=>{if(dragChipUrlRef.current){try{URL.revokeObjectURL(dragChipUrlRef.current);}catch{}}},[]);

  return {exportLog,exportJson,importJsonFile,handleChipDrag,handleChipDragEnd,buildLogString};
}
