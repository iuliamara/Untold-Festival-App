export interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  timestamp: number;
}

// Initialize database
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('untold_offline_db', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Add request to offline queue
export const enqueueRequest = async (
  url: string,
  method: string,
  body: any,
  headers: Record<string, string> = {}
): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readwrite');
    const store = transaction.objectStore('outbox');
    const request = store.add({
      url,
      method,
      body,
      headers,
      timestamp: Date.now(),
    });

    request.onsuccess = () => {
      resolve(request.result as number);
      // Trigger sync check immediately if we somehow got back online
      const token = sessionStorage.getItem('untold_token');
      syncOfflineQueue(token);
    };
    request.onerror = () => reject(request.error);
  });
};

// Retrieve all queued requests
export const getQueuedRequests = async (): Promise<QueuedRequest[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readonly');
    const store = transaction.objectStore('outbox');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Delete a request from the queue
export const deleteQueuedRequest = async (id: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readwrite');
    const store = transaction.objectStore('outbox');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

let isSyncing = false;
let syncCallback: (() => void) | null = null;

// Replay queued requests sequentially when online
export const syncOfflineQueue = async (token: string | null): Promise<boolean> => {
  if (isSyncing) return false;
  if (!navigator.onLine) return false;

  const queue = await getQueuedRequests();
  if (queue.length === 0) return true;

  isSyncing = true;
  console.log(`[Offline Sync] Starting sync of ${queue.length} requests...`);

  let hasFailure = false;

  for (const req of queue) {
    if (hasFailure) break;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...req.headers,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(req.url, {
        method: req.method,
        headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
      });

      if (response.ok) {
        console.log(`[Offline Sync] Successfully synced request ${req.id} to ${req.url}`);
        if (req.id !== undefined) {
          await deleteQueuedRequest(req.id);
        }
      } else {
        console.error(`[Offline Sync] Request ${req.id} to ${req.url} failed with status: ${response.status}`);
        
        // Handle server side bad request (400 validation issues etc.) by removing them to prevent a stuck queue.
        // For temporary issues (5xx/401/408/etc.), we halt the synchronization loop and keep requests for future retries.
        if (response.status === 400 || response.status === 422 || response.status === 404) {
          console.warn(`[Offline Sync] Deleting invalid/redundant request ${req.id} due to status ${response.status}`);
          if (req.id !== undefined) {
            await deleteQueuedRequest(req.id);
          }
        } else {
          hasFailure = true;
        }
      }
    } catch (error) {
      console.error(`[Offline Sync] Network error syncing request ${req.id}:`, error);
      hasFailure = true;
    }
  }

  isSyncing = false;

  if (syncCallback) {
    syncCallback();
  }

  return !hasFailure;
};

// Subscribe to sync complete events
export const subscribeToSync = (callback: () => void) => {
  syncCallback = callback;
  return () => {
    if (syncCallback === callback) {
      syncCallback = null;
    }
  };
};

// Listen to network changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const token = sessionStorage.getItem('untold_token');
    syncOfflineQueue(token);
  });
}
