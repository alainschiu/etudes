import {mkSpotId,mkPerfId,mkAttachId} from './items.js';

export const SCHEMA_VERSION=7;

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
];
export function migrateImport(data){let c=data;let v=c.schemaVersion||1;for(const m of IMPORT_MIGRATIONS){if(m.from===v){c=m.migrate(c);v=m.to;c.schemaVersion=v;}}return c;}

export function migrateItems(items){return (items||[]).map(i=>{
  let stage=i.stage;if(stage==='reading')stage='learning';if(stage==='performance')stage='maintenance';
  let rawPdfs=Array.isArray(i.pdfs)?i.pdfs:null;
  if(!rawPdfs){if(i.pdfUrl){rawPdfs=[{id:String(i.id),name:'Score'}];}else rawPdfs=[];}
  // Migrate old {id,name} shape to new {id,libraryId,name,startPage,endPage,bookmarks[]}
  const pdfs=rawPdfs.map(p=>p.libraryId?{...p,bookmarks:p.bookmarks||[]}:{id:mkAttachId(),libraryId:p.id,name:p.name,startPage:null,endPage:null,bookmarks:[]});
  // defaultPdfId was old libraryId; find matching attachment
  const defaultPdfId=pdfs.length>0?(pdfs.find(p=>p.libraryId===i.defaultPdfId)||pdfs[0]).id:null;
  return {...i,type:i.type==='jam'?'play':i.type,stage:stage||'learning',startedDate:i.startedDate??null,bpmLog:Array.isArray(i.bpmLog)?i.bpmLog:[],arranger:i.arranger||'',author:i.author||'',catalog:i.catalog||'',collection:i.collection||'',movement:i.movement||'',pdfs,defaultPdfId,bpmTarget:typeof i.bpmTarget==='number'?i.bpmTarget:null,todayNote:i.todayNote||'',instrument:typeof i.instrument==='string'?i.instrument:'',spots:Array.isArray(i.spots)?i.spots.map(s=>({id:s.id||mkSpotId(),label:s.label||'Untitled spot',bpmTarget:typeof s.bpmTarget==='number'?s.bpmTarget:null,note:typeof s.note==='string'?s.note:'',bpmLog:Array.isArray(s.bpmLog)?s.bpmLog:[],bookmarkId:s.bookmarkId||null,pdfAttachmentId:s.pdfAttachmentId||null})):[],performances:Array.isArray(i.performances)?i.performances.map(p=>({id:p.id||mkPerfId(),date:p.date||'',label:p.label||''})):[],lengthSecs:i.lengthSecs??null,pdfUrl:undefined};
});}
export function migrateSessions(sessions){return (sessions||[]).map(s=>({id:s.id,type:s.type,itemIds:s.itemIds===undefined?null:s.itemIds,target:typeof s.target==='number'?s.target:null,itemTargets:s.itemTargets&&typeof s.itemTargets==='object'?s.itemTargets:{},isWarmup:!!s.isWarmup}));}
export function migrateRoutines(routines){return (routines||[]).map(r=>({...r,sessions:(r.sessions||[]).map(s=>({type:s.type,intention:s.intention||'',itemIds:Array.isArray(s.itemIds)?s.itemIds:[],target:typeof s.target==='number'?s.target:null,itemTargets:s.itemTargets&&typeof s.itemTargets==='object'?s.itemTargets:{},isWarmup:!!s.isWarmup}))}));}
export function migrateHistory(h){return (h||[]).map(x=>({...x,kind:x.kind||'day'}));}
