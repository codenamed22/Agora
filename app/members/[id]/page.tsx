/* eslint-disable @next/next/no-img-element */

import { Role, UserStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import CreateBadgeModal from "../../create-badge-modal";
import SendNudgeModal from "../../send-nudge-modal";
import { memberDisplayName, memberInitials, medalsForMembers } from "../../../lib/members";
import { prisma } from "../../../lib/prisma";
import { assignBadge, removeMemberBadge } from "../../(protected)/admin/badges/actions";
import NudgesInbox from "../../nudges/nudges-inbox";

export const dynamic = "force-dynamic";

function leetcodeUrl(handle: string) {
  return `https://leetcode.com/u/${encodeURIComponent(handle)}`;
}

export default async function MemberProfilePage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams?: { error?: string } }>) {
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
  const ranking = await prisma.user.findMany({
    where: { status: UserStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { displayName: true } },
      memberBadges: { select: { badge: { select: { xp: true } } } },
    },
  });
  const medal = medalsForMembers(ranking).get(member.id);
  const photoClass = medal ? `member-profile-photo medal-${medal}` : "member-profile-photo";
  const canEdit =
    session?.user?.id === member.id ||
    (session?.user?.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE);
  const canNudge = session?.user?.status === UserStatus.ACTIVE && session.user.id !== member.id;
  const isOwnProfile = session?.user?.status === UserStatus.ACTIVE && session.user.id === member.id;
  const isAdmin = session?.user?.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE;
  const badges = isAdmin ? await prisma.badge.findMany({ orderBy: { name: "asc" } }) : [];
  const assignedBadgeIds = new Set(member.memberBadges.map((memberBadge) => memberBadge.badgeId));
  const availableBadges = badges.filter((badge) => !assignedBadgeIds.has(badge.id));

  return (
    <main className="app-shell member-profile-page workspace-shell">
      <section className="member-profile-shell">
        <aside className="member-profile-card">
          {member.profile?.photoUrl ? (
            <img className={photoClass} src={member.profile.photoUrl} alt="" />
          ) : (
            <span className={`${photoClass} member-avatar-fallback`}>{memberInitials(name)}</span>
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
          {canNudge ? (
            <>
              <a className="secondary-button" href="#send-nudge">
                Send nudge
              </a>
              <SendNudgeModal
                error={searchParams?.error}
                recipientId={member.id}
                recipientName={name}
                returnTo={`/members/${member.id}`}
              />
            </>
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
            <h2>Badges</h2>
            {isAdmin ? (
              <div className="member-badge-admin-actions">
                <a className="text-link" href="/admin/badges">
                  Manage badge groups
                </a>
                <a className="secondary-button" href="#create-badge">
                  + Create Badge
                </a>
                <CreateBadgeModal error={searchParams?.error} returnTo={`/members/${member.id}`} />
              </div>
            ) : null}

            {isAdmin && availableBadges.length ? (
              <form action={assignBadge} className="stacked-form member-badge-form">
                <input type="hidden" name="userId" value={member.id} />
                <label htmlFor="badgeId">Assign badge</label>
                <select id="badgeId" name="badgeId" required>
                  {availableBadges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>
                <button className="secondary-button" type="submit">
                  Add badge
                </button>
              </form>
            ) : null}

            {member.memberBadges.length ? (
              <div className="member-badge-list">
                {member.memberBadges.map((memberBadge) => (
                  <span className="profile-badge-shell" key={memberBadge.id}>
                    <a
                      aria-label={memberBadge.badge.name}
                      className="profile-badge-chip"
                      href={`/badges/${memberBadge.badgeId}`}
                      title={memberBadge.badge.name}
                    >
                      {memberBadge.badge.imageUrl ? (
                        <img
                          className="member-badge-image"
                          src={memberBadge.badge.imageUrl}
                          alt=""
                        />
                      ) : (
                        <span className="member-badge-image badge-image-fallback">Badge</span>
                      )}
                    </a>
                    {isAdmin ? (
                      <>
                        <a
                          className="profile-badge-edit-link"
                          href={`/admin/badges/${memberBadge.badgeId}`}
                        >
                          Edit
                        </a>
                        <form action={removeMemberBadge} className="profile-badge-remove-form">
                          <input type="hidden" name="memberBadgeId" value={memberBadge.id} />
                          <input type="hidden" name="userId" value={member.id} />
                          <input type="hidden" name="badgeId" value={memberBadge.badgeId} />
                          <button aria-label={`Remove ${memberBadge.badge.name}`} type="submit">
                            x
                          </button>
                        </form>
                      </>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : (
              <p>No badges yet.</p>
            )}
          </section>
        </aside>
      </section>

      {isOwnProfile ? <NudgesInbox userId={member.id} /> : null}
    </main>
  );
}
