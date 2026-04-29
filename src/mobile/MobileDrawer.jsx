import React, { useState } from 'react';
import Clock from 'lucide-react/dist/esm/icons/clock';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { MC, MF } from './tokens.js';

const PRIMARY = [
  { id: 'today',      label: 'Today',      eyebrow: "Aujourd'hui",            Icon: Clock },
  { id: 'repertoire', label: 'Repertoire', eyebrow: 'Pieces · technique · study', Icon: BookOpen },
  { id: 'logs',       label: 'Logs',       eyebrow: 'Daily history',           Icon: Calendar },
  { id: 'notes',      label: 'Notes',      eyebrow: 'Reference',               Icon: FileText },
];
const SECONDARY = [
  { id: 'routines',  label: 'Routines' },
  { id: 'programs',  label: 'Programs' },
  { id: 'settings',  label: 'Réglages' },
];

export default function MobileDrawer({ open, onClose, current, onNavigate, totalToday, dailyTarget, streak }) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 220);
  };

  if (!open && !closing) return null;

  const doneMin = Math.floor((totalToday || 0) / 60);

  return (
    <>
      {/* Scrim */}
      <div
        onClick={close}
        style={{
          position: 'absolute', inset: 0,
          background: MC.scrim,
          zIndex: 30,
          animation: closing
            ? 'm-fade-out 200ms ease forwards'
            : 'm-fade-in 200ms ease forwards',
          animationName: closing ? 'm-fade-out' : 'm-fade-in',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: '82%',
        background: MC.ink,
        borderRight: `1px solid ${MC.hairlineStrong}`,
        zIndex: 31,
        animation: closing
          ? 'm-slide-out 220ms cubic-bezier(0.6,0,0.8,0.3) forwards'
          : 'm-slide-in 240ms cubic-bezier(0.2,0.7,0.2,1) forwards',
        animationName: closing ? 'm-slide-out' : 'm-slide-in',
        display: 'flex', flexDirection: 'column',
        paddingTop: 54,
      }}>
        {/* Wordmark */}
        <div style={{ padding: '14px 24px 22px' }}>
          <span style={{
            fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500,
            fontSize: 32, letterSpacing: '-0.01em', lineHeight: 1.1, color: MC.ivory200,
          }}>
            Études
          </span>
          <div style={{
            marginTop: 4, fontFamily: MF.display, fontStyle: 'italic',
            fontSize: 12, color: MC.ivory400,
          }}>
            — a practice journal
          </div>
        </div>

        <div style={{ height: 1, background: MC.hairlineStrong }} />

        {/* Primary nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {PRIMARY.map(({ id, label, eyebrow, Icon }) => {
            const active = current === id;
            return (
              <div
                key={id}
                onClick={() => { close(); setTimeout(() => onNavigate(id), 100); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 24px',
                  cursor: 'pointer',
                  borderLeft: `2px solid ${active ? MC.accent : 'transparent'}`,
                  background: active ? MC.accentSoft : 'transparent',
                }}
              >
                <Icon size={16} strokeWidth={1.4} style={{ color: active ? MC.accent : MC.ivory400, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: MF.display, fontStyle: 'italic', fontSize: 22,
                    color: active ? MC.ivory100 : MC.ivory200, lineHeight: 1.1,
                  }}>
                    {label}
                  </div>
                  <span style={{
                    fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: MC.ivory500, marginTop: 2, display: 'block',
                  }}>
                    {eyebrow}
                  </span>
                </div>
              </div>
            );
          })}

          <div style={{ height: 1, background: MC.hairline, margin: '12px 24px' }} />

          {SECONDARY.map(({ id, label }) => (
            <div
              key={id}
              onClick={() => { close(); setTimeout(() => onNavigate(id), 100); }}
              style={{
                padding: '10px 24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span style={{
                fontFamily: MF.sans, fontSize: 10, fontWeight: 500,
                letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory300,
              }}>
                {label}
              </span>
              <ChevronRight size={11} strokeWidth={1.4} style={{ color: MC.ivory500 }} />
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div style={{ height: 1, background: MC.hairline }} />
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{
              fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400,
            }}>
              Today
            </span>
            <div style={{
              fontFamily: MF.mono, fontSize: 13, color: MC.ivory100,
              marginTop: 2, fontVariantNumeric: 'tabular-nums',
            }}>
              {doneMin} / {dailyTarget || 90}′
            </div>
          </div>
          {streak > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              height: 26, padding: '0 10px',
              fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              borderRadius: 999, border: `1px solid ${MC.hairlineStrong}`,
              color: MC.ivory200,
            }}>
              {streak} day streak
            </span>
          )}
        </div>
      </div>
    </>
  );
}
