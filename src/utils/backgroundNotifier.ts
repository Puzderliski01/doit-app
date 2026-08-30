// Background Notification Poller
// For native-wrapped apps that run in background (WebToApp, Capacitor, etc.)
// Polls Firestore for pending notifications and shows system notifications

import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';

const PUSH_REQUESTS_COLLECTION = 'push_requests';
const POLL_INTERVAL_MS = 30000; // 30 seconds

export interface PushRequest {
  id: string;
  uid: string;
  title: string;
  body: string;
  tag: string;
  taskId?: string;
  requireInteraction: boolean;
  processed: boolean;
  createdAt: Timestamp;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribeSnapshot: (() => void) | null = null;
let lastProcessedId: string | null = null;

// Write a push request to Firestore (called from triggerAppNotification)
export async function requestPushToFirestore(uid: string, options: {
  title: string;
  body: string;
  tag: string;
  taskId?: string;
  requireInteraction?: boolean;
}): Promise<void> {
  try {
    const pushRef = doc(collection(db, PUSH_REQUESTS_COLLECTION));
    await updateDoc(pushRef, {
      uid,
      title: options.title,
      body: options.body,
      tag: options.tag,
      taskId: options.taskId || null,
      requireInteraction: options.requireInteraction || false,
      processed: false,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error('[BackgroundNotifier] Failed to write push request:', err);
  }
}

// Show a system notification
function showSystemNotification(options: {
  title: string;
  body: string;
  tag: string;
  taskId?: string;
  requireInteraction: boolean;
}): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(options.title, {
      body: options.body,
      icon: '/icon-192.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
    });

    notif.onclick = () => {
      window.focus();
      if (options.taskId) {
        window.dispatchEvent(new CustomEvent('push-notification-click', {
          detail: { taskId: options.taskId }
        }));
      }
      notif.close();
    };
  } catch (err) {
    console.error('[BackgroundNotifier] Notification failed:', err);
  }
}

// Process a push request (show notification + mark as processed)
async function processPushRequest(request: PushRequest): Promise<void> {
  // Skip if already processed
  if (request.processed) return;
  if (lastProcessedId === request.id) return;

  lastProcessedId = request.id;

  // Show the notification
  showSystemNotification({
    title: request.title,
    body: request.body,
    tag: request.tag,
    taskId: request.taskId || undefined,
    requireInteraction: request.requireInteraction,
  });

  // Mark as processed
  try {
    const ref = doc(db, PUSH_REQUESTS_COLLECTION, request.id);
    await updateDoc(ref, { processed: true });
  } catch (err) {
    console.error('[BackgroundNotifier] Failed to mark processed:', err);
  }
}

// Start listening for push requests via Firestore real-time listener
export function startBackgroundPoller(uid: string): void {
  if (unsubscribeSnapshot) return; // Already running

  console.log('[BackgroundNotifier] Starting for user:', uid);

  // Real-time listener for unprocessed push requests for this user
  const q = query(
    collection(db, PUSH_REQUESTS_COLLECTION),
    where('uid', '==', uid),
    where('processed', '==', false),
    orderBy('createdAt', 'asc')
  );

  unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as Omit<PushRequest, 'id'>;
        processPushRequest({ id: change.doc.id, ...data });
      }
    });
  }, (err) => {
    console.error('[BackgroundNotifier] Snapshot error:', err);
  });

  // Also poll periodically as backup (in case real-time misses events)
  pollInterval = setInterval(async () => {
    try {
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<PushRequest, 'id'>;
        processPushRequest({ id: docSnap.id, ...data });
      });
    } catch (err) {
      console.error('[BackgroundNotifier] Poll error:', err);
    }
  }, POLL_INTERVAL_MS);
}

// Stop the background poller
export function stopBackgroundPoller(): void {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  lastProcessedId = null;
  console.log('[BackgroundNotifier] Stopped');
}
