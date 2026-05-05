import React, {useState} from 'react';
import {isDriveConfigured, getDriveAccessToken, clearDriveSession, hasDriveToken, forceExpireCachedDriveToken} from '../lib/driveAuth.js';
import {probeDriveConnection, spikeSilentDriveRenewal} from '../lib/driveSync.js';
import {formatDriveOAuthError} from '../lib/driveOAuthMessages.js';
import Download from 'lucide-react/dist/esm/icons/download';
import Archive from 'lucide-react/dist/esm/icons/archive';
import UploadIcon from 'lucide-react/dist/esm/icons/upload';
import Cloud from 'lucide-react/dist/esm/icons/cloud';
import CloudOff from 'lucide-react/dist/esm/icons/cloud-off';
import Loader from 'lucide-react/dist/esm/icons/loader';
import useViewport from '../hooks/useViewport.js';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARN, serif} from '../constants/theme.js';
import {APP_VERSION} from '../constants/config.js';
import appPkg from '../../package.json';

const SHORTCUTS=[{k:'Space',v:'Start or pause'},{k:'R',v:'Toggle rest timer'},{k:'M',v:'Toggle metronome'},{k:'D',v:'Toggle tuning drone'},{k:'T',v:'Tap tempo'},{k:'L',v:'Log BPM'},{k:'N',v:'Quick note'},{k:'1 – 4',v:'Jump to section'},{k:'?',v:'Open Réglages'},{k:'Esc',v:'Close'}];
const USER_GUIDE_URL='https://etudes.me/guide';

export default function SettingsView({settings,setSettings,storageMode,onExportZip,exportProgress,onExportJson,onImportClick,user,signIn,signUp,signOut,signInWithGoogle,syncStatus,lastSyncedAt,syncNow,syncPayloadWarning,seedTestNotes,devSeedAll,devClearAll,onSyncTabVisible,driveBackgroundError,onDismissDriveError,driveBlobRestoreProgress,driveBlobFailedCount=0,onBackupDrive,onRestoreFromDrive,onDriveDisconnectSession,onDriveConnect,initialTab='settings',setConfirmModal,setView}){
  const {isMobile}=useViewport();
  const [devBusy,setDevBusy]=useState(false);
  const [devStatus,setDevStatus]=useState('');
  const [driveBusy,setDriveBusy]=useState(false);
  const [driveLine,setDriveLine]=useState('');
  const [tab,setTab]=useState(initialTab||'settings');
  const [authMode,setAuthMode]=useState('signin');
  const [authEmail,setAuthEmail]=useState('');
  const [authPassword,setAuthPassword]=useState('');
  const [authError,setAuthError]=useState('');
  const [authBusy,setAuthBusy]=useState(false);
  const [signupSent,setSignupSent]=useState(false);
  const handleAuth=async(e)=>{e.preventDefault();setAuthError('');setAuthBusy(true);const fn=authMode==='signin'?signIn:signUp;const {error}=await fn(authEmail,authPassword);setAuthBusy(false);if(error){setAuthError(error.message);}else if(authMode==='signup'){setSignupSent(true);}};
  const sl=storageMode==='local'?'saved locally on this device':'storage unavailable';
  const sd=storageMode==='local'?'● local':'○ memory';
  const goBack=()=>setView&&setView('today');

  return (
    <div className="max-w-2xl mx-auto" style={isMobile?{paddingLeft:'20px',paddingRight:'20px',paddingTop:'12px',paddingBottom:'calc(var(--footer-height,160px) + 28px)'}:{paddingLeft:'48px',paddingRight:'48px',paddingTop:'56px',paddingBottom:'56px'}}>
      {/* Header — matches DisplayHeader pattern from other views */}
      {isMobile?(
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'16px',paddingTop:'8px'}}>
          <div>
            <div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Configuration</div>
            <div style={{fontFamily:serif,fontStyle:'italic',fontWeight:400,fontSize:'clamp(48px,13vw,56px)',letterSpacing:'-0.02em',lineHeight:1.05,color:TEXT}}>Réglages</div>
          </div>
          <button onClick={goBack} className="uppercase px-3 py-1.5" style={{color:MUTED,border:`1px solid ${LINE_MED}`,fontSize:'9px',letterSpacing:'0.22em',background:'transparent',marginBottom:'8px'}}>Done</button>
        </div>
      ):(
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Configuration</div>
            <h1 className="leading-none" style={{fontFamily:serif,fontWeight:400,fontSize:'clamp(32px,6vw,56px)',letterSpacing:'-0.02em'}}>
              <span style={{fontStyle:'italic'}}>Réglages</span>
            </h1>
          </div>
        </div>
      )}

      {/* Tab strip — in-view sub-navigation. North Star permits this in views,
          just not in modals. Horizontal scroll on narrow widths. */}
      <div className="flex overflow-x-auto etudes-scroll" style={{borderTop:`1px solid ${LINE_STR}`,borderBottom:`1px solid ${LINE}`}}>
        {[{id:'settings',label:'Settings'},{id:'shortcuts',label:'Shortcuts'},{id:'sync',label:'Sync'},{id:'export',label:'Export'},{id:'about',label:'About'}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);if(t.id==='sync')onSyncTabVisible?.();}} className="relative py-3 uppercase shrink-0" style={{color:tab===t.id?TEXT:FAINT,fontSize:'10px',letterSpacing:'0.22em',marginRight:'18px'}}>
            {t.label}{tab===t.id&&<span className="absolute bottom-0 left-0 right-0" style={{height:'1px',background:IKB}}/>}
          </button>
        ))}
      </div>

      {tab==='settings'&&(
        <div className="py-6 space-y-5">
          <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Targets</div>
          {[{key:'dailyTarget',label:'Daily'},{key:'weeklyTarget',label:'Weekly'},{key:'monthlyTarget',label:'Monthly'}].map(f=>(<div key={f.key} className="flex items-baseline justify-between gap-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}><div><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>{f.label}</div><div className="text-xs italic mt-0.5" style={{color:FAINT,fontFamily:serif}}>minutes · warm-up excluded</div></div><input type="number" value={settings[f.key]} onChange={e=>setSettings({...settings,[f.key]:+e.target.value||0})} className="w-24 px-2 py-1 text-right font-mono text-lg tabular-nums focus:outline-none" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontWeight:300,boxSizing:'border-box'}}/></div>))}
          <div className="uppercase pt-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Daily reminder</div>
          <div className="flex items-center justify-between gap-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}>
            <div><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Reminder</div><div className="text-xs italic mt-0.5" style={{color:FAINT,fontFamily:serif}}>no streaks · no consequences · opt-in</div></div>
            <button onClick={async()=>{if(!settings.reminderEnabled){const {requestNotificationPermission}=await import('../lib/notifications.js');await requestNotificationPermission();}setSettings({...settings,reminderEnabled:!settings.reminderEnabled});}} className="uppercase px-3 py-1" style={{color:settings.reminderEnabled?TEXT:FAINT,border:`1px solid ${settings.reminderEnabled?IKB:LINE_STR}`,background:settings.reminderEnabled?IKB_SOFT:'transparent',fontSize:'9px',letterSpacing:'0.22em'}}>{settings.reminderEnabled?'On':'Off'}</button>
          </div>
          {settings.reminderEnabled&&(<div className="flex items-baseline justify-between gap-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Time</div><input type="time" value={settings.reminderTime||'18:00'} onChange={e=>setSettings({...settings,reminderTime:e.target.value})} className="focus:outline-none font-mono" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontSize:'16px'}}/></div>)}
          <div className="pt-1 italic" style={{color:FAINT,fontFamily:serif,fontSize:'11px',lineHeight:1.6}}>Appears once on days you haven't opened Études. Requires notification permission. Resets each day.</div>
        </div>
      )}

      {tab==='sync'&&(
        <div className="py-6 space-y-5">
          <div className="flex items-baseline justify-between gap-4 pb-4" style={{borderBottom:`1px solid ${LINE}`}}><div className="min-w-0"><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Storage</div><div className="text-xs italic mt-0.5" style={{color:storageMode==='local'?FAINT:WARN,fontFamily:serif}}>{sl}</div></div><div className="uppercase shrink-0" style={{color:storageMode==='local'?IKB:WARN,fontSize:'10px',letterSpacing:'0.22em'}}>{sd}</div></div>
          {user?(
            <>
              <div className="flex items-start justify-between gap-4 pb-4" style={{borderBottom:`1px solid ${LINE}`}}>
                <div><div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Account</div><div className="text-xs italic mt-0.5" style={{color:MUTED,fontFamily:serif}}>{user.email}</div>{lastSyncedAt>0&&<div className="mt-1 italic" style={{color:FAINT,fontFamily:serif,fontSize:'10px'}}>Last cloud sync {new Date(lastSyncedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>}</div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={syncNow} disabled={syncStatus==='syncing'} className="uppercase flex items-center gap-1.5" style={{color:syncStatus==='error'?WARN:IKB,fontSize:'9px',letterSpacing:'0.22em',opacity:syncStatus==='syncing'?0.5:1}}>
                    {syncStatus==='syncing'?<Loader className="w-3 h-3 animate-spin" strokeWidth={1.5}/>:syncStatus==='error'?<CloudOff className="w-3 h-3" strokeWidth={1.5}/>:<Cloud className="w-3 h-3" strokeWidth={1.5}/>}
                    {syncStatus==='syncing'?'Syncing…':syncStatus==='error'?'Sync error':'Sync now'}
                  </button>
                </div>
              </div>
              <button onClick={signOut} className="w-full py-2.5 uppercase flex items-center justify-center gap-2" style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}><CloudOff className="w-3 h-3" strokeWidth={1.25}/> Sign out</button>
              {syncPayloadWarning&&(<div className="px-3 py-2" style={{background:'rgba(184,150,104,0.12)',border:'1px solid rgba(184,150,104,0.3)'}}><div className="italic" style={{color:'#B89668',fontFamily:serif,fontSize:'11px',lineHeight:1.5}}>Your journal is large. Export a backup to protect your data.</div></div>)}
              <div className="pt-2 pb-1 italic" style={{color:FAINT,fontFamily:serif,fontSize:'11px',lineHeight:1.6}}>
                <span style={{color:MUTED}}>Cloud sync (account):</span> repertoire, practice history, notes, settings, and recording metadata.<br/>
                <span style={{color:MUTED}}>Not in the cloud:</span> audio and PDF files. Connect Google Drive below for optional backup, or use Export for a file backup.
              </div>
              {driveBackgroundError&&(<div className="flex items-start justify-between gap-2 px-3 py-2 mt-3" style={{background:'rgba(184,150,104,0.12)',border:'1px solid rgba(184,150,104,0.3)'}}><div className="italic" style={{color:'#B89668',fontFamily:serif,fontSize:'11px',lineHeight:1.5}}>{driveBackgroundError}</div>{onDismissDriveError&&<button type="button" onClick={onDismissDriveError} className="shrink-0 uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.18em'}}>Dismiss</button>}</div>)}
              {driveBlobRestoreProgress&&<div className="text-xs italic mt-2" style={{color:MUTED,fontFamily:serif}}>Restoring media {driveBlobRestoreProgress.done} / {driveBlobRestoreProgress.total}…</div>}
              {!driveBlobRestoreProgress&&driveBlobFailedCount>0&&<div className="text-xs italic mt-1" style={{color:FAINT,fontFamily:serif}}>{driveBlobFailedCount} file{driveBlobFailedCount===1?'':'s'} could not be restored from Drive.</div>}
              <div className="pt-5 mt-4" style={{borderTop:`1px solid ${LINE}`}}>
                <div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Google Drive backup</div>
                {!isDriveConfigured() ? (
                  <p className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'11px',lineHeight:1.6}}>Drive backup requires <span style={{fontFamily:'ui-monospace,monospace',fontSize:'10px'}}>VITE_GOOGLE_CLIENT_ID</span> (OAuth Web client with Drive scope).</p>
                ) : (
                  <div className="space-y-3">
                    <p className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'11px',lineHeight:1.6}}>Separate from Supabase: uses Google Identity Services with access only to files the app creates in your Drive.</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={driveBusy}
                        onClick={async()=>{
                          setDriveBusy(true);setDriveLine('');
                          try{
                            if(onDriveConnect){await onDriveConnect();const r=await probeDriveConnection();if(r.ok)setDriveLine(r.user?.emailAddress?`Connected (${r.user.emailAddress})`:'Connected to Drive');else setDriveLine(r.error||'Connection failed');}
                            else{await getDriveAccessToken({interactive:true});const r=await probeDriveConnection();if(r.ok)setDriveLine(r.user?.emailAddress?`Connected (${r.user.emailAddress})`:'Connected to Drive');else setDriveLine(r.error||'Connection failed');}
                          }catch(e){setDriveLine(formatDriveOAuthError(e instanceof Error?e.message:String(e)));}
                          finally{setDriveBusy(false);}
                        }}
                        className="uppercase flex items-center gap-1.5 px-3 py-2"
                        style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'9px',letterSpacing:'0.22em',opacity:driveBusy?0.5:1}}
                      >
                        {driveBusy?<Loader className="w-3 h-3 animate-spin" strokeWidth={1.5}/>:null}
                        Connect Google Drive
                      </button>
                      {hasDriveToken()&&(
                        <>
                          {onBackupDrive&&<button type="button" disabled={driveBusy} onClick={()=>{onBackupDrive();setDriveLine('Backup queued…');}} className="uppercase px-3 py-2" style={{color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,fontSize:'9px',letterSpacing:'0.22em'}}>Backup now</button>}
                          {onRestoreFromDrive&&<button type="button" disabled={driveBusy} onClick={()=>{onRestoreFromDrive();}} className="uppercase px-3 py-2" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'9px',letterSpacing:'0.22em'}}>Restore from Drive</button>}
                          <button
                            type="button"
                            disabled={driveBusy}
                            onClick={()=>{if(onDriveDisconnectSession)onDriveDisconnectSession();else{clearDriveSession();}setDriveLine('Signed out of Drive on this device');}}
                            className="uppercase px-3 py-2"
                            style={{color:MUTED,border:`1px solid ${LINE_STR}`,fontSize:'9px',letterSpacing:'0.22em'}}
                          >
                            Disconnect Drive
                          </button>
                        </>
                      )}
                    </div>
                    {hasDriveToken()&&onBackupDrive&&(<div className="flex items-center justify-between gap-4 pt-1"><div className="text-xs italic" style={{color:FAINT,fontFamily:serif}}>Auto-backup journal and new recordings to Drive</div><button type="button" onClick={()=>setSettings({...settings,driveAutoBackup:!settings.driveAutoBackup})} className="uppercase px-3 py-1 shrink-0" style={{color:settings.driveAutoBackup?TEXT:FAINT,border:`1px solid ${settings.driveAutoBackup?IKB:LINE_STR}`,background:settings.driveAutoBackup?IKB_SOFT:'transparent',fontSize:'9px',letterSpacing:'0.22em'}}>{settings.driveAutoBackup?'On':'Off'}</button></div>)}
                    {driveLine&&<div className="text-xs italic" style={{color:MUTED,fontFamily:serif}}>{driveLine}</div>}
                    {import.meta.env.DEV&&(
                      <div className="pt-3 space-y-2" style={{borderTop:`1px dashed ${LINE_MED}`}}>
                        <div className="uppercase" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em'}}>Dev — silent renewal spike</div>
                        <p className="italic" style={{color:FAINT,fontFamily:serif,fontSize:'10px',lineHeight:1.5}}>
                          Set <span style={{fontFamily:'ui-monospace,monospace'}}>VITE_DRIVE_TOKEN_TTL_SEC=30</span> in <span style={{fontFamily:'ui-monospace,monospace'}}>.env.local</span>, restart dev, connect once, wait 31s, then run <strong>Test silent renewal</strong> (no interactive fallback). See README.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={driveBusy}
                            onClick={async()=>{
                              setDriveBusy(true);setDriveLine('');
                              try{
                                const r=await spikeSilentDriveRenewal();
                                if(r.ok)setDriveLine(r.email?`Silent OK — ${r.email}`:'Silent OK — Drive about succeeded');
                                else setDriveLine(`Silent FAILED — ${r.error}`);
                              }catch(e){setDriveLine(formatDriveOAuthError(e instanceof Error?e.message:String(e)));}
                              finally{setDriveBusy(false);}
                            }}
                            className="uppercase px-2 py-1.5"
                            style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'8px',letterSpacing:'0.18em'}}
                          >Test silent renewal</button>
                          <button
                            type="button"
                            disabled={driveBusy}
                            onClick={()=>{forceExpireCachedDriveToken();setDriveLine('Token cache forced expired — use Test silent renewal after ~31s if TTL=30');}}
                            className="uppercase px-2 py-1.5"
                            style={{color:FAINT,border:`1px solid ${LINE_MED}`,fontSize:'8px',letterSpacing:'0.18em'}}
                          >Force expire token</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ):signupSent?(
            <div className="py-4 space-y-4">
              <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Check your inbox</div>
              <p style={{fontFamily:serif,fontSize:'15px',fontWeight:300,lineHeight:1.7,color:MUTED}}>A confirmation link was sent to <span style={{color:TEXT}}>{authEmail}</span>. Follow it to activate, then return here to sign in.</p>
              <button type="button" onClick={()=>{setSignupSent(false);setAuthMode('signin');setAuthPassword('');}} className="w-full text-center mt-2" style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>Back to sign in</button>
            </div>
          ):(
            <div className="space-y-5">
              {signInWithGoogle&&(<div className="space-y-2"><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Continue with</div><button type="button" onClick={signInWithGoogle} className="w-full py-2.5 uppercase flex items-center justify-center gap-2" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}>Google</button><div className="flex items-center gap-3 py-1"><span style={{flex:1,height:'1px',background:LINE_STR}}/><span className="uppercase" style={{color:DIM,fontSize:'9px',letterSpacing:'0.22em'}}>or</span><span style={{flex:1,height:'1px',background:LINE_STR}}/></div></div>)}
              <form onSubmit={handleAuth} className="space-y-5">
                <div><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Sign in with email</div>
                  <div className="space-y-4 overflow-hidden">
                    <input type="email" value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError('');}} placeholder="Email" required className="w-full pb-1.5 focus:outline-none min-w-0" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontFamily:serif,fontSize:'16px',fontWeight:300,boxSizing:'border-box'}}/>
                    <input type="password" value={authPassword} onChange={e=>{setAuthPassword(e.target.value);setAuthError('');}} placeholder="Password" required className="w-full pb-1.5 focus:outline-none min-w-0" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontFamily:serif,fontSize:'16px',fontWeight:300,boxSizing:'border-box'}}/>
                  </div>
                  {authError&&<div className="text-xs mt-3 italic" style={{color:WARN,fontFamily:serif}}>{authError}</div>}
                </div>
                <button type="submit" disabled={authBusy} className="w-full py-2.5 uppercase flex items-center justify-center gap-2" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.28em',opacity:authBusy?0.6:1}}>
                  {authBusy?<Loader className="w-3 h-3 animate-spin" strokeWidth={1.5}/>:<Cloud className="w-3 h-3" strokeWidth={1.5}/>}
                  {authMode==='signin'?'Sign in':'Create account'}
                </button>
                <button type="button" onClick={()=>{setAuthMode(m=>m==='signin'?'signup':'signin');setAuthError('');}} className="w-full text-center" style={{color:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:'12px'}}>
                  {authMode==='signin'?'No account — create one':'Already have an account — sign in'}
                </button>
                <div className="pt-1 italic" style={{color:FAINT,fontFamily:serif,fontSize:'11px',lineHeight:1.6}}>
                  After you sign in, cloud sync covers repertoire, history, notes, and settings. Audio and PDFs are not uploaded to the cloud; optional Google Drive backup appears on the Sync tab once signed in, or use Export for a file backup.
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {tab==='export'&&(
        <div className="py-6 space-y-5">
          <div>
            <div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Journal export</div>
            <button onClick={onExportZip} disabled={!!exportProgress} className="w-full uppercase py-3 flex items-center justify-center gap-2 mb-2" style={{color:TEXT,background:IKB,fontSize:'10px',letterSpacing:'0.28em',opacity:exportProgress?0.6:1}}><Download className="w-3 h-3" strokeWidth={1.25}/> Export journal</button>
            {exportProgress?(
              <div className="text-center mb-2" style={{color:MUTED,fontSize:'11px',fontStyle:'italic'}}>{exportProgress}</div>
            ):(
              <div className="text-center mb-2" style={{color:FAINT,fontSize:'11px'}}>Includes notes, logs, recordings, and scores. Audio files may be large.</div>
            )}
          </div>
          <div><div className="uppercase mb-2" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Backup & restore</div><div className="text-xs italic mb-3" style={{color:FAINT,fontFamily:serif,lineHeight:1.5}}>Full backup of all data, PDFs, and recordings in one file.</div><div className="flex gap-2"><button onClick={onExportJson} className="flex-1 uppercase py-2.5 flex items-center justify-center gap-2" style={{color:TEXT,border:`1px solid ${IKB}`,background:IKB_SOFT,fontSize:'10px',letterSpacing:'0.22em'}}><Archive className="w-3 h-3" strokeWidth={1.25}/> Backup</button><button onClick={onImportClick} className="flex-1 uppercase py-2.5 flex items-center justify-center gap-2" style={{color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em'}}><UploadIcon className="w-3 h-3" strokeWidth={1.25}/> Restore</button></div></div>
        </div>
      )}

      {tab==='shortcuts'&&(
        <div className="py-6">
          {SHORTCUTS.map((r,i)=>(<div key={r.k} className="flex items-baseline justify-between gap-6 py-3" style={{borderBottom:i<SHORTCUTS.length-1?`1px solid ${LINE}`:'none'}}><kbd className="font-mono px-2.5 py-1 tabular-nums shrink-0" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'12px'}}>{r.k}</kbd><span style={{color:MUTED,fontFamily:serif,fontSize:'14px',fontStyle:'italic',fontWeight:300,textAlign:'right'}}>{r.v}</span></div>))}
          <div className="mt-5 italic" style={{color:FAINT,fontFamily:serif,fontSize:'12px',lineHeight:1.6}}>Shortcuts are disabled while typing in a field.</div>
        </div>
      )}

      {tab==='about'&&(
        <div className="py-6">
          <div className="flex items-baseline justify-between gap-4 pb-3" style={{borderBottom:`1px solid ${LINE}`}}>
            <div>
              <div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>Version <span className="normal-case italic" style={{color:FAINT,fontFamily:serif,letterSpacing:'normal'}}>current build</span></div>
            </div>
            <div className="uppercase shrink-0" style={{color:MUTED,fontSize:'10px',letterSpacing:'0.22em'}}>v{appPkg.version||APP_VERSION}</div>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3" style={{borderBottom:`1px solid ${LINE}`}}>
            <div className="uppercase" style={{fontSize:'10px',letterSpacing:'0.28em'}}>User Guide</div>
            <a
              href={USER_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="uppercase shrink-0"
              style={{color:IKB,fontSize:'10px',letterSpacing:'0.22em',cursor:'pointer'}}
              onClick={(e)=>{
                e.stopPropagation();
                const w=window.open(USER_GUIDE_URL,'_blank','noopener,noreferrer');
                if(w)e.preventDefault();
              }}
            >etudes.me/guide →</a>
          </div>
          {(seedTestNotes||devSeedAll||devClearAll)&&(
            <div className="pt-3">
              <div className="uppercase mb-2" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.28em'}}>Debug</div>
              <div className="flex flex-col gap-2">
                {devSeedAll&&<button
                  disabled={devBusy}
                  onClick={async()=>{
                    setDevBusy(true);setDevStatus('seeding…');
                    try{const r=await devSeedAll();setDevStatus(`✓ ${r.pieces} pieces · ${r.days} days · ${r.notes} notes · ${r.recs} recordings · ${r.refs} refs`);setTimeout(()=>window.location.reload(),800);}
                    catch(e){setDevStatus(`✗ ${e.message||String(e)}`);}
                    setDevBusy(false);
                  }}
                  className="uppercase text-left"
                  style={{color:devBusy?FAINT:'#C97E4A',border:`1px solid ${devBusy?LINE:'#5a3a10'}`,background:'transparent',padding:'4px 12px',fontSize:'9px',letterSpacing:'0.22em',cursor:devBusy?'not-allowed':'pointer'}}
                >Seed all (50 pieces · audio · notes · routines)</button>}
                {seedTestNotes&&<button
                  disabled={devBusy}
                  onClick={()=>{seedTestNotes();}}
                  className="uppercase text-left"
                  style={{color:FAINT,border:`1px solid ${LINE_MED}`,background:'transparent',padding:'4px 12px',fontSize:'9px',letterSpacing:'0.22em',cursor:'pointer'}}
                >Seed notes &amp; history only</button>}
                {devClearAll&&<button
                  disabled={devBusy}
                  onClick={()=>{
                    const run=async()=>{setDevBusy(true);setDevStatus('clearing…');await devClearAll();setDevStatus('✓ cleared — reloading…');setTimeout(()=>window.location.reload(),600);};
                    if(setConfirmModal){setConfirmModal({message:'Clear all Études data? This cannot be undone.',confirmLabel:'Clear all data',isDestructive:true,onConfirm:async()=>{setConfirmModal(null);await run();}});}
                    else if(window.confirm('Clear all Études data? This cannot be undone.')){run();}
                  }}
                  className="uppercase text-left"
                  style={{color:WARN,border:`1px solid ${WARN}80`,background:'transparent',padding:'4px 12px',fontSize:'9px',letterSpacing:'0.22em',cursor:'pointer'}}
                >Clear all data</button>}
                {devStatus&&<span style={{color:FAINT,fontSize:'9px',letterSpacing:'0.1em'}}>{devStatus}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
