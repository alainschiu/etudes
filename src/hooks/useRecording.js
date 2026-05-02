import {useRef} from 'react';
import {idbPut,idbDel,idbGet} from '../lib/storage.js';
import {computePeaks} from '../lib/media.js';
import {todayDateStr} from '../lib/dates.js';

const ROLLING_LIMIT = 10;
const LOCKED_LIMIT  = 20;

const preferredMime=()=>{for(const t of['audio/webm;codecs=opus','audio/mp4','']){if(!t||MediaRecorder.isTypeSupported(t))return t;}return'';};

export default function useRecording({dayClosed,recordingMeta,setRecordingMeta,setIsRecording,setConfirmModal,pieceRecordingMeta,setPieceRecordingMeta,setPieceRecordingItemId}){
  const mediaRecorderRef=useRef(null);
  const recordedChunksRef=useRef([]);
  const pieceMediaRecorderRef=useRef(null);
  const pieceChunksRef=useRef([]);

  // ── Daily session recording ───────────────────────────────────────────────
  const startRecording=async()=>{
    if(dayClosed)return;
    const tk=todayDateStr();
    const doStart=async()=>{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const mimeType=preferredMime();
        const mr=new MediaRecorder(stream,...(mimeType?[{mimeType}]:[]));
        recordedChunksRef.current=[];
        mr.ondataavailable=(e)=>{if(e.data.size>0)recordedChunksRef.current.push(e.data);};
        mr.onstop=async()=>{if(mediaRecorderRef.current!==mr)return;const blob=new Blob(recordedChunksRef.current,{type:mimeType||'audio/webm'});const peaks=await computePeaks(blob,60);await idbPut('recordings',tk,blob);setRecordingMeta(m=>({...m,[tk]:{peaks,size:blob.size,ts:Date.now(),mimeType:mimeType||'audio/webm'}}));stream.getTracks().forEach(t=>t.stop());};
        mediaRecorderRef.current=mr;mr.start();setIsRecording(true);
      }catch(e){setConfirmModal({message:'Microphone unavailable. Check browser permissions.',confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});}
    };
    if(recordingMeta[tk]){
      setConfirmModal({message:"Replace today's recording?",confirmLabel:'Replace',onConfirm:async()=>{setConfirmModal(null);await doStart();}});
    }else await doStart();
  };

  const stopRecording=()=>{try{mediaRecorderRef.current?.stop();}catch{}setIsRecording(false);};

  const deleteRecording=(date)=>{
    setConfirmModal({message:`Delete the recording for ${date}?`,confirmLabel:'Delete',onConfirm:async()=>{
      setConfirmModal(null);await idbDel('recordings',date);
      setRecordingMeta(m=>{const c={...m};delete c[date];return c;});
    }});
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Apply FIFO: if unlocked entries exceed ROLLING_LIMIT, delete the oldest. */
  const applyFifo=(itemId, entries)=>{
    const updated={...entries};
    const unlocked=Object.entries(updated)
      .filter(([,v])=>!(v.locked??false))
      .sort(([a],[b])=>a.localeCompare(b)); // oldest date first
    if(unlocked.length>ROLLING_LIMIT){
      const [oldestDate,oldestEntry]=unlocked[0];
      idbDel('pieceRecordings',oldestEntry.idbKey??`${itemId}__${oldestDate}`);
      delete updated[oldestDate];
    }
    return updated;
  };

  // ── Piece recording ───────────────────────────────────────────────────────
  const startPieceRecording=async(itemId,bpm,stage)=>{
    const date=todayDateStr();
    const doStart=async()=>{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const mimeType=preferredMime();
        const mr=new MediaRecorder(stream,...(mimeType?[{mimeType}]:[]));
        pieceChunksRef.current=[];
        mr.ondataavailable=(e)=>{if(e.data.size>0)pieceChunksRef.current.push(e.data);};
        mr.onstop=async()=>{
          if(pieceMediaRecorderRef.current!==mr)return;
          const idbKey=`${itemId}__${date}__${Date.now()}`;
          const blob=new Blob(pieceChunksRef.current,{type:mimeType||'audio/webm'});
          const peaks=await computePeaks(blob,120);
          await idbPut('pieceRecordings',idbKey,blob);
          setPieceRecordingMeta(m=>{
            const prev=m[itemId]||{};
            const updated={...prev,[date]:{peaks,size:blob.size,ts:Date.now(),bpm:bpm||null,stage:stage||'',locked:false,mimeType:mimeType||'audio/webm',idbKey}};
            return {...m,[itemId]:applyFifo(itemId,updated)};
          });
          setPieceRecordingItemId(null);
          stream.getTracks().forEach(t=>t.stop());
        };
        pieceMediaRecorderRef.current=mr;
        mr.start();
        setPieceRecordingItemId(itemId);
      }catch{setConfirmModal({message:'Microphone unavailable. Check browser permissions.',confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});}
    };
    if(pieceRecordingMeta?.[itemId]?.[date]){
      setConfirmModal({message:"Replace today's recording for this piece?",confirmLabel:'Replace',onConfirm:async()=>{setConfirmModal(null);await doStart();}});
    }else await doStart();
  };

  const stopPieceRecording=()=>{try{pieceMediaRecorderRef.current?.stop();}catch{}};

  const deletePieceRecording=(itemId,date)=>{
    const entry=pieceRecordingMeta?.[itemId]?.[date];
    if(entry?.locked){
      setConfirmModal({message:'This recording is locked. Unlock it before deleting.',confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});
      return;
    }
    const idbKey=entry?.idbKey??`${itemId}__${date}`;
    setConfirmModal({message:`Delete the recording from ${date}?`,confirmLabel:'Delete',onConfirm:async()=>{
      setConfirmModal(null);
      await idbDel('pieceRecordings',idbKey);
      setPieceRecordingMeta(m=>{const c={...m};if(c[itemId]){c[itemId]={...c[itemId]};delete c[itemId][date];if(!Object.keys(c[itemId]).length)delete c[itemId];}return c;});
    }});
  };

  /** Toggle lock on a piece recording. Locked recordings are exempt from FIFO. */
  const lockPieceRecording=(itemId,date)=>{
    setPieceRecordingMeta(m=>{
      const entry=m[itemId]?.[date];
      if(!entry)return m;
      const isCurrentlyLocked=entry.locked??false;
      if(!isCurrentlyLocked){
        const lockedCount=Object.values(m[itemId]||{}).filter(e=>e.locked??false).length;
        if(lockedCount>=LOCKED_LIMIT){
          setConfirmModal({message:`You can lock up to ${LOCKED_LIMIT} recordings per piece. Unlock one before locking another.`,confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});
          return m;
        }
      }
      return{...m,[itemId]:{...m[itemId],[date]:{...entry,locked:!isCurrentlyLocked}}};
    });
  };

  const attachDailyToPiece=async(itemId,bpm,stage)=>{
    const date=todayDateStr();
    const blob=await idbGet('recordings',date);
    if(!blob)return;
    const idbKey=`${itemId}__${date}__${Date.now()}`;
    const peaks=await computePeaks(blob,120);
    await idbPut('pieceRecordings',idbKey,blob);
    setPieceRecordingMeta(m=>{
      const prev=m[itemId]||{};
      const updated={...prev,[date]:{peaks,size:blob.size,ts:Date.now(),bpm:bpm||null,stage:stage||'',locked:false,idbKey}};
      return {...m,[itemId]:applyFifo(itemId,updated)};
    });
    await idbDel('recordings',date);
    setRecordingMeta(m=>{const c={...m};delete c[date];return c;});
  };

  return {startRecording,stopRecording,deleteRecording,startPieceRecording,stopPieceRecording,deletePieceRecording,lockPieceRecording,attachDailyToPiece};
}
