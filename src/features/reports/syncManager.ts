import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { getAllReports } from './reportRepository';
import { syncReport } from './reportSyncService';

let unsubscribe: (() => void) | null = null;
let syncInProgress = false;
let syncRequested = false;

function hasInternet(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

function triggerSync(): void {
  void syncPendingReports().catch(error => {
    console.warn('Background synchronization error:', error);
  });
}

export async function syncPendingReports(): Promise<void> {
  if (syncInProgress) {
    syncRequested = true;
    return;
  }

  syncInProgress = true;

  try {
    do {
      syncRequested = false;

      const network = await NetInfo.fetch();

      if (!hasInternet(network)) {
        return;
      }

      const reports = await getAllReports();

      for (const report of reports) {
        if (report.status === 'uploaded') continue;
        if (report.status === 'needs_attention') continue;

        if (
          report.status === 'retry_wait' &&
          report.nextRetryAt !== null &&
          report.nextRetryAt > Date.now()
        ) {
          continue;
        }

        try {
          await syncReport(report.id);
        } catch (error) {
          console.warn(`Unable to sync report ${report.id}:`, error);
        }
      }
    } while (syncRequested);
  } finally {
    syncInProgress = false;

    // Handle a request that arrived as the previous sync was finishing.
    if (syncRequested) {
      triggerSync();
    }
  }
}

export function requestSync(): void {
  syncRequested = true;
  triggerSync();
}

export function startSyncManager(): void {
  if (unsubscribe) return;

  unsubscribe = NetInfo.addEventListener(state => {
    if (hasInternet(state)) {
      triggerSync();
    }
  });

  triggerSync();
}

export function stopSyncManager(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
