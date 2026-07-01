import { prisma } from "../../lib/prisma";
import { NudgeCard } from "./nudge-card";

const nudgeInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { displayName: true } },
    },
  },
  recipient: {
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { displayName: true } },
    },
  },
  completedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { displayName: true } },
    },
  },
} as const;

export default async function NudgesInbox({ userId }: Readonly<{ userId: string }>) {
  const [received, sent] = await Promise.all([
    prisma.nudge.findMany({
      where: { recipientId: userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: nudgeInclude,
    }),
    prisma.nudge.findMany({
      where: { senderId: userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: nudgeInclude,
    }),
  ]);

  return (
    <section className="member-panel member-nudges-panel" id="nudges">
      <p className="section-label">Nudges</p>
      <h2>Your nudges</h2>
      <p>
        Challenges and accountability nudges between ShardUp members. Send nudges from another
        member&apos;s profile.
      </p>

      <section className="nudge-section">
        <h3>Received</h3>
        <div className="nudge-list">
          {received.length > 0 ? (
            received.map((nudge) => (
              <NudgeCard key={nudge.id} nudge={nudge} viewerId={userId} perspective="received" />
            ))
          ) : (
            <div className="form-message">No nudges received yet.</div>
          )}
        </div>
      </section>

      <section className="nudge-section">
        <h3>Sent</h3>
        <div className="nudge-list">
          {sent.length > 0 ? (
            sent.map((nudge) => (
              <NudgeCard key={nudge.id} nudge={nudge} viewerId={userId} perspective="sent" />
            ))
          ) : (
            <div className="form-message">You have not sent any nudges yet.</div>
          )}
        </div>
      </section>
    </section>
  );
}
