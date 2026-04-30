import React from 'react';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import BarChart2 from 'lucide-react/dist/esm/icons/bar-chart-2';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import ListMusic from 'lucide-react/dist/esm/icons/list-music';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import StickyNote from 'lucide-react/dist/esm/icons/sticky-note';
import {TEXT,FAINT,IKB,IKB_SOFT,LINE_MED,BG,sans} from '../constants/theme.js';

const ICONS={
  today:CalendarDays,
  review:BarChart2,
  repertoire:BookOpen,
  routines:Repeat,
  logs:ScrollText,
  notes:StickyNote,
  programs:ListMusic,
};

export default function MobileBottomNav({tabs,view,setView}){
  return (
    <nav
      className="shrink-0 flex items-stretch"
      style={{
        borderTop:`1px solid ${LINE_MED}`,
        background:BG,
        paddingBottom:'env(safe-area-inset-bottom)',
        height:'calc(56px + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map(t=>{
        const Icon=ICONS[t.id]||CalendarDays;
        const active=view===t.id;
        return (
          <button
            key={t.id}
            onClick={()=>setView(t.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
            style={{
              background:active?IKB_SOFT:'transparent',
              color:active?IKB:FAINT,
              fontSize:'8px',
              letterSpacing:'0.18em',
              fontFamily:sans,
              textTransform:'uppercase',
              borderTop:active?`2px solid ${IKB}`:'2px solid transparent',
            }}
          >
            <Icon style={{width:'18px',height:'18px'}} strokeWidth={active?1.5:1.25}/>
            <span style={{lineHeight:1,marginTop:'1px'}}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
