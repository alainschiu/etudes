// Lightweight piano-ish one-shot synth for the tuner keyboard.
// Independent of the drone — purely a UI feedback sound when a key is tapped.

let _ctx=null;
function getCtx(){
  if(_ctx)return _ctx;
  const C=typeof window!=='undefined'?(window.AudioContext||window.webkitAudioContext):null;
  if(!C)return null;
  _ctx=new C();
  return _ctx;
}

export function playPianoNote(freq,{volume=0.32,sustain=1.4}={}){
  const ctx=getCtx();
  if(!ctx||!Number.isFinite(freq))return;
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const now=ctx.currentTime;

  const out=ctx.createGain();
  out.gain.setValueAtTime(0,now);
  out.gain.linearRampToValueAtTime(volume,now+0.008);
  out.gain.exponentialRampToValueAtTime(Math.max(volume*0.45,0.001),now+0.18);
  out.gain.exponentialRampToValueAtTime(0.0001,now+sustain);
  out.connect(ctx.destination);

  const stopAt=now+sustain+0.05;
  const partial=(type,mult,gainV,until=stopAt)=>{
    const o=ctx.createOscillator();
    o.type=type;
    o.frequency.value=freq*mult;
    const g=ctx.createGain();
    g.gain.value=gainV;
    o.connect(g).connect(out);
    o.start(now);
    o.stop(until);
  };
  partial('triangle',1,1.0);
  partial('sine',2,0.32);
  partial('sine',3,0.12,now+sustain*0.7);
  partial('sine',4,0.05,now+0.45);
}
