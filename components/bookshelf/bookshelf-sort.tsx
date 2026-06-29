"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function BookshelfSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort") ?? "newest";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const sort = e.target.value;
    if (sort === "newest") {
      params.delete("sort"); // default option, remove to keep URL clean
    } else {
      params.set("sort", sort);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
      <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Sort By:
      </span>
      <select
        value={activeSort}
        onChange={handleSortChange}
        style={{
          padding: "8px 12px",
          border: "1px solid var(--line)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontFamily: "var(--font-main)",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="title-asc">Title A-Z</option>
        <option value="title-desc">Title Z-A</option>
      </select>
    </div>
  );
}
