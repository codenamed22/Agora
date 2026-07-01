"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ResourceType } from "@prisma/client";

const TYPE_LABELS: Record<string, string> = {
  BOOK: "Books",
  ARTICLE: "Articles",
  COURSE: "Courses",
  VIDEO: "Videos",
  RESEARCH_PAPER: "Research Papers",
};

export default function BookshelfFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeType = searchParams.get("type") ?? "";

  const handleTypeClick = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters =
    searchParams.has("type") || searchParams.has("q") || searchParams.has("sort");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        margin: "16px 0 24px",
      }}
    >
      <div className="bookshelf-filters" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          onClick={() => handleTypeClick("")}
          className={activeType === "" ? "button" : "secondary-button"}
          style={{
            fontSize: "0.85rem",
            padding: "6px 12px",
            minHeight: "36px",
            cursor: "pointer",
            boxShadow: activeType === "" ? "3px 3px 0 var(--ink)" : "none",
          }}
        >
          All Types
        </button>
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => handleTypeClick(type)}
            className={activeType === type ? "button" : "secondary-button"}
            style={{
              fontSize: "0.85rem",
              padding: "6px 12px",
              minHeight: "36px",
              cursor: "pointer",
              boxShadow: activeType === type ? "3px 3px 0 var(--ink)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {hasActiveFilters ? (
        <button
          onClick={() => router.push(pathname)}
          className="secondary-button"
          style={{
            fontSize: "0.85rem",
            padding: "6px 12px",
            minHeight: "36px",
            cursor: "pointer",
            color: "#d33f2f",
            borderColor: "#d33f2f",
          }}
        >
          Clear Filters &times;
        </button>
      ) : null}
    </div>
  );
}
