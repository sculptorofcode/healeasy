import { create } from 'zustand';

export type SyncIndicatorStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

interface SyncStatusStore {
  status: SyncIndicatorStatus;
  lastSyncTime: string | null;
  isPending: boolean;
  setStatus: (status: SyncIndicatorStatus) => void;
  setLastSyncTime: (time: string | null) => void;
  setPending: (pending: boolean) => void;
}

export const useSyncStatusStore = create<SyncStatusStore>((set) => ({
  status: 'idle',
  lastSyncTime: null,
  isPending: false,

  setStatus: (status: SyncIndicatorStatus) => {
    console.log(`[SyncStatus] Status changed: ${status}`);
    set({ status });
    // Auto-dismiss success after 2 seconds
    if (status === 'success') {
      setTimeout(() => {
        set({ status: 'idle' });
      }, 2000);
    }
  },

  setLastSyncTime: (time: string | null) => {
    set({ lastSyncTime: time });
  },

  setPending: (pending: boolean) => {
    set({ isPending: pending });
  },
}));
