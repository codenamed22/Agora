"use client";

import { useEffect, useState, type ReactNode } from "react";

type LayoutMode = "classic" | "split";

const layoutPreferenceKey = "problem-layout-preference";

function isLayoutMode(value: string | null): value is LayoutMode {
  return value === "classic" || value === "split";
}

export function ProblemLayoutShell({
  backLink,
  problemDetails,
  problemHeader,
  submissionSection,
}: Readonly<{
  backLink: ReactNode;
  problemDetails: ReactNode;
  problemHeader: ReactNode;
  submissionSection: ReactNode;
}>) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("classic");

  useEffect(() => {
    const savedLayout = localStorage.getItem(layoutPreferenceKey);

    if (isLayoutMode(savedLayout)) {
      setLayoutMode(savedLayout);
    }
  }, []);

  function chooseLayout(layout: LayoutMode) {
    setLayoutMode(layout);
    localStorage.setItem(layoutPreferenceKey, layout);
  }

  const layoutSelector = (
    <div className="problem-layout-selector" role="group" aria-label="Problem layout">
      <button
        className={layoutMode === "classic" ? "active" : undefined}
        type="button"
        aria-pressed={layoutMode === "classic"}
        onClick={() => chooseLayout("classic")}
      >
        Classic layout
      </button>
      <button
        className={layoutMode === "split" ? "active" : undefined}
        type="button"
        aria-pressed={layoutMode === "split"}
        onClick={() => chooseLayout("split")}
      >
        Split layout
      </button>
    </div>
  );

  if (layoutMode === "classic") {
    return (
      <section className="app-card workspace-card" aria-labelledby="problem-title">
        {problemHeader}
        {layoutSelector}
        {problemDetails}
        {submissionSection}
        {backLink}
      </section>
    );
  }

  return (
    <section className="app-card workspace-card">
      <div className="problem-solving-layout">
        <section className="problem-description-panel" aria-labelledby="problem-title">
          {problemHeader}
          {layoutSelector}
          {problemDetails}
          {backLink}
        </section>

        <section className="problem-workspace-panel" aria-labelledby="submit-solution-title">
          {submissionSection}
        </section>
      </div>
    </section>
  );
}
