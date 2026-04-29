import React, { useMemo } from 'react';
import { MC, MF } from '../tokens.js';
import { SECTION_CONFIG } from '../../constants/config.js';

const TYPE_COLORS = { tech: MC.ivory400, piece: MC.accent, play: MC.warn, study: MC.ivory300 };

export default function MobileLogsView({ history, items, settings, streak }) {
  const dailyTarget = settings?.dailyTarget || 90;

  const days = useMemo(() => {
    return history
      .filter(h => (h.kind === 'day' || !h.kind) && h.date && (h.minutes > 0 || h.reflection))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 60);
  }, [history]);

  const weekStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    const weekDays = days.filter(d => d.date >= weekKey);
    const total = weekDays.reduce((s, d) => s + (d.minutes || 0), 0);
    const avg = weekDays.length > 0 ? Math.round(total / weekDays.length) : 0;
    return { total, avg };
  }, [days]);

  return (
    <div style={{ padding: '12px 24px 28px' }}>
      <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
        Practice archive
      </span>
      <div style={{ marginTop: 6, marginBottom: 14 }}>
        <span style={{ fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500, fontSize: 40, letterSpacing: '-0.01em', lineHeight: 1.1, color: MC.ivory200 }}>
          Logs
        </span>
      </div>

      {/* Week summary */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '14px 0',
        borderTop: `1px solid ${MC.hairlineStrong}`,
        borderBottom: `1px solid ${MC.hairline}`,
      }}>
        <div>
          <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>Streak</span>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontFamily: MF.mono, fontSize: 18, color: MC.ivory100, fontVariantNumeric: 'tabular-nums' }}>
              {streak || 0} days
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>This week</span>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontFamily: MF.mono, fontSize: 18, color: MC.ivory100, fontVariantNumeric: 'tabular-nums' }}>
              {weekStats.total}′
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>Avg / day</span>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontFamily: MF.mono, fontSize: 18, color: MC.ivory100, fontVariantNumeric: 'tabular-nums' }}>
              {weekStats.avg}′
            </span>
          </div>
        </div>
      </div>

      {/* Day list */}
      <div style={{ marginTop: 8 }}>
        {days.length === 0 ? (
          <div style={{ padding: '32px 0', fontFamily: MF.text, fontStyle: 'italic', fontSize: 15, color: MC.ivory500 }}>
            No practice logs yet.
          </div>
        ) : (
          days.map((entry, i) => {
            const d = new Date(entry.date);
            const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
              + ' — ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const practMin = (entry.minutes || 0) - (entry.warmupMinutes || 0);
            const hitTarget = practMin >= dailyTarget;
            const isRest = entry.rest || (entry.minutes === 0 && !entry.reflection);

            // Build section bars from items grouped by type
            const typeSecs = {};
            (entry.items || []).forEach(it => {
              const liveItem = items.find(x => String(x.id) === String(it.id));
              const type = it.type || liveItem?.type || 'piece';
              typeSecs[type] = (typeSecs[type] || 0) + ((it.minutes || 0) * 60);
            });
            const typeEntries = Object.entries(typeSecs).filter(([, s]) => s > 0);

            return (
              <div key={entry.date} style={{ padding: '18px 0', borderBottom: `1px solid ${MC.hairline}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: MF.sans, fontSize: 10, fontWeight: 500,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: isRest ? MC.rest : MC.ivory300,
                  }}>
                    {dateLabel.toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    {isRest ? (
                      <span style={{ fontFamily: MF.mono, fontSize: 11, color: MC.rest }}>Rest</span>
                    ) : (
                      <>
                        <span style={{ fontFamily: MF.mono, fontSize: 13, color: hitTarget ? MC.ivory100 : MC.ivory300, fontVariantNumeric: 'tabular-nums' }}>
                          {practMin}′
                        </span>
                        <span style={{ fontFamily: MF.mono, fontSize: 9, color: MC.ivory500, fontVariantNumeric: 'tabular-nums' }}>
                          / {dailyTarget}′
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Section bar */}
                {typeEntries.length > 0 && (
                  <div style={{ display: 'flex', gap: 1, marginTop: 8, height: 2 }}>
                    {typeEntries.map(([type, secs]) => (
                      <div
                        key={type}
                        title={`${SECTION_CONFIG[type]?.label || type} ${Math.floor(secs / 60)}′`}
                        style={{
                          flex: secs,
                          background: TYPE_COLORS[type] || MC.ivory400,
                          opacity: 0.85,
                        }}
                      />
                    ))}
                    <div style={{
                      flex: Math.max(0, (dailyTarget * 60) - Object.values(typeSecs).reduce((a, b) => a + b, 0)),
                      background: MC.hairline,
                    }} />
                  </div>
                )}

                {entry.reflection && (
                  <div style={{
                    marginTop: 10, fontFamily: MF.text, fontStyle: 'italic',
                    fontSize: 13, lineHeight: 1.6, color: MC.ivory300,
                  }}>
                    {entry.reflection}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}
