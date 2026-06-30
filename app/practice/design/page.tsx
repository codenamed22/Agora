import { auth } from "../../../auth";
import { memberDisplayName } from "../../../lib/members";
import { prisma } from "../../../lib/prisma";
import { createBoard } from "./actions";
import { MAX_BOARDS_PER_USER } from "./constants";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function DesignBoardsPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  const session = await auth();
  const isActive = session?.user?.status === "ACTIVE";

  const boards = await prisma.board.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      owner: {
        select: { name: true, email: true, profile: { select: { displayName: true } } },
      },
    },
  });

  const ownedCount = session?.user?.id
    ? await prisma.board.count({ where: { ownerId: session.user.id } })
    : 0;
  const atLimit = ownedCount >= MAX_BOARDS_PER_USER;

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Practice · Design</p>
        <h1>Design Boards</h1>
        <p>
          Collaborative whiteboards for system design and group projects. Anyone can open a board;
          only its creator can edit it. You can keep up to {MAX_BOARDS_PER_USER} boards.
        </p>

        {searchParams?.error === "limit" ? (
          <div className="form-message error">
            You have reached the {MAX_BOARDS_PER_USER}-board limit. Delete a board to create a new
            one.
          </div>
        ) : null}
        {searchParams?.error === "title" ? (
          <div className="form-message error">Give your board a name (2–80 characters).</div>
        ) : null}

        {isActive ? (
          atLimit ? (
            <p className="muted-line">
              You have {ownedCount}/{MAX_BOARDS_PER_USER} boards. Delete one to create another.
            </p>
          ) : (
            <form action={createBoard} className="board-create-form">
              <input
                name="title"
                required
                maxLength={80}
                placeholder="New board name (e.g. Payments system design)"
                aria-label="New board name"
              />
              <button className="button" type="submit">
                Create board
              </button>
            </form>
          )
        ) : (
          <p className="muted-line">
            <a className="text-link" href="/join">
              Sign in
            </a>{" "}
            to create your own boards.
          </p>
        )}

        {boards.length === 0 ? (
          <p className="muted-line">No boards yet. Be the first to create one.</p>
        ) : (
          <div className="board-gallery-grid">
            {boards.map((board) => (
              <a
                className="board-gallery-card"
                key={board.id}
                href={`/practice/design/${board.id}`}
              >
                <h2>{board.title}</h2>
                <span className="board-gallery-owner">{memberDisplayName(board.owner)}</span>
                <span className="board-gallery-date">
                  Updated {dateFormatter.format(board.updatedAt)}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="event-detail-actions">
          <a className="text-link" href="/practice">
            ← Back to Practice
          </a>
        </div>
      </section>
    </main>
  );
}
