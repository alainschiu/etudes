import {useState,useEffect} from 'react';

// Treat any touch-primary device (phones, tablets) as "mobile" regardless
// of viewport width — so a phone rotated to landscape keeps the mobile UI
// instead of flipping to the desktop transport bar. Falls back to a width
// check for laptops / desktops with narrow windows.
const isTouchPrimary=()=>(
  typeof window!=='undefined'&&
  typeof window.matchMedia==='function'&&
  window.matchMedia('(pointer: coarse)').matches
);

const computeMobile=()=>{
  if(typeof window==='undefined')return false;
  if(isTouchPrimary())return true;
  return document.documentElement.clientWidth<768;
};

export default function useViewport(){
  const [isMobile,setIsMobile]=useState(computeMobile);
  useEffect(()=>{
    const update=()=>setIsMobile(computeMobile());
    const ro=new ResizeObserver(update);
    ro.observe(document.documentElement);
    const mq=window.matchMedia?.('(pointer: coarse)');
    mq?.addEventListener?.('change',update);
    return()=>{
      ro.disconnect();
      mq?.removeEventListener?.('change',update);
    };
  },[]);
  return {isMobile};
}
