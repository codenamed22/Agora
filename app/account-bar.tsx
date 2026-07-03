import type { Session } from "next-auth";
import { auth, signOut } from "../auth";
import {
  listNotifications,
  relativeTimeFromNow,
  unreadNotificationCount,
} from "../lib/notifications";
import NotificationBell, { type NotificationItem } from "./notification-bell";
import SiteHeader from "./site-header";

export default async function AccountBar({
  session: providedSession,
}: Readonly<{
  session?: Session | null;
}> = {}) {
  const session = providedSession ?? (await auth());

  if (!session?.user) {
    return <SiteHeader />;
  }

  const [unreadCount, notifications] = await Promise.all([
    unreadNotificationCount(session.user.id),
    listNotifications(session.user.id, 8),
  ]);
  const now = new Date();
  const notificationItems: NotificationItem[] = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    message: notification.message,
    link: notification.link,
    timeLabel: relativeTimeFromNow(notification.createdAt, now),
  }));

  return (
    <SiteHeader>
      <a href="/dashboard">Dashboard</a>
      <a href="/masterclass">Masterclass</a>
      <a href={`/members/${session.user.id}`}>Profile</a>
      {session.user.role === "ADMIN" ? <a href="/admin/cohort">Cohort</a> : null}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit">Sign out</button>
      </form>
      <NotificationBell items={notificationItems} unreadCount={unreadCount} />
    </SiteHeader>
  );
}
