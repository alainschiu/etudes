import {useEffect} from 'react';

export default function useKeyboardShortcuts({
  activeItemId,activeSpotId,activeSessionId,workingOn,items,view,setView,todaySessions,isResting,
  pdfDrawerItemId,logDrawerDate,promptModal,confirmModal,exportMenu,
  quickNoteOpen,logTempo,dayClosed,editingTimeItemId,droneExpanded,metroExpanded,
  startItem,stopItem,toggleRest,toggleDrone,handleTap,
  openSettings,setPdfDrawerItemId,closeLogDrawer,setPromptModal,setConfirmModal,
  setExportMenu,setQuickNoteOpen,setEditingTimeItemId,setDroneExpanded,setMetroExpanded,setMetronome,
  sessionRefs,lastActiveRef,
}){
  useEffect(()=>{
    const handler=(e)=>{
      const t=e.target;const typing=t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable);
      if(e.metaKey||e.ctrlKey||e.altKey)return;
      if(e.key==='Escape'){
        // Modals first; then transient UI; finally if on the Settings view,
        // back to Today (Esc-to-leave matches what users expect from the
        // pre-view modal era).
        if(pdfDrawerItemId)setPdfDrawerItemId(null);
        else if(logDrawerDate)closeLogDrawer();
        else if(promptModal)setPromptModal(null);
        else if(confirmModal)setConfirmModal(null);
        else if(exportMenu)setExportMenu(false);
        else if(quickNoteOpen)setQuickNoteOpen(false);
        else if(editingTimeItemId)setEditingTimeItemId(null);
        else if(droneExpanded)setDroneExpanded(false);
        else if(metroExpanded)setMetroExpanded(false);
        else if(view==='settings'&&setView)setView('today');
        return;
      }
      if(typing)return;
      // ? on the Settings view goes back to Today; elsewhere navigates there
      // and lands on the Shortcuts tab.
      if(e.key==='?'){e.preventDefault();if(view==='settings'&&setView)setView('today');else openSettings('shortcuts');return;}
      if(e.key===' '||e.code==='Space'){
        e.preventDefault();
        if(activeItemId){stopItem();}
        else if(!dayClosed){
          const {itemId,spotId,sessionId}=lastActiveRef.current;
          if(itemId&&items.find(i=>i.id===itemId)){const it=items.find(i=>i.id===itemId);const sp=spotId&&(it.spots||[]).some(s=>s.id===spotId);const ss=sessionId&&todaySessions.some(s=>s.id===sessionId);startItem(itemId,sp?spotId:null,ss?sessionId:null);}
          else if(workingOn[0])startItem(workingOn[0]);
        }
        return;
      }
      if(e.key==='r'||e.key==='R'){e.preventDefault();toggleRest();return;}
      if(e.key==='m'||e.key==='M'){e.preventDefault();setMetronome(m=>({...m,running:!m.running}));return;}
      if(e.key==='t'||e.key==='T'){e.preventDefault();handleTap();return;}
      if(e.key==='l'||e.key==='L'){e.preventDefault();logTempo();return;}
      if(e.key==='d'||e.key==='D'){e.preventDefault();setDroneExpanded(v=>!v);return;}
      if(e.key==='n'||e.key==='N'){if(activeItemId){e.preventDefault();setQuickNoteOpen(true);}return;}
      if(view==='today'&&/^[1-4]$/.test(e.key)){e.preventDefault();const idx=parseInt(e.key,10)-1;const s=todaySessions[idx];if(s&&sessionRefs.current[s.id])sessionRefs.current[s.id].scrollIntoView({behavior:'smooth',block:'start'});return;}
    };
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeItemId,activeSpotId,activeSessionId,workingOn,items,view,todaySessions,isResting,pdfDrawerItemId,logDrawerDate,promptModal,confirmModal,exportMenu,quickNoteOpen,logTempo,dayClosed,editingTimeItemId,droneExpanded,metroExpanded]);
}
