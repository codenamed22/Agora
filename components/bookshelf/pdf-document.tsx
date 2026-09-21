"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const SEARCH_SNIPPET_MARGIN = 96;

type SearchMatch = { page: number; y: number; pageHeight: number };

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value / SCALE_STEP) * SCALE_STEP));
}

export default function PdfDocument({ title, url }: { title: string; url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadedRef = useRef(false);
  const pendingScrollRef = useRef<SearchMatch | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[] | null>(null);
  const [matchIndex, setMatchIndex] = useState(-1);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setFailed(false);
    setNumPages(0);
    setPageNumber(1);
    setPageInput("1");
    setScale(1);
    setProgress(null);
    setQuery("");
    setMatches(null);
    setMatchIndex(-1);
    setSearching(false);
    pdfDocRef.current = null;
    loadedRef.current = false;
    pendingScrollRef.current = null;
  }, [url]);

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  const goPage = useCallback(
    (delta: number) => {
      setPageNumber((page) => Math.min(Math.max(1, page + delta), Math.max(1, numPages || 1)));
    },
    [numPages],
  );

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput, 10);

    if (Number.isNaN(parsed)) {
      setPageInput(String(pageNumber));
      return;
    }

    setPageNumber(Math.min(Math.max(1, parsed), Math.max(1, numPages || 1)));
  };

  const zoom = (delta: number) => {
    setScale((value) => clampScale(value + delta));
  };

  const fitHeight = async () => {
    const pdf = pdfDocRef.current;
    const container = containerRef.current;
    if (!pdf || !container || container.clientHeight <= 0) return;

    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const baseWidth = Math.max(240, container.clientWidth - 32);
      const renderedHeightAt1 = baseWidth * (viewport.height / viewport.width);
      const visibleHeight = container.clientHeight - 32;
      setScale(clampScale(visibleHeight / renderedHeightAt1));
    } catch {
      // Ignore transient page load errors while fitting.
    }
  };

  const scrollToMatch = (match: SearchMatch) => {
    const container = containerRef.current;
    const pageEl = container?.querySelector(`.react-pdf__Page[data-page-number="${match.page}"]`);

    if (!container || !pageEl) {
      return;
    }

    const renderedHeight = pageEl.getBoundingClientRect().height;
    const target = (match.y / match.pageHeight) * renderedHeight;
    container.scrollTop = Math.max(0, target - SEARCH_SNIPPET_MARGIN);
  };

  const goToMatch = (match: SearchMatch) => {
    pendingScrollRef.current = match;

    if (match.page === pageNumber) {
      pendingScrollRef.current = null;
      scrollToMatch(match);
    } else {
      setPageNumber(match.page);
    }
  };

  const stepMatch = (direction: 1 | -1) => {
    if (!matches || matches.length === 0) return;
    const next = (matchIndex + direction + matches.length) % matches.length;
    setMatchIndex(next);
    goToMatch(matches[next]);
  };

  const runSearch = async (rawQuery: string) => {
    const pdf = pdfDocRef.current;
    const needle = rawQuery.trim().toLowerCase();

    if (!pdf || !needle) {
      setMatches(null);
      setMatchIndex(-1);
      return;
    }

    setSearching(true);

    try {
      const found: SearchMatch[] = [];

      for (let page = 1; page <= pdf.numPages; page++) {
        const pdfPage = await pdf.getPage(page);
        const viewport = pdfPage.getViewport({ scale: 1 });
        const textContent = await pdfPage.getTextContent();

        let text = "";
        const segmentStarts: number[] = [];
        const segmentYs: number[] = [];

        for (const raw of textContent.items) {
          const item = raw as { str?: string; transform?: number[] };
          const str = item.str ?? "";

          if (!str) continue;

          segmentStarts.push(text.length);
          segmentYs.push(viewport.height - (item.transform?.[5] ?? 0));
          text += str;
        }

        const lower = text.toLowerCase();
        let index = lower.indexOf(needle);

        while (index !== -1) {
          let y = 0;

          for (let s = 0; s < segmentStarts.length; s++) {
            if (segmentStarts[s] <= index) {
              y = segmentYs[s];
            } else {
              break;
            }
          }

          found.push({ page, y, pageHeight: viewport.height });
          index = lower.indexOf(needle, index + Math.max(1, needle.length));
        }
      }

      setMatches(found);
      setMatchIndex(found.length > 0 ? 0 : -1);

      if (found.length > 0) {
        goToMatch(found[0]);
      }
    } catch {
      // A failed text pass leaves the previous results intact.
    } finally {
      setSearching(false);
    }
  };

  const handleDocumentLoad = (pdf: PDFDocumentProxy) => {
    pdfDocRef.current = pdf;
    loadedRef.current = true;
    setFailed(false);
    setNumPages(pdf.numPages);
    setProgress(null);
    setMatches(null);
    setMatchIndex(-1);
    setPageNumber((page) => Math.min(page, pdf.numPages));
  };

  const handlePageRenderSuccess = ({ pageNumber: renderedPage }: { pageNumber: number }) => {
    const container = containerRef.current;
    const pending = pendingScrollRef.current;

    if (!container) return;

    if (pending && pending.page === renderedPage) {
      pendingScrollRef.current = null;
      scrollToMatch(pending);
    } else if (!pending) {
      container.scrollTop = 0;
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goPage(1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goPage(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setPageNumber(1);
      } else if (event.key === "End") {
        event.preventDefault();
        setPageNumber(numPages);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoom(SCALE_STEP);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoom(-SCALE_STEP);
      } else if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPage, numPages]);

  if (failed) {
    return (
      <div className="paper-reader-message" role="alert">
        <p>This paper could not be displayed here.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="secondary-button">
          Open PDF in a new tab
        </a>
      </div>
    );
  }

  const searchStatus = searching
    ? "Searching…"
    : matches
      ? matches.length > 0
        ? `${matchIndex + 1} of ${matches.length}`
        : query
          ? "No matches"
          : ""
      : "";

  return (
    <div className="paper-reader-workspace">
      <div className="paper-reader-controls" aria-label="PDF controls">
        <div className="paper-reader-control-group">
          <button
            type="button"
            onClick={() => setPageNumber(1)}
            disabled={pageNumber <= 1}
            aria-label="First page"
          >
            &laquo;
          </button>
          <button type="button" onClick={() => goPage(-1)} disabled={pageNumber <= 1}>
            Previous
          </button>
          <span aria-live="polite">
            Page {pageNumber} of {numPages || "…"}
          </span>
          <button
            type="button"
            onClick={() => goPage(1)}
            disabled={!numPages || pageNumber >= numPages}
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setPageNumber(numPages)}
            disabled={!numPages || pageNumber >= numPages}
            aria-label="Last page"
          >
            &raquo;
          </button>
          <input
            className="paper-reader-page-input"
            type="number"
            min={1}
            max={numPages || undefined}
            aria-label="Go to page"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={commitPageInput}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitPageInput();
                (event.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>
        <span className="paper-reader-control-divider" aria-hidden="true" />
        <div className="paper-reader-control-group">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoom(-SCALE_STEP)}
            disabled={scale <= MIN_SCALE}
          >
            −
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoom(SCALE_STEP)}
            disabled={scale >= MAX_SCALE}
          >
            +
          </button>
          <button type="button" onClick={() => void fitHeight()}>
            Fit height
          </button>
        </div>
        <span className="paper-reader-control-divider" aria-hidden="true" />
        <div className="paper-reader-control-group paper-reader-search-group">
          <input
            ref={searchInputRef}
            className="paper-reader-search-input"
            type="search"
            placeholder="Search PDF"
            aria-label="Search in this PDF"
            value={query}
            disabled={searching}
            onChange={(event) => {
              setQuery(event.target.value);
              setMatches(null);
              setMatchIndex(-1);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void runSearch(query);
              } else if (event.key === "Escape") {
                setQuery("");
                setMatches(null);
                setMatchIndex(-1);
              }
            }}
          />
          <button
            type="button"
            aria-label="Previous match"
            onClick={() => stepMatch(-1)}
            disabled={!matches || matches.length === 0 || searching}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Next match"
            onClick={() => stepMatch(1)}
            disabled={!matches || matches.length === 0 || searching}
          >
            ↓
          </button>
          <span className="paper-reader-search-status" aria-live="polite">
            {searchStatus}
          </span>
        </div>
      </div>

      <div ref={containerRef} className="paper-reader-document">
        <div className="paper-reader-progress" aria-hidden="true">
          <div
            className="paper-reader-progress-bar"
            style={{ width: `${numPages ? (pageNumber / numPages) * 100 : 0}%` }}
          />
        </div>
        {progress ? (
          <div className="paper-reader-message">
            <p>
              Loading {title}…{" "}
              {progress.total > 0 ? `${Math.round((progress.loaded / progress.total) * 100)}%` : ""}
            </p>
          </div>
        ) : null}
        <Document
          file={url}
          loading={<p className="paper-reader-message">Loading {title}…</p>}
          onLoadProgress={({ loaded, total }) => {
            if (!loadedRef.current) {
              setProgress({ loaded, total });
            }
          }}
          onLoadSuccess={(pdf) => handleDocumentLoad(pdf)}
          onLoadError={() => setFailed(true)}
          onSourceError={() => setFailed(true)}
        >
          {containerWidth > 0 ? (
            <Page
              pageNumber={pageNumber}
              width={Math.max(240, containerWidth - 32)}
              scale={scale}
              renderAnnotationLayer={false}
              onRenderSuccess={handlePageRenderSuccess}
            />
          ) : null}
        </Document>
      </div>
    </div>
  );
}
