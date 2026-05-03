/**
 * Drive sync orchestration (incremental).
 * Phase 3 will add push/pull queues — use driveQueueCircuit.js for rate-limit pauses.
 */

import {getDriveAccessToken} from './driveAuth.js';
import {driveFetchJson} from './driveApi.js';

export {
  notifyDriveQueueOperationResult,
  getDriveQueueCircuitState,
  clearDriveQueueCircuitPause,
  assertDriveQueueNotPaused,
} from './driveQueueCircuit.js';

/**
 * Verify Drive API access (uses current or silently renewed token).
 * @returns {Promise<{ ok: true, user?: { displayName?: string, emailAddress?: string } } | { ok: false, error: string }>}
 */
export async function probeDriveConnection() {
  try {
    const token = await getDriveAccessToken({ interactive: false });
    const about = await driveFetchJson(token, '/about?fields=user');
    return { ok: true, user: about?.user || undefined };
  } catch (e) {
    try {
      const token = await getDriveAccessToken({ interactive: true });
      const about = await driveFetchJson(token, '/about?fields=user');
      return { ok: true, user: about?.user || undefined };
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      return { ok: false, error: msg };
    }
  }
}

/**
 * Silent renewal spike: **no** interactive fallback. Use after interactive sign-in;
 * with `VITE_DRIVE_TOKEN_TTL_SEC=30` in dev, wait 31s then call this to verify GIS
 * `requestAccessToken({ prompt: '' })` renews without UI.
 * @returns {Promise<{ ok: true, email?: string } | { ok: false, error: string }>}
 */
export async function spikeSilentDriveRenewal() {
  try {
    const token = await getDriveAccessToken({ interactive: false });
    const about = await driveFetchJson(token, '/about?fields=user');
    const email = about?.user?.emailAddress;
    return { ok: true, email: email || undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
