import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";
import { createBadge, deleteBadge } from "./actions";

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
        <p>Create badges like Hackathon 2026 Winner or Mock Hiring Drive Winner.</p>
        {searchParams?.error ? (
          <div className="form-message error">Check the badge fields.</div>
        ) : null}

        <form action={createBadge} className="stacked-form compact-form">
          <label htmlFor="emoji">Emoji</label>
          <input id="emoji" name="emoji" placeholder="🏆" required />

          <label htmlFor="name">Badge name</label>
          <input id="name" name="name" placeholder="Hackathon 2026 Winner" required />

          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} />

          <button className="button" type="submit">
            Create badge
          </button>
        </form>

        <div className="member-badge-admin-list">
          {badges.map((badge) => (
            <article className="member-badge-admin-row" key={badge.id}>
              <span>{badge.emoji}</span>
              <div>
                <strong>{badge.name}</strong>
                <small>
                  {badge.description || "No description"} · {badge._count.members} members
                </small>
              </div>
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
