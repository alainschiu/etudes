/**
 * Google Drive auth via Google Identity Services (GIS) — decoupled from Supabase.
 * No refresh token in browser; renewal uses requestAccessToken({ prompt: '' }) for silent re-auth.
 */

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

let scriptPromise = null;

function loadGisScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function getClientId() {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof id === 'string' ? id.trim() : '';
}

/** @type {{ requestAccessToken: (o: { prompt?: string }) => void } | null} */
let tokenClient = null;

/** @type {string | null} */
let cachedAccessToken = null;
/** epoch ms when access token is treated as expired */
let cachedExpiresAt = 0;

/** @type {(v: string) => void | null} */
let resolvePending = null;
/** @type {(e: Error) => void | null} */
let rejectPending = null;

/** @type {Promise<string> | null} */
let inflightToken = null;

/** Effective access-token lifetime (ms). Dev: VITE_DRIVE_TOKEN_TTL_SEC for silent-renewal spike; prod: use expires_in from Google. */
function effectiveTokenTtlMs() {
  const raw = import.meta.env.VITE_DRIVE_TOKEN_TTL_SEC;
  if (import.meta.env.DEV && raw !== undefined && raw !== '') {
    const n = Number.parseInt(String(raw), 10);
    if (Number.isFinite(n) && n > 0) return n * 1000;
  }
  return null;
}

function isTokenValid() {
  if (!cachedAccessToken) return false;
  const ttlOverride = effectiveTokenTtlMs();
  if (ttlOverride != null) return Date.now() < cachedExpiresAt - Math.min(5000, ttlOverride * 0.1);
  return Date.now() < cachedExpiresAt - 30_000;
}

function ensureTokenClient() {
  const clientId = getClientId();
  if (!clientId) throw new Error('Missing VITE_GOOGLE_CLIENT_ID');
  const g = window.google;
  if (!g?.accounts?.oauth2) throw new Error('Google Identity Services not available');

  if (tokenClient) return;

  tokenClient = g.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
    callback: (resp) => {
      const resolve = resolvePending;
      const reject = rejectPending;
      resolvePending = null;
      rejectPending = null;
      if (!resolve || !reject) return;
      if (resp.error) {
        reject(new Error(resp.error));
        return;
      }
      if (!resp.access_token) {
        reject(new Error('No access token from Google'));
        return;
      }
      cachedAccessToken = resp.access_token;
      const ttlOverride = effectiveTokenTtlMs();
      const sec =
        ttlOverride != null
          ? Math.round(ttlOverride / 1000)
          : typeof resp.expires_in === 'number'
            ? resp.expires_in
            : 3600;
      cachedExpiresAt = Date.now() + sec * 1000;
      resolve(resp.access_token);
    },
  });
}

/**
 * Eagerly load GIS and initialize the token client. Idempotent.
 * Call from app boot when isDriveConfigured() so requestDriveTokenInteractive()
 * can fire synchronously from a user gesture (iOS Safari popup-blocker fix).
 * @returns {Promise<void>}
 */
export function prepareDriveAuth() {
  return loadGisScript().then(() => {
    try { ensureTokenClient(); } catch { /* missing client id is surfaced on first use */ }
  });
}

/** Synchronous readiness check — true when GIS is loaded AND tokenClient exists. */
export function isDriveAuthReady() {
  return !!(typeof window !== 'undefined' && window.google?.accounts?.oauth2 && tokenClient);
}

/**
 * Synchronous popup trigger. Must be called directly from a user-gesture
 * handler (click/tap) — no awaits between the gesture and this call.
 * Throws synchronously if !isDriveAuthReady().
 *
 * Includes a 12-second safety timeout: GIS does not fire its callback when
 * iOS Safari (or any browser) silently blocks the popup, so without a
 * timeout the returned promise would hang and the UI would stay locked
 * forever. On timeout the promise rejects with a hint about pop-ups.
 *
 * @returns {Promise<string>}
 */
export function requestDriveTokenInteractive() {
  if (!isDriveAuthReady()) throw new Error('Drive auth not ready');
  if (inflightToken) return inflightToken;

  inflightToken = new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;
    const settle = (fn) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolvePending = null;
      rejectPending = null;
      fn();
    };
    resolvePending = (v) => settle(() => resolve(v));
    rejectPending  = (e) => settle(() => reject(e));

    try {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      settle(() => reject(e instanceof Error ? e : new Error(String(e))));
      return;
    }
    timer = setTimeout(() => {
      settle(() => reject(new Error('No response from Google sign-in. The pop-up may have been blocked. Allow pop-ups for this site and try again.')));
    }, 12_000);
  }).finally(() => {
    inflightToken = null;
  });

  return inflightToken;
}

/**
 * @param {{ interactive?: boolean }} [opts] interactive false → silent renewal (empty prompt).
 *   For interactive auth from a user gesture, prefer requestDriveTokenInteractive().
 *   This async path remains for silent renewal (no popup, no gesture rules).
 * @returns {Promise<string>}
 */
export async function getDriveAccessToken(opts = {}) {
  const interactive = opts.interactive !== false;
  if (isTokenValid()) return /** @type {string} */ (cachedAccessToken);
  if (inflightToken) return inflightToken;

  inflightToken = (async () => {
    await loadGisScript();
    ensureTokenClient();

    return new Promise((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
      try {
        tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
      } catch (e) {
        resolvePending = null;
        rejectPending = null;
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  })()
    .finally(() => {
      inflightToken = null;
    });

  return inflightToken;
}

export function clearDriveSession() {
  cachedAccessToken = null;
  cachedExpiresAt = 0;
  resolvePending = null;
  rejectPending = null;
  tokenClient = null;
  inflightToken = null;
}

export function isDriveConfigured() {
  return !!getClientId();
}

export function hasDriveToken() {
  return isTokenValid();
}

/** Dev / spike: force the next getDriveAccessToken to treat the cache as expired (silent renewal test). */
export function forceExpireCachedDriveToken() {
  cachedExpiresAt = 0;
}
