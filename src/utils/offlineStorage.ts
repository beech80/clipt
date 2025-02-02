import { openDB, IDBPDatabase } from 'idb';

interface OfflineStore {
  id: string;
  timestamp: number;
  data: any;
  type: 'post' | 'comment' | 'like' | 'follow';
  synced: boolean;
}

class OfflineStorage {
  private db: IDBPDatabase | null = null;

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores for different types of offline data
        if (!db.objectStoreNames.contains('offlineActions')) {
          db.createObjectStore('offlineActions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offlineContent')) {
          db.createObjectStore('offlineContent', { keyPath: 'id' });
        }
      },
    });
  }

  async saveOfflineAction(action: Omit<OfflineStore, 'timestamp' | 'synced'>) {
    if (!this.db) await this.init();
    
    const store: OfflineStore = {
      ...action,
      timestamp: Date.now(),
      synced: false,
    };

    await this.db!.put('offlineActions', store);
    
    // Register for background sync if available
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      // Check if sync is supported
      if ('sync' in registration) {
        try {
          await (registration as any).sync.register('sync-actions');
        } catch (err) {
          console.error('Background sync registration failed:', err);
        }
      }
    }
  }

  async getUnsynedActions(): Promise<OfflineStore[]> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction('offlineActions', 'readonly');
    const store = tx.objectStore('offlineActions');
    
    return await store.getAll();
  }

  async markAsSynced(id: string) {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');
    
    const item = await store.get(id);
    if (item) {
      item.synced = true;
      await store.put(item);
    }
  }

  async clearSyncedActions() {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');
    
    const all = await store.getAll();
    const synced = all.filter(item => item.synced);
    
    await Promise.all(synced.map(item => store.delete(item.id)));
  }
}

const DB_NAME = 'ClipOfflineDB';
const DB_VERSION = 1;

export const offlineStorage = new OfflineStorage();