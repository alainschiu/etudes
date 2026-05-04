import {useEffect} from 'react';

const FOCUSABLE='a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(containerRef,isActive=true){
  useEffect(()=>{
    if(!isActive)return;
    const container=containerRef.current;
    if(!container)return;
    const trigger=document.activeElement;
    const focusables=()=>Array.from(container.querySelectorAll(FOCUSABLE)).filter(el=>!el.hasAttribute('aria-hidden'));
    if(!container.contains(document.activeElement)){
      const first=focusables()[0];
      if(first)first.focus();
      else{container.setAttribute('tabindex','-1');container.focus();}
    }
    const handler=(e)=>{
      if(e.key!=='Tab')return;
      const f=focusables();if(!f.length)return;
      const firstEl=f[0],lastEl=f[f.length-1];
      if(e.shiftKey){
        if(document.activeElement===firstEl||!container.contains(document.activeElement)){e.preventDefault();lastEl.focus();}
      }else{
        if(document.activeElement===lastEl){e.preventDefault();firstEl.focus();}
      }
    };
    container.addEventListener('keydown',handler);
    return()=>{
      container.removeEventListener('keydown',handler);
      if(trigger&&document.contains(trigger)&&typeof trigger.focus==='function')trigger.focus();
    };
  },[isActive,containerRef]);
}
