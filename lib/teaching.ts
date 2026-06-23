import { z } from "zod";

export const MAX_TEACHING_SCENE_BYTES = 1_500_000;

export const teachingArtifactTypes = ["MEET", "SLIDES", "RECORDING", "EXCALIDRAW"] as const;

export const teachingArtifactLabels: Record<(typeof teachingArtifactTypes)[number], string> = {
  MEET: "Google Meet",
  SLIDES: "Docs or slides",
  RECORDING: "Drive recording",
  EXCALIDRAW: "Excalidraw",
};

export const createTeachingSessionSchema = z.object({
  title: z.string().trim().min(2).max(120),
  topic: z.string().trim().max(1000).optional(),
  sessionDate: z.string().trim().optional(),
});

export const teachingArtifactSchema = z.object({
  sessionId: z.string().trim().min(1),
  type: z.enum(teachingArtifactTypes),
  url: z.string().trim().url().max(2000),
  label: z.string().trim().max(120).optional(),
});

export const createTeachingBoardSchema = z.object({
  sessionId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(120),
});

export const teachingSceneSchema = z.object({
  elements: z.array(z.unknown()),
  appState: z.record(z.string(), z.unknown()).default({}),
});

export type TeachingScene = z.infer<typeof teachingSceneSchema>;

export const emptyTeachingScene: TeachingScene = {
  elements: [],
  appState: {},
};

export function parseOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sanitizeTeachingScene(scene: TeachingScene): TeachingScene {
  const { collaborators: _collaborators, ...appState } = scene.appState;

  return {
    elements: scene.elements,
    appState,
  };
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasBinaryFiles(value: unknown) {
  return isRecord(value) && Object.keys(value).length > 0;
}

function hasImageElement(elements: unknown[]) {
  return elements.some((element) => isRecord(element) && element.type === "image");
}

export function parseTeachingSceneJson(sceneJson: string) {
  if (byteLength(sceneJson) > MAX_TEACHING_SCENE_BYTES) {
    return { success: false as const, error: "Scene is too large." };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(sceneJson);
  } catch {
    return { success: false as const, error: "Scene is not valid JSON." };
  }

  if (isRecord(parsedJson) && hasBinaryFiles(parsedJson.files)) {
    return { success: false as const, error: "Images are not supported yet." };
  }

  const parsed = teachingSceneSchema.safeParse(parsedJson);

  if (!parsed.success) {
    return { success: false as const, error: "Scene has an invalid shape." };
  }

  if (hasImageElement(parsed.data.elements)) {
    return { success: false as const, error: "Images are not supported yet." };
  }

  const scene = sanitizeTeachingScene({
    elements: parsed.data.elements,
    appState: parsed.data.appState,
  });

  if (byteLength(JSON.stringify(scene)) > MAX_TEACHING_SCENE_BYTES) {
    return { success: false as const, error: "Scene is too large." };
  }

  return { success: true as const, scene };
}
