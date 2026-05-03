export function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onloadend=()=>{const s=r.result||'';const i=s.indexOf(',');res(i>=0?s.slice(i+1):'');};r.onerror=()=>rej(r.error);r.readAsDataURL(blob);});}
export function base64ToBlob(b64,type){try{const bin=atob(b64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:type||'application/octet-stream'});}catch{return null;}}

let _peaksCtx=null;
export async function computePeaks(blob,buckets=120){
  try{
    if(!_peaksCtx||_peaksCtx.state==='closed')_peaksCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(_peaksCtx.state==='suspended')await _peaksCtx.resume();
    const ctx=_peaksCtx;
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
    return peaks;
  }catch{return[];}
}
export function triggerDownload(b,fn){const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(u);},100);}

/** Returns embed info for YouTube, Spotify, or Apple Music URLs, or null for anything else. */
export function getEmbedInfo(url){
  if(!url)return null;
  const yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if(yt)return{type:'youtube',src:`https://www.youtube.com/embed/${yt[1]}`};
  const sp=url.match(/open\.spotify\.com\/(?:intl-[\w-]+\/)?(track|album|playlist|episode)\/([\w]+)/);
  if(sp)return{type:'spotify',src:`https://open.spotify.com/embed/${sp[1]}/${sp[2]}?utm_source=generator`,compact:sp[1]==='track'||sp[1]==='episode'};
  if(/music\.apple\.com/.test(url))return{type:'apple',src:url.replace('music.apple.com','embed.music.apple.com')};
  return null;
}
