import {useState,useEffect} from 'react';

export default function useViewport(){
  const [isMobile,setIsMobile]=useState(()=>window.innerWidth<768);
  useEffect(()=>{
    const ro=new ResizeObserver(()=>setIsMobile(document.documentElement.clientWidth<768));
    ro.observe(document.documentElement);
    return()=>ro.disconnect();
  },[]);
  return {isMobile};
}
