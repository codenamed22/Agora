import { notFound } from "next/navigation";
import AccountBar from "../../account-bar";
import ExcalidrawBoard from "../excalidraw-board";
import { requireActiveUser } from "../../../lib/guards";
import { prisma } from "../../../lib/prisma";
import {
  emptyTeachingScene,
  sanitizeTeachingScene,
  teachingSceneSchema,
} from "../../../lib/teaching";

export default async function TeachingBoardViewerPage({
  params,
}: Readonly<{ params: { boardId: string } }>) {
  await requireActiveUser();

  const board = await prisma.teachingBoard.findUnique({
    where: { id: params.boardId },
    include: { session: { select: { title: true, topic: true } } },
  });

  if (!board) {
    notFound();
  }

  const scene = teachingSceneSchema.safeParse(board.scene ?? emptyTeachingScene);

  return (
    <>
      <AccountBar />
      <main className="app-shell excalidraw-page-shell">
        <section className="app-card wide-card">
          <p className="section-label">Teaching board</p>
          <h1>{board.title}</h1>
          <p>{board.session.topic || board.session.title}</p>
          <ExcalidrawBoard
            boardId={board.id}
            editable={false}
            initialScene={scene.success ? sanitizeTeachingScene(scene.data) : emptyTeachingScene}
          />
        </section>
      </main>
    </>
  );
}
