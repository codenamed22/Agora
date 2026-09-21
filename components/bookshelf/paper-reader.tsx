"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const PdfDocument = dynamic(() => import("./pdf-document"), {
  ssr: false,
  loading: () => <p className="paper-reader-message">Loading reader…</p>,
});

function downloadName(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return `${slug || "document"}.pdf`;
}

export default function PaperReader({
  title,
  url,
  label = "Read online",
}: {
  title: string;
  url: string;
  label?: string;
}) {
  const readerRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () =>
      setIsFullscreen(document.fullscreenElement === readerRef.current);
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await readerRef.current?.requestFullscreen();
    }
  };

  return (
    <section ref={readerRef} className="paper-reader" aria-labelledby="paper-reader-heading">
      <div className="paper-reader-heading">
        <div>
          <p className="section-label">PDF reader</p>
          <h2 id="paper-reader-heading">{label}</h2>
        </div>
        <div className="paper-reader-heading-actions">
          <a
            href={url}
            download={downloadName(title)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            Download PDF
          </a>
          <button
            type="button"
            className="secondary-button"
            aria-pressed={isFullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>
      <PdfDocument title={title} url={url} />
    </section>
  );
}
