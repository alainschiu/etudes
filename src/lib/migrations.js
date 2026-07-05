import {mkSpotId,mkPerfId,mkAttachId} from './items.js';

export const IMPORT_MIGRATIONS=[
  {from:1,to:2,migrate:(d)=>{const s=d.state||{};const items=(s.items||[]).map(i=>({...i,instrument:typeof i.instrument==='string'?i.instrument:'',spots:Array.isArray(i.spots)?i.spots:[]}));return {...d,schemaVersion:2,state:{...s,items}};}},
  {from:2,to:3,migrate:(d)=>{const s=d.state||{};const items=(s.items||[]).map(i=>({...i,spots:Array.isArray(i.spots)?i.spots.map(sp=>({...sp,note:typeof sp.note==='string'?sp.note:'',bpmLog:Array.isArray(sp.bpmLog)?sp.bpmLog:[]})):[]}));return {...d,schemaVersion:3,state:{...s,items}};}},
  {from:3,to:4,migrate:(d)=>{const s=d.state||{};return {...d,schemaVersion:4,state:{...s,todaySessions:(s.todaySessions||[]).map(x=>({...x,isWarmup:!!x.isWarmup})),routines:(s.routines||[]).map(r=>({...r,sessions:(r.sessions||[]).map(x=>({...x,isWarmup:!!x.isWarmup}))}))}};}},
  {from:4,to:5,migrate:(d)=>{const s=d.state||{};const items=(s.items||[]).map(i=>({...i,performances:Array.isArray(i.performances)?i.performances:[]}));return {...d,schemaVersion:5,state:{...s,items}};}},
  {from:5,to:6,migrate:(d)=>{const s=d.state||{};const items=(s.items||[]).map(i=>({...i,author:i.author||'',lengthSecs:i.lengthSecs??null}));return {...d,schemaVersion:6,state:{...s,items}};}},
  {from:6,to:7,migrate:(d)=>{
    const s=d.state||{};
    const libMap={};
    const items=(s.items||[]).map(i=>{
      const newPdfs=(i.pdfs||[]).map(p=>{
        if(p.libraryId)return p; // already migrated
        const libraryId=p.id;
        const attId=mkAttachId();
        libMap[libraryId]=libMap[libraryId]||{id:libraryId,name:p.name};
        return {id:attId,libraryId,name:p.name,startPage:null,endPage:null,bookmarks:[]};
      });
      const spots=(i.spots||[]).map(s=>({...s,bookmarkId:s.bookmarkId||null,pdfAttachmentId:s.pdfAttachmentId||null}));
      return {...i,pdfs:newPdfs,spots};
    });
    const pdfLibrary=Object.values(libMap);
    return {...d,schemaVersion:7,state:{...s,items,pdfLibrary}};
  }},
  {from:7,to:8,migrate:(d)=>{
    const s=d.state||{};
    const items=(s.items||[]).map(i=>({...i,noteLog:Array.isArray(i.noteLog)?i.noteLog:[]}));
    return {...d,schemaVersion:8,state:{...s,items}};
  }},
  {from:8,to:9,migrate:(d)=>({...d,schemaVersion:9})},
  {from:9,to:10,migrate:(d)=>{
    const s=d.state||{};
    const programs=(s.programs||[]).map(p=>({venue:null,audience:null,itemNotes:{},intention:null,reflection:null,body:null,...p,itemNotes:(p.itemNotes&&typeof p.itemNotes==='object')?p.itemNotes:{}}));
    return {...d,schemaVersion:10,state:{...s,programs}};
  }},
  {from:10,to:11,migrate:(d)=>{
    // Notes gain updatedAt. Use the SAME defaulting as the live-state migrateFreeNotes
    // so a restored pre-11 backup lands identical to a live-migrated one.
    const s=d.state||{};
    return {...d,schemaVersion:11,state:{...s,freeNotes:migrateFreeNotes(s.freeNotes)}};
  }},
  {from:11,to:12,migrate:(d)=>{
    // scoreLink unification + bookmark.note default (C1). Shares migrateScoreLinks
    // with the live-state loader so an imported pre-12 backup lands identical to a
    // live-migrated one.
    const s=d.state||{};
    return {...d,schemaVersion:12,state:{...s,items:migrateScoreLinks(s.items||[])}};
  }},
];
export function migrateImport(data){let c=data;let v=c.schemaVersion||1;for(const m of IMPORT_MIGRATIONS){if(m.from===v){c=m.migrate(c);v=m.to;c.schemaVersion=v;}}return c;}

// Notes gain updatedAt (schema v11). Shared by the live-state loader and the
// import 10->11 migration. Idempotent: an existing updatedAt is preserved; a
// note without one defaults to its (immutable) creation date, else now.
export function migrateFreeNotes(notes){
  return (notes||[]).map(n=>({...n,updatedAt:n.updatedAt||n.date||Date.now()}));
}

// F1 (schema v12): unify spot.bookmarkId+spot.pdfAttachmentId and any surviving
// spot.pdfPage into spot.scoreLink = null | {attId,bookmarkId,page} (C1). Idempotent:
// an existing scoreLink is re-validated (attId must still resolve to a live attachment)
// and passed through rather than rebuilt — the legacy fields are gone by the second pass.
export function deriveScoreLink(spot,pdfs,defaultPdfId){
  if(spot.scoreLink!==undefined){
    if(spot.scoreLink&&(pdfs||[]).some(p=>p.id===spot.scoreLink.attId))return spot.scoreLink;
    return null;
  }
  if(spot.bookmarkId&&spot.pdfAttachmentId){
    if((pdfs||[]).some(p=>p.id===spot.pdfAttachmentId))return {attId:spot.pdfAttachmentId,bookmarkId:spot.bookmarkId,page:null};
    return null;
  }
  if(spot.pdfPage){
    const attId=defaultPdfId||(pdfs&&pdfs[0]&&pdfs[0].id)||null;
    if(attId)return {attId,bookmarkId:null,page:spot.pdfPage};
  }
  return null;
}

// Shared by the live-state loader (migrateItems, which computes pdfs/defaultPdfId
// itself further down) and the import 11->12 migration — applies the bookmark-note
// default + scoreLink derivation to items whose pdfs are already in the modern
// {id,libraryId,name,bookmarks[]} attachment shape (true for any import payload by v11).
export function migrateScoreLinks(items){
  return (items||[]).map(item=>{
    const pdfs=(item.pdfs||[]).map(p=>({...p,bookmarks:(p.bookmarks||[]).map(b=>({note:'',...b}))}));
    const spots=(item.spots||[]).map(s=>{
      const {pdfPage:_pdfPage,bookmarkId:_bookmarkId,pdfAttachmentId:_pdfAttachmentId,...rest}=s;
      return {...rest,scoreLink:deriveScoreLink(s,pdfs,item.defaultPdfId)};
    });
    return {...item,pdfs,spots};
  });
}

export function migratePrograms(programs){
  return (programs||[]).map(p=>({
    venue:null,audience:null,itemNotes:{},intention:null,
    reflection:null,body:null,
    ...p,
    // itemNotes re-checked after spread to guard against corrupted non-object values
    itemNotes:(p.itemNotes&&typeof p.itemNotes==='object')?p.itemNotes:{},
  }));
}

export function migrateItems(items){return (items||[]).map(i=>{
  let stage=i.stage;if(stage==='reading')stage='learning';if(stage==='performance')stage='maintenance';
  let rawPdfs=Array.isArray(i.pdfs)?i.pdfs:null;
  if(!rawPdfs){if(i.pdfUrl){rawPdfs=[{id:String(i.id),name:'Score'}];}else rawPdfs=[];}
  // Migrate old {id,name} shape to new {id,libraryId,name,startPage,endPage,bookmarks[]}.
  // Bookmarks gain note:'' default in the same pass (F1/schema v12).
  const pdfs=rawPdfs.map(p=>p.libraryId?{...p,bookmarks:(p.bookmarks||[]).map(b=>({note:'',...b}))}:{id:mkAttachId(),libraryId:p.id,name:p.name,startPage:null,endPage:null,bookmarks:[]});
  // defaultPdfId was old libraryId; find matching attachment
  const defaultPdfId=pdfs.length>0?(pdfs.find(p=>p.libraryId===i.defaultPdfId)||pdfs[0]).id:null;
  return {...i,type:i.type==='jam'?'play':i.type,stage:stage||'learning',startedDate:i.startedDate??null,bpmLog:Array.isArray(i.bpmLog)?i.bpmLog:[],arranger:i.arranger||'',author:i.author||'',catalog:i.catalog||'',collection:i.collection||'',movement:i.movement||'',pdfs,defaultPdfId,bpmTarget:typeof i.bpmTarget==='number'?i.bpmTarget:null,todayNote:i.todayNote||'',instrument:typeof i.instrument==='string'?i.instrument:'',spots:Array.isArray(i.spots)?i.spots.map(s=>({id:s.id||mkSpotId(),label:s.label||'Untitled spot',bpmTarget:typeof s.bpmTarget==='number'?s.bpmTarget:null,note:typeof s.note==='string'?s.note:'',bpmLog:Array.isArray(s.bpmLog)?s.bpmLog:[],scoreLink:deriveScoreLink(s,pdfs,defaultPdfId)})):[],performances:Array.isArray(i.performances)?i.performances.map(p=>({id:p.id||mkPerfId(),date:p.date||'',label:p.label||''})):[],lengthSecs:i.lengthSecs??null,noteLog:Array.isArray(i.noteLog)?i.noteLog:[],pdfUrl:undefined};
});}
export function migrateSessions(sessions){return (sessions||[]).map(s=>({id:s.id,type:s.type,itemIds:s.itemIds===undefined?null:s.itemIds,target:typeof s.target==='number'?s.target:null,itemTargets:s.itemTargets&&typeof s.itemTargets==='object'?s.itemTargets:{},isWarmup:!!s.isWarmup}));}
export function migrateRoutines(routines){return (routines||[]).map(r=>({...r,sessions:(r.sessions||[]).map(s=>({type:s.type,intention:s.intention||'',itemIds:Array.isArray(s.itemIds)?s.itemIds:[],target:typeof s.target==='number'?s.target:null,itemTargets:s.itemTargets&&typeof s.itemTargets==='object'?s.itemTargets:{},isWarmup:!!s.isWarmup}))}));}
export function migrateHistory(h){const arr=Array.isArray(h)?h:(h&&typeof h==='object'?Object.values(h):[]);return arr.map(x=>({...x,kind:x.kind||'day'}));}
