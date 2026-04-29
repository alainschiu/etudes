import React, { useState } from 'react';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { MC, MF } from '../tokens.js';
import { SECTION_CONFIG, TYPES } from '../../constants/config.js';
import { displayTitle, formatByline, getItemTime } from '../../lib/items.js';

function ItemRow({ item, active, onSelect, totalSec, fmt }) {
  return (
    <div
      onClick={() => onSelect(item)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 0', borderBottom: `1px solid ${MC.hairline}`,
        cursor: 'pointer',
      }}
    >
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{
            fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: MC.ivory500,
          }}>
            {item.stage}
          </span>
          {item.spots?.length > 0 && (
            <span style={{
              fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500,
            }}>
              · {item.spots.length} spot{item.spots.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, paddingTop: 2 }}>
        {totalSec > 0 && (
          <span style={{ fontFamily: MF.mono, fontSize: 11, color: MC.ivory300, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(totalSec)}
          </span>
        )}
        <ChevronRight size={12} strokeWidth={1.4} style={{ color: MC.ivory500 }} />
      </div>
    </div>
  );
}

export default function MobileRepertoireView({ items, itemTimes, activeItemId, onSelectPiece, fmt }) {
  const [openType, setOpenType] = useState('piece');

  const grouped = TYPES.map(type => ({
    type,
    cfg: SECTION_CONFIG[type],
    items: items.filter(i => i.type === type),
  })).filter(g => g.items.length > 0);

  return (
    <div style={{ padding: '12px 24px 28px' }}>
      <span style={{
        fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
        letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400,
      }}>
        {items.length} item{items.length !== 1 ? 's' : ''}
      </span>
      <div style={{ marginTop: 6, marginBottom: 18 }}>
        <span style={{ fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500, fontSize: 40, letterSpacing: '-0.01em', lineHeight: 1.1, color: MC.ivory200 }}>
          Repertoire
        </span>
      </div>

      {grouped.length === 0 ? (
        <div style={{ padding: '32px 0', fontFamily: MF.text, fontStyle: 'italic', fontSize: 15, color: MC.ivory500 }}>
          No items yet. Add pieces, technique, or study items to get started.
        </div>
      ) : (
        grouped.map(({ type, cfg, items: groupItems }) => {
          const isOpen = openType === type;
          return (
            <div key={type}>
              <div
                onClick={() => setOpenType(isOpen ? null : type)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 0',
                  borderBottom: `1px solid ${isOpen ? MC.hairlineStrong : MC.hairline}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ChevronRight
                    size={11} strokeWidth={1.4}
                    style={{
                      color: MC.ivory500,
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 200ms cubic-bezier(0.2,0.7,0.2,1)',
                    }}
                  />
                  <span style={{
                    fontFamily: MF.sans, fontSize: 10, fontWeight: 500,
                    letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400,
                  }}>
                    {cfg.label}
                  </span>
                  {!isOpen && (
                    <span style={{
                      fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
                      letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory500,
                    }}>
                      · {groupItems.length}
                    </span>
                  )}
                </div>
              </div>
              {isOpen && (
                <div style={{ animation: 'm-rise-fade 240ms cubic-bezier(0.2,0.7,0.2,1)', animationName: 'm-rise-fade' }}>
                  {groupItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      active={activeItemId === item.id}
                      totalSec={getItemTime(itemTimes, item.id)}
                      onSelect={onSelectPiece}
                      fmt={fmt}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      <div style={{ height: 24 }} />
    </div>
  );
}
