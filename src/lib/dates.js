export const todayDateStr=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const shiftDate=(s,days)=>{const [y,m,d]=s.split('-').map(Number);const dt=new Date(y,m-1,d);dt.setDate(dt.getDate()+days);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;};
export const getWeekStart=(s)=>{const [y,m,d]=s.split('-').map(Number);const dt=new Date(y,m-1,d);const dow=dt.getDay();const off=dow===0?-6:1-dow;dt.setDate(dt.getDate()+off);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;};
export const getMonthKey=(s)=>s.slice(0,7);

// ISO 8601 week key (YYYY-Www) from a YYYY-MM-DD date string.
// Thursday determines the year — week 1 is the week containing the
// first Thursday of the year.
export function isoWeekKey(dateStr){
  if(!dateStr)return null;
  try{
    const [y,m,d]=dateStr.split('-').map(Number);
    const dt=new Date(Date.UTC(y,m-1,d));
    const day=dt.getUTCDay()||7;
    dt.setUTCDate(dt.getUTCDate()+4-day);
    const yearStart=new Date(Date.UTC(dt.getUTCFullYear(),0,1));
    const weekNum=Math.ceil(((dt-yearStart)/86400000+1)/7);
    return `${dt.getUTCFullYear()}-W${String(weekNum).padStart(2,'0')}`;
  }catch{return null;}
}

export function daysUntil(dateStr){if(!dateStr)return null;try{const [y,m,d]=dateStr.split('-').map(Number);const t=new Date(y,m-1,d);t.setHours(0,0,0,0);const today=new Date();today.setHours(0,0,0,0);return Math.round((t-today)/86400000);}catch{return null;}}
