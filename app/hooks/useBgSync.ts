import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useVisitStore } from '../store/visitStore';
import { useAuthStore } from '../store/authStore';
import { useSyncStatusStore } from '../store/syncStatusStore';

export function useBgSync() {
  const { syncAll, syncFromServer, visits } = useVisitStore();
  const { isAuthenticated } = useAuthStore();
  const { setStatus, setLastSyncTime, setPending } = useSyncStatusStore();
  const appStateRef = useRef<AppStateStatus>('active');
  const isOnlineRef = useRef<boolean>(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSync = async () => {
    try {
      if (!isOnlineRef.current) {
        console.warn('[BgSync] ⚠️ No internet connection - skipping sync');
        setStatus('offline');
        return;
      }

      // Check if there are pending visits to sync
      const pendingCount = visits.filter(
        v => v.syncStatus === 'draft' || v.syncStatus === 'failed'
      ).length;

      if (pendingCount === 0) {
        console.log('[BgSync] ✓ No pending syncs needed');
        setStatus('idle');
        return;
      }

      console.log(`[BgSync] 🔄 Auto-syncing ${pendingCount} pending visits...`);
      setStatus('syncing');
      setPending(true);
      
      // First sync from server to get latest data
      await syncFromServer();
      
      // Then sync local changes
      await syncAll();
      
      console.log('[BgSync] ✅ Background sync completed');
      setStatus('success');
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('[BgSync] ❌ Background sync failed:', error);
      setStatus('error');
    } finally {
      setPending(false);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const prevAppState = appStateRef.current;
    appStateRef.current = nextAppState;

    if (prevAppState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[AppState] 📱 App coming to foreground - checking for pending syncs...');
      
      // Small delay to ensure app is fully loaded
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        handleSync();
      }, 500);
    } else if (nextAppState.match(/inactive|background/)) {
      console.log('[AppState] 📱 App going to background');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[useBgSync] Not authenticated, skipping initialization');
      return;
    }

    console.log('[useBgSync] Initializing background sync...');

    // Monitor network connectivity
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOnline = isOnlineRef.current;
      isOnlineRef.current = state.isConnected ?? false;

      console.log('[NetInfo] Connectivity changed:', {
        connected: isOnlineRef.current,
        type: state.type,
      });

      // Update sync status based on connectivity
      if (!isOnlineRef.current) {
        setStatus('offline');
      }

      // When coming back online, trigger sync queue
      if (!wasOnline && isOnlineRef.current) {
        console.log('[NetInfo] 🟢 Back online! Triggering sync...');
        setStatus('syncing');
        
        // Clear any pending timeout
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        // Small delay to ensure network is stable
        syncTimeoutRef.current = setTimeout(() => {
          handleSync();
        }, 1000);
      }
    });

    // Monitor app state (foreground/background)
    const unsubscribeAppState = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      console.log('[useBgSync] Cleaning up...');
      unsubscribeNetInfo();
      unsubscribeAppState.remove();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);

  // Watch for pending visits and auto-sync when new drafts are created
  useEffect(() => {
    if (!isAuthenticated) return;

    const pendingCount = visits.filter(
      v => v.syncStatus === 'draft' || v.syncStatus === 'failed'
    ).length;

    if (pendingCount > 0 && isOnlineRef.current) {
      console.log(`[BgSync] 📝 Detected ${pendingCount} pending visits, triggering auto-sync...`);
      
      // Clear any pending timeout to avoid multiple syncs
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Small delay to batch multiple changes
      syncTimeoutRef.current = setTimeout(() => {
        handleSync();
      }, 500);
    }
  }, [visits, isAuthenticated]);

  return { syncAll, syncFromServer };
}
