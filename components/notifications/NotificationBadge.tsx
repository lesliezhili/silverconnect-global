"use client";

import { useState, useEffect } from "react";

/**
 * NotificationBadge — Polls /api/notifications/unread every 30s.
 * Shows a red badge with count on the parent element.
 * Usage: <NotificationBadge /> (absolute-positioned within parent)
 */
export function NotificationBadge({ type = "total" }: { type?: "messages" | "notifications" | "followups" | "total" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const poll = () => {
      fetch("/api/notifications/unread")
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            switch (type) {
              case "messages": setCount(data.unreadMessages); break;
              case "notifications": setCount(data.unreadNotifications); break;
              case "followups": setCount(data.pendingFollowUps); break;
              default: setCount(data.totalBadge); break;
            }
          }
        })
        .catch(() => {});
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [type]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
      {count > 99 ? "99+" : count}
    </span>
  );
}
