/* eslint-disable @next/next/no-img-element */

import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";
import CreateBadgeModal from "../../../create-badge-modal";
import { deleteBadge } from "./actions";

export default async function AdminBadgesPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  await requireAdmin();
  const badges = await prisma.badge.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Member badges</h1>
        <p>Create badge groups like Hackathon 2026 Winner or Mock Hiring Drive Winner.</p>
        {searchParams?.error ? (
          <div className="form-message error">Check the badge fields.</div>
        ) : null}

        <a className="button" href="#create-badge">
          Create badge
        </a>
        <CreateBadgeModal error={searchParams?.error} returnTo="/admin/badges" />

        <div className="member-badge-admin-list">
          {badges.map((badge) => (
            <article className="member-badge-admin-row" key={badge.id}>
              {badge.imageUrl ? (
                <img className="badge-admin-thumb" src={badge.imageUrl} alt="" />
              ) : (
                <span className="badge-admin-thumb badge-image-fallback">Badge</span>
              )}
              <div>
                <strong>{badge.name}</strong>
                <small>
                  {badge.description || "No description"} · {badge._count.members} members
                </small>
              </div>
              <a className="secondary-button" href={`/admin/badges/${badge.id}`}>
                Manage
              </a>
              <form action={deleteBadge}>
                <input type="hidden" name="badgeId" value={badge.id} />
                <button className="secondary-button" type="submit">
                  Delete
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
