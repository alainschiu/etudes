// Persistent footer — the heart of the redesign.
// Three-row layout when active session:
//  Row 1: live readout (active piece + section time) — compact
//  Row 2: transport (play/pause big, BPM tap, record, quick-add)
//  Row 3: status strip (today total + rest)
// When idle, collapses to a single inviting row: "Begin practice".

function FooterFAB({ icon, onClick, active = false, danger = false, size = 36, color }) {
  const c = active ? C.accent : (danger ? C.record : (color || C.ivory200));
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: 999,
        background: active ? C.accentSoft : 'transparent',
        border: `1px solid ${active ? C.accentLine : C.hairlineStrong}`,
        color: c,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {icon}
    </button>
  );
}

function Footer({
  sessionActive, onTogglePlay, isPlaying, elapsed, todayTotal,
  activeItem, bpm, onTapMetronome, metroOn, onToggleMetro,
  onOpenMetro, onRecord, recording, onQuickAdd, onBegin,
  variant, // 'transport' | 'compact'
}) {
  // Variant: 'compact' = no readout row (idle or compact mode)
  const showReadout = sessionActive && activeItem;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: 'rgba(17,16,16,0.92)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderTop: `1px solid ${C.hairlineStrong}`,
      paddingBottom: 22, // home indicator area
      zIndex: 5,
    }}>
      {/* Row 1: readout (only when session active) */}
      {showReadout && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 18px 6px',
          borderBottom: `1px solid ${C.hairline}`,
        }}>
          <span className="pulse" style={{
            width: 6, height: 6, borderRadius: 999, background: C.accent,
            boxShadow: `0 0 6px ${C.accent}`, flexShrink: 0,
          }}/>
          <Caps size={9} color={C.accent}>Section</Caps>
          <div style={{
            flex: 1, fontFamily: F.display, fontStyle: 'italic',
            fontSize: 13, color: C.ivory200,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {activeItem.title}
          </div>
          <Mono size={11} color={C.ivory100}>{fmt(elapsed)}</Mono>
        </div>
      )}

      {/* Row 2: transport */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px 10px',
      }}>
        {/* Play / pause big — hairline capsule, accent on active */}
        <button
          onClick={sessionActive ? onTogglePlay : onBegin}
          style={{
            width: 48, height: 48, borderRadius: 999,
            background: isPlaying ? C.accentSoft : 'transparent',
            border: `1px solid ${isPlaying ? C.accentLine : C.hairlineStrong}`,
            color: isPlaying ? C.accent : C.ivory200,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
            transition: 'all 200ms cubic-bezier(0.2,0.7,0.2,1)',
          }}
        >
          {isPlaying
            ? <Pause size={16} strokeWidth={1.4}/>
            : <Play size={16} strokeWidth={1.4} style={{ marginLeft: 2 }}/>}
        </button>

        {/* Metronome — tap toggles, chevron expands the sheet. */}
        <div style={{
          display: 'inline-flex', alignItems: 'stretch',
          height: 40,
          background: 'transparent',
          border: `1px solid ${metroOn ? C.accentLine : C.hairlineStrong}`,
          borderRadius: 4,
          color: metroOn ? C.accent : C.ivory200,
          flex: 1, minWidth: 0,
          overflow: 'hidden',
        }}>
          <button
            onClick={onToggleMetro}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              padding: '0 14px',
              background: 'transparent', border: 'none',
              color: 'inherit', cursor: 'pointer',
              flex: 1, minWidth: 0,
            }}
          >
            {/* 6/8 beat row */}
            <span style={{
              display: 'inline-flex', alignItems: 'flex-end', gap: 3,
              height: 22, flexShrink: 0,
            }}>
              {[
                { strong: 'major', beat: 0 },
                { strong: 'weak',  beat: 1 },
                { strong: 'weak',  beat: 2 },
                { strong: 'minor', beat: 3 },
                { strong: 'weak',  beat: 4 },
                { strong: 'weak',  beat: 5 },
              ].map(({ strong, beat }) => {
                const h = strong === 'major' ? 20 : strong === 'minor' ? 14 : 9;
                const w = strong === 'major' ? 3 : 2;
                const baseColor = strong === 'major'
                  ? (metroOn ? C.accent : C.ivory200)
                  : strong === 'minor'
                    ? (metroOn ? C.accent : C.ivory300)
                    : C.ivory500;
                const dur = (60 / bpm) * 6;
                const delay = -dur + (dur / 6) * beat;
                return (
                  <span key={beat} style={{
                    width: w, height: h,
                    background: baseColor,
                    opacity: metroOn ? 0.45 : (strong === 'weak' ? 0.6 : 0.85),
                    transformOrigin: 'center bottom',
                    animation: metroOn
                      ? `metro-beat ${dur.toFixed(2)}s linear infinite ${delay.toFixed(2)}s`
                      : 'none',
                  }}/>
                );
              })}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1, gap: 3, marginLeft: 'auto', minWidth: 0 }}>
              <Mono size={13} color="currentColor" style={{ fontWeight: 500 }}>{bpm}</Mono>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <Caps size={8} color={C.ivory500}>BPM</Caps>
                <span style={{
                  fontFamily: F.display, fontStyle: 'italic',
                  fontSize: 11, color: metroOn ? C.accent : C.ivory300,
                  fontWeight: 500, letterSpacing: 0,
                }}>6/8</span>
              </span>
            </span>
          </button>
          <button
            onClick={onOpenMetro}
            aria-label="Expand metronome"
            style={{
              width: 28, background: 'transparent',
              border: 'none',
              color: C.ivory400, cursor: 'pointer', padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronUp size={12} strokeWidth={1.4}/>
          </button>
        </div>

        {/* Record */}
        <FooterFAB
          icon={recording
            ? <span style={{ width: 10, height: 10, background: C.record, borderRadius: 1 }}/>
            : <Mic size={15} strokeWidth={1.4}/>
          }
          onClick={onRecord}
          danger={recording}
          color={recording ? C.record : undefined}
          size={40}
        />

        {/* Quick add */}
        <FooterFAB
          icon={<Plus size={15} strokeWidth={1.4}/>}
          onClick={onQuickAdd}
          size={40}
        />
      </div>

      {/* Row 3: today total */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 18px 4px',
        borderTop: `1px solid ${C.hairline}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Caps size={8} color={C.ivory500}>Aujourd'hui</Caps>
          <Mono size={10} color={C.ivory300}>{Math.floor(todayTotal/60)} / 90′</Mono>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Caps size={8} color={C.ivory500}>Streak</Caps>
          <Mono size={10} color={C.ivory300}>9 days</Mono>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Footer });
