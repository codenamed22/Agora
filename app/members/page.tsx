/* eslint-disable @next/next/no-img-element */

import { UserStatus } from "@prisma/client";
import { memberDisplayName, memberInitials } from "../../lib/members";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await prisma.user.findMany({
    where: { status: UserStatus.ACTIVE },
    orderBy: [{ profile: { displayName: "asc" } }, { name: "asc" }],
    include: {
      profile: true,
      memberBadges: { include: { badge: true }, orderBy: { awardedAt: "desc" }, take: 3 },
    },
  });

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Members</p>
        <h1>ShardUp members</h1>
        <p>Meet the builders, mentors, and peers who are part of the ShardUp community.</p>

        <div className="member-grid">
          {members.map((member) => {
            const name = memberDisplayName(member);

            return (
              <article className="member-card" key={member.id}>
                <a className="member-card-profile" href={`/members/${member.id}`}>
                  {member.profile?.photoUrl ? (
                    <img className="member-avatar" src={member.profile.photoUrl} alt="" />
                  ) : (
                    <span className="member-avatar member-avatar-fallback">
                      {memberInitials(name)}
                    </span>
                  )}
                  <span>
                    <strong>{name}</strong>
                    <small>{member.profile?.college || "College not added"}</small>
                    <small>
                      {[member.profile?.batch, member.profile?.branch]
                        .filter(Boolean)
                        .join(" · ") || "Batch details pending"}
                    </small>
                  </span>
                </a>
                {member.memberBadges.length > 0 ? (
                  <span className="member-card-badges" aria-label="Badges">
                    {member.memberBadges.map((memberBadge) =>
                      memberBadge.badge.imageUrl ? (
                        <a
                          aria-label={memberBadge.badge.name}
                          href={`/badges/${memberBadge.badgeId}`}
                          key={memberBadge.id}
                          title={memberBadge.badge.name}
                        >
                          <img src={memberBadge.badge.imageUrl} alt={memberBadge.badge.name} />
                        </a>
                      ) : (
                        <a
                          aria-label={memberBadge.badge.name}
                          className="badge-image-fallback"
                          href={`/badges/${memberBadge.badgeId}`}
                          key={memberBadge.id}
                          title={memberBadge.badge.name}
                        >
                          Badge
                        </a>
                      ),
                    )}
                  </span>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
