/* eslint-disable @next/next/no-img-element */

import { UserStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/guards";
import { memberDisplayName, memberInitials } from "../../../../../lib/members";
import { prisma } from "../../../../../lib/prisma";
import { bulkAssignBadge, removeMemberBadge, updateBadge } from "../actions";

const errors: Record<string, string> = {
  invalid: "Check the badge fields and try again.",
  image: "Upload a JPG, PNG, or WebP image under 2MB.",
  storage: "Badge image storage is not configured yet. Add BLOB_READ_WRITE_TOKEN.",
};

export default async function AdminBadgeGroupPage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams?: { error?: string } }>) {
  await requireAdmin();
  const badge = await prisma.badge.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { include: { profile: true } } },
        orderBy: { awardedAt: "desc" },
      },
    },
  });

  if (!badge) {
    notFound();
  }

  const assignedIds = new Set(badge.members.map((memberBadge) => memberBadge.userId));
  const availableMembers = await prisma.user.findMany({
    where: { status: UserStatus.ACTIVE, id: { notIn: Array.from(assignedIds) } },
    include: { profile: true },
    orderBy: [{ profile: { displayName: "asc" } }, { name: "asc" }],
  });

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>{badge.name}</h1>
        <p>
          Manage this badge group. Everyone assigned here automatically shows this badge on their
          profile.
        </p>
        {searchParams?.error ? (
          <div className="form-message error">{errors[searchParams.error] ?? errors.invalid}</div>
        ) : null}

        <div className="badge-admin-layout">
          <form action={updateBadge} className="stacked-form compact-form">
            <input type="hidden" name="badgeId" value={badge.id} />

            {badge.imageUrl ? (
              <img className="badge-group-image" src={badge.imageUrl} alt="" />
            ) : (
              <span className="badge-group-image badge-image-fallback">Badge</span>
            )}

            <label htmlFor="name">Badge name</label>
            <input id="name" name="name" defaultValue={badge.name} required />

            <label htmlFor="description">Group description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={badge.description ?? ""}
            />

            <label htmlFor="image">Badge image</label>
            <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />

            <button className="button" type="submit">
              Save badge group
            </button>
          </form>

          <section className="member-panel">
            <p className="section-label">Group members</p>
            <h2>{badge.members.length} assigned</h2>

            {availableMembers.length ? (
              <form action={bulkAssignBadge} className="stacked-form member-badge-form">
                <input type="hidden" name="badgeId" value={badge.id} />
                <span className="form-label">Add members</span>
                <div className="badge-member-picker">
                  {availableMembers.map((member) => (
                    <label key={member.id}>
                      <input name="userIds" type="checkbox" value={member.id} />
                      <span>
                        <strong>{memberDisplayName(member)}</strong>
                        <small>{member.email}</small>
                      </span>
                    </label>
                  ))}
                </div>
                <button className="secondary-button" type="submit">
                  Add selected members
                </button>
              </form>
            ) : (
              <p>All active members are already in this badge group.</p>
            )}

            <div className="member-badge-admin-list">
              {badge.members.map((memberBadge) => {
                const name = memberDisplayName(memberBadge.user);

                return (
                  <article className="member-badge-admin-row" key={memberBadge.id}>
                    {memberBadge.user.profile?.photoUrl ? (
                      <img
                        className="member-avatar"
                        src={memberBadge.user.profile.photoUrl}
                        alt=""
                      />
                    ) : (
                      <span className="member-avatar member-avatar-fallback">
                        {memberInitials(name)}
                      </span>
                    )}
                    <div>
                      <strong>{name}</strong>
                      <small>{memberBadge.user.email}</small>
                    </div>
                    <form action={removeMemberBadge}>
                      <input type="hidden" name="memberBadgeId" value={memberBadge.id} />
                      <input type="hidden" name="userId" value={memberBadge.userId} />
                      <input type="hidden" name="badgeId" value={badge.id} />
                      <button className="secondary-button" type="submit">
                        Remove
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
