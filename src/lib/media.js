export function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onloadend=()=>{const s=r.result||'';const i=s.indexOf(',');res(i>=0?s.slice(i+1):'');};r.onerror=()=>rej(r.error);r.readAsDataURL(blob);});}
export function base64ToBlob(b64,type){try{const bin=atob(b64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:type||'application/octet-stream'});}catch{return null;}}

export async function computePeaks(blob,buckets=120){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const buf=await ctx.decodeAudioData(await blob.arrayBuffer());
    const d=buf.getChannelData(0);
    const bs=Math.max(1,Math.floor(d.length/buckets));
    // RMS per bucket — smoother than peak-max, matches perceived loudness
    const raw=[];
    for(let i=0;i<buckets;i++){
      const s=i*bs;let sum=0,n=0;
      for(let j=0;j<bs&&s+j<d.length;j++){const v=d[s+j]||0;sum+=v*v;n++;}
      raw.push(n>0?Math.sqrt(sum/n):0);
    }
    // 2-pass weighted smoothing (0.25 · 0.5 · 0.25)
    let peaks=[...raw];
    for(let pass=0;pass<2;pass++){
      const next=[...peaks];
      for(let i=1;i<peaks.length-1;i++)next[i]=peaks[i-1]*0.25+peaks[i]*0.5+peaks[i+1]*0.25;
      peaks=next;
    }
    // Normalize so the tallest bar fills the display
    const mx=Math.max(...peaks,1e-6);
    peaks=peaks.map(p=>p/mx);
    try{ctx.close();}catch{}
    return peaks;
  }catch{return[];}
}
export function triggerDownload(b,fn){const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(u);},100);}
