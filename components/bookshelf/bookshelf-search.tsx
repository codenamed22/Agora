"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function BookshelfSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim() === "") {
      params.delete("q");
    } else {
      params.set("q", query.trim());
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="stacked-form" style={{ margin: "24px 0 16px" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources by title, author, or keywords..."
          style={{ flexGrow: 1 }}
        />
        <button className="button" type="submit" style={{ minHeight: "46px", marginTop: 0 }}>
          Search
        </button>
      </div>
    </form>
  );
}
