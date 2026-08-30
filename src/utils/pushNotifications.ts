// Push Notification Manager
// Handles service worker registration, push subscription, and local push triggering

const VAPID_PUBLIC_KEY = 'BPcT9fuNcshgX5k3dPzmb8UnquO28j3LTve_85kq-DB98CtRBwMoPQENvOI1RgbcWJofuQwDbnY0t4xxNfxbClk';
const PUSH_SUBSCRIPTION_KEY = 'doit_push_subscription';

// Convert VAPID key to Uint8Array for subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current notification permission status
export function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Register the service worker
let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] Service Worker registered:', swRegistration.scope);

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.taskId) {
        // Dispatch custom event that App.tsx can listen to
        window.dispatchEvent(new CustomEvent('push-notification-click', { detail: { taskId: event.data.taskId } }));
      }
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        window.dispatchEvent(new CustomEvent('push-notification-action', {
          detail: { action: event.data.action, taskId: event.data.taskId }
        }));
      }
    });

    return swRegistration;
  } catch (err) {
    console.error('[Push] Service Worker registration failed:', err);
    return null;
  }
}

// Request notification permission
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  const result = await Notification.requestPermission();
  console.log('[Push] Permission:', result);
  return result;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const reg = swRegistration || await navigator.serviceWorker.ready;
    if (!reg) {
      console.error('[Push] No service worker registration');
      return null;
    }

    // Check if already subscribed
    let subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      console.log('[Push] Already subscribed');
      return subscription;
    }

    // Create new subscription
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('[Push] New subscription created');

    // Store subscription locally
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscription));

    return subscription;
  } catch (err) {
    console.error('[Push] Subscription failed:', err);
    return null;
  }
}

// Unsubscribe from push
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const reg = swRegistration || await navigator.serviceWorker.ready;
    if (!reg) return false;

    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return true;

    await subscription.unsubscribe();
    localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
    console.log('[Push] Unsubscribed');
    return true;
  } catch (err) {
    console.error('[Push] Unsubscribe failed:', err);
    return false;
  }
}

// Check if currently subscribed
export async function isSubscribed(): Promise<boolean> {
  try {
    const reg = swRegistration || await navigator.serviceWorker.ready;
    if (!reg) return false;

    const subscription = await reg.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// Show a local notification (works when app is in foreground)
// For background notifications, a server needs to send actual push messages
export async function showLocalNotification(options: {
  title: string;
  body: string;
  tag?: string;
  taskId?: string;
  icon?: string;
  requireInteraction?: boolean;
}): Promise<void> {
  if (Notification.permission !== 'granted') return;

  try {
    const reg = swRegistration || await navigator.serviceWorker.ready;
    if (reg?.active) {
      // Use service worker to show notification (works in all states when subscribed)
      await reg.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: {
          title: options.title,
          body: options.body,
          tag: options.tag || 'doit-local',
          icon: options.icon || '/icon-192.png',
          badge: '/icon-192.png',
          data: { taskId: options.taskId },
          requireInteraction: options.requireInteraction || false,
        },
      });
    } else {
      // Fallback to basic Notification API
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag || 'doit-local',
      });
    }
  } catch (err) {
    console.error('[Push] Show notification failed:', err);
    // Fallback
    new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
    });
  }
}

// Initialize push notifications (call on app start)
export async function initPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    console.log('[Push] Not supported');
    return false;
  }

  // Register service worker
  const reg = await registerServiceWorker();
  if (!reg) return false;

  // If permission already granted, subscribe
  if (Notification.permission === 'granted') {
    const sub = await subscribeToPush();
    return !!sub;
  }

  return false;
}
