import {useRef, useEffect, useState, useCallback} from 'react';
import {getDriveAccessToken, clearDriveSession, hasDriveToken, isDriveConfigured} from '../lib/driveAuth.js';
import {pushToDrive, pullJournalFromDrive, restoreBlobsFromDrive, formatDriveError, restoreManifestFromDriveIfNeeded} from '../lib/driveSync.js';
import {applyJournalPayload} from '../lib/journalPayload.js';
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
  const [driveBackgroundError, setDriveBackgroundError] = useState(null);
  const [driveBlobRestoreProgress, setDriveBlobRestoreProgress] = useState(null);
  const blobTimerRef = useRef(null);
  const intervalRef = useRef(null);

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
        setDriveBackgroundError(null);
      } catch (err) {
        setDriveBackgroundError(formatDriveError(err));
      }
    },
    [coldSlice, lsGet],
  );

  const notifyBlobWrite = useCallback(() => {
    if (!settings.driveAutoBackup) return;
    if (!hasDriveToken()) return;
    if (blobTimerRef.current) clearTimeout(blobTimerRef.current);
    blobTimerRef.current = setTimeout(() => {
      blobTimerRef.current = null;
      runPush('full');
    }, BLOB_DEBOUNCE_MS);
  }, [settings.driveAutoBackup, runPush]);

  useEffect(() => {
    if (!settings.driveAutoBackup || !hasDriveToken()) {
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
  }, [settings.driveAutoBackup, runPush]);

  const connectDrive = useCallback(async () => {
    setDriveBackgroundError(null);
    try {
      await getDriveAccessToken({interactive: true});
      clearDriveQueueCircuitPause();
      setSettings((s) => ({...s, driveConnected: true}));
    } catch (e) {
      setDriveBackgroundError(formatDriveError(e));
    }
  }, [setSettings]);

  const disconnectDrive = useCallback(() => {
    clearDriveSession();
    clearDriveQueueCircuitPause();
    setSettings((s) => ({...s, driveConnected: false, driveAutoBackup: false}));
  }, [setSettings]);

  const backupNow = useCallback(() => runPush('full'), [runPush]);

  const restoreFromDrive = useCallback(async () => {
    setDriveBackgroundError(null);
    setRestoreBusy(true);
    try {
      await restoreManifestFromDriveIfNeeded(() => getDriveAccessToken({interactive: false}), null);
      const pull = await pullJournalFromDrive(() => getDriveAccessToken({interactive: false}));
      if (pull.action === 'noop') {
        setConfirmModal({
          message: 'No journal on Google Drive yet.',
          confirmLabel: 'OK',
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
      await applyJournalPayload(pull.remoteState, {blobMode: 'none'}, applyDeps);
      await restoreBlobsFromDrive(pull.remoteState, () => getDriveAccessToken({interactive: false}), (p) =>
        setDriveBlobRestoreProgress(p),
      );
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
        onConfirm: () => setConfirmModal(null),
      });
    } catch (e) {
      setDriveBackgroundError(formatDriveError(e));
    } finally {
      setRestoreBusy(false);
      setDriveBlobRestoreProgress(null);
    }
  }, [applyDeps, setRestoreBusy, setConfirmModal, onDriveConflict]);

  const maybePullOnOpen = useCallback(async () => {
    if (!isDriveConfigured() || !hasDriveToken()) return;
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
    } catch (e) {
      setDriveBackgroundError(formatDriveError(e));
    }
  }, [onDriveConflict, applyDeps, setRestoreBusy, setConfirmModal]);

  return {
    connectDrive,
    disconnectDrive,
    backupNow,
    restoreFromDrive,
    maybePullOnOpen,
    notifyBlobWrite,
    driveBackgroundError,
    setDriveBackgroundError,
    driveBlobRestoreProgress,
    setDriveBlobRestoreProgress,
    isDriveConfigured,
    isDriveConnected: hasDriveToken,
  };
}
