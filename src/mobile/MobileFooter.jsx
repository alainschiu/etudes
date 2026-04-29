import React from 'react';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import { MC, MF } from './tokens.js';
import { displayTitle } from '../lib/items.js';

function FAB({ icon, onClick, active = false, danger = false, size = 40, color }) {
  const c = active ? MC.accent : (danger ? MC.record : (color || MC.ivory200));
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: 999,
        background: active ? MC.accentSoft : 'transparent',
        border: `1px solid ${active ? MC.accentLine : MC.hairlineStrong}`,
        color: c,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, padding: 0,
      }}
    >
      {icon}
    </button>
  );
}

function BeatBars({ bpm, metroOn }) {
  const beats = [
    { strong: 'major', beat: 0 }, { strong: 'weak', beat: 1 }, { strong: 'weak', beat: 2 },
    { strong: 'minor', beat: 3 }, { strong: 'weak', beat: 4 }, { strong: 'weak', beat: 5 },
  ];
  const dur = (60 / Math.max(40, bpm)) * 6;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3, height: 22, flexShrink: 0 }}>
      {beats.map(({ strong, beat }) => {
        const h = strong === 'major' ? 20 : strong === 'minor' ? 14 : 9;
        const w = strong === 'major' ? 3 : 2;
        const baseColor = strong === 'major'
          ? (metroOn ? MC.accent : MC.ivory200)
          : strong === 'minor'
            ? (metroOn ? MC.accent : MC.ivory300)
            : MC.ivory500;
        const delay = -dur + (dur / 6) * beat;
        return (
          <span key={beat} style={{
            width: w, height: h,
            background: baseColor,
            opacity: metroOn ? 0.45 : (strong === 'weak' ? 0.6 : 0.85),
            transformOrigin: 'center bottom',
            animation: metroOn
              ? `m-metro-beat ${dur.toFixed(2)}s linear infinite ${delay.toFixed(2)}s`
              : 'none',
          }} />
        );
      })}
    </span>
  );
}

export default function MobileFooter({
  sessionActive, isPlaying, onTogglePlay, onBegin,
  elapsed, totalToday, activeItem,
  bpm, metroOn, onToggleMetro, onOpenMetro,
  recording, onRecord,
  onQuickAdd, streak, dailyTarget,
}) {
  const itemTitle = activeItem ? displayTitle(activeItem) : null;
  const totalMin = Math.floor((totalToday || 0) / 60);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: 'rgba(17,16,16,0.94)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderTop: `1px solid ${MC.hairlineStrong}`,
      paddingBottom: 24,
      zIndex: 5,
    }}>
      {sessionActive && itemTitle && (
        /* Row 1: active item readout */
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 18px 6px',
          borderBottom: `1px solid ${MC.hairline}`,
        }}>
          <span className="m-pulse" style={{
            width: 6, height: 6, borderRadius: 999, background: MC.accent,
            boxShadow: `0 0 6px ${MC.accent}`, flexShrink: 0,
          }} />
          <span style={{
            fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.accent,
          }}>
            Now
          </span>
          <div style={{
            flex: 1, fontFamily: MF.display, fontStyle: 'italic',
            fontSize: 13, color: MC.ivory200,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {itemTitle}
          </div>
          <span style={{
            fontFamily: MF.mono, fontSize: 11, color: MC.ivory100,
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            {elapsed}
          </span>
        </div>
      )}

      {/* Row 2: transport */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px 10px',
      }}>
        {/* Play / pause */}
        <button
          onClick={sessionActive ? onTogglePlay : onBegin}
          style={{
            width: 48, height: 48, borderRadius: 999,
            background: isPlaying ? MC.accentSoft : 'transparent',
            border: `1px solid ${isPlaying ? MC.accentLine : MC.hairlineStrong}`,
            color: isPlaying ? MC.accent : MC.ivory200,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
            transition: 'all 200ms cubic-bezier(0.2,0.7,0.2,1)',
          }}
        >
          {isPlaying
            ? <Pause size={16} strokeWidth={1.4} />
            : <Play size={16} strokeWidth={1.4} style={{ marginLeft: 2 }} />
          }
        </button>

        {/* Metronome widget: tap area + chevron */}
        <div style={{
          display: 'inline-flex', alignItems: 'stretch',
          height: 40,
          border: `1px solid ${metroOn ? MC.accentLine : MC.hairlineStrong}`,
          borderRadius: 4,
          color: metroOn ? MC.accent : MC.ivory200,
          flex: 1, minWidth: 0, overflow: 'hidden',
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
            <BeatBars bpm={bpm} metroOn={metroOn} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1, gap: 3, marginLeft: 'auto', minWidth: 0 }}>
              <span style={{ fontFamily: MF.mono, fontSize: 13, color: 'currentColor', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {bpm}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: MF.sans, fontSize: 8, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>BPM</span>
              </span>
            </span>
          </button>
          <button
            onClick={onOpenMetro}
            aria-label="Expand metronome"
            style={{
              width: 28, background: 'transparent', border: 'none',
              color: MC.ivory400, cursor: 'pointer', padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronUp size={12} strokeWidth={1.4} />
          </button>
        </div>

        {/* Record */}
        <FAB
          icon={recording
            ? <span style={{ width: 10, height: 10, background: MC.record, borderRadius: 1 }} />
            : <Mic size={15} strokeWidth={1.4} />
          }
          onClick={onRecord}
          danger={recording}
          color={recording ? MC.record : undefined}
          size={40}
        />

        {/* Quick add */}
        <FAB icon={<Plus size={15} strokeWidth={1.4} />} onClick={onQuickAdd} size={40} />
      </div>

      {/* Row 3: today total + streak */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 18px 0',
        borderTop: `1px solid ${MC.hairline}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: MF.sans, fontSize: 8, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
            Aujourd'hui
          </span>
          <span style={{ fontFamily: MF.mono, fontSize: 10, color: MC.ivory300, fontVariantNumeric: 'tabular-nums' }}>
            {totalMin} / {dailyTarget || 90}′
          </span>
        </div>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: MF.sans, fontSize: 8, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
              Streak
            </span>
            <span style={{ fontFamily: MF.mono, fontSize: 10, color: MC.ivory300, fontVariantNumeric: 'tabular-nums' }}>
              {streak} days
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
