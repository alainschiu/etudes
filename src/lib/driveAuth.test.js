import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

// Stub window before importing the module — driveAuth reads window.google
// in isDriveAuthReady, and module load triggers no script side-effects.
vi.stubGlobal('window', {
  google: undefined,
  document: undefined,
});

describe('driveAuth surface', () => {
  let driveAuth;
  beforeEach(async () => {
    vi.resetModules();
    // Reset window before each test — clean module state
    globalThis.window = {google: undefined};
    globalThis.document = {
      head: {appendChild: vi.fn()},
      createElement: () => ({onload: null, onerror: null, set src(_) {}, set async(_) {}}),
    };
    // Stub Vite env via globalThis (vitest doesn't transform import.meta.env in non-Vite mode,
    // so we just verify the public surface shape rather than env-driven behavior).
    driveAuth = await import('./driveAuth.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the new prepare/ready/request surface', () => {
    expect(typeof driveAuth.prepareDriveAuth).toBe('function');
    expect(typeof driveAuth.isDriveAuthReady).toBe('function');
    expect(typeof driveAuth.requestDriveTokenInteractive).toBe('function');
  });

  it('preserves the legacy async surface', () => {
    expect(typeof driveAuth.getDriveAccessToken).toBe('function');
    expect(typeof driveAuth.clearDriveSession).toBe('function');
    expect(typeof driveAuth.hasDriveToken).toBe('function');
    expect(typeof driveAuth.isDriveConfigured).toBe('function');
  });

  it('isDriveAuthReady returns false when GIS is not loaded', () => {
    expect(driveAuth.isDriveAuthReady()).toBe(false);
  });

  it('requestDriveTokenInteractive throws synchronously when not ready', () => {
    expect(() => driveAuth.requestDriveTokenInteractive()).toThrow(/not ready/);
  });

  it('exposes the F3/A4 continuity surface', () => {
    expect(typeof driveAuth.subscribeDriveToken).toBe('function');
    expect(typeof driveAuth.silentRenewWithTimeout).toBe('function');
  });

  it('subscribeDriveToken returns an unsubscribe function and notifies on clear', () => {
    const seen = [];
    const unsub = driveAuth.subscribeDriveToken((ready) => seen.push(ready));
    expect(typeof unsub).toBe('function');
    driveAuth.clearDriveSession(); // no token → notifies false
    expect(seen).toContain(false);
    unsub();
    seen.length = 0;
    driveAuth.clearDriveSession();
    expect(seen).toEqual([]); // no longer notified after unsubscribe
  });

  it('silentRenewWithTimeout rejects on timeout without a live GIS path', async () => {
    await expect(driveAuth.silentRenewWithTimeout(20)).rejects.toThrow();
  });
});
