/**
 * Drive sync orchestration (incremental). Phase 1: connectivity probe only.
 */

import {getDriveAccessToken} from './driveAuth.js';
import {driveFetchJson} from './driveApi.js';

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
