import { ResourceType } from "@prisma/client";
import { requireAdmin } from "../../../../../lib/auth/admin";
import { prisma } from "../../../../../lib/prisma";
import { createResource } from "../../../../../lib/bookshelf/actions";

export const dynamic = "force-dynamic";

interface NewResourcePageProps {
  searchParams?: {
    error?: string;
  };
}

export default async function NewResourcePage({ searchParams }: NewResourcePageProps) {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">Admin &rsaquo; Bookshelf</p>
        <h1>Add learning resource.</h1>
        <p>Introduce a new curation to the community shelf.</p>

        {/* Error Notifications */}
        {searchParams?.error === "validation-failed" ? (
          <p className="form-message error">
            Failed to save resource. Please check that all required fields are filled correctly and URLs are valid.
          </p>
        ) : null}
        {searchParams?.error === "duplicate-resource" ? (
          <p className="form-message error">
            A resource with this title already exists in the selected category.
          </p>
        ) : null}

        <form action={createResource} className="stacked-form">
          <label>
            Title *
            <input name="title" required type="text" placeholder="e.g. Designing Data-Intensive Applications" />
          </label>

          <label>
            Author
            <input name="author" type="text" placeholder="e.g. Martin Kleppmann" />
          </label>

          <label>
            Description (Not stored)
            <textarea
              name="description"
              placeholder="A short synopsis of the resource... (Note: This field is for reference only and is not saved to the database)"
            />
          </label>

          <label>
            Resource Type *
            <select name="type" required style={{ width: "100%", padding: "13px 14px", border: "1px solid var(--line)", background: "var(--surface)" }}>
              <option value="">Select a type...</option>
              {Object.keys(ResourceType).map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label>
            Category *
            <select name="categoryId" required style={{ width: "100%", padding: "13px 14px", border: "1px solid var(--line)", background: "var(--surface)" }}>
              <option value="">Select a category...</option>
              {categories.map((cat: { id: string; name: string }) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Recommendation Reason
            <textarea
              name="recommendationReason"
              placeholder="Why should members check this out? What are the key learnings?"
            />
          </label>

          <label>
            Resource Link (URL)
            <input name="resourceLink" type="url" placeholder="https://example.com/resource" />
          </label>

          <label>
            Buy Link (URL)
            <input name="buyLink" type="url" placeholder="https://amazon.com/book-page" />
          </label>

          <label>
            Image Cover URL *
            <input
              name="imageUrl"
              required
              type="url"
              placeholder="https://example.com/cover-image.jpg"
            />
          </label>

          <div style={{ display: "flex", gap: "14px", marginTop: "14px" }}>
            <button className="button" type="submit">
              Save Resource
            </button>
            <a href="/admin/bookshelf" className="secondary-button" style={{ textDecoration: "none" }}>
              Cancel
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
