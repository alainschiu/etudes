import React, {useEffect} from 'react';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import ListMusic from 'lucide-react/dist/esm/icons/list-music';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import StickyNote from 'lucide-react/dist/esm/icons/sticky-note';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import {
  BG, TEXT, MUTED, FAINT, DIM, LINE, LINE_STR,
  IKB, IKB_SOFT, serif, serifText, sans, mono,
  Z_DRAWER, Z_DRAWER_SCRIM,
} from '../constants/theme.js';

const PRIMARY_ITEMS = [
  {id: 'today',      label: 'Today',      eyebrow: 'Aujourd\u2019hui',           Icon: CalendarDays},
  {id: 'repertoire', label: 'Répertoire', eyebrow: 'Pieces · technique · study', Icon: BookOpen},
  {id: 'programs',   label: 'Programs',   eyebrow: 'Salon journal',              Icon: ListMusic},
  {id: 'logs',       label: 'Logs',       eyebrow: 'Practice history',           Icon: ScrollText},
  {id: 'notes',      label: 'Notes',      eyebrow: 'Reference & ideas',          Icon: StickyNote},
];

const SECONDARY_ITEMS = [
  {id: 'review',   label: 'Review'},
  {id: 'routines', label: 'Routines'},
];

export default function Drawer({
  open,
  onClose,
  view,
  setView,
  buildZip,
  openSettings,
  totalToday,
  settings,
}) {
  const fmtMin = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    return `${m}′`;
  };

  // Lock background scroll while the drawer is open. The page is fixed-height
  // already (html, body { overflow:hidden } in index.css) but the iOS scrim
  // still rubber-bands without an explicit body lock.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const panelStyle = {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    width: '82%',
    maxWidth: '320px',
    background: BG,
    borderRight: `1px solid ${LINE_STR}`,
    zIndex: Z_DRAWER,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 'env(safe-area-inset-top, 44px)',
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    transition: open
      ? 'transform 240ms cubic-bezier(0.2,0.7,0.2,1)'
      : 'transform 200ms cubic-bezier(0.6,0,0.8,0.3)',
    willChange: 'transform',
    overscrollBehavior: 'contain',
  };

  const scrimStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(11,10,8,0.72)',
    zIndex: Z_DRAWER_SCRIM,
    opacity: open ? 1 : 0,
    transition: open
      ? 'opacity 240ms cubic-bezier(0.2,0.7,0.2,1)'
      : 'opacity 200ms cubic-bezier(0.6,0,0.8,0.3)',
    pointerEvents: open ? 'auto' : 'none',
  };

  if (!open && typeof window !== 'undefined') {
    // Keep in DOM during close animation; pointer events already none via scrim
  }

  return (
    <>
      {/* Scrim */}
      <div style={scrimStyle} onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div style={panelStyle} role="navigation" aria-label="Main navigation">

        {/* Wordmark header */}
        <div style={{padding: '16px 24px 20px', borderBottom: `1px solid ${LINE}`, flexShrink: 0}}>
          <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: '32px', color: TEXT, letterSpacing: '-0.01em', lineHeight: 1}}>
            Études
          </div>
          <div style={{fontFamily: serif, fontStyle: 'italic', fontSize: '12px', color: FAINT, marginTop: '4px'}}>
            — a practice journal
          </div>
        </div>

        {/* Scrollable nav area */}
        <div style={{flex: 1, overflowY: 'auto'}}>

          {/* Primary nav items */}
          <div style={{paddingTop: '8px', paddingBottom: '4px'}}>
            {PRIMARY_ITEMS.map(({id, label, eyebrow, Icon}) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    width: '100%',
                    padding: '14px 24px',
                    minHeight: '52px',
                    background: active ? IKB_SOFT : 'transparent',
                    borderLeft: active ? `2px solid ${IKB}` : '2px solid transparent',
                    border: 'none',
                    borderLeftWidth: '2px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: active ? IKB : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.25}
                    style={{color: active ? IKB : FAINT, flexShrink: 0}}
                  />
                  <div style={{minWidth: 0}}>
                    <div style={{
                      fontFamily: sans,
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: active ? TEXT : MUTED,
                      lineHeight: 1.2,
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontFamily: serifText,
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: '11px',
                      color: FAINT,
                      marginTop: '2px',
                    }}>
                      {eyebrow}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{height: '1px', background: LINE, margin: '10px 24px'}} />

          {/* Secondary nav items */}
          <div>
            {SECONDARY_ITEMS.map(({id, label}) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 24px',
                    minHeight: '44px',
                    background: active ? IKB_SOFT : 'transparent',
                    borderLeftWidth: '2px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: active ? IKB : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontFamily: sans,
                    fontSize: '10px',
                    fontWeight: 500,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: active ? TEXT : 'rgba(196,188,179,1)',
                  }}>
                    {label}
                  </span>
                  <ChevronRight size={10} strokeWidth={1.5} style={{color: FAINT, flexShrink: 0}} />
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{height: '1px', background: LINE, margin: '10px 24px'}} />

          {/* Utility items */}
          <div>
            <button
              onClick={() => { buildZip(); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 24px',
                minHeight: '44px',
                background: 'transparent',
                border: 'none',
                borderLeft: '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: sans,
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(196,188,179,1)',
              }}>
                Export
              </span>
            </button>
            <button
              onClick={() => { openSettings(); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 24px',
                minHeight: '44px',
                background: 'transparent',
                border: 'none',
                borderLeft: '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: sans,
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(196,188,179,1)',
              }}>
                Réglages
              </span>
            </button>
          </div>
        </div>

        {/* Drawer footer — today total, no streak */}
        <div style={{
          borderTop: `1px solid ${LINE}`,
          padding: '14px 24px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        }}>
          <span style={{
            fontFamily: sans,
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: FAINT,
          }}>
            Aujourd'hui
          </span>
          <span style={{
            fontFamily: mono,
            fontSize: '12px',
            color: MUTED,
          }}>
            {fmtMin(totalToday)}
            {settings?.dailyTarget ? ` / ${settings.dailyTarget}′` : ''}
          </span>
        </div>

      </div>
    </>
  );
}
