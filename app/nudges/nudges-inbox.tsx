import { memberDisplayName } from "../../lib/members";
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
  const [received, sent, scoreboard] = await Promise.all([
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
    prisma.user.findMany({
      where: { profile: { nudgesCompleted: { gt: 0 } } },
      orderBy: [{ profile: { nudgesCompleted: "desc" } }, { name: "asc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        profile: { select: { displayName: true, nudgesCompleted: true } },
      },
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

      <section className="practice-leaderboard" aria-labelledby="nudge-scoreboard-title">
        <div className="practice-leaderboard-header">
          <h3 id="nudge-scoreboard-title">Nudge scoreboard</h3>
          <span>Solved</span>
        </div>
        {scoreboard.length > 0 ? (
          <div className="leaderboard-list">
            {scoreboard.map((entry, index) => (
              <div className="leaderboard-row" key={entry.id}>
                <span className="leaderboard-rank">#{index + 1}</span>
                <span className="leaderboard-name">{memberDisplayName(entry)}</span>
                <span className="leaderboard-score">{entry.profile?.nudgesCompleted ?? 0}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="form-message">No nudges solved yet.</div>
        )}
      </section>

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
