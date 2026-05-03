/**
 * Map raw GIS / OAuth error strings to short user-facing copy (Settings driveLine).
 * @param {string} raw
 * @returns {string}
 */
export function formatDriveOAuthError(raw) {
  const s = String(raw ?? '').trim();
  const lower = s.toLowerCase();
  if (lower.includes('invalid_client') || lower.includes('unauthorized_client')) {
    return 'Google OAuth client misconfiguration — check VITE_GOOGLE_CLIENT_ID in the deploy environment.';
  }
  if (lower.includes('access_denied') || lower.includes('popup_closed_by_user')) {
    return 'Sign-in was cancelled. Try Connect again when ready.';
  }
  if (lower.includes('origin_mismatch') || lower.includes('redirect_uri')) {
    return 'This site’s URL is not allowed for this OAuth client — add it in Google Cloud Console.';
  }
  return s || 'Google sign-in failed';
}
