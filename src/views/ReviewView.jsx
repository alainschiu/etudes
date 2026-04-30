import React, {useState} from 'react';
import {lsGet,lsSet} from '../lib/storage.js';
import {IKB,TEXT,FAINT,sans} from '../constants/theme.js';
import WeekView from './WeekView.jsx';
import MonthView from './MonthView.jsx';

export default function ReviewView(props){
  const [scale,setScale]=useState(()=>lsGet('etudes-reviewScale','week'));

  const switchScale=(s)=>{
    setScale(s);
    lsSet('etudes-reviewScale',s);
  };

  return (
    <div>
      {/* Scale toggle — two quiet words, IKB underline on active */}
      <div
        className="flex items-center gap-6 px-12 pt-10 pb-0"
        style={{fontFamily:sans,fontSize:'11px',letterSpacing:'0.22em',textTransform:'uppercase'}}
      >
        <button
          onClick={()=>switchScale('week')}
          className="relative pb-1"
          style={{color:scale==='week'?TEXT:FAINT,background:'none',border:'none',cursor:'pointer',padding:0}}
        >
          Week
          {scale==='week'&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}
        </button>
        <button
          onClick={()=>switchScale('month')}
          className="relative pb-1"
          style={{color:scale==='month'?TEXT:FAINT,background:'none',border:'none',cursor:'pointer',padding:0}}
        >
          Month
          {scale==='month'&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}
        </button>
      </div>

      {scale==='week'&&<WeekView {...props}/>}
      {scale==='month'&&<MonthView {...props}/>}
    </div>
  );
}
