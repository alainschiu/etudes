import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { BG, SURFACE2, TEXT, MUTED, LINE_STR, IKB, sans } from '../constants/theme.js';

/**
 * Shown when a new service worker is waiting (registerType: 'prompt' in vite.config.js).
 * Dev: hook is inert when SW is unavailable.
 */
export default function UpdatePrompt() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
  const [show, setShow] = needRefresh;

  if (!show) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
        background: SURFACE2,
        borderTop: `1px solid ${LINE_STR}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontFamily: sans,
        fontSize: 13,
        color: TEXT,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
      }}
    >
      <span style={{ color: MUTED, flex: 1, minWidth: 0 }}>
        A new version is ready.
      </span>
      <button
        type="button"
        onClick={() => {
          void updateServiceWorker(true);
        }}
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          background: IKB,
          color: BG,
        }}
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => setShow(false)}
        style={{
          flexShrink: 0,
          padding: '8px 10px',
          borderRadius: 8,
          border: `1px solid ${LINE_STR}`,
          cursor: 'pointer',
          fontFamily: sans,
          fontSize: 12,
          color: MUTED,
          background: 'transparent',
        }}
      >
        Later
      </button>
    </div>
  );
}
