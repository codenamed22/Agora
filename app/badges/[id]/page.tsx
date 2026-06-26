/* eslint-disable @next/next/no-img-element */

import { Role, UserStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import { memberDisplayName, memberInitials } from "../../../lib/members";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function BadgeGroupPage({ params }: Readonly<{ params: { id: string } }>) {
  const session = await auth();
  const isAdmin = session?.user?.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE;
  const badge = await prisma.badge.findUnique({
    where: { id: params.id },
    include: {
      members: {
        where: { user: { status: UserStatus.ACTIVE } },
        include: { user: { include: { profile: true } } },
        orderBy: { awardedAt: "desc" },
      },
    },
  });

  if (!badge) {
    notFound();
  }

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="badge-group-hero">
        {badge.imageUrl ? (
          <img className="badge-group-image" src={badge.imageUrl} alt="" />
        ) : (
          <span className="badge-group-image badge-image-fallback">Badge</span>
        )}
        <div>
          <p className="section-label">Recognition</p>
          <h1>{badge.name}</h1>
          <p>{badge.description || "This badge recognizes members for their contribution."}</p>
          {isAdmin ? (
            <a className="button" href={`/admin/badges/${badge.id}`}>
              Edit badge
            </a>
          ) : null}
        </div>
      </section>

      <section className="app-card workspace-card badge-group-members">
        <p className="section-label">Members</p>
        <h2>{badge.members.length} members earned this badge</h2>
        <div className="member-grid">
          {badge.members.map((memberBadge) => {
            const name = memberDisplayName(memberBadge.user);

            return (
              <a
                className="member-card"
                href={`/members/${memberBadge.userId}`}
                key={memberBadge.id}
              >
                {memberBadge.user.profile?.photoUrl ? (
                  <img className="member-avatar" src={memberBadge.user.profile.photoUrl} alt="" />
                ) : (
                  <span className="member-avatar member-avatar-fallback">
                    {memberInitials(name)}
                  </span>
                )}
                <span>
                  <strong>{name}</strong>
                  <small>{memberBadge.user.profile?.college || "College not added"}</small>
                  <small>
                    {[memberBadge.user.profile?.batch, memberBadge.user.profile?.branch]
                      .filter(Boolean)
                      .join(" · ") || "Batch details pending"}
                  </small>
                </span>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
