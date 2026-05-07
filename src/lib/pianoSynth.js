// Piano-ish one-shot for the tuner keyboard.
// Pure UI feedback when a key is tapped — independent of the drone.
//
// Real pianos have (1) a percussive hammer strike, (2) slightly inharmonic
// partials due to string stiffness, and (3) higher partials that decay much
// faster than the fundamental. This sketches that with a short noise click
// plus a triangle fundamental and three sine partials, each on its own
// gain envelope. Brief sustain (~0.6 s).

let _ctx=null;
function getCtx(){
  if(_ctx)return _ctx;
  const C=typeof window!=='undefined'?(window.AudioContext||window.webkitAudioContext):null;
  if(!C)return null;
  _ctx=new C();
  return _ctx;
}

let _noiseBuf=null;
function noiseBuffer(ctx){
  if(_noiseBuf&&_noiseBuf.sampleRate===ctx.sampleRate)return _noiseBuf;
  const len=Math.floor(ctx.sampleRate*0.05); // 50 ms is plenty
  _noiseBuf=ctx.createBuffer(1,len,ctx.sampleRate);
  const data=_noiseBuf.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
  return _noiseBuf;
}

export function playPianoNote(freq,{volume=0.3,sustain=0.6}={}){
  const ctx=getCtx();
  if(!ctx||!Number.isFinite(freq))return;
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const now=ctx.currentTime;

  // Master mixer with a gentle lowpass to take edge off the partials.
  const master=ctx.createGain();
  master.gain.value=volume;
  const lp=ctx.createBiquadFilter();
  lp.type='lowpass';
  lp.frequency.value=Math.min(8000,Math.max(2200,freq*8));
  lp.Q.value=0.4;
  master.connect(lp).connect(ctx.destination);

  // Per-partial decay times — high partials die quickly (string stiffness).
  // Slight inharmonicity on the multipliers gives that detuned piano warmth.
  const partials=[
    {type:'triangle',mult:1.000,gain:1.00,decay:sustain},
    {type:'sine',    mult:2.002,gain:0.36,decay:sustain*0.65},
    {type:'sine',    mult:3.008,gain:0.18,decay:sustain*0.40},
    {type:'sine',    mult:4.020,gain:0.08,decay:sustain*0.25},
  ];
  const tailEnd=now+sustain+0.05;
  for(const p of partials){
    const o=ctx.createOscillator();
    o.type=p.type;
    o.frequency.value=freq*p.mult;
    const g=ctx.createGain();
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(p.gain,now+0.004); // 4 ms attack
    g.gain.exponentialRampToValueAtTime(0.0001,now+p.decay);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(tailEnd);
  }

  // Hammer click — short filtered noise burst at the very start.
  const noise=ctx.createBufferSource();
  noise.buffer=noiseBuffer(ctx);
  const noiseFilter=ctx.createBiquadFilter();
  noiseFilter.type='bandpass';
  noiseFilter.frequency.value=Math.min(6000,Math.max(1500,freq*4));
  noiseFilter.Q.value=1.4;
  const noiseGain=ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18,now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001,now+0.04);
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start(now);
  noise.stop(now+0.06);
}
