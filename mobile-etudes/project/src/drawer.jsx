// Hamburger drawer — slides in from the left.

function Drawer({ open, onClose, current, onNavigate }) {
  const [closing, setClosing] = React.useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  };
  if (!open && !closing) return null;

  const items = [
    { id: 'today', label: 'Today', icon: Clock, eyebrow: 'Aujourd\'hui' },
    { id: 'piece', label: 'Repertoire', icon: BookOpen, eyebrow: 'Pieces · technique · study' },
    { id: 'logs', label: 'Logs', icon: Calendar, eyebrow: 'Daily history' },
    { id: 'notes', label: 'Notes', icon: FileText, eyebrow: 'Reference' },
  ];
  const secondary = [
    { id: 'routines', label: 'Routines' },
    { id: 'programs', label: 'Programs' },
    { id: 'export', label: 'Export' },
    { id: 'settings', label: 'Réglages' },
  ];

  return (
    <>
      {/* Scrim */}
      <div
        onClick={close}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(7,6,8,0.66)',
          zIndex: 30,
          animation: closing ? 'etudes-fade-out 200ms ease forwards' : 'etudes-fade-in 200ms ease forwards',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: '82%',
        background: C.ink,
        borderRight: `1px solid ${C.hairlineStrong}`,
        zIndex: 31,
        animation: closing ? 'etudes-slide-out 220ms cubic-bezier(0.6,0,0.8,0.3) forwards' : 'etudes-slide-in 240ms cubic-bezier(0.2,0.7,0.2,1) forwards',
        display: 'flex', flexDirection: 'column',
        paddingTop: 60, // status bar area
      }}>
        {/* Header / wordmark */}
        <div style={{ padding: '14px 24px 22px' }}>
          <Display size={32}>Études</Display>
          <div style={{ marginTop: 2, fontFamily: F.display, fontStyle: 'italic', fontSize: 12, color: C.ivory400 }}>
            — a practice journal
          </div>
        </div>

        <Rule strong/>

        {/* Primary nav */}
        <div style={{ padding: '10px 0', flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {items.map(it => {
            const active = current === it.id;
            const Icon = it.icon;
            return (
              <div
                key={it.id}
                onClick={() => { close(); setTimeout(() => onNavigate(it.id), 100); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 24px',
                  cursor: 'pointer',
                  borderLeft: `2px solid ${active ? C.accent : 'transparent'}`,
                  background: active ? C.accentSoft : 'transparent',
                }}
              >
                <Icon size={16} strokeWidth={1.4} style={{ color: active ? C.accent : C.ivory400 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: F.display, fontStyle: 'italic', fontSize: 22,
                    color: active ? C.ivory100 : C.ivory200,
                    lineHeight: 1.1,
                  }}>{it.label}</div>
                  <Caps size={9} color={C.ivory500} style={{ marginTop: 2, display: 'block' }}>
                    {it.eyebrow}
                  </Caps>
                </div>
              </div>
            );
          })}

          <div style={{ height: 1, background: C.hairline, margin: '12px 24px' }}/>
          {secondary.map(it => (
            <div
              key={it.id}
              style={{
                padding: '10px 24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <Caps size={10} color={C.ivory300}>{it.label}</Caps>
              <ChevronRight size={11} strokeWidth={1.4} style={{ color: C.ivory500 }}/>
            </div>
          ))}
        </div>

        <Rule/>
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Caps size={9}>Today</Caps>
            <Mono size={13} color={C.ivory100} style={{ marginTop: 2, display: 'block' }}>14 / 90′</Mono>
          </div>
          <Pill small>9 day streak</Pill>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Drawer });
