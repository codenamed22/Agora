import { formatBytes } from "../../../../lib/bookshelf/format";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";
import { deleteResource } from "./actions";

export default async function AdminBookshelfPage() {
  await requireAdmin();
  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true, slug: true } } },
  });

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Bookshelf</h1>
        <p>Create and manage bookshelf resources, including full PDFs for the in-app reader.</p>

        <a className="button" href="/admin/bookshelf/new">
          Create resource
        </a>

        <div className="member-badge-admin-list">
          {resources.length === 0 ? (
            <p>No resources yet. Create the first one.</p>
          ) : (
            resources.map((resource) => (
              <article className="member-badge-admin-row" key={resource.id}>
                <div>
                  <strong>{resource.title}</strong>
                  <small>
                    {resource.category.name} · {resource.type.replace("_", " ")}
                    {resource.pdfUrl
                      ? ` · PDF ${formatBytes(resource.pdfSizeBytes)}`
                      : " · link only"}
                  </small>
                </div>
                <a className="secondary-button" href={`/admin/bookshelf/${resource.id}`}>
                  Manage
                </a>
                <form action={deleteResource}>
                  <input type="hidden" name="resourceId" value={resource.id} />
                  <button className="secondary-button" type="submit">
                    Delete
                  </button>
                </form>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
