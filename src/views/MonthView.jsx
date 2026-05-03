import React, {useMemo, useState} from 'react';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import {BG, SURFACE, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, serif, sans} from '../constants/theme.js';
import useViewport from '../hooks/useViewport.js';
import {todayDateStr} from '../lib/dates.js';
import {DisplayHeader, Ring, MarkdownField} from '../components/shared.jsx';

export default function MonthView(p){
  const {isMobile}=useViewport();
  const {history,settings,monthActualSeconds,monthReflection,setMonthReflection,openLogEntry,effectiveTotalToday,nested,onWikiLinkClick}=p;
  const [monthOffset,setMonthOffset]=useState(0);
  const isCurrent=monthOffset===0;
  const todayKey=todayDateStr();
  const now=new Date();
  const targetDate=new Date(now.getFullYear(),now.getMonth()+monthOffset,1);
  const year=targetDate.getFullYear();
  const month=targetDate.getMonth();
  const firstDay=new Date(year,month,1);
  const startDay=firstDay.getDay();
  const dim=new Date(year,month+1,0).getDate();
  const hm=useMemo(()=>{const m={};history.forEach(h=>{if(h.kind==='day'||!h.kind)m[h.date]=h;});return m;},[history]);
  const cells=useMemo(()=>{const l=[];for(let i=0;i<startDay;i++)l.push(null);for(let d=1;d<=dim;d++){const dt=new Date(year,month,d);const key=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;const h=hm[key];const base=h?(h.minutes-(h.warmupMinutes||0)):0;const iT=isCurrent&&key===todayKey;const iF=key>todayKey;const min=iT?base+Math.floor((effectiveTotalToday||0)/60):base;l.push({date:dt,key,minutes:min,isToday:iT,isFuture:iF,entry:h});}while(l.length%7!==0)l.push(null);return l;},[startDay,dim,year,month,hm,todayKey,effectiveTotalToday,isCurrent]);
  const maxM=Math.max(...cells.filter(Boolean).map(c=>c.minutes),120);
  const wds=['S','M','T','W','T','F','S'];
  const fields=[{key:'notes',label:'Notes, observations, wins'},{key:'goals',label:'Goals for next month'}];
  const monthTotalMinutes=isCurrent?Math.floor(monthActualSeconds/60):cells.filter(Boolean).reduce((a,c)=>a+c.minutes,0);
  const [hoveredCell,setHoveredCell]=useState(null);
  const content = (<div>
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={()=>setMonthOffset(o=>o-1)} style={{color:DIM,display:'flex',alignItems:'center'}}><ChevronLeft className="w-3 h-3" strokeWidth={1.5}/></button>
        <span className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Reflection</span>
        <button onClick={()=>setMonthOffset(o=>o+1)} style={{color:monthOffset<0?DIM:'transparent',display:'flex',alignItems:'center',pointerEvents:monthOffset<0?'auto':'none'}}><ChevronRight className="w-3 h-3" strokeWidth={1.5}/></button>
        {monthOffset<0&&<button onClick={()=>setMonthOffset(0)} className="uppercase ml-1" style={{color:FAINT,fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em'}}>Now</button>}
      </div>
      <h1 className="leading-none" style={{fontFamily:serif,fontWeight:400,fontSize:isMobile?'clamp(48px,13vw,56px)':'clamp(32px,6vw,56px)',letterSpacing:'-0.02em'}}><span style={{fontStyle:'italic'}}>{targetDate.toLocaleDateString('en-US',{month:'long'})}</span><span style={{color:FAINT}}>{` ${year}`}</span></h1>
    </div><div className="grid grid-cols-12 gap-8 mb-10"><div className="col-span-8"><div className="uppercase mb-6" style={{fontSize:'10px',letterSpacing:'0.32em'}}>Calendar</div><div style={{borderTop:`1px solid ${LINE_STR}`}}><div className="grid grid-cols-7" style={{borderBottom:`1px solid ${LINE_MED}`}}>{wds.map((d,i)=>(<div key={i} className="py-2.5 uppercase text-center" style={{color:FAINT,borderRight:i<6?`1px solid ${LINE}`:'none',fontSize:'10px',letterSpacing:'0.25em'}}>{d}</div>))}</div><div className="grid grid-cols-7">{cells.map((c,i)=>{const lc=(i+1)%7===0;const cb={borderRight:!lc?`1px solid ${LINE}`:'none',borderBottom:`1px solid ${LINE}`};if(!c)return (<div key={`empty-${i}`} className="aspect-square" style={cb}/>);const it=c.minutes/maxM;const isHov=hoveredCell===c.key&&!c.isFuture;return (<button key={c.key} onClick={()=>{if(c.isFuture)return;if(c.entry)openLogEntry(c.entry);else if(c.isToday)openLogEntry({kind:'day',date:c.key});}} onMouseEnter={()=>!c.isFuture&&setHoveredCell(c.key)} onMouseLeave={()=>setHoveredCell(null)} disabled={c.isFuture} className="aspect-square relative text-left flex flex-col overflow-hidden" style={{...cb,opacity:c.isFuture?0.4:1,cursor:c.isFuture?'default':'pointer',background:isHov?'rgba(0,47,167,0.08)':'transparent',transition:'background 0.12s'}}>{c.minutes>0&&!c.isFuture&&(<div className="absolute inset-y-0 left-0" style={{width:'2px',background:IKB,opacity:isHov?1:0.25+it*0.75,boxShadow:isHov||it>0.6?`0 0 6px ${IKB}`:'none',transition:'opacity 0.12s'}}/>)}<div className="flex items-start justify-between px-2 pt-2"><div className="tabular-nums" style={{color:c.isToday||isHov?IKB:TEXT,fontWeight:c.isToday||isHov?400:300,fontSize:'12px',transition:'color 0.12s'}}>{c.date.getDate()}</div>{c.isToday&&(<div className="w-1 h-1 rounded-full mt-1.5" style={{background:IKB,boxShadow:`0 0 5px ${IKB}`}}/>)}</div>{c.minutes>0&&!c.isFuture&&(<div className="px-2 font-mono tabular-nums mt-auto mb-2 truncate" style={{color:isHov?IKB:MUTED,fontWeight:300,fontSize:'10px',transition:'color 0.12s'}}>{c.minutes}′</div>)}</button>);})}</div></div></div><div className="col-span-4 flex flex-col items-center justify-start pt-10 min-w-0"><div className="uppercase mb-4" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Monthly target</div><Ring value={monthTotalMinutes} max={settings.monthlyTarget}/></div></div>
    {isCurrent&&(<><div className="pb-3 mb-5" style={{borderBottom:`1px solid ${LINE}`}}><div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>Working draft. Snapshots to Logs at month end.</div></div><div className="space-y-10">{fields.map(f=>(<div key={f.key}><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>{f.label}</div><MarkdownField value={monthReflection[f.key]||''} onChange={v=>setMonthReflection({...monthReflection,[f.key]:v})} placeholder={f.key==='notes'?'What the month held.':'What you intend for next month.'} minHeight={144} style={{background:SURFACE}} showDeepLinkHint onWikiLinkClick={onWikiLinkClick}/></div>))}</div></>)}
  </div>);
  if(nested)return content;
  return (<div className="max-w-4xl mx-auto px-12 py-14" style={isMobile?{paddingLeft:'20px',paddingRight:'20px',paddingTop:'12px',paddingBottom:'calc(var(--footer-height,160px) + 28px)'}:{}}>{content}</div>);
}
