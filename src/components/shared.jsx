import React, {useState, useEffect, useRef} from 'react';
import {computePeaks} from '../lib/media.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import SkipBack from 'lucide-react/dist/esm/icons/skip-back';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Crosshair from 'lucide-react/dist/esm/icons/crosshair';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Check from 'lucide-react/dist/esm/icons/check';
import Music from 'lucide-react/dist/esm/icons/music';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Upload from 'lucide-react/dist/esm/icons/upload';
import {MarkdownEditor} from './MarkdownEditor.jsx';
import {BG, SURFACE, SURFACE2, TEXT, MUTED, FAINT, DIM, LINE, LINE_MED, LINE_STR, IKB, IKB_SOFT, WARM, serif, serifText, sans, mono, LINK} from '../constants/theme.js';
import {STAGES} from '../constants/config.js';
import {idbGet} from '../lib/storage.js';
import {daysUntil} from '../lib/dates.js';
import {getItemTime, getSpotTime, displayTitle, formatByline} from '../lib/items.js';

export function DisplayHeader({eyebrow,title,suffix,right,titleRight}){return (<div className="mb-12 flex items-end justify-between gap-6"><div><div className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>{eyebrow}</div><div className="flex items-end gap-5"><h1 className="leading-none" style={{fontFamily:serif,fontWeight:300,fontSize:'72px',letterSpacing:'-0.02em'}}><span style={{fontStyle:'italic'}}>{title}</span>{suffix&&<span style={{color:FAINT}}>{suffix}</span>}</h1>{titleRight&&<div className="pb-2">{titleRight}</div>}</div></div>{right}</div>);}

export function Ring({value,max,maxSize=180}){const pct=Math.min(100,(value/max)*100);return (<div className="relative flex items-center justify-center w-full mx-auto" style={{maxWidth:maxSize,aspectRatio:'1 / 1'}}><svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" preserveAspectRatio="xMidYMid meet"><circle cx="50" cy="50" r="44" fill="none" stroke={LINE_MED} strokeWidth="5"/><circle cx="50" cy="50" r="44" fill="none" stroke={IKB} strokeWidth="5" strokeLinecap="round" strokeDasharray={2*Math.PI*44} strokeDashoffset={2*Math.PI*44*(1-pct/100)} style={{transition:'stroke-dashoffset 0.6s ease'}}/></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><div className="tabular-nums" style={{fontFamily:serif,fontWeight:300,letterSpacing:'-0.02em',fontSize:'36px'}}>{value}<span style={{color:MUTED,fontSize:'18px'}}>′</span></div><div className="uppercase mt-1" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.25em'}}>of {max}′</div></div></div>);}

export function StageLabels({stage,onChange,compact=false}){const ai=STAGES.findIndex(s=>s.key===stage);return (<div className={`flex ${compact?'gap-4':'gap-5'} flex-wrap`}>{STAGES.map((s,i)=>{const a=i===ai;return (<button key={s.key} onClick={(e)=>{e.stopPropagation();onChange(s.key);}} className="transition pb-1.5" style={{color:a?TEXT:FAINT,fontFamily:serif,fontStyle:'italic',fontSize:compact?'12px':'15px',fontWeight:300,borderBottom:a?`1px solid ${IKB}`:`1px solid transparent`}}>{s.label}</button>);})}</div>);}

export function Waveform({date,meta,compact=false,blobLoader,actions,playbackRate=1.0}){
  const [playing,setPlaying]=useState(false);
  const [progress,setProgress]=useState(0);
  const [duration,setDuration]=useState(0);
  const [blobAvailable,setBlobAvailable]=useState(true);
  const audioRef=useRef(null);
  const urlRef=useRef(null);
  const svgRef=useRef(null);
  const scrubbingRef=useRef(false);
  const wasPlayingRef=useRef(false);
  const playbackRateRef=useRef(playbackRate);
  const uid=useRef(`wf${Math.random().toString(36).slice(2,7)}`).current;
  const load=blobLoader||(()=>idbGet('recordings',date));

  useEffect(()=>{
    playbackRateRef.current=playbackRate;
    if(audioRef.current){audioRef.current.playbackRate=playbackRate;audioRef.current.preservesPitch=true;}
  },[playbackRate]);

  useEffect(()=>{if(!meta)return;load().then(b=>setBlobAvailable(!!b));},[date,meta]);

  const ensure=async()=>{
    if(audioRef.current)return audioRef.current;
    const b=await load();if(!b)return null;
    urlRef.current=URL.createObjectURL(b);
    const a=new Audio(urlRef.current);
    a.playbackRate=playbackRateRef.current;
    a.preservesPitch=true;
    a.onloadedmetadata=()=>{setDuration(a.duration||0);};
    a.ontimeupdate=()=>{if(!scrubbingRef.current)setProgress(a.duration?a.currentTime/a.duration:0);};
    a.onended=()=>{setPlaying(false);setProgress(0);};
    audioRef.current=a;return a;
  };

  const play=async()=>{const a=await ensure();if(!a)return;a.play().then(()=>setPlaying(true)).catch(()=>{});};
  const pause=()=>{if(audioRef.current){audioRef.current.pause();setPlaying(false);}};
  const rewind=()=>{if(audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0;}setPlaying(false);setProgress(0);};

  // Real scrubbing: mousedown starts drag, mousemove tracks, mouseup commits
  const onScrubStart=async(e)=>{
    if(!peaks.length)return;
    e.preventDefault();
    wasPlayingRef.current=playing;
    // Pause during scrub so audio doesn't race ahead
    if(audioRef.current){audioRef.current.pause();setPlaying(false);}
    // Pre-load audio so mouseup can seek immediately
    ensure();
    scrubbingRef.current=true;

    const getFrac=(clientX)=>{
      if(!svgRef.current)return 0;
      const r=svgRef.current.getBoundingClientRect();
      return Math.max(0,Math.min(1,(clientX-r.left)/r.width));
    };

    // Set initial position immediately
    setProgress(getFrac(e.clientX));

    const onMove=(mv)=>{setProgress(getFrac(mv.clientX));};
    const onUp=async(up)=>{
      scrubbingRef.current=false;
      document.removeEventListener('mousemove',onMove);
      document.removeEventListener('mouseup',onUp);
      const frac=getFrac(up.clientX);
      setProgress(frac);
      const a=audioRef.current;
      if(a&&a.duration&&!isNaN(a.duration)){
        a.currentTime=frac*a.duration;
        if(wasPlayingRef.current)a.play().then(()=>setPlaying(true)).catch(()=>{});
      }
    };
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
  };

  useEffect(()=>()=>{if(audioRef.current)audioRef.current.pause();if(urlRef.current)URL.revokeObjectURL(urlRef.current);},[]);

  // 2-pass smooth + normalize for display
  const rawPeaks=meta?.peaks||[];
  const peaks=rawPeaks.length<3?rawPeaks:(()=>{
    let s=[...rawPeaks];
    for(let p=0;p<2;p++){const n=[...s];for(let i=1;i<s.length-1;i++)n[i]=s[i-1]*0.25+s[i]*0.5+s[i+1]*0.25;s=n;}
    const mx=Math.max(...s,1e-6);return s.map(v=>v/mx);
  })();

  // Closed SVG path: smooth bezier top (L→R) + bottom (R→L)
  const shapePath=(()=>{
    const n=peaks.length;if(n<2)return'';
    const f=v=>v.toFixed(2);
    const xOf=i=>(i/(n-1))*1000;
    const topPts=peaks.map((p,i)=>[xOf(i),50-p*46]);
    const botR2L=peaks.slice().reverse().map((p,i)=>[xOf(n-1-i),50+p*46]);
    let top=`M${f(topPts[0][0])},${f(topPts[0][1])}`;
    for(let i=1;i<topPts.length;i++){const cx=(topPts[i-1][0]+topPts[i][0])/2;top+=` C${f(cx)},${f(topPts[i-1][1])} ${f(cx)},${f(topPts[i][1])} ${f(topPts[i][0])},${f(topPts[i][1])}`;}
    let bot='';
    for(let i=1;i<botR2L.length;i++){const cx=(botR2L[i-1][0]+botR2L[i][0])/2;bot+=` C${f(cx)},${f(botR2L[i-1][1])} ${f(cx)},${f(botR2L[i][1])} ${f(botR2L[i][0])},${f(botR2L[i][1])}`;}
    return top+` L${f(botR2L[0][0])},${f(botR2L[0][1])}`+bot+' Z';
  })();

  const fmtT=s=>{if(!s||isNaN(s))return'--:--';const m=Math.floor(s/60);return m+':'+String(Math.floor(s%60)).padStart(2,'0');};
  const clipId=`${uid}-c`;
  const needleX=progress*1000;

  if(!blobAvailable&&meta)return(<div style={{color:FAINT,fontSize:'10px',letterSpacing:'0.14em',textTransform:'uppercase'}}>Recording on another device</div>);

  const svgMarkup=(h)=>(
    <svg ref={svgRef} width="100%" height={h} viewBox="0 0 1000 100" preserveAspectRatio="none"
      style={{display:'block',cursor:peaks.length?'col-resize':'default',userSelect:'none'}}
      onMouseDown={peaks.length?onScrubStart:undefined}>
      <defs><clipPath id={clipId}><rect x="0" y="0" width={needleX} height="100"/></clipPath></defs>
      {peaks.length>0?(<>
        <path d={shapePath} fill={DIM}/>
        <path d={shapePath} fill={IKB} clipPath={`url(#${clipId})`}/>
        <line x1={needleX} y1="0" x2={needleX} y2="100" stroke={IKB} strokeWidth="2" opacity="0.9"/>
      </>):(
        <text x="8" y="56" fill={FAINT} fontSize="9" fontFamily={serif} fontStyle="italic">recording unavailable</text>
      )}
    </svg>
  );

  if(compact){
    return(
      <div className="flex items-center gap-3 w-full" style={{minWidth:0}}>
        <button onClick={playing?pause:play} className="shrink-0" style={{color:playing?IKB:TEXT}}>
          {playing?<Pause className="w-3.5 h-3.5" strokeWidth={1.25} fill="currentColor"/>:<Play className="w-3.5 h-3.5" strokeWidth={1.25} fill="currentColor"/>}
        </button>
        <div className="flex-1" style={{minWidth:0}}>{svgMarkup(20)}</div>
        {duration>0&&<span className="tabular-nums shrink-0" style={{fontFamily:mono,color:FAINT,fontSize:'10px',letterSpacing:'0.04em'}}>{fmtT(Math.round(progress*duration))} / {fmtT(duration)}</span>}
      </div>
    );
  }

  const btnBase={display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',border:`1px solid ${LINE_MED}`,background:'transparent',cursor:'pointer'};
  return(
    <div className="w-full" style={{minWidth:0}}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={play} disabled={playing} style={{...btnBase,color:playing?FAINT:TEXT,borderColor:playing?LINE:LINE_MED,cursor:playing?'default':'pointer'}}>
          <Play className="w-3.5 h-3.5" strokeWidth={1.25} fill={playing?'none':'currentColor'}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>Play</span>
        </button>
        <button onClick={pause} disabled={!playing} style={{...btnBase,color:!playing?FAINT:IKB,borderColor:!playing?LINE:IKB,background:playing?IKB_SOFT:'transparent',cursor:!playing?'default':'pointer'}}>
          <Pause className="w-3.5 h-3.5" strokeWidth={1.25} fill={playing?'currentColor':'none'}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>Pause</span>
        </button>
        <button onClick={rewind} style={{...btnBase,color:MUTED}}>
          <SkipBack className="w-3.5 h-3.5" strokeWidth={1.25}/><span className="uppercase" style={{fontSize:'10px',letterSpacing:'0.22em'}}>Rewind</span>
        </button>
        {actions}
        {duration>0&&<span className="ml-auto tabular-nums" style={{fontFamily:mono,color:FAINT,fontSize:'11px',letterSpacing:'0.04em'}}>{fmtT(progress*duration)} / {fmtT(duration)}</span>}
      </div>
      {svgMarkup(40)}
    </div>
  );
}

const REF_COLOR='#6B8F71';
const REF_SOFT='rgba(107,143,113,0.12)';

export function RefTrackPlayer({meta,blobLoader,onUpload,onDelete}){
  const [speed,setSpeed]=useState(1.0);
  const [uploading,setUploading]=useState(false);
  const [dragOver,setDragOver]=useState(false);
  const fileRef=useRef(null);

  const processFile=async(file)=>{
    if(!file||!file.type.startsWith('audio/'))return;
    setUploading(true);
    try{const peaks=await computePeaks(file);await onUpload(file,peaks);}
    finally{setUploading(false);}
  };

  const handleFile=async(e)=>{
    const file=e.target.files?.[0];
    e.target.value='';
    await processFile(file);
  };

  const onDragOver=(e)=>{
    if(!onUpload)return;
    e.preventDefault();e.stopPropagation();
    setDragOver(true);
  };
  const onDragLeave=(e)=>{e.preventDefault();setDragOver(false);};
  const onDrop=async(e)=>{
    e.preventDefault();e.stopPropagation();
    setDragOver(false);
    if(!onUpload)return;
    const file=e.dataTransfer.files?.[0];
    await processFile(file);
  };

  const canDrop=!!onUpload&&!uploading;
  const isDragActive=dragOver&&canDrop;

  return(
    <div
      onDragOver={canDrop?onDragOver:undefined}
      onDragLeave={canDrop?onDragLeave:undefined}
      onDrop={canDrop?onDrop:undefined}
      style={{
        background:isDragActive?`rgba(107,143,113,0.22)`:REF_SOFT,
        borderLeft:`2px solid ${isDragActive?REF_COLOR:REF_COLOR}`,
        border:isDragActive?`1.5px dashed ${REF_COLOR}`:`1.5px solid transparent`,
        borderLeft:`2px solid ${REF_COLOR}`,
        padding:'8px 10px 10px',
        marginBottom:'10px',
        transition:'background 120ms',
      }}>
      <input ref={fileRef} type="file" accept="audio/*" style={{display:'none'}} onChange={handleFile}/>
      <div className="flex items-center gap-2 mb-2">
        <span className="uppercase shrink-0" style={{fontFamily:mono,color:REF_COLOR,fontSize:'8px',letterSpacing:'0.28em'}}>Ref</span>
        {isDragActive?(
          <span className="italic flex-1" style={{fontFamily:serif,color:REF_COLOR,fontSize:'11px'}}>drop to attach</span>
        ):meta?(
          <>
            <span className="italic truncate flex-1 min-w-0" style={{fontFamily:serif,color:MUTED,fontSize:'11px'}}>{meta.filename}</span>
            <span className="tabular-nums shrink-0" style={{fontFamily:mono,color:FAINT,fontSize:'9px'}}>{Math.round(speed*100)}%</span>
            <input type="range" min="0.5" max="1" step="0.05" value={speed}
              onChange={e=>setSpeed(parseFloat(e.target.value))}
              className="shrink-0" style={{width:'60px',accentColor:REF_COLOR,cursor:'pointer'}}
              title={`Speed: ${Math.round(speed*100)}%`}/>
            {onUpload&&<button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{color:FAINT,padding:'0 2px',cursor:'pointer'}} title="Replace ref track (or drag a new file)"><Upload className="w-3 h-3" strokeWidth={1.25}/></button>}
            {onDelete&&<button onClick={onDelete} style={{color:FAINT,padding:'0 2px',cursor:'pointer'}} title="Remove ref track"><X className="w-3 h-3" strokeWidth={1.25}/></button>}
          </>
        ):onUpload?(
          <button onClick={()=>fileRef.current?.click()} disabled={uploading}
            className="uppercase flex items-center gap-1.5"
            style={{color:uploading?FAINT:MUTED,fontSize:'9px',letterSpacing:'0.18em',cursor:uploading?'wait':'pointer'}}>
            {uploading?'processing…':<><Upload className="w-3 h-3" strokeWidth={1.25}/> add reference · mp3 wav flac m4a</>}
          </button>
        ):null}
      </div>
      {!isDragActive&&meta&&<Waveform blobLoader={blobLoader} meta={meta} compact playbackRate={speed}/>}
    </div>
  );
}

export function ItemPickerPopup({availableItems,onPick,onClose}){return (<><div className="fixed inset-0 z-20" onClick={onClose}/><div className="absolute z-30 right-0 mt-1 min-w-64 max-h-64 overflow-auto etudes-scroll" style={{background:SURFACE,border:`1px solid ${LINE_STR}`,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>{availableItems.length===0&&<div className="px-4 py-3 text-xs italic" style={{color:FAINT,fontFamily:serif}}>No items available.</div>}{availableItems.map(it=>(<button key={it.id} onClick={()=>{onPick(it.id);onClose();}} className="w-full text-left px-4 py-2.5" style={{borderBottom:`1px solid ${LINE}`}}><div style={{fontSize:'13px',fontWeight:300}}>{displayTitle(it)}</div>{formatByline(it)&&<div className="italic mt-0.5" style={{color:MUTED,fontFamily:serif,fontSize:'11px'}}>{formatByline(it)}</div>}</button>))}</div></>);}

export function TargetEdit({target,onChange,small=false}){const [editing,setEditing]=useState(false);const [val,setVal]=useState('');const open=(e)=>{e.stopPropagation();setVal(target?String(target):'');setEditing(true);};const commit=()=>{const n=parseInt(val,10);onChange(Number.isFinite(n)&&n>0?n:null);setEditing(false);};if(editing){return (<input autoFocus value={val} onChange={e=>setVal(e.target.value.replace(/[^0-9]/g,''))} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();else if(e.key==='Escape'){setEditing(false);}}} onClick={e=>e.stopPropagation()} className="font-mono tabular-nums focus:outline-none px-1.5 text-center" style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_STR}`,width:'38px',fontSize:small?'10px':'11px'}} placeholder="min"/>);}if(target){return (<button onClick={open} className="font-mono tabular-nums" style={{color:'inherit',fontSize:'inherit',whiteSpace:'nowrap',letterSpacing:0}} title="Edit target">/ {target}′</button>);}return (<button onClick={open} className="uppercase target-hover-reveal" style={{color:FAINT,fontSize:small?'8px':'9px',letterSpacing:small?'0.12em':'0.2em',marginLeft:0}} title="Set target">+ target</button>);}

export function TimeWithTarget({seconds,target,onTargetChange,format,small=false}){const ex=!!target&&seconds>=target*60;const col=ex?IKB:MUTED;return (<span className="inline-flex items-baseline gap-1.5" style={{fontFamily:mono,color:col,fontSize:small?'11px':'12px',fontWeight:300}}><span className="tabular-nums">{format(seconds)}</span><TargetEdit target={target} onChange={onTargetChange} small={small}/></span>);}

export function ItemTimeEditor({seconds,onCommit,onCancel,small=false}){const [val,setVal]=useState(String(Math.floor((seconds||0)/60)));const commit=()=>{onCommit(val);};return (<span className="inline-flex items-center gap-1" onClick={e=>e.stopPropagation()}><input autoFocus value={val} onChange={e=>setVal(e.target.value.replace(/[^0-9]/g,''))} onKeyDown={e=>{if(e.key==='Enter')commit();else if(e.key==='Escape'){onCancel();}}} className="font-mono tabular-nums focus:outline-none px-1.5 text-right" style={{background:SURFACE2,color:TEXT,border:`1px solid ${IKB}`,width:'48px',fontSize:small?'11px':'12px'}}/><span style={{color:MUTED,fontSize:'10px'}}>min</span><button onClick={commit} title="Save" style={{color:IKB,padding:'2px'}}><Check className="w-3 h-3" strokeWidth={2}/></button><button onClick={onCancel} title="Cancel" style={{color:FAINT,padding:'2px'}}><X className="w-3 h-3" strokeWidth={1.25}/></button></span>);}

export function fmtSpotTime(s){s=s||0;const m=Math.floor(s/60);const sec=s%60;return `${m}:${String(sec).padStart(2,'0')}`;}

export function PerformanceChip({perf,compact=false}){if(!perf||!perf.date)return null;const days=daysUntil(perf.date);if(days===null||days<-30)return null;let color,text;if(days<0){color=MUTED;text=`${Math.abs(days)}d ago`;}else if(days===0){color=WARM;text='today';}else if(days<=7){color=WARM;text=`${days}d`;}else if(days<=30){color=IKB;text=`${days}d`;}else{color=FAINT;text=`${days}d`;}const label=perf.label||'perf';return (<span className="inline-flex items-center gap-1 uppercase" title={`${label} · ${perf.date}`} style={{color,fontSize:compact?'9px':'10px',letterSpacing:'0.22em',padding:compact?'1px 5px':'2px 6px',border:`1px solid ${color}40`,background:(days<=7&&days>=0)?`${color}15`:'transparent'}}><Calendar className="w-2.5 h-2.5" strokeWidth={1.25}/>{label} · {text}</span>);}

export function SpotRow({spot,itemId,itemTimes,isActive,onStart,onStop,onRename,onDelete,onEditTime,dayClosed,compact=false}){const [editing,setEditing]=useState(false);const [val,setVal]=useState(spot.label);const [editingTime,setEditingTime]=useState(false);const time=getSpotTime(itemTimes,itemId,spot.id);const commit=()=>{if(val.trim())onRename(val.trim());else setVal(spot.label);setEditing(false);};return (<div className="group flex items-center gap-3 py-2 px-2" style={{background:isActive?IKB_SOFT:'transparent',borderLeft:isActive?`2px solid ${IKB}`:`2px solid transparent`}}><button onClick={()=>isActive?onStop():onStart()} disabled={dayClosed&&!isActive} className="shrink-0" style={{color:isActive?IKB:(dayClosed?FAINT:TEXT),cursor:(dayClosed&&!isActive)?'not-allowed':'pointer'}}>{isActive?<Pause className="w-3.5 h-3.5" strokeWidth={1.25} fill="currentColor"/>:<Play className="w-3.5 h-3.5" strokeWidth={1.25} fill="currentColor"/>}</button><Crosshair className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:isActive?IKB:FAINT}}/>{editing?(<input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();else if(e.key==='Escape'){setVal(spot.label);setEditing(false);}}} className="flex-1 focus:outline-none pb-0.5" style={{background:'transparent',color:TEXT,borderBottom:`1px solid ${LINE_STR}`,fontFamily:serif,fontSize:compact?'13px':'14px',fontWeight:300}}/>):(<span onDoubleClick={()=>setEditing(true)} className="flex-1 cursor-text" style={{fontFamily:serif,fontSize:compact?'13px':'14px',fontWeight:300}}>{spot.label}</span>)}{spot.bpmTarget&&<span className="font-mono tabular-nums shrink-0" style={{color:FAINT,fontSize:'10px'}}>♩ {spot.bpmTarget}</span>}{editingTime?(<ItemTimeEditor seconds={time} onCommit={(v)=>{onEditTime&&onEditTime(v);setEditingTime(false);}} onCancel={()=>setEditingTime(false)} small/>):(<><span className="font-mono tabular-nums shrink-0" style={{color:time>0?MUTED:FAINT,fontSize:'11px',fontWeight:300}}>{time>0?fmtSpotTime(time):'—'}</span>{!dayClosed&&onEditTime&&<button onClick={()=>setEditingTime(true)} className="target-hover-reveal shrink-0" style={{color:FAINT}} title="Edit minutes"><Pencil className="w-3 h-3" strokeWidth={1.25}/></button>}</>)}{!editing&&!editingTime&&(<><button onClick={()=>setEditing(true)} className="target-hover-reveal shrink-0" style={{color:FAINT}} title="Rename"><Pencil className="w-3 h-3" strokeWidth={1.25}/></button><button onClick={onDelete} className="target-hover-reveal shrink-0" style={{color:FAINT}} title="Delete spot"><X className="w-3 h-3" strokeWidth={1.25}/></button></>)}</div>);}

export function Tooltip({children,shortcut,label}){
  const [vis,setVis]=useState(false);
  if(!shortcut&&!label)return children;
  return(
    <span style={{position:'relative',display:'inline-flex'}} onMouseEnter={()=>setVis(true)} onMouseLeave={()=>setVis(false)}>
      {children}
      {vis&&<span style={{position:'absolute',bottom:'calc(100% + 5px)',left:'50%',transform:'translateX(-50%)',pointerEvents:'none',zIndex:9999,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'4px',padding:'3px 7px',background:'#141412',border:'1px solid rgba(244,238,227,0.14)'}}>
        {label&&<span style={{color:MUTED,fontSize:'10px',letterSpacing:'0.1em',fontFamily:sans}}>{label}</span>}
        {shortcut&&<kbd style={{color:TEXT,fontSize:'10px',fontFamily:mono,background:'rgba(244,238,227,0.07)',border:'1px solid rgba(244,238,227,0.2)',padding:'0 4px',lineHeight:'16px',display:'inline-block'}}>{shortcut}</kbd>}
      </span>}
    </span>
  );
}

const DEEP_LINK_SCHEMES=['obsidian://','x-devonthink-item://'];
const HAS_CUSTOM_LINK_RE=/(?:obsidian:\/\/|x-devonthink-item:\/\/)/;

function MarkdownComponents({serif:serifFont}){
  return {
    a:({href,children,...rest})=>{
      const isDeep=DEEP_LINK_SCHEMES.some(s=>href&&href.startsWith(s));
      const isExternal=href&&(href.startsWith('http://')||href.startsWith('https://'));
      const handleClick=(e)=>{if(isDeep||isExternal){e.preventDefault();if(href)window.open(href,'_blank','noopener,noreferrer');}};
      return (<a href={href} onClick={handleClick} style={{color:LINK,textDecoration:'underline',textDecorationColor:`${LINK}70`,cursor:'pointer'}} {...rest}>{children}</a>);
    },
    p:({children})=><p style={{marginBottom:'0.85em',lineHeight:1.8}}>{children}</p>,
    h1:({children})=><h1 style={{fontSize:'1.3em',fontWeight:400,marginBottom:'0.5em',marginTop:'1em',borderBottom:`1px solid rgba(244,238,227,0.12)`,paddingBottom:'0.2em'}}>{children}</h1>,
    h2:({children})=><h2 style={{fontSize:'1.15em',fontWeight:400,marginBottom:'0.5em',marginTop:'0.9em'}}>{children}</h2>,
    h3:({children})=><h3 style={{fontSize:'1em',fontWeight:400,marginBottom:'0.4em',marginTop:'0.8em',opacity:0.8}}>{children}</h3>,
    hr:()=><hr style={{border:'none',borderTop:`1px solid rgba(244,238,227,0.15)`,margin:'1em 0'}}/>,
    ul:({children})=><ul style={{paddingLeft:'1.4em',marginBottom:'0.8em',listStyleType:'disc'}}>{children}</ul>,
    ol:({children})=><ol style={{paddingLeft:'1.4em',marginBottom:'0.8em',listStyleType:'decimal'}}>{children}</ol>,
    li:({children})=><li style={{marginBottom:'0.25em'}}>{children}</li>,
    code:({inline,children})=>inline?<code style={{background:'rgba(244,238,227,0.08)',padding:'1px 4px',fontSize:'0.88em',fontFamily:'monospace'}}>{children}</code>:<pre style={{background:'rgba(244,238,227,0.05)',padding:'0.75em 1em',overflowX:'auto',fontSize:'0.88em',fontFamily:'monospace',marginBottom:'0.8em'}}><code>{children}</code></pre>,
    blockquote:({children})=><blockquote style={{borderLeft:`2px solid ${IKB}`,paddingLeft:'0.8em',marginLeft:0,opacity:0.8,fontStyle:'italic'}}>{children}</blockquote>,
  };
}

export function MarkdownField({value,onChange,placeholder,minHeight=80,className='',style={},readOnly=false,showDeepLinkHint=false}){
  const {fontSize:styleFontSize,background,border,...wrapStyle}=style||{};
  const hasCustomLink=HAS_CUSTOM_LINK_RE.test(value||'');
  const showHint=showDeepLinkHint&&hasCustomLink;

  if(readOnly){
    return (
      <div className={className} style={{minHeight,padding:'12px 16px',fontFamily:serif,fontSize:'15px',lineHeight:1.8,fontWeight:300,color:TEXT,background:'transparent',border:`1px solid ${LINE}`,...style}}>
        {(value||'').trim()?(
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents({})}>{value}</ReactMarkdown>
        ):(
          <span style={{color:FAINT,fontStyle:'italic',fontSize:'14px'}}>{placeholder||'Nothing here yet.'}</span>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{border:border||`1px solid ${LINE}`,background:background||'transparent',...wrapStyle}}>
      <MarkdownEditor
        value={value||''}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={minHeight}
        fontSize={styleFontSize||'15px'}
      />
      {showHint&&(
        <div style={{padding:'4px 16px 8px',fontSize:'11px',color:FAINT,fontStyle:'italic',fontFamily:serif}}>
          Custom links open in the desktop app if installed.
        </div>
      )}
    </div>
  );
}

export function SpotsBlock({item,itemTimes,activeItemId,activeSpotId,startItem,stopItem,addSpot,updateSpot,deleteSpot,editSpotTime,dayClosed}){const spots=item.spots||[];return (<div><div className="uppercase mb-2 flex items-center gap-1.5" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.25em'}}><Crosshair className="w-3 h-3" strokeWidth={1.25} style={{color:IKB}}/> Spots {spots.length>0&&<span style={{color:DIM,letterSpacing:'0.2em'}}>· {spots.length}</span>}</div>{spots.length>0&&(<div style={{background:SURFACE2,border:`1px solid ${LINE}`}}>{spots.map((s,idx)=>(<div key={s.id} style={{borderBottom:idx<spots.length-1?`1px solid ${LINE}`:'none'}}><SpotRow spot={s} itemId={item.id} itemTimes={itemTimes} isActive={activeItemId===item.id&&activeSpotId===s.id} onStart={()=>startItem(item.id,s.id)} onStop={stopItem} onRename={(label)=>updateSpot(item.id,s.id,{label})} onDelete={()=>deleteSpot(item.id,s.id)} onEditTime={editSpotTime?(v)=>editSpotTime(item.id,s.id,v):undefined} dayClosed={dayClosed}/></div>))}</div>)}<button onClick={()=>addSpot(item.id,'New spot')} className="uppercase flex items-center gap-1.5 mt-2 italic" style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}><Plus className="w-3 h-3 not-italic" strokeWidth={1.25}/> Add spot</button></div>);}
