import { Role, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  if (session.user.status !== UserStatus.ACTIVE) {
    redirect("/apply");
  }

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">Member dashboard</p>
        <h1>Welcome, {session.user.name ?? "builder"}.</h1>
        <p>
          Your account is active. This dashboard is the starting point for member profiles,
          resources, achievements, and future leaderboards.
        </p>

        <div className="auth-actions-list">
          <a className="button" href={`/members/${session.user.id}/edit`}>
            Edit profile
          </a>
          <a className="secondary-button" href={`/members/${session.user.id}`}>
            View profile
          </a>
        </div>

        {session.user.role === Role.ADMIN ? (
          <div className="member-link-list dashboard-admin-links">
            <a href="/admin/applications">Review applications</a>
            <a href="/admin/cohort">Edit cohort questions</a>
            <a href="/admin/events">Manage events</a>
            <a href="/admin/problems">Review problems</a>
          </div>
        ) : null}
      </section>
    </main>
  );
}
