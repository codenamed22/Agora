"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import { saveTeachingBoard } from "../(protected)/admin/teaching/actions";
import { emptyTeachingScene, sanitizeTeachingScene, type TeachingScene } from "../../lib/teaching";
import { useTheme } from "../use-theme";

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string;
  }
}

if (typeof window !== "undefined") {
  window.EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/";
}

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => <div className="form-message">Loading Excalidraw...</div>,
  },
);

type SaveState = "idle" | "saving" | "saved" | "error";

function hasImageElement(elements: readonly unknown[]) {
  return elements.some(
    (element) =>
      Boolean(element) &&
      typeof element === "object" &&
      !Array.isArray(element) &&
      (element as { type?: unknown }).type === "image",
  );
}

export default function ExcalidrawBoard({
  boardId,
  editable,
  initialScene,
}: Readonly<{
  boardId: string;
  editable: boolean;
  initialScene: TeachingScene | null;
}>) {
  const sanitizedInitialScene = useMemo(
    () => sanitizeTeachingScene(initialScene ?? emptyTeachingScene),
    [initialScene],
  );
  const theme = useTheme();
  const sceneRef = useRef<TeachingScene>(sanitizedInitialScene);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const initialData = useMemo(
    () =>
      ({
        elements: sanitizedInitialScene.elements,
        appState: {
          viewBackgroundColor: theme === "dark" ? "#151a23" : "#fffef8",
          ...sanitizedInitialScene.appState,
        },
        scrollToContent: true,
        files: {},
      }) as ExcalidrawInitialDataState,
    [sanitizedInitialScene, theme],
  );

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function handleSave() {
    setSaveState("saving");
    setError(null);

    if (hasImageElement(sceneRef.current.elements)) {
      setSaveState("error");
      setError("Images are not supported in boards yet. Remove the image before saving.");
      return;
    }

    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("sceneJson", JSON.stringify(sceneRef.current));

    const result = await saveTeachingBoard(formData);

    if (!result.ok) {
      setSaveState("error");
      setError(result.error);
      return;
    }

    setSaveState("saved");
  }

  async function toggleFullscreen() {
    setError(null);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await fullscreenRef.current?.requestFullscreen();
      }
    } catch {
      setError("Fullscreen is not available in this browser.");
    }
  }

  return (
    <div className="excalidraw-board-shell" ref={fullscreenRef}>
      <div className="excalidraw-toolbar">
        {editable ? (
          <>
            <button
              className="button"
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? "Saving..." : "Save board"}
            </button>
            <span aria-live="polite">
              {saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved" : ""}
            </span>
          </>
        ) : null}
        <button className="secondary-button" type="button" onClick={toggleFullscreen}>
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>
      {error ? <div className="form-message error">{error}</div> : null}
      <div className="excalidraw-canvas-shell" data-testid="excalidraw-board">
        <Excalidraw
          initialData={initialData}
          theme={theme}
          viewModeEnabled={!editable}
          zenModeEnabled={!editable}
          onChange={(elements, appState: AppState, files: BinaryFiles) => {
            if (!editable) {
              return;
            }

            const hasFiles = Object.keys(files).length > 0;

            if (hasFiles) {
              setError("Images are not supported in boards yet. Remove the image before saving.");
            }

            sceneRef.current = sanitizeTeachingScene({
              elements: [...elements],
              appState: appState as unknown as Record<string, unknown>,
            });
          }}
        />
      </div>
    </div>
  );
}
