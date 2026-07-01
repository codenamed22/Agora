"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveUser } from "../../../lib/guards";
import { prisma } from "../../../lib/prisma";
import { emptyTeachingScene, parseTeachingSceneJson } from "../../../lib/teaching";
import { MAX_BOARDS_PER_USER } from "./constants";

const titleSchema = z.string().trim().min(2).max(80);

export async function createBoard(formData: FormData) {
  const user = await requireActiveUser();

  const parsedTitle = titleSchema.safeParse(formData.get("title"));
  if (!parsedTitle.success) {
    redirect("/practice/design?error=title");
  }

  const count = await prisma.board.count({ where: { ownerId: user.id } });
  if (count >= MAX_BOARDS_PER_USER) {
    redirect("/practice/design?error=limit");
  }

  const board = await prisma.board.create({
    data: {
      ownerId: user.id,
      title: parsedTitle.data,
      scene: emptyTeachingScene as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  redirect(`/practice/design/${board.id}`);
}

export async function saveBoard(formData: FormData) {
  const user = await requireActiveUser();
  const boardId = String(formData.get("boardId") ?? "");
  const sceneJson = String(formData.get("sceneJson") ?? "");

  if (!boardId || !sceneJson) {
    return { ok: false, error: "Missing board data." };
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });

  if (!board || board.ownerId !== user.id) {
    return { ok: false, error: "You can only edit your own boards." };
  }

  const parsed = parseTeachingSceneJson(sceneJson);
  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }

  await prisma.board.update({
    where: { id: boardId },
    data: { scene: parsed.scene as Prisma.InputJsonValue },
  });

  revalidatePath(`/practice/design/${boardId}`);
  return { ok: true, error: null };
}

export async function renameBoard(formData: FormData) {
  const user = await requireActiveUser();
  const boardId = String(formData.get("boardId") ?? "");
  const parsedTitle = titleSchema.safeParse(formData.get("title"));

  if (!boardId || !parsedTitle.success) {
    redirect(`/practice/design/${boardId}?error=title`);
  }

  // updateMany scopes to the owner, so a non-owner can't rename someone else's board.
  await prisma.board.updateMany({
    where: { id: boardId, ownerId: user.id },
    data: { title: parsedTitle.data },
  });

  revalidatePath(`/practice/design/${boardId}`);
  redirect(`/practice/design/${boardId}`);
}

export async function deleteBoard(formData: FormData) {
  const user = await requireActiveUser();
  const boardId = String(formData.get("boardId") ?? "");

  if (boardId) {
    await prisma.board.deleteMany({ where: { id: boardId, ownerId: user.id } });
  }

  revalidatePath("/practice/design");
  redirect("/practice/design");
}
