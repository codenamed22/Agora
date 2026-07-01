import { notFound } from "next/navigation";
import ExcalidrawBoard from "../../../boards/excalidraw-board";
import { requireActiveUser } from "../../../../lib/guards";
import { memberDisplayName } from "../../../../lib/members";
import { prisma } from "../../../../lib/prisma";
import {
  emptyTeachingScene,
  sanitizeTeachingScene,
  teachingSceneSchema,
} from "../../../../lib/teaching";
import { deleteBoard, renameBoard, saveBoard } from "../actions";

export const dynamic = "force-dynamic";

export default async function DesignBoardPage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams?: { error?: string } }>) {
  const user = await requireActiveUser();

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { name: true, email: true, profile: { select: { displayName: true } } } },
    },
  });

  if (!board) {
    notFound();
  }

  const isOwner = board.ownerId === user.id;
  const scene = teachingSceneSchema.safeParse(board.scene ?? emptyTeachingScene);

  return (
    <main className="app-shell excalidraw-page-shell">
      <section className="app-card wide-card">
        <p className="section-label">Practice · Design board</p>
        <h1>{board.title}</h1>
        <p className="muted-line">
          By {memberDisplayName(board.owner)}
          {isOwner ? " · You can edit this board" : " · Read-only"}
        </p>

        {searchParams?.error === "title" ? (
          <div className="form-message error">Give your board a name (2–80 characters).</div>
        ) : null}

        {isOwner ? (
          <div className="board-owner-actions">
            <form action={renameBoard} className="board-rename-form">
              <input type="hidden" name="boardId" value={board.id} />
              <input
                name="title"
                defaultValue={board.title}
                required
                maxLength={80}
                aria-label="Board name"
              />
              <button className="secondary-button" type="submit">
                Rename
              </button>
            </form>
            <form action={deleteBoard}>
              <input type="hidden" name="boardId" value={board.id} />
              <button className="secondary-button" type="submit">
                Delete
              </button>
            </form>
          </div>
        ) : null}

        <ExcalidrawBoard
          boardId={board.id}
          editable={isOwner}
          initialScene={scene.success ? sanitizeTeachingScene(scene.data) : emptyTeachingScene}
          saveAction={saveBoard}
        />

        <div className="event-detail-actions">
          <a className="text-link" href="/practice/design">
            ← Back to Design Boards
          </a>
        </div>
      </section>
    </main>
  );
}
