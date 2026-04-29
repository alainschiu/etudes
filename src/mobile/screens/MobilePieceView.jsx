import React, { useState } from 'react';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import Play from 'lucide-react/dist/esm/icons/play';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { MC, MF } from '../tokens.js';
import { displayTitle, formatByline, getItemTime, getSpotTime, nextPerformance } from '../../lib/items.js';

const TABS = [
  { id: 'spots',      label: 'Spots' },
  { id: 'bookmarks',  label: 'Bookmarks' },
  { id: 'recordings', label: 'Recordings' },
];

function SpotRow({ spot, active, spotTime, onActivate, fmt }) {
  return (
    <div
      onClick={onActivate}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 0', borderBottom: `1px solid ${MC.hairline}`,
        cursor: 'pointer',
      }}
    >
      <div style={{
        marginTop: 4, width: 16, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: active ? MC.accent : MC.ivory400,
      }}>
        {active ? (
          <span className="m-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: MC.accent, boxShadow: `0 0 8px ${MC.accent}` }} />
        ) : (
          <Play size={10} strokeWidth={1.4} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: MF.text, fontSize: 14, color: MC.ivory200, fontStyle: 'italic' }}>
          {spot.label}
        </div>
        {spot.bookmark && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Bookmark size={9} strokeWidth={1.4} style={{ color: MC.ivory500 }} />
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
              {spot.bookmark}
            </span>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontFamily: MF.mono, fontSize: 11, color: MC.ivory200, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(spotTime)}
        </span>
        {spot.target && (
          <div>
            <span style={{ fontFamily: MF.mono, fontSize: 9, color: MC.ivory500, fontVariantNumeric: 'tabular-nums' }}>
              / {spot.target}′
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobilePieceView({
  piece, onBack, activeItemId, activeSpotId,
  startItem, stopItem, itemTimes,
  pieceRecordingMeta, fmt,
}) {
  const [tab, setTab] = useState('spots');
  if (!piece) return null;

  const isActive = activeItemId === piece.id;
  const totalSec = getItemTime(itemTimes, piece.id);
  const nextPerf = nextPerformance(piece.performances || []);

  const today = new Date().toISOString().split('T')[0];
  const daysAway = nextPerf?.date
    ? Math.ceil((new Date(nextPerf.date) - new Date(today)) / 86400000)
    : null;

  const recordings = pieceRecordingMeta?.[piece.id] || [];
  const recList = Array.isArray(recordings)
    ? recordings
    : Object.values(recordings);

  return (
    <div style={{ padding: '4px 24px 28px' }}>
      {/* Back */}
      <div
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 0', cursor: 'pointer', color: MC.ivory400 }}
      >
        <ChevronLeft size={12} strokeWidth={1.4} />
        <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
          Repertoire
        </span>
      </div>

      {/* Stage + instrument */}
      <div style={{ marginTop: 8 }}>
        <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
          {piece.stage}{piece.instrument ? ` · ${piece.instrument}` : ''}
        </span>
      </div>

      {/* Title */}
      <div style={{ marginTop: 6 }}>
        <span style={{ fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500, fontSize: 32, letterSpacing: '-0.01em', lineHeight: 1.1, color: MC.ivory200 }}>
          {displayTitle(piece)}
        </span>
      </div>
      {formatByline(piece) && (
        <div style={{ marginTop: 4, fontFamily: MF.text, fontSize: 14, color: MC.ivory400, fontStyle: 'italic' }}>
          {formatByline(piece)}
        </div>
      )}

      {/* Performance + total */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginTop: 18, padding: '12px 0',
        borderTop: `1px solid ${MC.hairlineStrong}`,
        borderBottom: `1px solid ${MC.hairline}`,
      }}>
        {nextPerf ? (
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
              Next perf.
            </span>
            <div style={{ marginTop: 4, fontFamily: MF.text, fontStyle: 'italic', fontSize: 13, color: MC.ivory200 }}>
              {nextPerf.name || nextPerf.date}
            </div>
            {daysAway !== null && (
              <span style={{ fontFamily: MF.mono, fontSize: 10, color: daysAway <= 7 ? MC.warn : MC.ivory400, marginTop: 2, display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                {daysAway > 0 ? `${daysAway} days away` : 'Today'}
              </span>
            )}
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
              No performance scheduled
            </span>
          </div>
        )}
        <div style={{ width: 1, alignSelf: 'stretch', background: MC.hairline }} />
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
            Total time
          </span>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontFamily: MF.mono, fontSize: 18, color: MC.ivory100, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(totalSec)}
            </span>
          </div>
        </div>
      </div>

      {/* Start / stop button */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => isActive ? stopItem() : startItem(piece.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 36, padding: '0 16px',
            fontFamily: MF.sans, fontSize: 10, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            borderRadius: 4,
            background: isActive ? MC.accentSoft : 'transparent',
            border: `1px solid ${isActive ? MC.accentLine : MC.hairlineStrong}`,
            color: isActive ? MC.accent : MC.ivory200,
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
        >
          {isActive
            ? <><span style={{ width: 8, height: 8, background: MC.accent, borderRadius: 999 }} className="m-pulse" /> Practicing</>
            : <><Play size={12} strokeWidth={1.4} /> Start</>
          }
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', marginTop: 24, borderBottom: `1px solid ${MC.hairline}` }}>
        {TABS.map(t => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 14px 12px', cursor: 'pointer',
              borderBottom: `1px solid ${tab === t.id ? MC.accent : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            <span style={{
              fontFamily: MF.sans, fontSize: 10, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: tab === t.id ? MC.ivory100 : MC.ivory400,
            }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>

      {/* Spots */}
      {tab === 'spots' && (
        <div style={{ marginTop: 4 }}>
          {(piece.spots || []).length === 0 ? (
            <div style={{ padding: '20px 0', fontFamily: MF.text, fontStyle: 'italic', fontSize: 13, color: MC.ivory500 }}>
              No spots yet.
            </div>
          ) : (
            (piece.spots || []).map(sp => (
              <SpotRow
                key={sp.id}
                spot={sp}
                active={activeSpotId === sp.id}
                spotTime={getSpotTime(itemTimes, piece.id, sp.id)}
                onActivate={() => startItem(piece.id, sp.id)}
                fmt={fmt}
              />
            ))
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: MC.ivory500 }}>
            <Plus size={11} strokeWidth={1.4} />
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500 }}>
              Add spot
            </span>
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {tab === 'bookmarks' && (
        <div style={{ marginTop: 4 }}>
          {(piece.pdfs || []).length === 0 ? (
            <div style={{ padding: '20px 0', fontFamily: MF.text, fontStyle: 'italic', fontSize: 13, color: MC.ivory500 }}>
              No PDF attached. Open the score viewer to add bookmarks.
            </div>
          ) : (
            (piece.pdfs || []).flatMap(pdf => pdf.bookmarks || []).map((bm, i) => (
              <div key={bm.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: `1px solid ${MC.hairline}` }}>
                <Bookmark size={11} strokeWidth={1.4} style={{ color: MC.ivory400 }} />
                <div style={{ flex: 1, fontFamily: MF.text, fontStyle: 'italic', fontSize: 14, color: MC.ivory200 }}>{bm.label}</div>
                <span style={{ fontFamily: MF.mono, fontSize: 10, color: MC.ivory400, fontVariantNumeric: 'tabular-nums' }}>p. {bm.page}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recordings */}
      {tab === 'recordings' && (
        <div style={{ marginTop: 16 }}>
          {recList.length === 0 ? (
            <div style={{ fontFamily: MF.text, fontStyle: 'italic', fontSize: 13, color: MC.ivory500 }}>
              No recordings yet.
            </div>
          ) : (
            recList.slice(0, 5).map((rec, i) => (
              <div key={rec.id || i} style={{ background: MC.ink100, border: `1px solid ${MC.hairline}`, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
                    {rec.date || rec.createdAt || `Recording ${i + 1}`}
                  </span>
                  {rec.bpm && (
                    <span style={{ fontFamily: MF.mono, fontSize: 10, color: MC.ivory400, fontVariantNumeric: 'tabular-nums' }}>
                      {rec.bpm} BPM
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 8, height: 24, background: MC.ink200, borderRadius: 2, opacity: 0.5 }} />
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
