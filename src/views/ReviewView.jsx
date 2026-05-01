import React, {useState} from 'react';
import {lsGet,lsSet} from '../lib/storage.js';
import {IKB,TEXT,FAINT,sans} from '../constants/theme.js';
import useViewport from '../hooks/useViewport.js';
import WeekView from './WeekView.jsx';
import MonthView from './MonthView.jsx';

export default function ReviewView(props){
  const {isMobile}=useViewport();
  const [scale,setScale]=useState(()=>lsGet('etudes-reviewScale','week'));

  const switchScale=(s)=>{
    setScale(s);
    lsSet('etudes-reviewScale',s);
  };

  return (
    <div className="max-w-4xl mx-auto px-12 pt-14 pb-14" style={isMobile?{paddingLeft:'20px',paddingRight:'20px',paddingTop:'12px',paddingBottom:'calc(var(--footer-height,160px) + 28px)'}:{}}>
      {/* Scale toggle — two quiet words, IKB underline on active — part of the heading area */}
      <div
        className="flex items-center gap-6 mb-3"
        style={{fontFamily:sans,fontSize:'11px',letterSpacing:'0.22em',textTransform:'uppercase'}}
      >
        <button
          onClick={()=>switchScale('week')}
          className="relative pb-1"
          style={{color:scale==='week'?TEXT:FAINT,background:'none',border:'none',cursor:'pointer',padding:0,minHeight:isMobile?'44px':undefined,minWidth:isMobile?'44px':undefined}}
        >
          Week
          {scale==='week'&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}
        </button>
        <button
          onClick={()=>switchScale('month')}
          className="relative pb-1"
          style={{color:scale==='month'?TEXT:FAINT,background:'none',border:'none',cursor:'pointer',padding:0,minHeight:isMobile?'44px':undefined,minWidth:isMobile?'44px':undefined}}
        >
          Month
          {scale==='month'&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}
        </button>
      </div>

      {scale==='week'&&<WeekView {...props} nested/>}
      {scale==='month'&&<MonthView {...props} nested/>}
    </div>
  );
}
