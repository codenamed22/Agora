"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsSeenAction } from "./notifications/actions";

export type NotificationItem = {
  id: string;
  type:
    | "PRACTICE_SOLVED"
    | "RANK_UP"
    | "BADGE_EARNED"
    | "CONTEST_FINISHED"
    | "CONTEST_PUBLISHED"
    | "EVENT_PUBLISHED"
    | "OVERALL_RANK_UP"
    | "NUDGE_RECEIVED";
  message: string;
  link: string | null;
  timeLabel: string;
};

const ICONS: Record<NotificationItem["type"], string> = {
  PRACTICE_SOLVED: "✅",
  RANK_UP: "⬆️",
  BADGE_EARNED: "🏅",
  CONTEST_FINISHED: "🏆",
  CONTEST_PUBLISHED: "🎯",
  EVENT_PUBLISHED: "📅",
  OVERALL_RANK_UP: "📈",
  NUDGE_RECEIVED: "👋",
};

export default function NotificationBell({
  items,
  unreadCount,
}: Readonly<{ items: NotificationItem[]; unreadCount: number }>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);

    if (next && unreadCount > 0) {
      markNotificationsSeenAction()
        .then(() => router.refresh())
        .catch(() => undefined);
    }
  }

  return (
    <div className="notification-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notification-bell"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        title="Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="notification-bell-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="notification-dropdown"
          role="menu"
          aria-label="Notifications"
          data-lenis-prevent
        >
          <div className="notification-dropdown-header">
            <span>Notifications</span>
          </div>
          {items.length > 0 ? (
            <ul className="notification-dropdown-list">
              {items.map((item) => {
                const body = (
                  <>
                    <span className="notification-dropdown-icon" aria-hidden="true">
                      {ICONS[item.type]}
                    </span>
                    <span className="notification-dropdown-body">
                      <span className="notification-dropdown-message">{item.message}</span>
                      <span className="notification-dropdown-time">{item.timeLabel}</span>
                    </span>
                  </>
                );

                return (
                  <li key={item.id} role="menuitem">
                    {item.link ? (
                      <a
                        className="notification-dropdown-item"
                        href={item.link}
                        onClick={() => setOpen(false)}
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="notification-dropdown-item">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="notification-dropdown-empty">No notifications yet.</div>
          )}
          <a className="notification-dropdown-footer" href="/notifications">
            View all
          </a>
        </div>
      ) : null}
    </div>
  );
}
