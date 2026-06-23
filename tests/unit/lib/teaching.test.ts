import { describe, expect, it } from "vitest";
import {
  MAX_TEACHING_SCENE_BYTES,
  parseTeachingSceneJson,
  sanitizeTeachingScene,
  teachingArtifactSchema,
} from "../../../lib/teaching";

describe("teaching artifact validation", () => {
  it("accepts a known artifact type and valid URL", () => {
    const parsed = teachingArtifactSchema.safeParse({
      sessionId: "session-1",
      type: "SLIDES",
      url: "https://docs.google.com/presentation/d/example",
      label: "Week 1 slides",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unknown artifact types", () => {
    const parsed = teachingArtifactSchema.safeParse({
      sessionId: "session-1",
      type: "WHITEBOARD",
      url: "https://example.com",
      label: "Board",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid URLs", () => {
    const parsed = teachingArtifactSchema.safeParse({
      sessionId: "session-1",
      type: "MEET",
      url: "not a url",
      label: "Meet",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("teaching scene validation", () => {
  it("accepts a valid Excalidraw scene", () => {
    const parsed = parseTeachingSceneJson(
      JSON.stringify({
        elements: [],
        appState: { viewBackgroundColor: "#fffef8" },
        files: {},
      }),
    );

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const parsed = parseTeachingSceneJson("not json");

    expect(parsed.success).toBe(false);
  });

  it("rejects scenes without an elements array", () => {
    const parsed = parseTeachingSceneJson(JSON.stringify({ appState: {} }));

    expect(parsed.success).toBe(false);
  });

  it("rejects oversized scenes", () => {
    const parsed = parseTeachingSceneJson("x".repeat(MAX_TEACHING_SCENE_BYTES + 1));

    expect(parsed.success).toBe(false);
  });

  it("rejects image files until object storage is added", () => {
    const parsed = parseTeachingSceneJson(
      JSON.stringify({
        elements: [],
        appState: {},
        files: { image1: { dataURL: "data:image/png;base64,abc" } },
      }),
    );

    expect(parsed.success).toBe(false);
  });

  it("rejects image elements until object storage is added", () => {
    const parsed = parseTeachingSceneJson(
      JSON.stringify({
        elements: [{ id: "image1", type: "image" }],
        appState: {},
        files: {},
      }),
    );

    expect(parsed.success).toBe(false);
  });

  it("strips collaborators because JSON turns Excalidraw's Map into a plain object", () => {
    const parsed = parseTeachingSceneJson(
      JSON.stringify({
        elements: [],
        appState: { collaborators: {}, viewBackgroundColor: "#fffef8" },
        files: {},
      }),
    );

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.scene.appState).toEqual({ viewBackgroundColor: "#fffef8" });
    }

    expect(
      sanitizeTeachingScene({
        elements: [],
        appState: { collaborators: {}, viewBackgroundColor: "#fffef8" },
      }).appState,
    ).toEqual({ viewBackgroundColor: "#fffef8" });
  });
});
