import React from 'react';
import Menu from 'lucide-react/dist/esm/icons/menu';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import {BG, IKB, TEXT, MUTED, LINE, serif} from '../constants/theme.js';
import {Z_TOPBAR} from '../constants/theme.js';

export default function TopBar({onMenu, activeItemId, onSettings}) {
  return (
    <div
      style={{
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        background: BG,
        borderBottom: `1px solid ${LINE}`,
        position: 'relative',
        zIndex: Z_TOPBAR,
        flexShrink: 0,
      }}
    >
      {/* Left — hamburger */}
      <button
        onClick={onMenu}
        style={{
          minWidth: '40px',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: MUTED,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        aria-label="Open navigation"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      {/* Center — wordmark */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          pointerEvents: 'none',
        }}
      >
        <div
          className={activeItemId ? 'animate-pulse' : ''}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            background: IKB,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '18px',
            letterSpacing: '-0.01em',
            color: TEXT,
          }}
        >
          Études
        </span>
      </div>

      {/* Right — settings */}
      <button
        onClick={onSettings}
        style={{
          minWidth: '40px',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: MUTED,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginLeft: 'auto',
        }}
        aria-label="Settings"
      >
        <MoreHorizontal size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
