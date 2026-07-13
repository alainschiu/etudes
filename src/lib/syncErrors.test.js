import {describe, it, expect} from 'vitest';
import {mapSyncError} from './syncErrors.js';

const NETWORK_LINE = 'Could not reach the sync service. Your data is safe on this device.';

describe('mapSyncError — C1: no raw error ever reaches a surface', () => {
  it('maps fetch network failure (the live Supabase-paused case)', () => {
    expect(mapSyncError(new TypeError('Failed to fetch'))).toBe(NETWORK_LINE);
  });
  it('maps Safari network failure wording', () => {
    expect(mapSyncError(new TypeError('Load failed'))).toBe(NETWORK_LINE);
  });
  it('maps abort/timeout from the reachability probe', () => {
    const e = new Error('The operation timed out.');
    e.name = 'TimeoutError';
    expect(mapSyncError(e)).toBe(NETWORK_LINE);
    const a = new Error('Aborted');
    a.name = 'AbortError';
    expect(mapSyncError(a)).toBe(NETWORK_LINE);
  });
  it('maps wrong password (the live raw-leak case)', () => {
    expect(mapSyncError({message: 'Invalid login credentials'})).toBe('Email or password did not match.');
  });
  it('maps unconfirmed email', () => {
    expect(mapSyncError({message: 'Email not confirmed'})).toBe('Confirm your email first — the link is in your inbox.');
  });
  it('maps rate limiting by status and by message', () => {
    expect(mapSyncError({message: 'Request rate limit reached', status: 429})).toBe('Too many attempts. Wait a moment, then try again.');
    expect(mapSyncError({message: 'Too many requests'})).toBe('Too many attempts. Wait a moment, then try again.');
  });
  it('maps sign-up collisions and weak passwords', () => {
    expect(mapSyncError({message: 'User already registered'})).toBe('That email already has an account. Sign in instead.');
    expect(mapSyncError({message: 'Password should be at least 6 characters'})).toBe('Password needs at least six characters.');
  });
  it('maps malformed email', () => {
    expect(mapSyncError({message: 'Unable to validate email address: invalid format'})).toBe('That does not look like an email address.');
  });
  it('falls back to the generic quiet line — never the raw message', () => {
    const out = mapSyncError({message: 'ECONNREFUSED 127.0.0.1:5432 pg bouncer exploded'});
    expect(out).toBe('Sign-in failed. Try again.');
    expect(out).not.toMatch(/ECONNREFUSED/);
  });
  it('tolerates null/undefined/strings', () => {
    expect(mapSyncError(null)).toBe('Sign-in failed. Try again.');
    expect(mapSyncError(undefined)).toBe('Sign-in failed. Try again.');
    expect(mapSyncError('Failed to fetch')).toBe(NETWORK_LINE);
  });
});
