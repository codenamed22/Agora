import { ResourceType } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../../lib/auth/admin";
import { prisma } from "../../../../../../lib/prisma";
import { updateResource } from "../../../../../../lib/bookshelf/actions";

export const dynamic = "force-dynamic";

interface EditResourcePageProps {
  params: {
    id: string;
  };
  searchParams?: {
    error?: string;
  };
}

export default async function EditResourcePage({ params, searchParams }: EditResourcePageProps) {
  await requireAdmin();

  const resource = await prisma.resource.findUnique({
    where: { id: params.id },
  });

  if (!resource) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // Bind the resource ID to the update action
  const updateResourceWithId = updateResource.bind(null, resource.id);

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">Admin &rsaquo; Bookshelf</p>
        <h1>Edit learning resource.</h1>
        <p>Modify existing information for: {resource.title}</p>

        {/* Error Notifications */}
        {searchParams?.error === "validation-failed" ? (
          <p className="form-message error">
            Failed to update resource. Please check that all required fields are filled correctly and URLs are valid.
          </p>
        ) : null}
        {searchParams?.error === "duplicate-resource" ? (
          <p className="form-message error">
            A resource with this title already exists in the selected category.
          </p>
        ) : null}

        <form action={updateResourceWithId} className="stacked-form">
          <label>
            Title *
            <input
              name="title"
              required
              type="text"
              defaultValue={resource.title}
            />
          </label>

          <label>
            Author
            <input
              name="author"
              type="text"
              defaultValue={resource.author ?? ""}
            />
          </label>

          <label>
            Description (Not stored)
            <textarea
              name="description"
              placeholder="Note: This field is not saved to the database"
            />
          </label>

          <label>
            Resource Type *
            <select
              name="type"
              required
              defaultValue={resource.type}
              style={{ width: "100%", padding: "13px 14px", border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              {Object.keys(ResourceType).map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label>
            Category *
            <select
              name="categoryId"
              required
              defaultValue={resource.categoryId}
              style={{ width: "100%", padding: "13px 14px", border: "1px solid var(--line)", background: "var(--surface)" }}
            >
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
              defaultValue={resource.recommendationReason ?? ""}
            />
          </label>

          <label>
            Resource Link (URL)
            <input
              name="resourceLink"
              type="url"
              defaultValue={resource.resourceLink ?? ""}
            />
          </label>

          <label>
            Buy Link (URL)
            <input
              name="buyLink"
              type="url"
              defaultValue={resource.buyLink ?? ""}
            />
          </label>

          <label>
            Image Cover URL *
            <input
              name="imageUrl"
              required
              type="url"
              defaultValue={resource.imageUrl ?? ""}
            />
          </label>

          <div style={{ display: "flex", gap: "14px", marginTop: "14px" }}>
            <button className="button" type="submit">
              Update Resource
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
