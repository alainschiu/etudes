import {useState,useEffect} from 'react';

// How much of the bottom of the layout viewport the on-screen keyboard currently
// covers, via the VisualViewport API — 0 when no keyboard is showing. Same
// mechanism NotesView's mobile edit sheet uses (sheetBottom) to lift itself clear
// of the keyboard on iOS; extracted here for the F5 bookmark entry surfaces.
export default function useKeyboardInset(){
  const [inset,setInset]=useState(0);
  useEffect(()=>{
    const vv=window.visualViewport;
    if(!vv)return;
    const update=()=>{
      const kb=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
      setInset(kb);
    };
    vv.addEventListener('resize',update);
    vv.addEventListener('scroll',update);
    return()=>{vv.removeEventListener('resize',update);vv.removeEventListener('scroll',update);};
  },[]);
  return inset;
}
