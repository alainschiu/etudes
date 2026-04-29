// App shell — iOS frame, drawer, current screen, persistent footer

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "openWith": "active"
}/*EDITMODE-END*/;

function TopBar({ onMenu, title, sessionActive }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 16px 8px',
      position: 'relative', zIndex: 10,
    }}>
      <button
        onClick={onMenu}
        style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'transparent', border: 'none',
          color: C.ivory200, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        <Menu size={18} strokeWidth={1.4}/>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sessionActive && (
          <span className="pulse" style={{
            width: 6, height: 6, borderRadius: 999, background: C.accent,
            boxShadow: `0 0 6px ${C.accent}`,
          }}/>
        )}
        <Caps size={9} color={C.ivory400}>Études</Caps>
      </div>
      <button
        style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'transparent', border: 'none',
          color: C.ivory400, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        <MoreHorizontal size={18} strokeWidth={1.4}/>
      </button>
    </div>
  );
}

function PhoneScreen({ tweaks, setTweak }) {
  // Open with active session by default
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [metroOpen, setMetroOpen] = React.useState(false);
  const [screen, setScreen] = React.useState('today');
  const [sessionActive, setSessionActive] = React.useState(tweaks.openWith === 'active');
  const [isPlaying, setIsPlaying] = React.useState(tweaks.openWith === 'active');
  const [activeItemId, setActiveItemId] = React.useState(tweaks.openWith === 'active' ? 'p1' : null);
  const [activeSpotId, setActiveSpotId] = React.useState('sp1');
  const [bpm, setBpm] = React.useState(92);
  const [metroOn, setMetroOn] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(55);

  // Tick when playing
  React.useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Sync open-with tweak
  React.useEffect(() => {
    if (tweaks.openWith === 'active') {
      setSessionActive(true); setIsPlaying(true);
      setActiveItemId('p1'); setActiveSpotId('sp1');
    } else {
      setSessionActive(false); setIsPlaying(false);
      setActiveItemId(null);
    }
  }, [tweaks.openWith]);

  const activeItem = activeItemId
    ? SECTIONS.flatMap(s => s.items).find(i => i.id === activeItemId)
    : null;

  const todayTotal = SECTIONS.reduce((a, s) => a + s.items.reduce((b, i) => b + i.time, 0), 0)
    + (sessionActive ? elapsed : 0);

  const handleItemClick = (item) => {
    if (item.id === 'p1') {
      setActiveItemId('p1');
      setSessionActive(true); setIsPlaying(true);
      setScreen('piece');
    } else {
      setActiveItemId(item.id);
      setSessionActive(true); setIsPlaying(true);
    }
  };

  const handleBegin = () => {
    setSessionActive(true); setIsPlaying(true);
    if (!activeItemId) setActiveItemId('p1');
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: C.ink,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar area is handled by IOSDevice — we offset content */}
      <div style={{ height: 54 }}/>

      {/* Top bar */}
      <TopBar onMenu={() => setDrawerOpen(true)} sessionActive={sessionActive}/>

      {/* Scrollable content */}
      <div className="no-scrollbar" style={{
        flex: 1, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {screen === 'today' && (
          <TodayScreen
            activeItemId={activeItemId}
            onItemClick={handleItemClick}
            onNavigate={setScreen}
            density={tweaks.density}
          />
        )}
        {screen === 'piece' && (
          <PieceScreen
            piece={REPERTOIRE_DETAIL}
            onBack={() => setScreen('today')}
            activeSpotId={activeSpotId}
            onActivateSpot={(id) => { setActiveSpotId(id); setSessionActive(true); setIsPlaying(true); }}
            density={tweaks.density}
          />
        )}
        {screen === 'logs' && <LogsScreen density={tweaks.density}/>}
        {screen === 'notes' && <NotesScreen density={tweaks.density}/>}

        {/* Footer space */}
        <div style={{ height: sessionActive ? 168 : 130 }}/>
      </div>

      {/* Footer */}
      <Footer
        sessionActive={sessionActive}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(p => !p)}
        elapsed={elapsed}
        todayTotal={todayTotal}
        activeItem={activeItem}
        bpm={bpm}
        metroOn={metroOn}
        onToggleMetro={() => setMetroOn(m => !m)}
        onOpenMetro={() => setMetroOpen(true)}
        onRecord={() => setRecording(r => !r)}
        recording={recording}
        onQuickAdd={() => {/* could open sheet */}}
        onBegin={handleBegin}
      />

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current={screen}
        onNavigate={(id) => {
          if (id === 'piece') setScreen('piece');
          else setScreen(id);
        }}
      />

      {/* Metronome sheet */}
      <Metronome
        open={metroOpen}
        onClose={() => setMetroOpen(false)}
        bpm={bpm}
        setBpm={setBpm}
        on={metroOn}
        onToggle={() => setMetroOn(m => !m)}
      />
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
      gap: 18,
    }}>
      {/* Eyebrow */}
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <Display size={28} color={C.ivory300}>Études — mobile redesign</Display>
        <div style={{ marginTop: 6 }}>
          <Caps size={9} color={C.ivory500}>
            Drawer nav · accordion sections · persistent transport · simplified
          </Caps>
        </div>
      </div>

      <IOSDevice dark>
        <IOSStatusBar dark/>
        <PhoneScreen tweaks={tweaks} setTweak={setTweak}/>
      </IOSDevice>

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection title="Layout">
          <TweakRadio
            label="Density"
            value={tweaks.density}
            options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]}
            onChange={v => setTweak('density', v)}
          />
        </TweakSection>
        <TweakSection title="Session">
          <TweakRadio
            label="Open with"
            value={tweaks.openWith}
            options={[{value:'active',label:'Active'},{value:'idle',label:'Idle'}]}
            onChange={v => setTweak('openWith', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
