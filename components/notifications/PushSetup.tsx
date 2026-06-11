"use client";

import { useEffect, useState } from "react";

/**
 * PushSetup — Registers service worker + push subscription.
 * Place in root layout. Shows permission prompt for elderly (large, clear).
 */
export function PushSetup() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Register service worker
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Check if already subscribed
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) { setRegistered(true); return; }
        // Show prompt after 5 seconds (don't overwhelm on first visit)
        if (Notification.permission === "default") {
          setTimeout(() => setShowPrompt(true), 5000);
        }
      });
    });
  }, []);

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      // Get VAPID key
      const res = await fetch("/api/notifications/push");
      const data = await res.json();
      if (!data.vapidPublicKey) { setShowPrompt(false); return; }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setShowPrompt(false); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.vapidPublicKey),
      });

      // Send subscription to server
      await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", subscription: sub.toJSON() }),
      });

      setRegistered(true);
      setShowPrompt(false);
    } catch { setShowPrompt(false); }
  };

  if (registered || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white border-2 border-emerald-300 rounded-2xl p-5 shadow-xl z-50 max-w-lg mx-auto">
      <p className="text-xl font-semibold text-gray-900 mb-2">\ud83d\udd14 Stay Connected</p>
      <p className="text-lg text-gray-600 mb-4">Get notified when your volunteer sends a message or your service is confirmed.</p>
      <div className="flex gap-3">
        <button onClick={() => setShowPrompt(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-lg font-medium">
          Not Now
        </button>
        <button onClick={subscribe} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-lg font-bold">
          Enable
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
