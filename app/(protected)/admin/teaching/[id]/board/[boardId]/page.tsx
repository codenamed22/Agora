import { redirect } from "next/navigation";

export default async function TeachingBoardEditorPage({
  params,
}: Readonly<{ params: { id: string; boardId: string } }>) {
  redirect(`/masterclass/${params.id}/board/${params.boardId}`);
}
