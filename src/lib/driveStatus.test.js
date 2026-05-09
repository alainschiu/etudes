import {describe, it, expect} from 'vitest';
import {deriveDriveStatus, formatRelative, formatResumeIn} from './driveStatus.js';

const noCircuit = {paused: false, resumeAt: 0, message: null};
const paused = {paused: true, resumeAt: Date.now() + 5 * 60_000, message: 'rate-limited'};

describe('deriveDriveStatus', () => {
  it('returns not-configured when isConfigured is false', () => {
    const r = deriveDriveStatus({manifest: {}, circuit: noCircuit, autoBackupOn: false, isConnected: false, isConfigured: false});
    expect(r.kind).toBe('not-configured');
  });

  it('returns disconnected when configured but not connected', () => {
    const r = deriveDriveStatus({manifest: {}, circuit: noCircuit, autoBackupOn: false, isConnected: false, isConfigured: true});
    expect(r.kind).toBe('disconnected');
  });

  it('returns paused when circuit is paused, before checking failures', () => {
    const m = {consecutiveFailures: 5};
    const r = deriveDriveStatus({manifest: m, circuit: paused, autoBackupOn: true, isConnected: true, isConfigured: true});
    expect(r.kind).toBe('paused');
    expect(r.resumeAt).toBe(paused.resumeAt);
  });

  it('returns broken at >= 3 consecutive failures', () => {
    const m = {consecutiveFailures: 3, lastFailureMessage: 'token revoked', lastPushedAt: '2026-05-08T10:00:00Z'};
    const r = deriveDriveStatus({manifest: m, circuit: noCircuit, autoBackupOn: true, isConnected: true, isConfigured: true});
    expect(r.kind).toBe('broken');
    expect(r.error).toBe('token revoked');
    expect(r.lastSuccess).toBe('2026-05-08T10:00:00Z');
  });

  it('returns retrying at 1–2 failures', () => {
    const m = {consecutiveFailures: 1, lastFailureMessage: 'network', lastPushedAt: '2026-05-08T10:00:00Z'};
    const r = deriveDriveStatus({manifest: m, circuit: noCircuit, autoBackupOn: true, isConnected: true, isConfigured: true});
    expect(r.kind).toBe('retrying');
  });

  it('returns idle when last push exists and no failures', () => {
    const m = {lastPushedAt: '2026-05-08T10:00:00Z'};
    const r = deriveDriveStatus({manifest: m, circuit: noCircuit, autoBackupOn: false, isConnected: true, isConfigured: true});
    expect(r.kind).toBe('idle');
    expect(r.autoBackupOn).toBe(false);
  });

  it('returns never when connected but no push has succeeded', () => {
    const r = deriveDriveStatus({manifest: {}, circuit: noCircuit, autoBackupOn: true, isConnected: true, isConfigured: true});
    expect(r.kind).toBe('never');
    expect(r.autoBackupOn).toBe(true);
  });
});

describe('formatRelative', () => {
  it('returns "never" for null/undefined', () => {
    expect(formatRelative(null)).toBe('never');
    expect(formatRelative(undefined)).toBe('never');
  });

  it('returns "recently" for unparseable input', () => {
    expect(formatRelative('not a date')).toBe('recently');
  });

  it('returns "just now" within a minute', () => {
    const iso = new Date(Date.now() - 5_000).toISOString();
    expect(formatRelative(iso)).toBe('just now');
  });

  it('formats minutes', () => {
    const iso = new Date(Date.now() - 7 * 60_000).toISOString();
    expect(formatRelative(iso)).toBe('7 min ago');
  });

  it('formats hours', () => {
    const iso = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatRelative(iso)).toBe('3 hr ago');
  });

  it('formats days with pluralization', () => {
    const iso1 = new Date(Date.now() - 1 * 24 * 60 * 60_000).toISOString();
    const iso2 = new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString();
    expect(formatRelative(iso1)).toBe('1 day ago');
    expect(formatRelative(iso2)).toBe('4 days ago');
  });
});

describe('formatResumeIn', () => {
  it('returns "shortly" for past timestamps', () => {
    expect(formatResumeIn(Date.now() - 1000)).toBe('shortly');
  });

  it('formats minutes ahead', () => {
    expect(formatResumeIn(Date.now() + 5 * 60_000)).toBe('in 5 min');
  });

  it('formats hours ahead', () => {
    expect(formatResumeIn(Date.now() + 90 * 60_000)).toBe('in 2 hr');
  });
});
