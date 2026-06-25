/* eslint-disable @next/next/no-img-element */

import { Role, UserStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import { memberDisplayName, memberInitials } from "../../../lib/members";
import { prisma } from "../../../lib/prisma";
import { assignBadge, removeMemberBadge } from "../../(protected)/admin/badges/actions";

export const dynamic = "force-dynamic";

function leetcodeUrl(handle: string) {
  return `https://leetcode.com/u/${encodeURIComponent(handle)}`;
}

export default async function MemberProfilePage({ params }: Readonly<{ params: { id: string } }>) {
  const session = await auth();
  const member = await prisma.user.findFirst({
    where: { id: params.id, status: UserStatus.ACTIVE },
    include: {
      profile: true,
      memberBadges: { include: { badge: true }, orderBy: { awardedAt: "desc" } },
    },
  });

  if (!member) {
    notFound();
  }

  const name = memberDisplayName(member);
  const canEdit =
    session?.user?.id === member.id ||
    (session?.user?.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE);
  const isAdmin = session?.user?.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE;
  const badges = isAdmin ? await prisma.badge.findMany({ orderBy: { name: "asc" } }) : [];
  const assignedBadgeIds = new Set(member.memberBadges.map((memberBadge) => memberBadge.badgeId));
  const availableBadges = badges.filter((badge) => !assignedBadgeIds.has(badge.id));

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="member-profile-shell">
        <aside className="member-profile-card">
          {member.profile?.photoUrl ? (
            <img className="member-profile-photo" src={member.profile.photoUrl} alt="" />
          ) : (
            <span className="member-profile-photo member-avatar-fallback">
              {memberInitials(name)}
            </span>
          )}
          <h1>{name}</h1>
          <p>{member.email}</p>
          <dl className="member-facts">
            <div>
              <dt>College</dt>
              <dd>{member.profile?.college || "Not added"}</dd>
            </div>
            <div>
              <dt>Batch</dt>
              <dd>{member.profile?.batch || "Not added"}</dd>
            </div>
            <div>
              <dt>Branch</dt>
              <dd>{member.profile?.branch || "Not added"}</dd>
            </div>
          </dl>
          {canEdit ? (
            <a className="button" href={`/members/${member.id}/edit`}>
              Edit profile
            </a>
          ) : null}
        </aside>

        <div className="member-profile-main">
          <section className="member-panel">
            <p className="section-label">Bio</p>
            <h2>About</h2>
            <p>{member.profile?.bio || "This member has not added a bio yet."}</p>
          </section>

          <section className="member-panel">
            <p className="section-label">Links</p>
            <h2>Profiles</h2>
            <div className="member-link-list">
              {member.profile?.linkedinUrl ? (
                <a href={member.profile.linkedinUrl}>LinkedIn</a>
              ) : null}
              {member.profile?.githubUrl ? <a href={member.profile.githubUrl}>GitHub</a> : null}
              {member.profile?.leetcodeHandle ? (
                <a href={leetcodeUrl(member.profile.leetcodeHandle)}>LeetCode</a>
              ) : null}
              {member.profile?.resumeUrl ? <a href={member.profile.resumeUrl}>Resume</a> : null}
              {!member.profile?.linkedinUrl &&
              !member.profile?.githubUrl &&
              !member.profile?.leetcodeHandle &&
              !member.profile?.resumeUrl ? (
                <span>No links added yet.</span>
              ) : null}
            </div>
          </section>

          <section className="member-panel">
            <p className="section-label">Skills</p>
            <h2>What they work on</h2>
            {member.profile?.skills.length ? (
              <div className="member-chip-list">
                {member.profile.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            ) : (
              <p>No skills added yet.</p>
            )}
          </section>
        </div>

        <aside className="member-profile-side">
          <section className="member-panel">
            <p className="section-label">Badges</p>
            <h2>Recognition</h2>
            {isAdmin ? (
              <a className="text-link" href="/admin/badges">
                Manage badge types
              </a>
            ) : null}
            {member.memberBadges.length ? (
              <div className="member-badge-list">
                {member.memberBadges.map((memberBadge) => (
                  <article className="member-badge" key={memberBadge.id}>
                    <span>{memberBadge.badge.emoji}</span>
                    <strong>{memberBadge.badge.name}</strong>
                    {memberBadge.badge.description ? (
                      <small>{memberBadge.badge.description}</small>
                    ) : null}
                    {isAdmin ? (
                      <form action={removeMemberBadge}>
                        <input type="hidden" name="memberBadgeId" value={memberBadge.id} />
                        <input type="hidden" name="userId" value={member.id} />
                        <button className="text-link" type="submit">
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p>No badges yet.</p>
            )}

            {isAdmin && availableBadges.length ? (
              <form action={assignBadge} className="stacked-form member-badge-form">
                <input type="hidden" name="userId" value={member.id} />
                <label htmlFor="badgeId">Assign badge</label>
                <select id="badgeId" name="badgeId" required>
                  {availableBadges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.emoji} {badge.name}
                    </option>
                  ))}
                </select>
                <button className="secondary-button" type="submit">
                  Add badge
                </button>
              </form>
            ) : null}
          </section>
        </aside>
      </section>
    </main>
  );
}
