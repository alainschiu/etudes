import React, {useState} from 'react';
import {X, Download, Archive, Upload as UploadIcon, Cloud, CloudOff, Loader} from 'lucide-react';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, serif} from '../constants/theme.js';
import appPkg from '../../package.json';

const SHORTCUTS=[{k:'Space',v:'Start / pause last practiced item'},{k:'R',v:'Toggle rest timer'},{k:'M',v:'Toggle metronome'},{k:'D',v:'Toggle tuning drone'},{k:'T',v:'Tap tempo'},{k:'L',v:'Log BPM to active item or spot'},{k:'N',v:'Quick note for active item'},{k:'1 – 4',v:'Jump to session on Today'},{k:'?',v:'Open Réglages'},{k:'Esc',v:'Close drawers and modals'}];
const APP_VERSION=(appPkg.version || 'unknown').replace(/\.0$/,'');

export function SettingsModal({settings,setSettings,storageMode,onExportMd,onExportTxt,onExportJson,onImportClick,onClose,user,signIn,signUp,signOut,syncStatus,lastSyncedAt,syncNow}){
  const [tab,setTab]=useState('settings');
  const [authMode,setAuthMode]=useState('signin'); // 'signin'|'signup'
  const [authEmail,setAuthEmail]=useState('');
  const [authPassword,setAuthPassword]=useState('');
  const [authError,setAuthError]=useState('');
  const [authBusy,setAuthBusy]=useState(false);
  const [signupSent,setSignupSent]=useState(false);
  const handleAuth=async(e)=>{e.preventDefault();setAuthError('');setAuthBusy(true);const fn=authMode==='signin'?signIn:signUp;const {error}=await fn(authEmail,authPassword);setAuthBusy(false);if(error){setAuthError(error.message);}else if(authMode==='signup'){setSignupSent(true);}};
  const sl=storageMode==='local'?'saved locally on this device':'storage unavailable';
  const sd=storageMode==='local'?'● local':'○ memory';
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}} onClick={onClose}><div className="max-w-md w-full max-h-screen overflow-auto etudes-scroll" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}>
    <div className="px-8 py-6 flex items-baseline justify-between" style={{borderBottom:`1px solid ${LINE_MED}`}}>
      <div><div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Configuration</div><h2 className="text-3xl mt-1" style={{fontFamily:serif,fontStyle:'italic',fontWeight:300}}>Réglages</h2></div>
      <button onClick={onClose} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button>
    </div>
    {/* Tab strip */}
    <div className="flex px-8" style={{borderBottom:`1px solid ${LINE}`}}>
      {[{id:'settings',label:'Settings'},{id:'shortcuts',label:'Shortcuts'},{id:'sync',label:'Sync'},{id:'export',label:'Export'},{id:'about',label:'About'}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} className="relative py-3 mr-5 uppercase shrink-0" style={{color:tab===t.id?TEXT:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>
          {t.label}{tab===t.id&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}
        </button>
      ))}
    </div>
    {tab==='settings'&&(
      <div className="px-8 py-6 space-y-5">
        <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Targets</div>
        {[{key:'dailyTarget',label:'Daily'},{key:'weeklyTarget',label:'Weekly'},{key:'monthlyTarget',label:'Monthly'}].map(f=>(<div key={f.key} className="flex items-baseline justify-between gap-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}><div><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>{f.label}</div><div className="text-xs italic mt-0.5" style={{color:FAINT,fontFamily:serif}}>minutes · warm-up excluded</div></div><input type="number" value={settings[f.key]} onChange={e=>setSettings({...settings,[f.key]:+e.target.value||0})} className="w-24 px-2 py-1 text-right font-mono text-lg tabular-nums focus:outline-none" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontWeight:300,boxSizing:'border-box'}}/></div>))}
      </div>
    )}
    {tab==='sync'&&(
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-baseline justify-between gap-4 pb-4" style={{borderBottom:`1px solid ${LINE}`}}><div className="min-w-0"><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Storage</div><div className="text-xs italic mt-0.5" style={{color:storageMode==='local'?FAINT:'#E07A7A',fontFamily:serif}}>{sl}</div></div><div className="uppercase shrink-0" style={{color:storageMode==='local'?IKB:'#E07A7A',fontSize:'10px',letterSpacing:'0.22em'}}>{sd}</div></div>
        {user?(
          <>
            <div className="flex items-start justify-between gap-4 pb-4" style={{borderBottom:`1px solid ${LINE}`}}>
              <div><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Account</div><div className="text-xs italic mt-0.5" style={{color:MUTED,fontFamily:serif}}>{user.email}</div>{lastSyncedAt>0&&<div className="mt-1 italic" style={{color:FAINT,fontFamily:serif,fontSize:'10px'}}>Last cloud sync {new Date(lastSyncedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>}</div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={syncNow} disabled={syncStatus==='syncing'} className="uppercase flex items-center gap-1.5" style={{color:syncStatus==='error'?'#E07A7A':IKB,fontSize:'9px',letterSpacing:'0.22em',opacity:syncStatus==='syncing'?0.5:1}}>
                  {syncStatus==='syncing'?<Loader className="w-3 h-3 animate-spin" strokeWidth={1.5}/>:syncStatus==='error'?<CloudOff className="w-3 h-3" strokeWidth={1.5}/>:<Cloud className="w-3 h-3" strokeWidth={1.5}/>}
                  {syncStatus==='syncing'?'Syncing…':syncStatus==='error'?'Sync error':'Sync now'}
                </button>
              </div>
            </div>
            <button onClick={signOut} className="w-full py-2.5 uppercase flex items-center justify-center gap-2" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}><CloudOff className="w-3 h-3" strokeWidth={1.25}/> Sign out</button>
          </>
        ):signupSent?(
          <div className="py-4 space-y-4">
            <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Check your inbox</div>
            <p style={{fontFamily:serif,fontSize:'15px',fontWeight:300,lineHeight:1.7,color:MUTED}}>A confirmation link has been sent to <span style={{color:TEXT}}>{authEmail}</span>. Follow the link to activate your account, then return here to sign in.</p>
            <button type="button" onClick={()=>{setSignupSent(false);setAuthMode('signin');setAuthPassword('');}} className="w-full text-center mt-2" style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>Back to sign in</button>
          </div>
        ):(
          <form onSubmit={handleAuth} className="space-y-5">
            <div><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Sign in to sync across devices</div>
              <div className="space-y-4 overflow-hidden">
                <input type="email" value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError('');}} placeholder="Email" required className="w-full pb-1.5 focus:outline-none min-w-0" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontFamily:serif,fontSize:'15px',fontWeight:300,boxSizing:'border-box'}}/>
                <input type="password" value={authPassword} onChange={e=>{setAuthPassword(e.target.value);setAuthError('');}} placeholder="Password" required className="w-full pb-1.5 focus:outline-none min-w-0" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontFamily:serif,fontSize:'15px',fontWeight:300,boxSizing:'border-box'}}/>
              </div>
              {authError&&<div className="text-xs mt-3 italic" style={{color:'#E07A7A',fontFamily:serif}}>{authError}</div>}
            </div>
            <button type="submit" disabled={authBusy} className="w-full py-2.5 uppercase flex items-center justify-center gap-2" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.28em',opacity:authBusy?0.6:1}}>
              {authBusy?<Loader className="w-3 h-3 animate-spin" strokeWidth={1.5}/>:<Cloud className="w-3 h-3" strokeWidth={1.5}/>}
              {authMode==='signin'?'Sign in':'Create account'}
            </button>
            <button type="button" onClick={()=>{setAuthMode(m=>m==='signin'?'signup':'signin');setAuthError('');}} className="w-full text-center" style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>
              {authMode==='signin'?'No account — create one':'Already have an account — sign in'}
            </button>
          </form>
        )}
      </div>
    )}
    {tab==='export'&&(
      <div className="px-8 py-6 space-y-5">
        <div><div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Journal export</div><div className="flex gap-2"><button onClick={()=>{onExportMd();onClose();}} className="flex-1 uppercase py-2.5 flex items-center justify-center gap-2" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}><Download className="w-3 h-3" strokeWidth={1.25}/> .md</button><button onClick={()=>{onExportTxt();onClose();}} className="flex-1 uppercase py-2.5 flex items-center justify-center gap-2" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}><Download className="w-3 h-3" strokeWidth={1.25}/> .txt</button></div></div>
        <div><div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Backup & restore</div><div className="text-xs italic mb-3" style={{color:FAINT,fontFamily:serif,lineHeight:1.5}}>Full backup includes all data, PDFs, and recordings in a single .json file.</div><div className="flex gap-2"><button onClick={onExportJson} className="flex-1 uppercase py-2.5 flex items-center justify-center gap-2" style={{color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,fontSize:'10px',letterSpacing:'0.22em'}}><Archive className="w-3 h-3" strokeWidth={1.25}/> Backup</button><button onClick={()=>{onClose();setTimeout(onImportClick,100);}} className="flex-1 uppercase py-2.5 flex items-center justify-center gap-2" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}><UploadIcon className="w-3 h-3" strokeWidth={1.25}/> Restore</button></div></div>
      </div>
    )}
    {tab==='shortcuts'&&(
      <div className="px-8 py-6">
        {SHORTCUTS.map((r,i)=>(<div key={r.k} className="flex items-baseline justify-between gap-6 py-3" style={{borderBottom:i<SHORTCUTS.length-1?`1px solid ${LINE}`:'none'}}><kbd className="font-mono px-2.5 py-1 tabular-nums shrink-0" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'12px'}}>{r.k}</kbd><span style={{color:MUTED,fontFamily:serif,fontSize:'14px',fontStyle:'italic',fontWeight:300,textAlign:'right'}}>{r.v}</span></div>))}
        <div className="mt-5 italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px',lineHeight:1.6}}>Shortcuts are disabled while typing in a field.</div>
      </div>
    )}
    {tab==='about'&&(
      <div className="px-8 py-6">
        <div className="flex items-baseline justify-between gap-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}>
          <div>
            <div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Version <span className="normal-case italic" style={{color:FAINT,fontFamily:serif,letterSpacing:'normal'}}>current build</span></div>
          </div>
          <div className="uppercase shrink-0" style={{color:MUTED,fontSize:'10px',letterSpacing:'0.22em'}}>v{APP_VERSION}</div>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-3">
          <div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>User Guide</div>
          <a href="#" target="_blank" rel="noopener noreferrer" className="uppercase shrink-0" style={{color:IKB,fontSize:'10px',letterSpacing:'0.22em'}}>Link pending →</a>
        </div>
      </div>
    )}
    <div className="px-8 py-5" style={{borderTop:`1px solid ${LINE}`}}><button onClick={onClose} className="w-full py-3 uppercase" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.32em'}}>Done</button></div>
  </div></div>);
}

export function HelpModal({onClose}){const rows=[{k:'Space',v:'Start / pause last practiced item + spot'},{k:'R',v:'Toggle rest timer'},{k:'M',v:'Toggle metronome'},{k:'D',v:'Toggle drone'},{k:'T',v:'Tap tempo'},{k:'L',v:'Log BPM (to active spot, or piece if no spot)'},{k:'N',v:'Quick note for active item'},{k:'1 – 4',v:'Jump to session on Today'},{k:'Esc',v:'Close drawers and modals'},{k:'?',v:'Show / hide this panel'}];return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}} onClick={onClose}><div className="max-w-md w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}><div className="px-8 py-6 flex items-baseline justify-between" style={{borderBottom:`1px solid ${LINE_MED}`}}><div><div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Reference</div><h2 className="text-3xl mt-1" style={{fontFamily:serif,fontStyle:'italic',fontWeight:300}}>Shortcuts</h2></div><button onClick={onClose} style={{color:FAINT}}><X className="w-4 h-4" strokeWidth={1.25}/></button></div><div className="px-8 py-6">{rows.map((r,i)=>(<div key={r.k} className="flex items-baseline justify-between gap-6 py-3" style={{borderBottom:i<rows.length-1?`1px solid ${LINE}`:'none'}}><kbd className="font-mono px-2.5 py-1 tabular-nums" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'12px'}}>{r.k}</kbd><span style={{color:MUTED,fontFamily:serif,fontSize:'14px',fontStyle:'italic',fontWeight:300}}>{r.v}</span></div>))}<div className="mt-5 italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px',lineHeight:1.6}}>Shortcuts are disabled while typing in a field.</div></div></div></div>);}

export function SyncConflictModal({localCount,remoteCount,hasOverlap,onMerge,onKeepLocal,onKeepCloud}){
  const overlapNote=hasOverlap
    ? 'Some pieces exist on both devices with different edits. Merge combines everything — local edits win on the same piece.'
    : 'Both devices have unique pieces. Merge combines everything safely.';
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}><div className="max-w-sm w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}>
    <div className="px-8 py-7">
      <div className="uppercase mb-4" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Sync — both devices have data</div>
      <p style={{fontFamily:serif,fontSize:'15px',lineHeight:1.7,fontWeight:300}}>This device has <span style={{color:TEXT}}>{localCount} {localCount===1?'piece':'pieces'}</span>. The cloud has <span style={{color:TEXT}}>{remoteCount} {remoteCount===1?'piece':'pieces'}</span> from another device.</p>
      <p className="mt-3" style={{fontFamily:serif,fontSize:'13px',lineHeight:1.6,fontWeight:300,color:MUTED,fontStyle:'italic'}}>{overlapNote}</p>
    </div>
    <div className="px-8 pb-6 flex flex-col gap-2" style={{borderTop:`1px solid ${LINE}`,paddingTop:'20px'}}>
      <button onClick={onMerge} className="w-full py-2.5 uppercase" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Merge — keep everything</button>
      <button onClick={onKeepLocal} className="w-full py-2.5 uppercase" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Use this device — overwrite cloud</button>
      <button onClick={onKeepCloud} className="w-full py-2.5 uppercase" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Use cloud — discard local changes</button>
    </div>
  </div></div>);
}

export function ConfirmModal({message,confirmLabel='Confirm',onConfirm,onCancel}){return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}} onClick={onCancel}><div className="max-w-sm w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}><div className="px-8 py-8 max-h-96 overflow-auto etudes-scroll"><p style={{fontFamily:serif,fontSize:'15px',lineHeight:1.6,fontWeight:300,whiteSpace:'pre-wrap'}}>{message}</p></div><div className="px-8 py-4 flex gap-3" style={{borderTop:`1px solid ${LINE}`}}><button onClick={onCancel} className="flex-1 py-2.5 uppercase" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Cancel</button><button onClick={onConfirm} className="flex-1 py-2.5 uppercase" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>{confirmLabel}</button></div></div></div>);}

export function PromptModal({title,placeholder,initial='',onConfirm,onCancel}){const [val,setVal]=useState(initial);return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}} onClick={onCancel}><div className="max-w-sm w-full" style={{background:BG,border:`1px solid ${LINE_STR}`}} onClick={e=>e.stopPropagation()}><div className="px-8 py-7"><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>{title}</div><input autoFocus value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onConfirm(val);onCancel();}}} placeholder={placeholder} className="w-full pb-1 focus:outline-none" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontFamily:serif,fontSize:'17px',fontWeight:300}}/></div><div className="px-8 py-4 flex gap-3" style={{borderTop:`1px solid ${LINE}`}}><button onClick={onCancel} className="flex-1 py-2.5 uppercase" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Cancel</button><button onClick={()=>{onConfirm(val);onCancel();}} className="flex-1 py-2.5 uppercase" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>Save</button></div></div></div>);}
