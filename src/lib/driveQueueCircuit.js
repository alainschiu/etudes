/**
 * Queue-level circuit breaker for Drive bulk operations (Phase 3 sync queue).
 * Per-request backoff stays in driveApi.js; this layer pauses the queue after
 * repeated rate-limit exhaustion so the UI does not silently grind for hours.
 */

import {DriveRateLimitExhausted} from './driveApi.js';
import {lsGet, lsSet} from './storage.js';

const K_CONSECUTIVE = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

let consecutiveRateLimitExhaustions = 0;
/** epoch ms — queue must not start new operations until this time */
let pausedUntil = 0;
/** user-facing reason while paused */
let pauseMessage = '';

/**
 * Call after each Drive queue operation completes (success or failure).
 * @param {unknown} error - pass null/undefined on success
 */
export function notifyDriveQueueOperationResult(error) {
  if (error instanceof DriveRateLimitExhausted) {
    consecutiveRateLimitExhaustions += 1;
    if (consecutiveRateLimitExhaustions >= K_CONSECUTIVE) {
      consecutiveRateLimitExhaustions = 0;
      pausedUntil = Date.now() + COOLDOWN_MS;
      pauseMessage =
        'Drive is rate-limiting. Pausing sync for 5 minutes. You can retry from Settings when the pause ends.';
      lsSet('etudes-driveCircuit', {pausedUntil, pauseMessage});
    }
    return;
  }
  consecutiveRateLimitExhaustions = 0;
}

/**
 * @returns {{ paused: boolean, resumeAt: number, message: string | null }}
 */
export function getDriveQueueCircuitState() {
  const now = Date.now();
  if (pausedUntil === 0) {
    const persisted = lsGet('etudes-driveCircuit', null);
    if (persisted?.pausedUntil) {
      pausedUntil = persisted.pausedUntil;
      pauseMessage = persisted.pauseMessage || '';
    }
  }
  const paused = now < pausedUntil;
  if (!paused) {
    pauseMessage = '';
    pausedUntil = 0;
  }
  return {
    paused,
    resumeAt: paused ? pausedUntil : 0,
    message: paused ? pauseMessage : null,
  };
}

/** Clear pause (e.g. Settings "Retry sync" after cooldown or user override). */
export function clearDriveQueueCircuitPause() {
  pausedUntil = 0;
  pauseMessage = '';
  consecutiveRateLimitExhaustions = 0;
  lsSet('etudes-driveCircuit', {pausedUntil: 0, pauseMessage: ''});
}

/**
 * Throws if the queue is in cooldown — Phase 3 runner should await or skip work until unpaused.
 */
export function assertDriveQueueNotPaused() {
  const {paused, message} = getDriveQueueCircuitState();
  if (paused) {
    const e = new Error(message || 'Drive queue paused');
    e.code = 'DriveQueuePaused';
    throw e;
  }
}
