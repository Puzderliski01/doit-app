// DoIT Service Worker — Push Notifications & Offline Support
const CACHE_NAME = 'doit-v1';

// Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
  let data = { title: 'DoIT', body: '', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'doit-push', data: {} };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const notifOptions = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'doit-push',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notifOptions)
  );
});

// Notification click — open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (event.notification.data?.taskId) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', taskId: event.notification.data.taskId });
          }
          return;
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification action click
self.addEventListener('notificationactionclick', (event) => {
  event.notification.close();

  if (event.action === 'complete_task' && event.notification.data?.taskId) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_ACTION',
              action: event.action,
              taskId: event.notification.data.taskId,
            });
            return;
          }
        }
      })
    );
  }
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Main thread requests to show a notification
  if (event.data?.type === 'SHOW_NOTIFICATION' && event.data?.notification) {
    const n = event.data.notification;
    self.registration.showNotification(n.title, {
      body: n.body,
      icon: n.icon || '/icon-192.png',
      badge: n.badge || '/icon-192.png',
      tag: n.tag || 'doit-local',
      data: n.data || {},
      vibrate: [200, 100, 200],
      requireInteraction: n.requireInteraction || false,
    });
  }
});
