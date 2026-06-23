"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/guards";
import {
  createTeachingBoardSchema,
  createTeachingSessionSchema,
  parseTeachingSceneJson,
  parseOptionalDate,
  teachingArtifactSchema,
} from "../../../../lib/teaching";

export async function createTeachingSession(formData: FormData) {
  const user = await requireAdmin();
  const parsed = createTeachingSessionSchema.safeParse({
    title: formData.get("title"),
    topic: formData.get("topic") ?? "",
    sessionDate: formData.get("sessionDate") ?? "",
  });

  if (!parsed.success) {
    redirect("/masterclass?error=invalid-session");
  }

  const session = await prisma.teachingSession.create({
    data: {
      title: parsed.data.title,
      topic: parsed.data.topic || null,
      sessionDate: parseOptionalDate(parsed.data.sessionDate),
      createdById: user.id,
    },
    select: { id: true },
  });

  revalidatePath("/masterclass");
  redirect(`/masterclass/${session.id}`);
}

export async function updateTeachingSession(formData: FormData) {
  await requireAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");
  const parsed = createTeachingSessionSchema.safeParse({
    title: formData.get("title"),
    topic: formData.get("topic") ?? "",
    sessionDate: formData.get("sessionDate") ?? "",
  });

  if (!sessionId || !parsed.success) {
    redirect("/masterclass?error=invalid-session");
  }

  await prisma.teachingSession.update({
    where: { id: sessionId },
    data: {
      title: parsed.data.title,
      topic: parsed.data.topic || null,
      sessionDate: parseOptionalDate(parsed.data.sessionDate),
    },
  });

  revalidatePath("/masterclass");
  revalidatePath(`/masterclass/${sessionId}`);
}

export async function addTeachingArtifact(formData: FormData) {
  await requireAdmin();
  const parsed = teachingArtifactSchema.safeParse({
    sessionId: formData.get("sessionId"),
    type: formData.get("type"),
    url: formData.get("url"),
    label: formData.get("label") ?? "",
  });

  if (!parsed.success) {
    redirect("/masterclass?error=invalid-artifact");
  }

  const session = await prisma.teachingSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: { id: true },
  });

  if (!session) {
    redirect("/masterclass");
  }

  await prisma.teachingArtifact.create({
    data: {
      sessionId: parsed.data.sessionId,
      type: parsed.data.type,
      url: parsed.data.url,
      label: parsed.data.label || null,
    },
  });

  revalidatePath("/masterclass");
  revalidatePath(`/masterclass/${parsed.data.sessionId}`);
}

export async function removeTeachingArtifact(formData: FormData) {
  await requireAdmin();
  const artifactId = String(formData.get("artifactId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!artifactId || !sessionId) {
    redirect("/masterclass");
  }

  await prisma.teachingArtifact.deleteMany({
    where: { id: artifactId, sessionId },
  });

  revalidatePath("/masterclass");
  revalidatePath(`/masterclass/${sessionId}`);
}

export async function createTeachingBoard(formData: FormData) {
  await requireAdmin();
  const parsed = createTeachingBoardSchema.safeParse({
    sessionId: formData.get("sessionId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect("/masterclass?error=invalid-board");
  }

  const session = await prisma.teachingSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: { id: true },
  });

  if (!session) {
    redirect("/masterclass");
  }

  const board = await prisma.teachingBoard.create({
    data: {
      sessionId: parsed.data.sessionId,
      title: parsed.data.title,
      scene: { elements: [], appState: {} },
    },
    select: { id: true },
  });

  revalidatePath("/masterclass");
  revalidatePath(`/masterclass/${parsed.data.sessionId}`);
  redirect(`/masterclass/${parsed.data.sessionId}/board/${board.id}`);
}

export async function saveTeachingBoard(formData: FormData) {
  await requireAdmin();
  const boardId = String(formData.get("boardId") ?? "");
  const sceneJson = String(formData.get("sceneJson") ?? "");

  if (!boardId || !sceneJson) {
    return { ok: false, error: "Missing board data." };
  }

  const parsed = parseTeachingSceneJson(sceneJson);

  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }

  const board = await prisma.teachingBoard.findUnique({
    where: { id: boardId },
    select: { sessionId: true },
  });

  if (!board) {
    return { ok: false, error: "Board was not found." };
  }

  await prisma.teachingBoard.update({
    where: { id: boardId },
    data: {
      scene: parsed.scene as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/masterclass/${board.sessionId}`);
  revalidatePath(`/masterclass/${board.sessionId}/board/${boardId}`);
  revalidatePath(`/boards/${boardId}`);

  return { ok: true, error: null };
}

export async function deleteTeachingBoard(formData: FormData) {
  await requireAdmin();
  const boardId = String(formData.get("boardId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!boardId || !sessionId) {
    redirect("/masterclass");
  }

  await prisma.teachingBoard.deleteMany({
    where: { id: boardId, sessionId },
  });

  revalidatePath("/masterclass");
  revalidatePath(`/masterclass/${sessionId}`);
}
