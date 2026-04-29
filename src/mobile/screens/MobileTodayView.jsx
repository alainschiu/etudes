import React, { useState } from 'react';
import Play from 'lucide-react/dist/esm/icons/play';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { MC, MF } from '../tokens.js';
import { SECTION_CONFIG } from '../../constants/config.js';
import { displayTitle, formatByline, getItemTime } from '../../lib/items.js';

function Progress({ value, max }) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  return (
    <div style={{ position: 'relative', height: 1, background: 'rgba(244,238,227,0.10)', borderRadius: 0.5, flex: 1 }}>
      <div style={{
        position: 'absolute', inset: 0, right: 'auto',
        width: `${pct}%`, background: MC.accent,
        boxShadow: pct > 0 ? `0 0 6px ${MC.accent}` : 'none',
        transition: 'width 360ms cubic-bezier(0.2,0.7,0.2,1)',
      }} />
    </div>
  );
}

function ItemRow({ item, active, elapsed, onClick }) {
  const timeStr = elapsed;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 0',
        borderBottom: `1px solid ${MC.hairline}`,
        cursor: 'pointer',
      }}
    >
      <div style={{
        marginTop: 3, width: 18, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: active ? MC.accent : MC.ivory400,
      }}>
        {active ? (
          <span className="m-pulse" style={{
            width: 8, height: 8, borderRadius: 999, background: MC.accent,
            boxShadow: `0 0 8px ${MC.accent}`,
          }} />
        ) : (
          <Play size={11} strokeWidth={1.4} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: MF.display, fontStyle: 'italic', fontSize: 17,
          color: active ? MC.ivory100 : MC.ivory200, lineHeight: 1.25,
        }}>
          {displayTitle(item)}
        </div>
        {formatByline(item) && (
          <div style={{ fontFamily: MF.text, fontSize: 12, color: MC.ivory400, marginTop: 2, fontStyle: 'italic' }}>
            {formatByline(item)}
          </div>
        )}
        {item.spots?.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
              {item.spots.length} spot{item.spots.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
        <span style={{ fontFamily: MF.mono, fontSize: 12, color: timeStr !== '0:00' ? MC.ivory100 : MC.ivory500, fontVariantNumeric: 'tabular-nums' }}>
          {timeStr}
        </span>
      </div>
    </div>
  );
}

function SectionAccordion({ session, items, itemTimes, activeItemId, onItemClick, fmt }) {
  const [open, setOpen] = useState(session.type === 'piece');
  const cfg = SECTION_CONFIG[session.type];
  const sessionItems = items.filter(i => (session.itemIds || []).includes(i.id));
  const sectionSec = sessionItems.reduce((sum, i) => sum + getItemTime(itemTimes, i.id), 0);
  const sectionMin = Math.floor(sectionSec / 60);

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0',
          borderBottom: `1px solid ${open ? MC.hairlineStrong : MC.hairline}`,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChevronRight
            size={11} strokeWidth={1.4}
            style={{
              color: MC.ivory500,
              transform: open ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 200ms cubic-bezier(0.2,0.7,0.2,1)',
            }}
          />
          <span style={{ fontFamily: MF.sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
            {cfg.label}
          </span>
          {!open && sessionItems.length > 0 && (
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
              · {sessionItems.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: MF.mono, fontSize: 11, color: sectionMin > 0 ? MC.ivory200 : MC.ivory500, fontVariantNumeric: 'tabular-nums' }}>
            {sectionMin}′
          </span>
          {session.target && (
            <span style={{ fontFamily: MF.mono, fontSize: 9, color: MC.ivory500, fontVariantNumeric: 'tabular-nums' }}>
              / {session.target}′
            </span>
          )}
        </div>
      </div>

      {open && (
        <div style={{ animation: 'm-rise-fade 240ms cubic-bezier(0.2,0.7,0.2,1)', animationName: 'm-rise-fade' }}>
          {sessionItems.length === 0 ? (
            <div style={{
              padding: '20px 0', borderBottom: `1px solid ${MC.hairline}`,
              fontFamily: MF.text, fontStyle: 'italic', fontSize: 13, color: MC.ivory500,
            }}>
              No items in this section yet.
            </div>
          ) : (
            sessionItems.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                active={activeItemId === item.id}
                elapsed={fmt(getItemTime(itemTimes, item.id))}
                onClick={() => onItemClick(item)}
              />
            ))
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 0', borderBottom: `1px solid ${MC.hairline}`,
            color: MC.ivory500, cursor: 'pointer',
          }}>
            <Plus size={11} strokeWidth={1.4} />
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
              Add to {cfg.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ReflectionBlock({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const hasText = (value || '').trim().length > 0;
  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${MC.hairline}` }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0', cursor: 'pointer',
          borderBottom: `1px solid ${open ? MC.hairlineStrong : MC.hairline}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChevronRight
            size={11} strokeWidth={1.4}
            style={{
              color: MC.ivory500,
              transform: open ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 200ms cubic-bezier(0.2,0.7,0.2,1)',
            }}
          />
          <span style={{ fontFamily: MF.sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
            Reflection
          </span>
          <span style={{ fontFamily: MF.display, fontStyle: 'italic', fontSize: 14, color: MC.ivory300 }}>
            Journal du jour
          </span>
        </div>
        <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: hasText ? MC.accent : MC.ivory500 }}>
          {hasText ? 'Saved' : 'Empty'}
        </span>
      </div>
      {open && (
        <div style={{ padding: '14px 0 4px', animation: 'm-rise-fade 220ms cubic-bezier(0.2,0.7,0.2,1)', animationName: 'm-rise-fade' }}>
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="How did today feel? What surprised you?"
            style={{
              width: '100%', background: MC.ink100,
              border: `1px solid ${MC.hairline}`,
              padding: '14px 16px', minHeight: 100,
              fontFamily: MF.text, fontStyle: 'italic', fontSize: 14,
              lineHeight: 1.7, color: MC.ivory200, outline: 'none',
              resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function MobileTodayView({
  todaySessions, items, itemTimes, activeItemId,
  onItemClick, effectiveTotalToday, settings,
  dailyReflection, setDailyReflection,
  dayClosed, loadRoutine, routines, loadedRoutine,
  fmt, fmtMin,
}) {
  const today = new Date();
  const dateStr = (today.toLocaleDateString('en-US', { weekday: 'long' }) + ' · ' +
    today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })).toUpperCase();
  const totalMin = Math.floor((effectiveTotalToday || 0) / 60);
  const dailyTarget = settings?.dailyTarget || 90;

  return (
    <div style={{ padding: '12px 24px 28px' }}>
      {/* Eyebrow */}
      <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
        {dateStr}
      </span>

      {/* Title row */}
      <div style={{ marginTop: 6, marginBottom: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500, fontSize: 44, letterSpacing: '-0.01em', lineHeight: 1.1, color: MC.ivory200 }}>
          Today
        </span>
        {routines.length > 0 && (
          <span
            onClick={() => {/* open routine picker */}}
            style={{
              fontFamily: MF.display, fontStyle: 'italic', fontSize: 13,
              color: MC.ivory400,
              borderBottom: `1px solid ${MC.hairlineStrong}`,
              paddingBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 4,
              cursor: 'pointer',
            }}
          >
            <Bookmark size={11} strokeWidth={1.4} />
            {loadedRoutine ? loadedRoutine.name : 'Load routine'}
            <ChevronDown size={10} strokeWidth={1.4} />
          </span>
        )}
      </div>

      {/* Target progress */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 0',
        borderTop: `1px solid ${MC.hairlineStrong}`,
        borderBottom: `1px solid ${MC.hairline}`,
      }}>
        <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400, flexShrink: 0 }}>
          Target
        </span>
        <Progress value={totalMin} max={dailyTarget} />
        <span style={{ fontFamily: MF.mono, fontSize: 11, color: MC.ivory200, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {totalMin} / {dailyTarget}′
        </span>
      </div>

      {/* Section accordions */}
      <div style={{ marginTop: 8 }}>
        {todaySessions.map(session => (
          <SectionAccordion
            key={session.id}
            session={session}
            items={items}
            itemTimes={itemTimes}
            activeItemId={activeItemId}
            onItemClick={onItemClick}
            fmt={fmt}
          />
        ))}
      </div>

      {/* Close the day */}
      {!dayClosed && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 24px' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 14px',
            fontFamily: MF.sans, fontSize: 10, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            borderRadius: 999, border: `1px solid ${MC.hairlineStrong}`,
            background: 'transparent', color: MC.ivory200, cursor: 'pointer',
          }}>
            <Lock size={10} strokeWidth={1.4} /> Close the day
          </button>
        </div>
      )}

      {/* Reflection */}
      <ReflectionBlock value={dailyReflection} onChange={setDailyReflection} />

      <div style={{ height: 24 }} />
    </div>
  );
}
