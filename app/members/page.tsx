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
              <a className="member-card" href={`/members/${member.id}`} key={member.id}>
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
                    {[member.profile?.batch, member.profile?.branch].filter(Boolean).join(" · ") ||
                      "Batch details pending"}
                  </small>
                </span>
                {member.memberBadges.length > 0 ? (
                  <span className="member-card-badges" aria-label="Badges">
                    {member.memberBadges.map((memberBadge) => (
                      <span key={memberBadge.id}>{memberBadge.badge.emoji}</span>
                    ))}
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
