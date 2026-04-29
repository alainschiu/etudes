import React, { useState } from 'react';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import X from 'lucide-react/dist/esm/icons/x';
import { MC, MF } from './tokens.js';

const METERS = [
  { label: '2/4',  beats: 2,  noteValue: '4', compound: 0 },
  { label: '3/4',  beats: 3,  noteValue: '4', compound: 0 },
  { label: '4/4',  beats: 4,  noteValue: '4', compound: 0 },
  { label: '6/8',  beats: 6,  noteValue: '8', compound: 3 },
  { label: '12/8', beats: 12, noteValue: '8', compound: 3 },
];

function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        height: 26, padding: '0 10px',
        fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        borderRadius: 999,
        border: `1px solid ${active ? MC.accentLine : MC.hairlineStrong}`,
        background: active ? MC.accentSoft : 'transparent',
        color: active ? MC.ivory100 : MC.ivory200,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export default function MobileMetronomeSheet({ open, onClose, metronome, setMetronome, handleTap }) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 220);
  };

  if (!open && !closing) return null;

  const bpm = metronome.bpm || 92;
  const on = metronome.running;
  const accelEnabled = metronome.accel?.enabled || false;

  const currentMeter = METERS.find(m =>
    m.beats === (metronome.beats || 4) && m.noteValue === (metronome.noteValue || '4')
  ) || METERS[2];

  const setBpm = (v) => setMetronome(m => ({ ...m, bpm: Math.max(40, Math.min(240, v)) }));
  const setMeter = (m) => setMetronome(s => ({
    ...s, beats: m.beats, noteValue: m.noteValue, compoundGroup: m.compound,
  }));
  const toggleAccel = () => setMetronome(m => ({
    ...m, accel: { ...m.accel, enabled: !accelEnabled },
  }));
  const toggleOn = () => setMetronome(m => ({ ...m, running: !m.running }));

  const beatCount = metronome.beats || 4;
  const isCompound = (metronome.compoundGroup || 0) > 0;
  const strongBeats = isCompound
    ? Array.from({ length: beatCount }, (_, i) => i % (metronome.compoundGroup || 3) === 0)
    : Array.from({ length: beatCount }, (_, i) => i === 0);

  return (
    <>
      <div
        onClick={close}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(7,6,8,0.55)',
          zIndex: 40,
          animationName: closing ? 'm-fade-out' : 'm-fade-in',
          animation: `${closing ? 'm-fade-out' : 'm-fade-in'} 220ms ease forwards`,
        }}
      />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: MC.ink,
        borderTop: `1px solid ${MC.hairlineStrong}`,
        zIndex: 41,
        animation: `${closing ? 'm-slide-up 220ms cubic-bezier(0.6,0,0.8,0.3) reverse' : 'm-slide-up 280ms cubic-bezier(0.2,0.7,0.2,1)'} forwards`,
        paddingBottom: 32,
      }}>
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div style={{ width: 36, height: 3, background: MC.ivory500, borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '4px 24px 8px',
        }}>
          <div>
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
              Metronome
            </span>
            <div style={{ marginTop: 2 }}>
              <span style={{ fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500, fontSize: 26, color: MC.ivory200 }}>
                Tempo
              </span>
            </div>
          </div>
          <button onClick={close} style={{ background: 'transparent', border: 'none', color: MC.ivory400, cursor: 'pointer', padding: 0, marginTop: 4 }}>
            <X size={16} strokeWidth={1.4} />
          </button>
        </div>

        <div style={{ height: 1, background: MC.hairline }} />

        {/* Big BPM */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
          padding: '28px 0 20px', gap: 16,
        }}>
          <button
            onClick={() => setBpm(bpm - 1)}
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'transparent', border: `1px solid ${MC.hairlineStrong}`,
              color: MC.ivory300, cursor: 'pointer', padding: 0,
              fontFamily: MF.display, fontSize: 22, lineHeight: 1,
            }}
          >−</button>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: MF.mono, fontSize: 72,
              color: on ? MC.accent : MC.ivory100,
              fontWeight: 400, letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 200ms',
            }}>
              {bpm}
            </span>
            <span style={{ fontFamily: MF.sans, fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
              BPM
            </span>
          </div>

          <button
            onClick={() => setBpm(bpm + 1)}
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'transparent', border: `1px solid ${MC.hairlineStrong}`,
              color: MC.ivory300, cursor: 'pointer', padding: 0,
              fontFamily: MF.display, fontSize: 22, lineHeight: 1,
            }}
          >+</button>
        </div>

        {/* Slider */}
        <div style={{ padding: '0 28px' }}>
          <input
            type="range" min="40" max="240" value={bpm}
            onChange={e => setBpm(+e.target.value)}
            style={{ width: '100%', accentColor: MC.accent }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {[40, 120, 240].map(v => (
              <span key={v} style={{ fontFamily: MF.mono, fontSize: 9, color: MC.ivory500, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
            ))}
          </div>
        </div>

        {/* Beat dots */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, padding: '20px 24px 8px' }}>
          {strongBeats.map((isStrong, i) => (
            <span key={i} style={{
              width: isStrong ? 10 : 7, height: isStrong ? 10 : 7,
              borderRadius: 999,
              background: on && i === 0 ? MC.accent : (isStrong ? MC.ivory300 : MC.ivory500),
              boxShadow: on && i === 0 ? `0 0 8px ${MC.accent}` : 'none',
              opacity: on ? 1 : 0.5,
              transition: 'background 120ms',
            }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 12 }}>
          <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
            {currentMeter.label} · beat 1 accented
          </span>
        </div>

        <div style={{ height: 1, background: MC.hairline }} />

        {/* Controls */}
        <div style={{ padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400, display: 'block', marginBottom: 8 }}>
              Meter
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {METERS.map(m => (
                <Pill key={m.label} active={currentMeter.label === m.label} onClick={() => setMeter(m)}>
                  {m.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Accelerando */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div>
              <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
                Accelerando
              </span>
              <div style={{ marginTop: 4, fontFamily: MF.text, fontStyle: 'italic', fontSize: 12, color: MC.ivory500 }}>
                +{metronome.accel?.stepBpm || 2} BPM every {metronome.accel?.every || 8} bars to {bpm + 24}
              </div>
            </div>
            <button
              onClick={toggleAccel}
              style={{
                width: 40, height: 22, borderRadius: 999,
                background: accelEnabled ? MC.accent : MC.ink200,
                border: `1px solid ${accelEnabled ? MC.accent : MC.hairlineStrong}`,
                position: 'relative', cursor: 'pointer', padding: 0,
                transition: 'all 200ms', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: accelEnabled ? 20 : 2,
                width: 16, height: 16, borderRadius: 999,
                background: MC.ivory100,
                transition: 'left 200ms cubic-bezier(0.2,0.7,0.2,1)',
              }} />
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: MC.hairline }} />

        {/* Start / Tap tempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px 0' }}>
          <button
            onClick={toggleOn}
            style={{
              flex: 1, height: 44, borderRadius: 4,
              background: on ? MC.accent : MC.ivory100,
              border: `1px solid ${on ? MC.accent : MC.ivory100}`,
              color: on ? '#fff' : MC.ink,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            {on ? <Pause size={14} strokeWidth={1.4} /> : <Play size={14} strokeWidth={1.4} />}
            <span style={{ fontFamily: MF.sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'currentColor' }}>
              {on ? 'Stop' : 'Start'}
            </span>
          </button>
          <button
            onClick={handleTap}
            style={{
              display: 'inline-flex', alignItems: 'center',
              height: 32, padding: '0 14px',
              fontFamily: MF.sans, fontSize: 10, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: MC.ivory200, background: 'transparent',
              border: `1px solid ${MC.hairlineStrong}`, borderRadius: 999,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Tap tempo
          </button>
        </div>
      </div>
    </>
  );
}
