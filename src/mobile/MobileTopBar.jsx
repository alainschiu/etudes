import React from 'react';
import Menu from 'lucide-react/dist/esm/icons/menu';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Settings from 'lucide-react/dist/esm/icons/settings';
import { MC, MF } from './tokens.js';

export default function MobileTopBar({ onMenu, sessionActive, onSettings }) {
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
          color: MC.ivory200, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        <Menu size={18} strokeWidth={1.4} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sessionActive && (
          <span className="m-pulse" style={{
            width: 6, height: 6, borderRadius: 999, background: MC.accent,
            boxShadow: `0 0 6px ${MC.accent}`,
          }} />
        )}
        <span style={{
          fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400,
        }}>
          Études
        </span>
      </div>

      <button
        onClick={onSettings}
        style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'transparent', border: 'none',
          color: MC.ivory400, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        <Settings size={16} strokeWidth={1.4} />
      </button>
    </div>
  );
}
