import React, {useEffect, useState} from 'react';
import Menu from 'lucide-react/dist/esm/icons/menu';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import {BG, IKB, TEXT, MUTED, LINE, serif, sans, SURFACE2, LINE_MED} from '../constants/theme.js';
import {Z_TOPBAR} from '../constants/theme.js';

export default function TopBar({onMenu, activeItemId, onSettings, onScrollToTop}) {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

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

      {/* Center — wordmark; tap scrolls to top of current view */}
      <button
        onClick={onScrollToTop}
        style={{
          position: 'absolute',
          left: '44px',
          right: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          height: '44px',
        }}
        aria-label="Scroll to top"
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
      </button>

      {/* Right — offline (PWA / flaky network) + settings */}
      <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6}}>
        {!online && (
          <div
            role="status"
            aria-live="polite"
            title="No network connection"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
              background: SURFACE2,
              border: `1px solid ${LINE_MED}`,
              flexShrink: 0,
            }}
          >
            <WifiOff size={12} strokeWidth={1.75} color={MUTED} aria-hidden />
            <span
              style={{
                fontFamily: sans,
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: MUTED,
              }}
            >
              Offline
            </span>
          </div>
        )}
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
          }}
          aria-label="Settings"
        >
          <MoreHorizontal size={18} strokeWidth={1.5} />
        </button>
      </div>
      </div>{/* end inner 44px row */}
    </div>
  );
}
