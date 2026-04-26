import {useRef} from 'react';
import {idbPut,idbDel} from '../lib/storage.js';
import {computePeaks} from '../lib/media.js';
import {todayDateStr} from '../lib/dates.js';

export default function useRecording({dayClosed,recordingMeta,setRecordingMeta,setIsRecording,setConfirmModal,pieceRecordingMeta,setPieceRecordingMeta,setPieceRecordingItemId}){
  const mediaRecorderRef=useRef(null);
  const recordedChunksRef=useRef([]);
  const pieceMediaRecorderRef=useRef(null);
  const pieceChunksRef=useRef([]);

  const startRecording=async()=>{
    if(dayClosed)return;
    const tk=todayDateStr();
    const doStart=async()=>{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const mr=new MediaRecorder(stream);
        recordedChunksRef.current=[];
        mr.ondataavailable=(e)=>{if(e.data.size>0)recordedChunksRef.current.push(e.data);};
        mr.onstop=async()=>{if(mediaRecorderRef.current!==mr)return;const blob=new Blob(recordedChunksRef.current,{type:'audio/webm'});const peaks=await computePeaks(blob,60);await idbPut('recordings',tk,blob);setRecordingMeta(m=>({...m,[tk]:{peaks,size:blob.size,ts:Date.now()}}));stream.getTracks().forEach(t=>t.stop());};
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

  const startPieceRecording=async(itemId,bpm,stage)=>{
    const date=todayDateStr();
    const key=`${itemId}__${date}`;
    const doStart=async()=>{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const mr=new MediaRecorder(stream);
        pieceChunksRef.current=[];
        mr.ondataavailable=(e)=>{if(e.data.size>0)pieceChunksRef.current.push(e.data);};
        mr.onstop=async()=>{
          if(pieceMediaRecorderRef.current!==mr)return;
          const blob=new Blob(pieceChunksRef.current,{type:'audio/webm'});
          const peaks=await computePeaks(blob,120);
          await idbPut('pieceRecordings',key,blob);
          setPieceRecordingMeta(m=>({...m,[itemId]:{...(m[itemId]||{}),[date]:{peaks,size:blob.size,ts:Date.now(),bpm:bpm||null,stage:stage||''}}}));
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
    const key=`${itemId}__${date}`;
    setConfirmModal({message:`Delete the recording from ${date}?`,confirmLabel:'Delete',onConfirm:async()=>{
      setConfirmModal(null);
      await idbDel('pieceRecordings',key);
      setPieceRecordingMeta(m=>{const c={...m};if(c[itemId]){c[itemId]={...c[itemId]};delete c[itemId][date];if(!Object.keys(c[itemId]).length)delete c[itemId];}return c;});
    }});
  };

  return {startRecording,stopRecording,deleteRecording,startPieceRecording,stopPieceRecording,deletePieceRecording};
}
