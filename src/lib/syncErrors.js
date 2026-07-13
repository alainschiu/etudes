// C1 (v0.99.0-2 spec): every auth/sync failure is translated to NS voice before
// it reaches a surface — no raw error.message from Supabase or fetch, ever.
// Pure function; the matching is defensive (message-class based) because
// supabase-js does not expose stable error codes across versions.

export function mapSyncError(e) {
  const msg = String(e?.message || e || '').toLowerCase();
  const name = e?.name || '';
  const status = typeof e?.status === 'number' ? e.status : null;

  // Network-class failures: fetch's TypeError('Failed to fetch'), Safari's
  // 'Load failed', abort/timeout from the reachability probe, offline.
  if (
    name === 'AbortError' || name === 'TimeoutError' ||
    (name === 'TypeError' && (msg.includes('fetch') || msg.includes('load failed') || msg.includes('network'))) ||
    msg.includes('failed to fetch') || msg.includes('load failed') ||
    msg.includes('networkerror') || msg.includes('network request failed') ||
    msg.includes('timed out') || msg.includes('timeout')
  ) {
    return 'Could not reach the sync service. Your data is safe on this device.';
  }
  if (msg.includes('invalid login credentials')) return 'Email or password did not match.';
  if (msg.includes('email not confirmed')) return 'Confirm your email first — the link is in your inbox.';
  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Wait a moment, then try again.';
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'That email already has an account. Sign in instead.';
  }
  if (msg.includes('password should be') || msg.includes('password is too short')) {
    return 'Password needs at least six characters.';
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid email') || msg.includes('is invalid')) {
    return 'That does not look like an email address.';
  }
  return 'Sign-in failed. Try again.';
}

/**
 * F2 (v0.99.0): reachability probe before the OAuth redirect. ANY HTTP
 * response — even an error status — proves the backend is reachable; only a
 * network failure or timeout returns false. navigator.onLine short-circuits
 * without a request (A11).
 * @returns {Promise<boolean>}
 */
export async function probeAuthReachable(baseUrl, timeoutMs = 4000) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  if (!baseUrl) return false;
  try {
    await fetch(`${baseUrl}/auth/v1/health`, {signal: AbortSignal.timeout(timeoutMs), cache: 'no-store'});
    return true;
  } catch {
    return false;
  }
}
