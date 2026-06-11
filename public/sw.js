// SilverConnect Service Worker — Push Notifications + Offline Support
const CACHE_NAME = "silverconnect-v1";
const OFFLINE_URL = "/offline.html";

// Install: cache offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Push notification received
self.addEventListener("push", (event) => {
  let data = { title: "SilverConnect", body: "You have a new notification", url: "/" };
  try {
    data = event.data ? event.data.json() : data;
  } catch { /* use defaults */ }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-badge.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "silverconnect-" + Date.now(),
    renotify: true,
    requireInteraction: true, // Keep visible for elderly users
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Later" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Fetch: serve cached offline page when network fails
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
