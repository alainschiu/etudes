import {useRef, useEffect, useState, useCallback} from 'react';
import {getDriveAccessToken, clearDriveSession, hasDriveToken, isDriveConfigured, subscribeDriveToken} from '../lib/driveAuth.js';
import {pushToDrive, pullJournalFromDrive, restoreBlobsFromDrive, formatDriveError, restoreManifestFromDriveIfNeeded, probeDriveConnection} from '../lib/driveSync.js';
import {applyJournalPayload} from '../lib/journalPayload.js';
import {describeJournalInventory} from '../lib/journalInventory.js';
import {writeDriveManifest} from '../lib/driveManifest.js';
import {clearDriveQueueCircuitPause} from '../lib/driveQueueCircuit.js';

const BLOB_DEBOUNCE_MS = 30000;
const JSON_INTERVAL_MS = 10 * 60 * 1000;

export default function useDriveSync({
  settings,
  setSettings,
  coldSlice,
  lsGet,
  applyDeps,
  setRestoreBusy,
  setConfirmModal,
  onDriveConflict,
}) {
  const [driveBlobRestoreProgress, setDriveBlobRestoreProgress] = useState(null);
  const [driveBlobFailedCount, setDriveBlobFailedCount] = useState(0);
  const blobTimerRef = useRef(null);
  const intervalRef = useRef(null);

  // F3 (C6): token presence is reactive state. It flips on connect, silent
  // renewal, expiry, and disconnect via the driveAuth pub/sub — replacing the
  // non-reactive hasDriveToken() reads that left the auto-backup interval and
  // the blob-write gate stuck on a dead token.
  const [driveReady, setDriveReady] = useState(() => hasDriveToken());
  useEffect(() => {
    // Seed comes from the useState initializer; every later transition (connect,
    // silent renewal, expiry, disconnect) arrives through the subscription.
    const unsub = subscribeDriveToken((ready) => setDriveReady(ready));
    return unsub;
  }, []);

  const runPush = useCallback(
    async (mode) => {
      if (!isDriveConfigured()) return;
      try {
        await pushToDrive({
          mode,
          getAccessToken: () => getDriveAccessToken({interactive: false}),
          slice: coldSlice(),
          lsGet,
        });
      } catch {
        // Failure is recorded on the drive manifest (consecutiveFailures /
        // lastFailureMessage); the Sync tab status block reads it.
      }
    },
    [coldSlice, lsGet],
  );

  const notifyBlobWrite = useCallback(() => {
    if (!settings.driveAutoBackup) return;
    if (!driveReady) return;
    if (blobTimerRef.current) clearTimeout(blobTimerRef.current);
    blobTimerRef.current = setTimeout(() => {
      blobTimerRef.current = null;
      runPush('full');
    }, BLOB_DEBOUNCE_MS);
  }, [settings.driveAutoBackup, driveReady, runPush]);

  useEffect(() => {
    if (!settings.driveAutoBackup || !driveReady) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      runPush('json');
    }, JSON_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings.driveAutoBackup, driveReady, runPush]);

  const connectDrive = useCallback(async () => {
    await getDriveAccessToken({interactive: true});
    clearDriveQueueCircuitPause();
    // A2: the connected marker is device-local (manifest fields), never
    // settings.driveConnected — settings rides the synced payload and would
    // lie on every other device. driveAccountEmail makes a wrong-account
    // reconnect visible in the Sync tab.
    let email = '';
    try {
      const r = await probeDriveConnection();
      if (r.ok) email = r.user?.emailAddress || '';
    } catch { /* email is best-effort; the marker still records the connection */ }
    writeDriveManifest({driveConnectedAt: new Date().toISOString(), driveAccountEmail: email});
    setSettings((s) => ({...s, driveConnected: true}));
  }, [setSettings]);

  const disconnectDrive = useCallback(() => {
    clearDriveSession();
    clearDriveQueueCircuitPause();
    writeDriveManifest({driveConnectedAt: '', driveAccountEmail: ''});
    setSettings((s) => ({...s, driveConnected: false, driveAutoBackup: false}));
  }, [setSettings]);

  const backupNow = useCallback(() => runPush('full'), [runPush]);

  // Apply an already-pulled journal + its Drive blobs. Runs only after the
  // user confirms the inventory (destructive step).
  const applyDrivePull = useCallback(async (pull) => {
    setDriveBlobFailedCount(0);
    setRestoreBusy(true);
    try {
      await applyJournalPayload(pull.remoteState, {blobMode: 'none'}, applyDeps);
      const {failed} = await restoreBlobsFromDrive(
        pull.remoteState,
        () => getDriveAccessToken({interactive: false}),
        (p) => setDriveBlobRestoreProgress(p),
      );
      if (failed.length > 0) setDriveBlobFailedCount(failed.length);
      const meta = pull.meta;
      if (meta?.remoteModified) {
        writeDriveManifest({journalRemoteModifiedTime: meta.remoteModified, lastPulledAt: new Date().toISOString()});
      }
      const pdfKeys = await applyDeps.idbAllKeys('pdfs');
      const newUrl = {};
      for (const k of pdfKeys) {
        const b = await applyDeps.idbGet('pdfs', k);
        if (b) newUrl[String(k)] = URL.createObjectURL(b);
      }
      applyDeps.setPdfUrlMap(newUrl);
      setConfirmModal({
        message: 'Restored from Google Drive.',
        confirmLabel: 'OK',
        ackOnly: true,
        onConfirm: () => setConfirmModal(null),
      });
    } catch (e) {
      setConfirmModal({
        message: `Could not restore from Drive. ${formatDriveError(e)}`,
        confirmLabel: 'OK',
        ackOnly: true,
        onConfirm: () => setConfirmModal(null),
      });
    } finally {
      setRestoreBusy(false);
      setDriveBlobRestoreProgress(null);
    }
  }, [applyDeps, setRestoreBusy, setConfirmModal]);

  // F5: pull the (now tiny, metadata-only) journal FIRST, then show the same
  // inventory + backup date as the file restore in a destructive confirm
  // before applying anything.
  const restoreFromDrive = useCallback(async () => {
    setRestoreBusy(true);
    let pull;
    try {
      await restoreManifestFromDriveIfNeeded(() => getDriveAccessToken({interactive: false}), null);
      pull = await pullJournalFromDrive(() => getDriveAccessToken({interactive: false}));
    } catch (e) {
      setConfirmModal({
        message: `Could not restore from Drive. ${formatDriveError(e)}`,
        confirmLabel: 'OK',
        ackOnly: true,
        onConfirm: () => setConfirmModal(null),
      });
      setRestoreBusy(false);
      return;
    }
    setRestoreBusy(false);
    if (pull.action === 'noop') {
      setConfirmModal({
        message: 'No journal on Google Drive yet.',
        confirmLabel: 'OK',
        ackOnly: true,
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }
    if (pull.action === 'prompt') {
      onDriveConflict?.({
        ...pull,
        getToken: () => getDriveAccessToken({interactive: false}),
        applyDeps,
        setRestoreBusy,
        setConfirmModal,
      });
      return;
    }
    const inv = describeJournalInventory(pull.remoteState);
    const message = [
      'Replace all current data with the Drive backup?',
      '',
      ...inv.lines,
      '',
      'Audio and PDFs already on this device are kept.',
      '',
      'This will overwrite everything and cannot be undone.',
    ].join('\n');
    setConfirmModal({
      message,
      confirmLabel: 'Replace everything',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModal(null);
        applyDrivePull(pull);
      },
      onCancel: () => setConfirmModal(null),
    });
  }, [applyDeps, applyDrivePull, setRestoreBusy, setConfirmModal, onDriveConflict]);

  const maybePullOnOpen = useCallback(async () => {
    if (!isDriveConfigured() || !driveReady) return;
    try {
      const pull = await pullJournalFromDrive(() => getDriveAccessToken({interactive: false}));
      if (pull.action === 'prompt')
        onDriveConflict?.({
          ...pull,
          getToken: () => getDriveAccessToken({interactive: false}),
          applyDeps,
          setRestoreBusy,
          setConfirmModal,
        });
    } catch {
      // Background pull on tab open — failures are quiet. The next push
      // attempt surfaces via the manifest-driven status block.
    }
  }, [driveReady, onDriveConflict, applyDeps, setRestoreBusy, setConfirmModal]);

  return {
    connectDrive,
    disconnectDrive,
    backupNow,
    restoreFromDrive,
    maybePullOnOpen,
    notifyBlobWrite,
    driveBlobRestoreProgress,
    setDriveBlobRestoreProgress,
    driveBlobFailedCount,
    driveReady,
    isDriveConfigured,
    isDriveConnected: driveReady,
  };
}
