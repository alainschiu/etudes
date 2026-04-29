// Piece detail screen — repertoire item with spots, PDF preview, recording

function SpotRow({ spot, active, onActivate }) {
  return (
    <div
      onClick={onActivate}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${C.hairline}`,
        cursor: 'pointer',
      }}
    >
      <div style={{
        marginTop: 4,
        width: 16, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: active ? C.accent : C.ivory400,
      }}>
        {active ? (
          <span className="pulse" style={{
            width: 7, height: 7, borderRadius: 999, background: C.accent,
            boxShadow: `0 0 8px ${C.accent}`,
          }}/>
        ) : (
          <Play size={10} strokeWidth={1.4}/>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.text, fontSize: 14, color: C.ivory200, fontStyle: 'italic' }}>
          {spot.label}
        </div>
        {spot.bookmark && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Bookmark size={9} strokeWidth={1.4} style={{ color: spot.linked ? C.accent : C.ivory500 }}/>
            <Caps size={9} color={spot.linked ? C.accent : C.ivory500}>{spot.bookmark}</Caps>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <Mono size={11} color={C.ivory200}>{fmt(spot.time)}</Mono>
        {spot.target && <div><Mono size={9} color={C.ivory500}>/ {spot.target}′</Mono></div>}
      </div>
    </div>
  );
}

function PieceScreen({ piece, onBack, activeSpotId, onActivateSpot, density }) {
  const [tab, setTab] = React.useState('spots');
  const padX = density === 'compact' ? 20 : 24;

  return (
    <div style={{ padding: `4px ${padX}px 28px` }}>
      {/* Back */}
      <div
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 0', cursor: 'pointer', color: C.ivory400 }}
      >
        <ChevronLeft size={12} strokeWidth={1.4}/>
        <Caps size={9}>Repertoire</Caps>
      </div>

      {/* Eyebrow */}
      <div style={{ marginTop: 8 }}>
        <Caps size={9}>{piece.stage} · {piece.instrument}</Caps>
      </div>

      {/* Title */}
      <div style={{ marginTop: 6 }}>
        <Display size={32}>{piece.title}</Display>
      </div>
      <div style={{ marginTop: 4, fontFamily: F.text, fontSize: 14, color: C.ivory400, fontStyle: 'italic' }}>
        {piece.composer}
      </div>

      {/* Performance + total */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginTop: 18,
        padding: '12px 0',
        borderTop: `1px solid ${C.hairlineStrong}`,
        borderBottom: `1px solid ${C.hairline}`,
      }}>
        <div style={{ flex: 1 }}>
          <Caps size={9}>Next perf.</Caps>
          <div style={{ marginTop: 4, fontFamily: F.text, fontStyle: 'italic', fontSize: 13, color: C.ivory200 }}>
            {piece.performance.name}
          </div>
          <Mono size={10} color={C.warn} style={{ marginTop: 2 }}>{piece.performance.daysAway} days away</Mono>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: C.hairline }}/>
        <div style={{ textAlign: 'right' }}>
          <Caps size={9}>Total time</Caps>
          <div style={{ marginTop: 4 }}>
            <Mono size={18} color={C.ivory100}>{Math.floor(piece.totalTime/60)}:{String(piece.totalTime%60).padStart(2,'0')}</Mono>
          </div>
        </div>
      </div>

      {/* PDF preview card */}
      <div style={{
        marginTop: 20,
        background: C.ink100,
        border: `1px solid ${C.hairline}`,
        height: 160,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
          {/* staves */}
          {[40, 75, 110, 145].map((y,i) => (
            <g key={i}>
              {[0,1,2,3,4].map(k => (
                <line key={k} x1="20" x2="280" y1={y - 8 + k*4} y2={y - 8 + k*4} stroke={C.ivory400} strokeWidth="0.5"/>
              ))}
              <line x1="20" x2="20" y1={y-8} y2={y+8} stroke={C.ivory400} strokeWidth="1"/>
              <line x1="280" x2="280" y1={y-8} y2={y+8} stroke={C.ivory400} strokeWidth="1"/>
              {/* notes */}
              {[40, 70, 100, 130, 160, 190, 220, 250].map((x,j) => (
                <ellipse key={j} cx={x} cy={y - 6 + (j%5)*2} rx="3" ry="2" fill={C.ivory400} transform={`rotate(-15 ${x} ${y})`}/>
              ))}
            </g>
          ))}
        </svg>
        <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={11} strokeWidth={1.4} style={{ color: C.ivory400 }}/>
          <Caps size={9} color={C.ivory400}>Score · p. 1 of 6</Caps>
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 12 }}>
          <Pill small>Open</Pill>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: `1px solid ${C.hairline}` }}>
        {[
          { id: 'spots', label: 'Spots' },
          { id: 'bookmarks', label: 'Bookmarks' },
          { id: 'recordings', label: 'Recordings' },
        ].map(t => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 14px 12px',
              cursor: 'pointer',
              borderBottom: `1px solid ${tab === t.id ? C.accent : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            <Caps size={10} color={tab === t.id ? C.ivory100 : C.ivory400}>{t.label}</Caps>
          </div>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'spots' && (
        <div style={{ marginTop: 4 }}>
          {piece.spots.map(sp => (
            <SpotRow key={sp.id} spot={sp} active={activeSpotId === sp.id} onActivate={() => onActivateSpot(sp.id)}/>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: C.ivory500 }}>
            <Plus size={11} strokeWidth={1.4}/>
            <Caps size={9} color={C.ivory500}>Add spot</Caps>
          </div>
        </div>
      )}
      {tab === 'bookmarks' && (
        <div style={{ marginTop: 4 }}>
          {piece.bookmarks.map((b,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: `1px solid ${C.hairline}` }}>
              <Bookmark size={11} strokeWidth={1.4} style={{ color: C.ivory400 }}/>
              <div style={{ flex: 1, fontFamily: F.text, fontStyle: 'italic', fontSize: 14, color: C.ivory200 }}>{b.name}</div>
              <Mono size={10} color={C.ivory400}>p. {b.page}</Mono>
            </div>
          ))}
        </div>
      )}
      {tab === 'recordings' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: C.ink100, border: `1px solid ${C.hairline}`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Caps size={9}>Apr 21 · 18:42</Caps>
              <Mono size={10} color={C.ivory400}>92 BPM</Mono>
            </div>
            <svg width="100%" height="36" viewBox="0 0 280 36" style={{ marginTop: 8 }}>
              {Array.from({length: 56}).map((_,i) => {
                const h = 4 + Math.abs(Math.sin(i * 0.7)) * 24 + Math.random() * 4;
                return <rect key={i} x={i*5} y={(36-h)/2} width="2" height={h} fill={C.ivory400}/>
              })}
            </svg>
          </div>
          <div style={{ marginTop: 10, fontFamily: F.text, fontStyle: 'italic', fontSize: 13, color: C.ivory500 }}>
            One earlier take from Apr 18.
          </div>
        </div>
      )}

      <div style={{ height: 24 }}/>
    </div>
  );
}

Object.assign(window, { PieceScreen });
