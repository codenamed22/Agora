import { Role } from "@prisma/client";
import { requireActiveUser } from "../../lib/guards";
import { prisma } from "../../lib/prisma";
import { createTeachingSession } from "../(protected)/admin/teaching/actions";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function MasterclassPage() {
  const user = await requireActiveUser();
  const isAdmin = user.role === Role.ADMIN;

  const sessions = await prisma.teachingSession.findMany({
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { artifacts: true, boards: true } },
    },
  });

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Masterclass</p>
        <h1>Masterclass sessions</h1>
        <p>
          Find session notes, recordings, Meet links, and whiteboards from ShardUp masterclasses.
        </p>

        {isAdmin ? (
          <form action={createTeachingSession} className="stacked-form teaching-form">
            <label htmlFor="title">Session title</label>
            <input id="title" name="title" placeholder="Intro to dynamic programming" required />

            <label htmlFor="topic">Topic or notes</label>
            <textarea id="topic" name="topic" placeholder="What this session covers" rows={3} />

            <label htmlFor="sessionDate">Session date</label>
            <input id="sessionDate" name="sessionDate" type="date" />

            <button className="button" type="submit">
              Start new masterclass session
            </button>
          </form>
        ) : null}

        <div className="teaching-session-list">
          {sessions.length === 0 ? (
            <p>No masterclass sessions yet.</p>
          ) : (
            sessions.map((session) => (
              <a
                className="teaching-session-row"
                href={`/masterclass/${session.id}`}
                key={session.id}
              >
                <span>
                  <strong>{session.title}</strong>
                  <small>{session.topic || "No topic added"}</small>
                </span>
                <span>
                  {session.sessionDate ? dateFormatter.format(session.sessionDate) : "No date"}
                </span>
                <span>
                  {session._count.artifacts} artifacts · {session._count.boards} boards
                </span>
              </a>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
