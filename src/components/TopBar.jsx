import React from 'react';
import Menu from 'lucide-react/dist/esm/icons/menu';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import {BG, IKB, TEXT, MUTED, LINE, serif} from '../constants/theme.js';
import {Z_TOPBAR} from '../constants/theme.js';

export default function TopBar({onMenu, activeItemId, onSettings}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 'calc(44px + env(safe-area-inset-top, 0px))',
        padding: 'env(safe-area-inset-top, 0px) 8px 0',
        background: BG,
        borderBottom: `1px solid ${LINE}`,
        zIndex: Z_TOPBAR,
      }}
    >
      {/* Inner row sits below status bar, always 44px tall */}
      <div style={{display:'flex',alignItems:'center',width:'100%',height:'44px',position:'relative'}}>
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
            fontSize: '22px',
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
      </div>{/* end inner 44px row */}
    </div>
  );
}
