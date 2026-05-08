/**
 * Pure helpers for the Settings → Sync drive backup status block.
 * No React, no side effects. Read-only of arguments passed in.
 */

/**
 * @param {{
 *   manifest: import('./driveManifest.js').DriveManifest,
 *   circuit: { paused: boolean, resumeAt: number, message: string | null },
 *   autoBackupOn: boolean,
 *   isConnected: boolean,
 *   isConfigured: boolean,
 * }} args
 */
export function deriveDriveStatus({manifest, circuit, autoBackupOn, isConnected, isConfigured}) {
  if (!isConfigured) return {kind: 'not-configured'};
  if (!isConnected) return {kind: 'disconnected'};
  if (circuit.paused) return {kind: 'paused', resumeAt: circuit.resumeAt};
  const failures = manifest.consecutiveFailures ?? 0;
  if (failures >= 3) return {kind: 'broken', error: manifest.lastFailureMessage, lastSuccess: manifest.lastPushedAt};
  if (failures >= 1) return {kind: 'retrying', error: manifest.lastFailureMessage, lastSuccess: manifest.lastPushedAt};
  if (manifest.lastPushedAt) return {kind: 'idle', lastSuccess: manifest.lastPushedAt, autoBackupOn};
  return {kind: 'never', autoBackupOn};
}

/** Relative time in language form: "just now", "3 min ago", "2 hr ago", "5 days ago". */
export function formatRelative(iso) {
  if (!iso) return 'never';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 'recently';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.round(hr / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

/** "Resumes in N min" / "Resumes in N hr" — used for circuit pause. */
export function formatResumeIn(resumeAt) {
  const diff = resumeAt - Date.now();
  if (diff <= 0) return 'shortly';
  const min = Math.round(diff / 60000);
  if (min < 1) return 'in less than a minute';
  if (min < 60) return `in ${min} min`;
  const hr = Math.round(min / 60);
  return `in ${hr} hr`;
}
