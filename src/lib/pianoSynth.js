// FM bell (Rhodes / glass) one-shot for the tuner keyboard.
// Pure UI feedback when a key is tapped — independent of the drone.

let _ctx=null;
function getCtx(){
  if(_ctx)return _ctx;
  const C=typeof window!=='undefined'?(window.AudioContext||window.webkitAudioContext):null;
  if(!C)return null;
  _ctx=new C();
  return _ctx;
}

// FM topology: a sine "modulator" at carrierFreq * ratio drives the carrier's
// frequency. The modulator's depth (in Hz) decays from a high index to a low
// one — that's the classic bell-strike timbre that's bright on attack and
// settles into a near-sine tail.
export function playPianoNote(freq,{volume=0.28,sustain=1.2}={}){
  const ctx=getCtx();
  if(!ctx||!Number.isFinite(freq))return;
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const now=ctx.currentTime;
  const ratio=3.5;          // inharmonic — bell shimmer
  const indexHi=3;          // strike brightness
  const indexLo=0.5;        // sustained body
  const indexFall=0.2;      // s — how fast brightness decays

  // Output amp envelope: 5 ms attack → exp decay over `sustain`.
  const out=ctx.createGain();
  out.gain.setValueAtTime(0,now);
  out.gain.linearRampToValueAtTime(volume,now+0.005);
  out.gain.exponentialRampToValueAtTime(0.0001,now+sustain);
  out.connect(ctx.destination);

  // Carrier sine at freq.
  const carrier=ctx.createOscillator();
  carrier.type='sine';
  carrier.frequency.setValueAtTime(freq,now);
  carrier.connect(out);

  // Modulator sine at freq * ratio, routed into the carrier's frequency
  // through a gain whose value is freq * index(t).
  const modulator=ctx.createOscillator();
  modulator.type='sine';
  modulator.frequency.setValueAtTime(freq*ratio,now);

  const modDepth=ctx.createGain();
  modDepth.gain.setValueAtTime(freq*indexHi,now);
  modDepth.gain.exponentialRampToValueAtTime(Math.max(freq*indexLo,0.0001),now+indexFall);
  modulator.connect(modDepth).connect(carrier.frequency);

  const stopAt=now+sustain+0.05;
  carrier.start(now);
  carrier.stop(stopAt);
  modulator.start(now);
  modulator.stop(stopAt);
}
