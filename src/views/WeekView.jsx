import React, {useState} from 'react';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import {BG, SURFACE, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, serif, sans} from '../constants/theme.js';
import useViewport from '../hooks/useViewport.js';
import {todayDateStr, shiftDate, getWeekStart} from '../lib/dates.js';
import {DisplayHeader, Ring, MarkdownField} from '../components/shared.jsx';

export default function WeekView(p){
  const {isMobile}=useViewport();
  const {history,settings,weekActualSeconds,weekReflection,setWeekReflection,effectiveTotalToday,openLogEntry,nested,onWikiLinkClick,wikiCompletionData}=p;
  const [weekOffset,setWeekOffset]=useState(0);
  const isCurrent=weekOffset===0;
  const todayKey=todayDateStr();
  const monday=getWeekStart(shiftDate(todayKey,weekOffset*7));
  const sunday=shiftDate(monday,6);
  const hm={};history.forEach(h=>{if(h.kind==='day'||!h.kind)hm[h.date]=h;});
  const dd=Array.from({length:7},(_,i)=>{const date=shiftDate(monday,i);const isToday=isCurrent&&date===todayKey;const isFuture=date>todayKey;const h=hm[date];const base=(h?.minutes||0)-(h?.warmupMinutes||0);const actual=isToday?base+Math.floor(effectiveTotalToday/60):base;return {date,isToday,isFuture,actual,minutes:base};});
  const maxM=Math.max(...dd.map(d=>d.actual),120);
  const wds=['S','M','T','W','T','F','S'];
  const fields=[{key:'notes',label:'Notes, observations, wins'},{key:'goals',label:'Goals for next week'}];
  const any=dd.some(d=>d.actual>0);
  const md=new Date(+monday.split('-')[0],+monday.split('-')[1]-1,+monday.split('-')[2]);
  const sd=new Date(+sunday.split('-')[0],+sunday.split('-')[1]-1,+sunday.split('-')[2]);
  const weekTotalMinutes=isCurrent?Math.floor(weekActualSeconds/60):dd.reduce((a,d)=>a+d.actual,0);
  const [hoveredDay,setHoveredDay]=useState(null);
  const eyebrowLabel=`Week of ${md.toLocaleDateString('en-US',{month:'short',day:'numeric'})} — ${sd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  const todayYear=new Date().getFullYear();
  const weekTitle=isCurrent?'This week':(()=>{
    const sameMonth=md.getMonth()===sd.getMonth();
    const sameYear=md.getFullYear()===sd.getFullYear();
    const yearSuffix=md.getFullYear()!==todayYear?` ${md.getFullYear()}`:'';
    if(sameMonth)return `${md.toLocaleDateString('en-US',{month:'short'})} ${md.getDate()} — ${sd.getDate()}${yearSuffix}`;
    return `${md.toLocaleDateString('en-US',{month:'short',day:'numeric'})} — ${sd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}${yearSuffix}`;
  })();
  const content = (<div>
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={()=>setWeekOffset(o=>o-1)} style={{color:DIM,display:'flex',alignItems:'center'}}><ChevronLeft className="w-3 h-3" strokeWidth={1.5}/></button>
        <span className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>{eyebrowLabel}</span>
        <button onClick={()=>setWeekOffset(o=>o+1)} style={{color:weekOffset<0?DIM:'transparent',display:'flex',alignItems:'center',pointerEvents:weekOffset<0?'auto':'none'}}><ChevronRight className="w-3 h-3" strokeWidth={1.5}/></button>
        {weekOffset<0&&<button onClick={()=>setWeekOffset(0)} className="uppercase ml-1" style={{color:FAINT,fontFamily:sans,fontSize:'8px',letterSpacing:'0.22em'}}>Now</button>}
      </div>
      <h1 className="leading-none" style={{fontFamily:serif,fontWeight:400,fontSize:isMobile?'clamp(48px,13vw,56px)':'clamp(32px,6vw,56px)',letterSpacing:'-0.02em',fontStyle:'italic'}}>{weekTitle}</h1>
    </div><div className="grid grid-cols-12 gap-8 mb-10"><div className="col-span-8"><div className="flex items-baseline justify-between mb-6"><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.32em'}}>Timeline</div>{any&&<div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.22em'}}>Mon — Sun · click a day · warm-up excluded</div>}</div><div className="pt-10" style={{borderTop:`1px solid ${LINE_STR}`}}>{!any?<div className="italic py-8 text-center" style={{color:FAINT,fontFamily:serif}}>No sessions this week yet.</div>:(<><div className="grid grid-cols-7 gap-4 h-52 items-end">{dd.map((d,di)=>{const h=(d.actual/maxM)*100;const isHov=hoveredDay===di;return (<button key={d.date} onClick={()=>{if(d.isFuture)return;const e=history.find(x=>(x.kind==='day'||!x.kind)&&x.date===d.date);if(e)openLogEntry(e);else if(d.isToday)openLogEntry({kind:'day',date:d.date});}} onMouseEnter={()=>!d.isFuture&&setHoveredDay(di)} onMouseLeave={()=>setHoveredDay(null)} disabled={d.isFuture} className="flex flex-col items-center justify-end h-full" style={d.isFuture?{opacity:0.25,cursor:'default'}:{}}><div className="font-mono tabular-nums mb-3" style={{color:isHov?IKB:MUTED,fontWeight:300,fontSize:'10px',transition:'color 0.12s'}}>{d.isFuture?'':d.actual+'′'}</div><div className="w-full relative" style={{height:`${Math.max(d.isFuture?0:h,2)}%`,minHeight:'2px'}}><div className="absolute inset-0" style={{background:d.isToday?IKB:isHov?'rgba(0,47,167,0.55)':LINE_STR,opacity:d.isFuture?0:(d.isToday?1:isHov?1:0.7),boxShadow:d.isToday?`0 0 20px ${IKB}80`:isHov?`0 0 10px rgba(0,47,167,0.3)`:'none',transition:'background 0.12s, opacity 0.12s, box-shadow 0.12s'}}/></div></button>);})}</div><div className="grid grid-cols-7 gap-4 mt-3 pt-3" style={{borderTop:`1px solid ${LINE}`}}>{dd.map((d,di)=>{const [y,m,day]=d.date.split('-').map(Number);const dt=new Date(y,m-1,day);const isHov=hoveredDay===di;return (<div key={d.date} className="text-center" style={d.isFuture?{opacity:0.35}:{}}><div className="uppercase" style={{color:isHov?IKB:FAINT,fontSize:'10px',letterSpacing:'0.25em',transition:'color 0.12s'}}>{wds[dt.getDay()]}</div><div className="text-xs tabular-nums mt-1" style={{fontWeight:isHov?400:300,color:d.isToday?IKB:isHov?IKB:TEXT,transition:'color 0.12s'}}>{ dt.getDate()}</div></div>);})}</div></>)}</div></div><div className="col-span-4 flex flex-col items-center justify-start pt-10 min-w-0"><div className="uppercase mb-4" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Weekly target</div><Ring value={weekTotalMinutes} max={settings.weeklyTarget}/></div></div>
    {isCurrent&&(<><div className="pb-3 mb-5" style={{borderBottom:`1px solid ${LINE}`}}><div className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px'}}>Working draft for Mon — Sun. Snapshots to Logs when the week rolls over.</div></div><div className="space-y-10">{fields.map(f=>(<div key={f.key}><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>{f.label}</div><MarkdownField value={weekReflection[f.key]||''} onChange={v=>setWeekReflection({...weekReflection,[f.key]:v})} placeholder={f.key==='notes'?'What you noticed. What held you back.':'What you intend for next week.'} minHeight={144} style={{background:SURFACE}} showDeepLinkHint onWikiLinkClick={onWikiLinkClick} completionData={wikiCompletionData}/></div>))}</div></>)}
  </div>);
  if(nested)return content;
  return (<div className="max-w-4xl mx-auto px-12 py-14" style={isMobile?{paddingLeft:'20px',paddingRight:'20px',paddingTop:'12px',paddingBottom:'calc(var(--footer-height,160px) + 28px)'}:{}}>{content}</div>);
}
