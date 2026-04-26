import {todayDateStr,shiftDate} from './dates.js';

export const mkPdfId=()=>`pdf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
export const mkSpotId=()=>`spot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
export const mkPerfId=()=>`perf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;

export function getItemTime(t,id){const k=String(id);const pre=k+':';let total=0;for(const x in t){if(x===k||x.startsWith(pre))total+=t[x]||0;}return total;}
export function getSpotTime(t,id,sid){return t[`${id}:${sid}`]||0;}
export function getParentBucket(t,id){return t[String(id)]||0;}

export function displayTitle(i){if(i.collection&&i.movement)return `${i.collection} — ${i.movement}`;if(i.collection&&i.title&&i.title!==i.collection)return `${i.collection} — ${i.title}`;if(i.collection)return i.collection;if(i.movement)return i.movement;return i.title||'Untitled';}
export function formatByline(i){const p=[];if(i.composer)p.push(i.composer);if(i.arranger)p.push(`arr. ${i.arranger}`);if(i.author)p.push(i.author);return p.join(', ');}
export function formatForMarkdown(i){let base;if(i.collection&&i.movement){base=i.catalog?`${i.collection}, ${i.catalog} — ${i.movement}`:`${i.collection} — ${i.movement}`;}else if(i.collection){base=i.catalog?`${i.collection}, ${i.catalog}`:i.collection;}else{base=i.catalog?`${i.title||'Untitled'}, ${i.catalog}`:(i.title||'Untitled');}const by=formatByline(i);return by?`${base} (${by})`:base;}

export function resolveHistoryItem(e,items){
  const has=e.title!==undefined||e.type!==undefined||e.composer!==undefined;
  const live=items.find(i=>i.id===e.id);
  if(has){return {id:e.id,title:e.title||live?.title||'Untitled',composer:e.composer??live?.composer??'',arranger:e.arranger??live?.arranger??'',catalog:e.catalog??live?.catalog??'',collection:e.collection??live?.collection??'',movement:e.movement??live?.movement??'',type:e.type||live?.type||'piece',detail:live?.detail||'',note:e.note||'',spotMinutes:e.spotMinutes||{},spotsSnapshot:e.spotsSnapshot||[]};}
  if(!live)return null;
  return {id:live.id,title:live.title,composer:live.composer||'',arranger:live.arranger||'',catalog:live.catalog||'',collection:live.collection||'',movement:live.movement||'',type:live.type,detail:live.detail||'',note:'',spotMinutes:{},spotsSnapshot:[]};
}

export function buildHistoryItems(it,items){
  return items.filter(item=>{if((it[item.id]||0)>0)return true;const pre=`${item.id}:`;return Object.keys(it).some(k=>k.startsWith(pre)&&(it[k]||0)>0);}).map(item=>{
    const parent=it[item.id]||0;const spotSec={};const pre=`${item.id}:`;
    Object.keys(it).forEach(k=>{if(k.startsWith(pre)){const sid=k.slice(pre.length);if((it[k]||0)>0)spotSec[sid]=it[k];}});
    const snap=(item.spots||[]).filter(s=>spotSec[s.id]).map(s=>({id:s.id,label:s.label}));
    return {id:item.id,minutes:Math.floor((parent+Object.values(spotSec).reduce((a,b)=>a+b,0))/60),title:item.title,composer:item.composer||'',arranger:item.arranger||'',catalog:item.catalog||'',collection:item.collection||'',movement:item.movement||'',type:item.type,note:item.todayNote||'',spotMinutes:Object.fromEntries(Object.entries(spotSec).map(([k,v])=>[k,Math.floor(v/60)])),spotsSnapshot:snap};
  });
}

export function nextPerformance(perfs){if(!Array.isArray(perfs)||perfs.length===0)return null;const td=todayDateStr();const up=perfs.filter(p=>p.date&&p.date>=td).sort((a,b)=>a.date.localeCompare(b.date));if(up[0])return up[0];const past=perfs.filter(p=>p.date).sort((a,b)=>b.date.localeCompare(a.date));return past[0]||null;}
export function normalizeComposerKey(s){return (s||'').trim().toLowerCase().replace(/\s+/g,' ');}

export const makeNewItem=(type)=>({id:Date.now()+Math.floor(Math.random()*1000),type,title:'Untitled',tags:[],pdfs:[],defaultPdfId:null,detail:'',composer:'',author:'',arranger:'',catalog:'',collection:'',movement:'',stage:'queued',referenceUrl:'',startedDate:null,bpmLog:[],bpmTarget:null,todayNote:'',instrument:'',spots:[],performances:[],lengthSecs:null});

export const calcStreak=(history,effMin)=>{const map={};history.forEach(h=>{if((h.kind==='day'||!h.kind)){const eff=(h.minutes||0)-(h.warmupMinutes||0);if(eff>=1)map[h.date]=eff;}});const t=todayDateStr();if((effMin||0)>=1)map[t]=effMin;let c=0;let cur=t;if(!map[cur])cur=shiftDate(cur,-1);while(map[cur]){c++;cur=shiftDate(cur,-1);}return c;};
