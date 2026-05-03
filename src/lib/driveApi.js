/**
 * Google Drive API v3 — all requests through here for centralized 401 handling
 * and exponential backoff on 403 rateLimitExceeded / userRateLimitExceeded.
 */

const DRIVE_V3 = 'https://www.googleapis.com/drive/v3';

/** Thrown when Drive returns 403 rate limits after all per-request retries (driveSync queue circuit breaker hooks this). */
export class DriveRateLimitExhausted extends Error {
  constructor(message = 'Drive rate limit — retries exhausted') {
    super(message);
    this.name = 'DriveRateLimitExhausted';
    /** @type {'DriveRateLimitExhausted'} */
    this.code = 'DriveRateLimitExhausted';
  }
}

/** @param {unknown} body */
function isDriveRateLimit(status, body) {
  if (status !== 403 || !body || typeof body !== 'object') return false;
  const err = /** @type {{ error?: { errors?: { reason?: string }[] } }} */ (body).error;
  const errors = err?.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some((e) => e.reason === 'rateLimitExceeded' || e.reason === 'userRateLimitExceeded');
}

async function readJsonBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * @param {string} accessToken
 * @param {string} path - e.g. "/files?pageSize=10" (leading slash optional)
 * @param {RequestInit} [init]
 * @param {number} [attempt] internal retry count
 * @returns {Promise<Response>}
 */
export async function driveFetchRaw(accessToken, path, init = {}, attempt = 0) {
  const url = path.startsWith('http') ? path : `${DRIVE_V3}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  const res = await fetch(url, {...init, headers});

  if (res.status === 401) {
    const e = new Error('Drive unauthorized');
    e.code = 'DriveUnauthorized';
    throw e;
  }

  if (res.status === 403) {
    const body = await readJsonBody(res);
    const maxAttempts = 8;
    if (isDriveRateLimit(403, body) && attempt < maxAttempts) {
      const base = 1000 * 2 ** attempt;
      const jitter = Math.random() * 500;
      const delay = Math.min(60_000, base + jitter);
      await new Promise((r) => setTimeout(r, delay));
      return driveFetchRaw(accessToken, path, init, attempt + 1);
    }
    if (isDriveRateLimit(403, body)) {
      throw new DriveRateLimitExhausted();
    }
    const e = new Error(/** @type {{ error?: { message?: string } }} */ (body).error?.message || 'Drive forbidden');
    e.code = 'DriveForbidden';
    e.details = body;
    throw e;
  }

  if (!res.ok) {
    const body = await readJsonBody(res.clone());
    const e = new Error(/** @type {{ error?: { message?: string } }} */ (body).error?.message || `Drive HTTP ${res.status}`);
    e.code = 'DriveHttpError';
    e.status = res.status;
    e.details = body;
    throw e;
  }

  return res;
}

/**
 * @param {string} accessToken
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<unknown|null>} JSON body or null for 204 / empty
 */
export async function driveFetchJson(accessToken, path, init = {}) {
  const res = await driveFetchRaw(accessToken, path, init);
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  return res.json();
}

/**
 * List files in Drive (files.list).
 * @param {string} accessToken
 * @param {string} q - Drive query string
 */
export async function driveListFiles(accessToken, q) {
  const enc = encodeURIComponent(q);
  return driveFetchJson(accessToken, `/files?q=${enc}&fields=files(id,name,mimeType),nextPageToken&pageSize=100`);
}

/**
 * Create a folder under parent (or root if parent omitted).
 * @param {string} accessToken
 * @param {string} name
 * @param {string} [parentId] - omit for appData or root per API; use 'root' for root
 */
export async function driveCreateFolder(accessToken, name, parentId = 'root') {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [],
  };
  return driveFetchJson(accessToken, '/files?fields=id,name', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(metadata),
  });
}
