import React, { useState, Suspense, lazy } from 'react';
import { MC } from './tokens.js';
import MobileTopBar from './MobileTopBar.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import MobileFooter from './MobileFooter.jsx';
import MobileMetronomeSheet from './MobileMetronomeSheet.jsx';
import MobileTodayView from './screens/MobileTodayView.jsx';
import MobileRepertoireView from './screens/MobileRepertoireView.jsx';
import MobilePieceView from './screens/MobilePieceView.jsx';
import MobileLogsView from './screens/MobileLogsView.jsx';
import MobileNotesView from './screens/MobileNotesView.jsx';
import { getItemTime } from '../lib/items.js';

export default function MobileShell({ s }) {
  const [screen, setScreen] = useState('today');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [metroOpen, setMetroOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const {
    items, itemTimes, todaySessions,
    activeItemId, activeSpotId, activeItem,
    startItem, stopItem,
    effectiveTotalToday, warmupTimeToday,
    settings, streak,
    dailyReflection, setDailyReflection, dayClosed,
    metronome, setMetronome, handleTap,
    isRecording, startRecording, stopRecording,
    history, freeNotes, noteCategories,
    pieceRecordingMeta,
    loadedRoutine, routines, loadRoutine,
    setShowSettings,
    fmt, fmtMin,
  } = s;

  const sessionActive = !!activeItemId;
  const isPlaying = sessionActive;
  const elapsedSec = activeItemId ? getItemTime(itemTimes, activeItemId) : 0;
  const elapsedStr = fmt ? fmt(elapsedSec) : '0:00';

  const selectedItem = selectedItemId ? items.find(i => String(i.id) === String(selectedItemId)) : null;

  const handleItemClick = (item) => {
    startItem(item.id);
    setSelectedItemId(String(item.id));
    setScreen('piece');
  };

  const handleSelectPiece = (item) => {
    setSelectedItemId(String(item.id));
    setScreen('piece');
  };

  const handleNavigate = (id) => {
    if (id === 'settings') {
      setShowSettings(true);
      return;
    }
    setSelectedItemId(null);
    setScreen(id);
  };

  const handleBegin = () => {
    if (items.length > 0) startItem(items[0].id);
  };

  const handleTogglePlay = () => {
    if (activeItemId) stopItem();
    else if (items.length > 0) startItem(items[0].id);
  };

  const handleRecord = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const footerHeight = sessionActive && activeItem ? 148 : 116;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: MC.ink,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Status bar spacer (safe area) */}
      <div style={{ height: 'env(safe-area-inset-top, 44px)', background: MC.ink, flexShrink: 0 }} />

      {/* Top bar */}
      <MobileTopBar
        onMenu={() => setDrawerOpen(true)}
        sessionActive={sessionActive}
        onSettings={() => setShowSettings(true)}
      />

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
        className="no-scrollbar"
      >
        {screen === 'today' && (
          <MobileTodayView
            todaySessions={todaySessions}
            items={items}
            itemTimes={itemTimes}
            activeItemId={activeItemId}
            onItemClick={handleItemClick}
            effectiveTotalToday={effectiveTotalToday}
            settings={settings}
            dailyReflection={dailyReflection}
            setDailyReflection={setDailyReflection}
            dayClosed={dayClosed}
            loadRoutine={loadRoutine}
            routines={routines}
            loadedRoutine={loadedRoutine}
            fmt={fmt}
            fmtMin={fmtMin}
          />
        )}
        {screen === 'repertoire' && (
          <MobileRepertoireView
            items={items}
            itemTimes={itemTimes}
            activeItemId={activeItemId}
            onSelectPiece={handleSelectPiece}
            fmt={fmt}
          />
        )}
        {screen === 'piece' && (
          <MobilePieceView
            piece={selectedItem}
            onBack={() => setScreen('repertoire')}
            activeItemId={activeItemId}
            activeSpotId={activeSpotId}
            startItem={startItem}
            stopItem={stopItem}
            itemTimes={itemTimes}
            pieceRecordingMeta={pieceRecordingMeta}
            fmt={fmt}
          />
        )}
        {screen === 'logs' && (
          <MobileLogsView
            history={history}
            items={items}
            settings={settings}
            streak={streak}
          />
        )}
        {screen === 'notes' && (
          <MobileNotesView freeNotes={freeNotes} />
        )}

        {/* Footer spacer */}
        <div style={{ height: footerHeight + 24 }} />
      </div>

      {/* Persistent footer */}
      <MobileFooter
        sessionActive={sessionActive}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onBegin={handleBegin}
        elapsed={elapsedStr}
        totalToday={effectiveTotalToday}
        activeItem={activeItem}
        bpm={metronome?.bpm || 92}
        metroOn={metronome?.running || false}
        onToggleMetro={() => setMetronome(m => ({ ...m, running: !m.running }))}
        onOpenMetro={() => setMetroOpen(true)}
        recording={isRecording}
        onRecord={handleRecord}
        onQuickAdd={() => {}}
        streak={streak}
        dailyTarget={settings?.dailyTarget}
      />

      {/* Drawer overlay */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current={screen}
        onNavigate={handleNavigate}
        totalToday={effectiveTotalToday}
        dailyTarget={settings?.dailyTarget}
        streak={streak}
      />

      {/* Metronome sheet */}
      <MobileMetronomeSheet
        open={metroOpen}
        onClose={() => setMetroOpen(false)}
        metronome={metronome || {}}
        setMetronome={setMetronome}
        handleTap={handleTap}
      />
    </div>
  );
}
