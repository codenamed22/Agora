import { notFound } from "next/navigation";
import ExcalidrawBoard from "../../../../boards/excalidraw-board";
import { saveTeachingBoard } from "../../../../(protected)/admin/teaching/actions";
import { requireAdmin } from "../../../../../lib/guards";
import { prisma } from "../../../../../lib/prisma";
import {
  emptyTeachingScene,
  sanitizeTeachingScene,
  teachingSceneSchema,
} from "../../../../../lib/teaching";

export default async function MasterclassBoardEditorPage({
  params,
}: Readonly<{ params: { id: string; boardId: string } }>) {
  await requireAdmin();

  const board = await prisma.teachingBoard.findFirst({
    where: { id: params.boardId, sessionId: params.id },
    include: { session: { select: { title: true } } },
  });

  if (!board) {
    notFound();
  }

  const scene = teachingSceneSchema.safeParse(board.scene ?? emptyTeachingScene);

  return (
    <main className="app-shell excalidraw-page-shell">
      <section className="app-card wide-card">
        <p className="section-label">Masterclass board editor</p>
        <h1>{board.title}</h1>
        <p>
          Masterclass session: <a href={`/masterclass/${params.id}`}>{board.session.title}</a>
        </p>
        <ExcalidrawBoard
          boardId={board.id}
          editable={true}
          initialScene={scene.success ? sanitizeTeachingScene(scene.data) : emptyTeachingScene}
          saveAction={saveTeachingBoard}
        />
      </section>
    </main>
  );
}
