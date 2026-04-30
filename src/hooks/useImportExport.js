import {useState} from 'react';
import JSZip from 'jszip';
import {APP_VERSION,SCHEMA_VERSION,TYPES,SECTION_CONFIG,DEFAULT_SESSIONS,ROLLOVER_KEY,WEEK_ROLLOVER_KEY,MONTH_ROLLOVER_KEY} from '../constants/config.js';
import {idbPut,idbDel,idbGet,idbAllKeys,lsGet,lsSet} from '../lib/storage.js';
import {blobToBase64,base64ToBlob,triggerDownload} from '../lib/media.js';
import {todayDateStr,getWeekStart,getMonthKey} from '../lib/dates.js';
import {formatForMarkdown,resolveHistoryItem} from '../lib/items.js';
import {migrateImport,migrateItems,migrateSessions,migrateRoutines,migrateHistory,migratePrograms} from '../lib/migrations.js';
import {toSlug,uniqueSlug} from '../lib/slug.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isoToHuman(iso){
  if(!iso)return null;
  const[y,m,d]=iso.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}

function blobExt(blob){
  const t=(blob?.type||'').toLowerCase();
  if(t.includes('webm'))return 'webm';
  if(t.includes('mp4')||t.includes('m4a')||t.includes('aac'))return 'mp4';
  if(t.includes('ogg'))return 'ogg';
  return 'webm';
}

function itemSlug(item,usedSlugs){
  const composerPart=item.composer?toSlug(item.composer):'';
  const titlePart=toSlug(item.title||item.collection||'untitled');
  const base=composerPart?`${composerPart}_${titlePart}`:titlePart;
  return uniqueSlug(base,usedSlugs);
}

// ── Markdown generators ───────────────────────────────────────────────────────

function generateReadme(todayKey){
  return `# Études export — ${todayKey}

This archive contains your complete Études journal.

## Folder structure

- \`journal/\` — daily logs and weekly/monthly reflections
- \`notes/\` — your knowledge base notes
- \`repertoire/\` — pieces and practice items
- \`programs/\` — concert and salon programs
- \`recordings/\` — audio takes (daily and per piece)
- \`scores/\` — PDF scores

## Audio formats

Recordings are in the format your browser's MediaRecorder produces: WebM/Opus on Chrome and Android, MP4/AAC on Safari and iOS. Both are widely supported — VLC plays either.

## Re-import

\`_data.json\` contains the full machine-readable journal. It can be used to restore your data if needed.

## No app required

Every \`.md\` file in this archive is readable in any text editor, markdown viewer, or Obsidian vault.
`;
}

function generateDailyLog(entry,items,todayKey){
  const d=entry.date;
  const[y,m,day]=d.split('-').map(Number);
  const dt=new Date(y,m-1,day);
  const humanDate=dt.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const mins=entry.minutes||0;
  const tech=(entry.items||[]).filter(i=>{const r=resolveHistoryItem(i,items);return r?.type==='tech';});
  const pieces=(entry.items||[]).filter(i=>{const r=resolveHistoryItem(i,items);return r?.type==='piece';});
  const play=(entry.items||[]).filter(i=>{const r=resolveHistoryItem(i,items);return r?.type==='play';});
  const study=(entry.items||[]).filter(i=>{const r=resolveHistoryItem(i,items);return r?.type==='study';});
  const techMin=tech.reduce((a,i)=>a+(i.minutes||0),0);
  const piecesMin=pieces.reduce((a,i)=>a+(i.minutes||0),0);
  const playMin=play.reduce((a,i)=>a+(i.minutes||0),0);
  const studyMin=study.reduce((a,i)=>a+(i.minutes||0),0);

  const lines=[];
  lines.push(`---`);
  lines.push(`type: log`);
  lines.push(`date: ${d}`);
  lines.push(`minutes: ${mins}`);
  lines.push(`sections:`);
  lines.push(`  technique: ${techMin}`);
  lines.push(`  pieces: ${piecesMin}`);
  lines.push(`  play: ${playMin}`);
  lines.push(`  study: ${studyMin}`);
  lines.push(`routine: ${entry.routineName?`"${entry.routineName}"`:'null'}`);
  lines.push(`---`);
  lines.push(``);
  lines.push(`# ${humanDate}`);
  lines.push(``);

  const sectionOrder=[{type:'tech',label:'Technique',list:tech,total:techMin},{type:'piece',label:'Pieces',list:pieces,total:piecesMin},{type:'play',label:'Play',list:play,total:playMin},{type:'study',label:'Study',list:study,total:studyMin}];
  for(const{label,list,total} of sectionOrder){
    if(!list.length)continue;
    lines.push(`## ${label} — ${total} min`);
    lines.push(``);
    for(const e of list){
      const r=resolveHistoryItem(e,items);
      if(!r)continue;
      lines.push(`- ${formatForMarkdown(r)} — ${e.minutes||0} min`);
      if(e.spotsSnapshot?.length){
        for(const sp of e.spotsSnapshot){const sm=(e.spotMinutes||{})[sp.id]||0;if(sm>0)lines.push(`  - ${sp.label} (spot) — ${sm} min`);}
      }
    }
    lines.push(``);
  }

  if(entry.reflection?.trim()){
    lines.push(`---`);
    lines.push(``);
    lines.push(`*Reflection*`);
    lines.push(``);
    lines.push(entry.reflection.trim());
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`*Exported from Études · ${todayKey}*`);
  return lines.join('\n');
}

function generateWeekReflection(entry,todayKey){
  const lines=[];
  lines.push(`---`);
  lines.push(`type: reflection`);
  lines.push(`scale: week`);
  lines.push(`week: ${entry.weekStart||entry.week||''}`);
  lines.push(`minutes: ${entry.minutes||0}`);
  lines.push(`---`);
  lines.push(``);
  const wd=entry.weekStart||entry.week||'';
  lines.push(`# Week of ${wd}`);
  lines.push(``);
  if(entry.notes?.trim()){lines.push(`## Notes`);lines.push(``);lines.push(entry.notes.trim());lines.push(``);}
  if(entry.goals?.trim()){lines.push(`## Goals for next week`);lines.push(``);lines.push(entry.goals.trim());lines.push(``);}
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Exported from Études · ${todayKey}*`);
  return lines.join('\n');
}

function generateMonthReflection(entry,todayKey){
  const lines=[];
  lines.push(`---`);
  lines.push(`type: reflection`);
  lines.push(`scale: month`);
  lines.push(`month: ${entry.month||''}`);
  lines.push(`minutes: ${entry.minutes||0}`);
  lines.push(`---`);
  lines.push(``);
  const[y,m]=(entry.month||'2000-01').split('-').map(Number);
  const dt=new Date(y,m-1,1);
  const monthName=dt.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  lines.push(`# ${monthName}`);
  lines.push(``);
  if(entry.notes?.trim()){lines.push(`## Notes`);lines.push(``);lines.push(entry.notes.trim());lines.push(``);}
  if(entry.goals?.trim()){lines.push(`## Goals for next month`);lines.push(``);lines.push(entry.goals.trim());lines.push(``);}
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Exported from Études · ${todayKey}*`);
  return lines.join('\n');
}

function generateNoteFile(note,todayKey){
  const lines=[];
  lines.push(`---`);
  lines.push(`type: note`);
  lines.push(`id: ${note.id}`);
  lines.push(`created: ${note.date||''}`);
  lines.push(`folder: ${note.category?`"${note.category}"`:'null'}`);
  lines.push(`tags: [${(note.tags||[]).map(t=>`"${t}"`).join(', ')}]`);
  lines.push(`---`);
  lines.push(``);
  lines.push(`# ${note.title||'Untitled'}`);
  lines.push(``);
  if(note.body?.trim())lines.push(note.body.trim());
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Exported from Études · ${todayKey}*`);
  return lines.join('\n');
}

function generateRepertoireFile(item,todayKey){
  const lines=[];
  lines.push(`---`);
  lines.push(`type: ${item.type}`);
  lines.push(`id: ${item.id}`);
  lines.push(`title: ${item.title||''}`);
  lines.push(`composer: ${item.composer||'null'}`);
  lines.push(`movement: ${item.movement||'null'}`);
  lines.push(`collection: ${item.collection||'null'}`);
  lines.push(`instrument: ${item.instrument||'null'}`);
  lines.push(`catalog: ${item.catalog||'null'}`);
  lines.push(`stage: ${item.stage||'queued'}`);
  lines.push(`started: ${item.startedDate||'null'}`);
  const lifeTime=0;
  lines.push(`time_invested: ${lifeTime}`);
  lines.push(`tempo_target: ${item.bpmTarget||'null'}`);
  lines.push(`bpm_log:`);
  for(const bl of(item.bpmLog||[]))lines.push(`  - { date: ${bl.date}, bpm: ${bl.bpm} }`);
  lines.push(`tags: [${(item.tags||[]).map(t=>`"${t}"`).join(', ')}]`);
  lines.push(`---`);
  lines.push(``);
  const byline=item.composer?`*${item.composer}*`:null;
  const titleStr=item.collection&&item.movement?`${item.collection} — ${item.movement}`:(item.title||'Untitled');
  lines.push(`# ${byline?`${byline} — `:''}${titleStr}`);
  lines.push(``);
  if(item.detail?.trim()){lines.push(`## Notes`);lines.push(``);lines.push(item.detail.trim());lines.push(``);}
  if((item.spots||[]).length){
    lines.push(`## Spots`);
    lines.push(``);
    for(const s of item.spots){
      lines.push(`### ${s.label||'Unnamed spot'}`);
      if(s.bpmTarget)lines.push(``+`*Tempo target: ${s.bpmTarget} BPM*`);
      if(s.note?.trim()){lines.push(``);lines.push(s.note.trim());}
      lines.push(``);
    }
  }
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Exported from Études · ${todayKey}*`);
  return lines.join('\n');
}

function generateProgramFile(program,items,todayKey){
  // audience is intentionally excluded from all exports
  const totalSecs=(program.itemIds||[]).reduce((a,id)=>{const it=items.find(i=>i.id===id);return a+(it?.lengthSecs||0);},0);
  const totalMin=Math.round(totalSecs/60);
  const piecesList=(program.itemIds||[]).map(id=>{
    const it=items.find(i=>i.id===id);
    const note=(program.itemNotes||{})[id]||null;
    return `  - { title: "${it?it.title||'':id}", composer: "${it?.composer||''}", note: ${note?`"${note}"`:'null'} }`;
  });

  const lines=[];
  lines.push(`---`);
  lines.push(`type: program`);
  lines.push(`id: ${program.id}`);
  lines.push(`name: "${program.name||''}"`);
  lines.push(`performance_date: ${program.performanceDate||'null'}`);
  lines.push(`venue: ${program.venue?`"${program.venue}"`:'null'}`);
  lines.push(`duration_minutes: ${totalMin}`);
  lines.push(`pieces:`);
  for(const p of piecesList)lines.push(p);
  lines.push(`---`);
  lines.push(``);
  lines.push(`# ${program.name||'Untitled program'}`);
  lines.push(``);
  if(program.performanceDate){
    const venuePart=program.venue?` · ${program.venue}`:'';
    lines.push(`*${isoToHuman(program.performanceDate)}${venuePart}*`);
    lines.push(``);
  }
  if(program.intention?.trim()){
    lines.push(`## Intention`);
    lines.push(``);
    lines.push(program.intention.trim());
    lines.push(``);
  }
  if(program.body?.trim()){
    lines.push(`## Program notes`);
    lines.push(``);
    lines.push(program.body.trim());
    lines.push(``);
  }
  if(program.reflection?.trim()){
    lines.push(`## Reflection`);
    lines.push(``);
    lines.push(program.reflection.trim());
    lines.push(``);
  }
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Exported from Études · ${todayKey}*`);
  return lines.join('\n');
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export default function useImportExport({
  todayKey,items,itemTimes,warmupTimeToday,restToday,workingOn,todaySessions,loadedRoutineId,routines,
  dailyReflection,weekReflection,monthReflection,settings,freeNotes,recordingMeta,history,dayClosed,
  pieceRecordingMeta,noteCategories,refTrackMeta,programs,
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
  const [exportProgress,setExportProgress]=useState('');

  // ── JSON backup (preserved) ─────────────────────────────────────────────────
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

  // ── ZIP export ───────────────────────────────────────────────────────────────
  const buildZip=async()=>{
    const zip=new JSZip();
    const root=`études-export-${todayKey}/`;

    // README
    setExportProgress('Exporting journal entries…');
    await new Promise(r=>setTimeout(r,0));
    zip.file(`${root}README.md`,generateReadme(todayKey));

    // _data.json — strip audience from programs
    const safePrograms=(programs||[]).map(p=>{
      // eslint-disable-next-line no-unused-vars
      const {audience,...rest}=p;
      return rest;
    });
    const allLsKeys=['etudes-items','etudes-itemTimes','etudes-warmupTimeToday','etudes-restToday','etudes-workingOn','etudes-todaySessions','etudes-loadedRoutineId','etudes-routines','etudes-programs','etudes-dailyReflection','etudes-weekReflection','etudes-monthReflection','etudes-settings','etudes-freeNotes','etudes-noteCategories','etudes-recordingMeta','etudes-pieceRecordingMeta','etudes-refTrackMeta','etudes-history','etudes-dayClosed'];
    const dataJson={};
    for(const k of allLsKeys){
      try{const v=localStorage.getItem(k);if(v)dataJson[k]=JSON.parse(v);}catch{}
    }
    dataJson['etudes-programs']=safePrograms;
    zip.file(`${root}_data.json`,JSON.stringify(dataJson,null,2));

    // Journal entries
    const days=[...history.filter(h=>h.kind==='day'||!h.kind)];
    if(todayHistoryEntry&&(todayHistoryEntry.minutes>0||todayHistoryEntry.items?.length>0||todayHistoryEntry.reflection?.trim())){
      days.push(todayHistoryEntry);
    }
    for(const d of days){
      if(!d.date)continue;
      zip.file(`${root}journal/${d.date}_log.md`,generateDailyLog(d,items,todayKey));
    }
    const weeks=history.filter(h=>h.kind==='week');
    for(const w of weeks){
      const key=w.weekStart||w.week||w.date||'unknown';
      zip.file(`${root}journal/${key}_reflection.md`,generateWeekReflection(w,todayKey));
    }
    const months=history.filter(h=>h.kind==='month');
    for(const mo of months){
      const key=mo.month||mo.date||'unknown';
      zip.file(`${root}journal/${key}_reflection.md`,generateMonthReflection(mo,todayKey));
    }

    // Notes
    const noteUsedSlugs=new Set();
    for(const note of(freeNotes||[])){
      const sl=uniqueSlug(toSlug(note.title||'untitled'),noteUsedSlugs);
      zip.file(`${root}notes/${sl}.md`,generateNoteFile(note,todayKey));
    }

    // Repertoire
    const repUsedSlugs=new Set();
    for(const item of(items||[])){
      const sl=itemSlug(item,repUsedSlugs);
      zip.file(`${root}repertoire/${sl}.md`,generateRepertoireFile(item,todayKey));
    }

    // Programs (audience already stripped above)
    const progUsedSlugs=new Set();
    for(const prog of(programs||[])){
      const namePart=toSlug(prog.name||'untitled');
      const datePart=prog.performanceDate||'undated';
      const baseSlug=`${datePart}_program_${namePart}`;
      const sl=uniqueSlug(baseSlug,progUsedSlugs);
      zip.file(`${root}programs/${sl}.md`,generateProgramFile(prog,items,todayKey));
    }

    // Recordings
    setExportProgress('Exporting recordings…');
    await new Promise(r=>setTimeout(r,0));

    // Daily recordings
    const dailyKeys=await idbAllKeys('recordings');
    for(const k of dailyKeys){
      const blob=await idbGet('recordings',k);
      if(!blob)continue;
      const ext=blobExt(blob);
      zip.file(`${root}recordings/daily/${k}_session.${ext}`,blob);
    }

    // Piece recordings
    const allPieceMeta=pieceRecordingMeta||{};
    for(const [itemId,takes] of Object.entries(allPieceMeta)){
      if(!Array.isArray(takes)||takes.length===0)continue;
      const item=items.find(i=>String(i.id)===String(itemId));
      const composerPart=item?.composer?toSlug(item.composer):'unknown';
      const titlePart=toSlug(item?.title||item?.collection||'untitled');
      const folderSlug=composerPart?`${composerPart}_${titlePart}`:titlePart;
      const sortedTakes=[...takes].sort((a,b)=>(a.ts||0)-(b.ts||0));
      for(let n=0;n<sortedTakes.length;n++){
        const take=sortedTakes[n];
        const blob=await idbGet('pieceRecordings',take.idbKey||`${itemId}__${take.ts}`);
        if(!blob)continue;
        const ext=blobExt(blob);
        const lockSuffix=take.locked?'_locked':'';
        const date=take.ts?new Date(take.ts).toISOString().slice(0,10):'unknown';
        zip.file(`${root}recordings/pieces/${folderSlug}/${date}_take-${n+1}${lockSuffix}.${ext}`,blob);
      }
    }

    // Scores (PDFs)
    setExportProgress('Exporting scores…');
    await new Promise(r=>setTimeout(r,0));
    const pdfKeys=await idbAllKeys('pdfs');
    for(const libraryId of pdfKeys){
      const blob=await idbGet('pdfs',libraryId);
      if(!blob)continue;
      // Find the item that owns this pdf via its pdfLibrary entry
      let itemForPdf=null;
      for(const it of(items||[])){
        const att=(it.pdfs||[]).find(p=>p.libraryId===libraryId||p.id===libraryId);
        if(att){itemForPdf=it;break;}
      }
      if(!itemForPdf)continue;
      const composerPart=itemForPdf.composer?toSlug(itemForPdf.composer):'';
      const titlePart=toSlug(itemForPdf.title||itemForPdf.collection||'untitled');
      const pdfSlug=composerPart?`${composerPart}_${titlePart}`:titlePart;
      zip.file(`${root}scores/${pdfSlug}.pdf`,blob);
    }

    // Build and deliver
    setExportProgress('Building archive…');
    await new Promise(r=>setTimeout(r,0));
    const zipBlob=await zip.generateAsync({type:'blob'});
    const filename=`etudes-export-${todayKey}.zip`;
    const file=new File([zipBlob],filename,{type:'application/zip'});

    setExportProgress('');
    if(navigator.canShare?.({files:[file]})){
      try{
        await navigator.share({files:[file]});
      }catch(e){
        if(e.name!=='AbortError'){
          triggerDownload(zipBlob,filename);
        }
        // AbortError: user dismissed share sheet — do nothing
      }
    }else{
      triggerDownload(zipBlob,filename);
    }
  };

  // ── Import ───────────────────────────────────────────────────────────────────
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
      const hasPieceRec=data.blobs?.pieceRecordings!==undefined;
      const hasRefTracks=data.blobs?.refTracks!==undefined;
      if(hasPieceRec){for(const k of await idbAllKeys('pieceRecordings'))await idbDel('pieceRecordings',k);}
      if(hasRefTracks){for(const k of await idbAllKeys('refTracks'))await idbDel('refTracks',k);}
      const newUrl={};for(const [k,b] of Object.entries(npb)){await idbPut('pdfs',k,b);newUrl[k]=URL.createObjectURL(b);}
      for(const [k,b] of Object.entries(nrb)){await idbPut('recordings',k,b);}
      for(const [k,b] of Object.entries(nprb)){await idbPut('pieceRecordings',k,b);}
      for(const [k,b] of Object.entries(nrtb)){await idbPut('refTracks',k,b);}
      const st=data.state||{};
      const importedRecKeys=new Set(Object.keys(nrb));
      const reconciledMeta=Object.fromEntries(Object.entries(st.recordingMeta||{}).filter(([k])=>importedRecKeys.has(k)));
      setItems(migrateItems(st.items||[]));setItemTimes(st.itemTimes||{});setWarmupTimeToday(st.warmupTimeToday||0);setRestToday(st.restToday||0);setWorkingOn(Array.isArray(st.workingOn)?st.workingOn:[]);setTodaySessions(migrateSessions(st.todaySessions||DEFAULT_SESSIONS));setLoadedRoutineId(st.loadedRoutineId||null);setRoutines(migrateRoutines(st.routines||[]));setDailyReflection(st.dailyReflection||'');setWeekReflection(st.weekReflection||{notes:'',goals:''});setMonthReflection(st.monthReflection||{notes:'',goals:''});setSettings(st.settings||{dailyTarget:90,weeklyTarget:600,monthlyTarget:2400});setFreeNotes(Array.isArray(st.freeNotes)?st.freeNotes:[]);
      if(st.noteCategories!==undefined)setNoteCategories(Array.isArray(st.noteCategories)?st.noteCategories:[]);
      setRecordingMeta(reconciledMeta);
      if(hasPieceRec)setPieceRecordingMeta(st.pieceRecordingMeta||{});
      if(hasRefTracks)setRefTrackMeta(st.refTrackMeta||{});
      setHistory(migrateHistory(st.history||[]));setDayClosed(!!st.dayClosed);setPdfUrlMap(newUrl);
      if(hasPieceRec)setLocalPieceRecordingIds(new Set(Object.keys(nprb).map(k=>k.split('__')[0])));
      else idbAllKeys('pieceRecordings').then(keys=>setLocalPieceRecordingIds(new Set(keys.map(k=>String(k).split('__')[0]))));
      if(hasRefTracks)setLocalRefTrackIds(new Set(Object.keys(nrtb)));
      else idbAllKeys('refTracks').then(keys=>setLocalRefTrackIds(new Set(keys.map(k=>String(k)))));
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

  return {exportJson,importJsonFile,buildZip,exportProgress};
}
