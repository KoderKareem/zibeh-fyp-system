"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications/actions";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function formatRelativeTime(isoDate: string) {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 17h5l-1.6-1.6a2 2 0 01-.4-1.2V11a7 7 0 10-14 0v3.2a2 2 0 01-.4 1.2L2 17h5m8 0a4 4 0 01-8 0m8 0H7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-navy/70 transition-colors hover:bg-navy/5"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-card border border-navy/10 bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
              Notifications
            </span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-navy/50">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => {
                    setOpen(false);
                    if (!n.is_read) markNotificationRead(n.id);
                  }}
                  className={`flex flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-navy/5 ${
                    n.is_read ? "" : "bg-card-secondary"
                  }`}
                >
                  <span className="text-sm font-semibold text-navy">{n.title}</span>
                  {n.body ? (
                    <span className="line-clamp-2 text-xs text-navy/60">{n.body}</span>
                  ) : null}
                  <span className="text-[11px] text-navy/40">{formatRelativeTime(n.created_at)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
