import {useState,useEffect} from 'react';

// Layout rule:
//   • Non-touch device (laptop / desktop): mobile if width < 768, else desktop.
//   • Touch device whose short edge is < 768 (a phone): mobile in any
//     orientation.
//   • Touch device whose short edge is ≥ 768 (a tablet): desktop in
//     landscape, mobile in portrait.
//
// The 768 short-edge cut-off cleanly separates phones from tablets — every
// iPad's short edge is ≥ 768, every iPhone's is well below it (the largest
// at the time of writing, iPhone 15 Pro Max, is 430).

const isTouchPrimary=()=>(
  typeof window!=='undefined'&&
  typeof window.matchMedia==='function'&&
  window.matchMedia('(pointer: coarse)').matches
);

const computeMobile=()=>{
  if(typeof window==='undefined')return false;
  const w=document.documentElement.clientWidth;
  const h=document.documentElement.clientHeight;
  if(!isTouchPrimary())return w<768;
  const minEdge=Math.min(w,h);
  if(minEdge<768)return true;          // phone → always mobile
  return w<=h;                          // tablet: portrait mobile, landscape desktop
};

export default function useViewport(){
  const [isMobile,setIsMobile]=useState(computeMobile);
  useEffect(()=>{
    const update=()=>setIsMobile(computeMobile());
    const ro=new ResizeObserver(update);
    ro.observe(document.documentElement);
    const mqPointer=window.matchMedia?.('(pointer: coarse)');
    const mqOrient=window.matchMedia?.('(orientation: landscape)');
    mqPointer?.addEventListener?.('change',update);
    mqOrient?.addEventListener?.('change',update);
    return()=>{
      ro.disconnect();
      mqPointer?.removeEventListener?.('change',update);
      mqOrient?.removeEventListener?.('change',update);
    };
  },[]);
  return {isMobile};
}
