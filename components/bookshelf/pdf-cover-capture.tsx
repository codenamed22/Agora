"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const COVER_WIDTH = 900;
const JPEG_QUALITY = 0.85;

type CoverStatus = "idle" | "working" | "ready" | "error";

export default function PdfCoverCapture() {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CoverStatus>("idle");

  const clearCover = useCallback(() => {
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }, []);

  const generateCover = useCallback(
    async (file: File) => {
      setStatus("working");

      try {
        const buffer = await file.arrayBuffer();
        const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
        const doc = await task.promise;

        try {
          const page = await doc.getPage(1);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = COVER_WIDTH / baseViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Canvas 2D context unavailable");
          }

          await page.render({ canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
          );

          if (!blob) {
            throw new Error("Cover image encoding failed");
          }

          const transfer = new DataTransfer();
          transfer.items.add(new File([blob], "cover.jpg", { type: "image/jpeg" }));
          if (coverInputRef.current) {
            coverInputRef.current.files = transfer.files;
          }
          setStatus("ready");
        } finally {
          await doc.destroy();
        }
      } catch (error) {
        console.error("pdf-cover-capture failed", error);
        clearCover();
        setStatus("error");
      }
    },
    [clearCover],
  );

  useEffect(() => {
    const input = document.getElementById("pdf") as HTMLInputElement | null;

    if (!input) {
      return;
    }

    const onChange = () => {
      const file = input.files?.[0];

      if (!file) {
        clearCover();
        setStatus("idle");
        return;
      }

      void generateCover(file);
    };

    input.addEventListener("change", onChange);
    return () => input.removeEventListener("change", onChange);
  }, [clearCover, generateCover]);

  return (
    <>
      <input ref={coverInputRef} name="cover" type="file" hidden tabIndex={-1} aria-hidden="true" />
      <small className="pdf-cover-status" aria-live="polite">
        {status === "working"
          ? "Generating cover preview…"
          : status === "ready"
            ? "Cover preview ready."
            : status === "error"
              ? "Cover preview failed — the resource will keep its current cover."
              : "The first page of the PDF becomes the cover preview when no cover is set."}
      </small>
    </>
  );
}
