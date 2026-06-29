/* eslint-disable @next/next/no-img-element */

import { UserStatus } from "@prisma/client";
import {
  medalsForMembers,
  memberDisplayName,
  memberInitials,
  memberTotalXp,
} from "../../lib/members";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await prisma.user.findMany({
    where: { status: UserStatus.ACTIVE },
    orderBy: [{ profile: { displayName: "asc" } }, { name: "asc" }],
    include: {
      profile: true,
      memberBadges: { include: { badge: true }, orderBy: { awardedAt: "desc" } },
    },
  });

  const xpByMember = new Map(
    members.map((member) => [member.id, memberTotalXp(member.memberBadges)]),
  );
  const medals = medalsForMembers(members);

  const NO_BATCH = "Batch details pending";
  const groups = new Map<string, typeof members>();

  // Sort by XP desc (then name) before grouping, so each batch group is XP-ranked.
  const ranked = [...members].sort(
    (a, b) =>
      (xpByMember.get(b.id) ?? 0) - (xpByMember.get(a.id) ?? 0) ||
      memberDisplayName(a).localeCompare(memberDisplayName(b)),
  );

  for (const member of ranked) {
    const batch = member.profile?.batch?.trim() || NO_BATCH;
    (groups.get(batch) ?? groups.set(batch, []).get(batch)!).push(member);
  }

  const batchGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === NO_BATCH) return 1;
    if (b === NO_BATCH) return -1;
    return b.localeCompare(a, undefined, { numeric: true });
  });

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Members</p>
        <h1>ShardUp members</h1>
        <p>Meet the builders, mentors, and peers who are part of the ShardUp community.</p>

        <div className="member-batch-groups">
          {batchGroups.map(([batch, batchMembers]) => (
            <section className="member-batch-group" key={batch}>
              <h2 className="member-batch-heading">{batch}</h2>
              <div className="member-grid">
                {batchMembers.map((member) => {
                  const name = memberDisplayName(member);
                  const medal = medals.get(member.id);
                  const avatarClass = medal ? `member-avatar medal-${medal}` : "member-avatar";

                  return (
                    <article
                      className={medal ? `member-card medal-${medal}` : "member-card"}
                      key={member.id}
                    >
                      <a className="member-card-profile" href={`/members/${member.id}`}>
                        {member.profile?.photoUrl ? (
                          <img className={avatarClass} src={member.profile.photoUrl} alt="" />
                        ) : (
                          <span className={`${avatarClass} member-avatar-fallback`}>
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
                                <img
                                  src={memberBadge.badge.imageUrl}
                                  alt={memberBadge.badge.name}
                                />
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
          ))}
        </div>
      </section>
    </main>
  );
}
