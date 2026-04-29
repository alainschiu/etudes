// Expanded metronome sheet — slides up from the footer

function Metronome({ open, onClose, bpm, setBpm, on, onToggle }) {
  const [closing, setClosing] = React.useState(false);
  const [meter, setMeter] = React.useState('6/8');
  const [sub, setSub] = React.useState('♩');
  const [accel, setAccel] = React.useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 220);
  };
  if (!open && !closing) return null;

  const meters = ['2/4','3/4','4/4','6/8','12/8'];
  const subs = ['♩','♫','♩₃','♬'];

  return (
    <>
      <div
        onClick={close}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(7,6,8,0.55)',
          zIndex: 40,
          animation: closing ? 'etudes-fade-out 220ms ease forwards' : 'etudes-fade-in 220ms ease forwards',
        }}
      />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: C.ink,
        borderTop: `1px solid ${C.hairlineStrong}`,
        zIndex: 41,
        animation: closing
          ? 'etudes-slide-up 220ms cubic-bezier(0.6,0,0.8,0.3) reverse forwards'
          : 'etudes-slide-up 280ms cubic-bezier(0.2,0.7,0.2,1) forwards',
        paddingBottom: 28,
      }}>
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div style={{ width: 36, height: 3, background: C.ivory500, borderRadius: 2 }}/>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          padding: '4px 24px 8px',
        }}>
          <div>
            <Caps size={9}>Metronome</Caps>
            <div style={{ marginTop: 2 }}><Display size={26}>Tempo</Display></div>
          </div>
          <button
            onClick={close}
            style={{ background: 'transparent', border: 'none', color: C.ivory400, cursor: 'pointer', padding: 0 }}
          >
            <X size={16} strokeWidth={1.4}/>
          </button>
        </div>

        <Rule/>

        {/* Big BPM */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
          padding: '32px 0 24px', gap: 16,
        }}>
          <button
            onClick={() => setBpm(Math.max(40, bpm - 1))}
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'transparent',
              border: `1px solid ${C.hairlineStrong}`,
              color: C.ivory300, cursor: 'pointer', padding: 0,
              fontFamily: F.display, fontSize: 22, lineHeight: 1,
            }}
          >−</button>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <Mono size={72} color={on ? C.accent : C.ivory100} style={{ fontWeight: 400, letterSpacing: '-0.02em' }}>
              {bpm}
            </Mono>
            <Caps size={11} color={C.ivory400}>BPM</Caps>
          </div>

          <button
            onClick={() => setBpm(Math.min(240, bpm + 1))}
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'transparent',
              border: `1px solid ${C.hairlineStrong}`,
              color: C.ivory300, cursor: 'pointer', padding: 0,
              fontFamily: F.display, fontSize: 22, lineHeight: 1,
            }}
          >+</button>
        </div>

        {/* Slider */}
        <div style={{ padding: '0 28px' }}>
          <input
            type="range"
            min="40" max="240" value={bpm}
            onChange={e => setBpm(+e.target.value)}
            style={{ width: '100%', accentColor: C.accent }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Mono size={9} color={C.ivory500}>40</Mono>
            <Mono size={9} color={C.ivory500}>120</Mono>
            <Mono size={9} color={C.ivory500}>240</Mono>
          </div>
        </div>

        {/* Beat dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 10,
          padding: '24px 0 12px',
        }}>
          {[0,1,2,3,4,5].map(i => {
            const isStrong = i === 0 || i === 3;
            return (
              <span key={i} style={{
                width: isStrong ? 10 : 7, height: isStrong ? 10 : 7,
                borderRadius: 999,
                background: on && i === 0 ? C.accent : (isStrong ? C.ivory300 : C.ivory500),
                boxShadow: on && i === 0 ? `0 0 8px ${C.accent}` : 'none',
                opacity: on ? 1 : 0.5,
              }}/>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 16 }}>
          <Caps size={9} color={C.ivory500}>{meter} · pickup on 1 & 4</Caps>
        </div>

        <Rule/>

        {/* Meter / Sub / Accel */}
        <div style={{ padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Caps size={9} style={{ display: 'block', marginBottom: 8 }}>Meter</Caps>
            <div style={{ display: 'flex', gap: 6 }}>
              {meters.map(m => (
                <Pill key={m} small active={meter === m} onClick={() => setMeter(m)}>{m}</Pill>
              ))}
            </div>
          </div>
          <div>
            <Caps size={9} style={{ display: 'block', marginBottom: 8 }}>Subdivision</Caps>
            <div style={{ display: 'flex', gap: 6 }}>
              {subs.map(s => (
                <Pill key={s} small active={sub === s} onClick={() => setSub(s)}>
                  <span style={{ fontFamily: F.display, fontSize: 14, letterSpacing: 0 }}>{s}</span>
                </Pill>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div>
              <Caps size={9}>Accelerando</Caps>
              <div style={{ marginTop: 4, fontFamily: F.text, fontStyle: 'italic', fontSize: 12, color: C.ivory500 }}>
                +2 BPM every 4 bars to {bpm + 24}
              </div>
            </div>
            <button
              onClick={() => setAccel(a => !a)}
              style={{
                width: 40, height: 22, borderRadius: 999,
                background: accel ? C.accent : C.ink200,
                border: `1px solid ${accel ? C.accent : C.hairlineStrong}`,
                position: 'relative', cursor: 'pointer', padding: 0,
                transition: 'all 200ms',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: accel ? 20 : 2,
                width: 16, height: 16, borderRadius: 999,
                background: C.ivory100,
                transition: 'left 200ms cubic-bezier(0.2,0.7,0.2,1)',
              }}/>
            </button>
          </div>
        </div>

        <Rule/>

        {/* Footer transport */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 24px 8px',
        }}>
          <button
            onClick={onToggle}
            style={{
              flex: 1, height: 44, borderRadius: 4,
              background: on ? C.accent : C.ivory100,
              border: `1px solid ${on ? C.accent : C.ivory100}`,
              color: on ? '#fff' : C.ink,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            {on ? <Pause size={14} strokeWidth={1.4}/> : <Play size={14} strokeWidth={1.4}/>}
            <Caps size={10} color="currentColor">{on ? 'Stop' : 'Start'}</Caps>
          </button>
          <Pill>Tap tempo</Pill>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Metronome });
