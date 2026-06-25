import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireActiveUser } from "../../../lib/guards";
import { prisma } from "../../../lib/prisma";
import { teachingArtifactLabels, teachingArtifactTypes } from "../../../lib/teaching";
import {
  addTeachingArtifact,
  createTeachingBoard,
  deleteTeachingBoard,
  removeTeachingArtifact,
  updateTeachingSession,
} from "../../(protected)/admin/teaching/actions";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function MasterclassSessionPage({
  params,
}: Readonly<{ params: { id: string } }>) {
  const user = await requireActiveUser();
  const isAdmin = user.role === Role.ADMIN;

  const session = await prisma.teachingSession.findUnique({
    where: { id: params.id },
    include: {
      artifacts: { orderBy: { createdAt: "asc" } },
      boards: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!session) {
    notFound();
  }

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Masterclass session</p>
        <h1>{session.title}</h1>
        <p>{session.topic || "No topic added yet."}</p>
        <p className="teaching-date">
          {session.sessionDate ? dateFormatter.format(session.sessionDate) : "No session date set"}
        </p>

        {isAdmin ? (
          <form action={updateTeachingSession} className="stacked-form teaching-form compact-form">
            <input type="hidden" name="sessionId" value={session.id} />
            <label htmlFor="title">Edit title</label>
            <input id="title" name="title" defaultValue={session.title} required />

            <label htmlFor="topic">Edit topic or notes</label>
            <textarea id="topic" name="topic" defaultValue={session.topic ?? ""} rows={3} />

            <label htmlFor="sessionDate">Edit session date</label>
            <input
              id="sessionDate"
              name="sessionDate"
              type="date"
              defaultValue={formatDateInput(session.sessionDate)}
            />

            <button className="button" type="submit">
              Save session details
            </button>
          </form>
        ) : null}

        <div className="teaching-board-section">
          <div>
            <p className="section-label">In-app whiteboards</p>
            <h2>Excalidraw boards</h2>
            <p>
              {isAdmin
                ? "Create, teach with, and share saved whiteboards with members."
                : "View the whiteboards shared for this session."}
            </p>
          </div>

          {isAdmin ? (
            <form action={createTeachingBoard} className="stacked-form teaching-form compact-form">
              <input type="hidden" name="sessionId" value={session.id} />
              <label htmlFor="boardTitle">Board title</label>
              <input
                id="boardTitle"
                name="title"
                placeholder="Whiteboard for graph traversal"
                required
              />
              <button className="button" type="submit">
                Create Excalidraw board
              </button>
            </form>
          ) : null}

          <div className="teaching-session-list">
            {session.boards.length === 0 ? (
              <p>No Excalidraw boards created yet.</p>
            ) : (
              session.boards.map((board) => (
                <article className="teaching-board-row" key={board.id}>
                  <div>
                    <strong>{board.title}</strong>
                    <small>Updated {dateFormatter.format(board.updatedAt)}</small>
                  </div>
                  <a className="secondary-button" href={`/boards/${board.id}`}>
                    View
                  </a>
                  {isAdmin ? (
                    <>
                      <a className="button" href={`/masterclass/${session.id}/board/${board.id}`}>
                        Open editor
                      </a>
                      <form action={deleteTeachingBoard}>
                        <input type="hidden" name="sessionId" value={session.id} />
                        <input type="hidden" name="boardId" value={board.id} />
                        <button className="secondary-button" type="submit">
                          Remove
                        </button>
                      </form>
                    </>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>

        <div className="teaching-artifact-list">
          {session.artifacts.length === 0 ? (
            <p>No artifacts attached yet.</p>
          ) : (
            session.artifacts.map((artifact) => (
              <article className="teaching-artifact-row" key={artifact.id}>
                <div>
                  <p className="section-label">{teachingArtifactLabels[artifact.type]}</p>
                  <h2>{artifact.label || teachingArtifactLabels[artifact.type]}</h2>
                  <a className="text-link" href={artifact.url} rel="noreferrer" target="_blank">
                    {artifact.url}
                  </a>
                </div>
                {isAdmin ? (
                  <form action={removeTeachingArtifact}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <input type="hidden" name="artifactId" value={artifact.id} />
                    <button className="secondary-button" type="submit">
                      Remove
                    </button>
                  </form>
                ) : null}
              </article>
            ))
          )}
        </div>

        {isAdmin ? (
          <form action={addTeachingArtifact} className="stacked-form teaching-form">
            <input type="hidden" name="sessionId" value={session.id} />

            <label htmlFor="type">Artifact type</label>
            <select id="type" name="type" required>
              {teachingArtifactTypes.map((type) => (
                <option key={type} value={type}>
                  {teachingArtifactLabels[type]}
                </option>
              ))}
            </select>

            <label htmlFor="label">Label</label>
            <input id="label" name="label" placeholder="Week 1 slides" />

            <label htmlFor="url">Artifact URL</label>
            <input id="url" name="url" placeholder="https://..." required type="url" />

            <button className="button" type="submit">
              Add artifact
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
