"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    return `?${params.toString()}`;
  };

  const handlePageChange = (pageNumber: number) => {
    router.push(createPageUrl(pageNumber));
  };

  return (
    <nav
      className="pagination-container"
      aria-label="Pagination Navigation"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "36px",
        paddingTop: "20px",
        borderTop: "1px solid var(--line)",
      }}
    >
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="secondary-button"
        style={{
          fontSize: "0.9rem",
          padding: "8px 16px",
          cursor: currentPage <= 1 ? "not-allowed" : "pointer",
          opacity: currentPage <= 1 ? 0.5 : 1,
        }}
      >
        Previous
      </button>

      <span style={{ fontWeight: "bold", fontSize: "0.95rem", color: "var(--ink)" }}>
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="secondary-button"
        style={{
          fontSize: "0.9rem",
          padding: "8px 16px",
          cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
          opacity: currentPage >= totalPages ? 0.5 : 1,
        }}
      >
        Next
      </button>
    </nav>
  );
}
