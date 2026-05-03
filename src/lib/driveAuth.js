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

function isTokenValid() {
  return !!cachedAccessToken && Date.now() < cachedExpiresAt - 30_000;
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
      const sec = typeof resp.expires_in === 'number' ? resp.expires_in : 3600;
      cachedExpiresAt = Date.now() + sec * 1000;
      resolve(resp.access_token);
    },
  });
}

/**
 * @param {{ interactive?: boolean }} [opts] interactive false → silent renewal (empty prompt)
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
