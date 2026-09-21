import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/guards";
import { prisma } from "../../../../../lib/prisma";
import { deleteResource, updateResource } from "../actions";
import ResourceFormFields from "../resource-form-fields";

const errors: Record<string, string> = {
  invalid: "Check the resource fields.",
  missing: "A resource needs a PDF. Upload one or restore the previous one.",
  pdf: "Upload a PDF file up to 50MB.",
  cover: "The cover preview could not be saved.",
  storage: "PDF storage is not configured yet. Add BLOB_READ_WRITE_TOKEN.",
};

export default async function AdminResourcePage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams?: { error?: string } }>) {
  await requireAdmin();
  const [resource, categories] = await Promise.all([
    prisma.resource.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!resource) {
    notFound();
  }

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>{resource.title}</h1>
        <p>
          {resource.type.replace("_", " ")} ·{" "}
          <a className="text-link" href={`/bookshelf/resource/${resource.id}`}>
            View on the bookshelf
          </a>
        </p>
        {searchParams?.error ? (
          <div className="form-message error">{errors[searchParams.error] ?? errors.invalid}</div>
        ) : null}

        <form action={updateResource} className="stacked-form compact-form">
          <input type="hidden" name="resourceId" value={resource.id} />

          <ResourceFormFields
            categories={categories}
            defaults={{
              title: resource.title,
              author: resource.author,
              type: resource.type,
              categoryId: resource.categoryId,
              recommendationReason: resource.recommendationReason,
            }}
            pdf={
              resource.pdfUrl ? { url: resource.pdfUrl, sizeBytes: resource.pdfSizeBytes } : null
            }
          />

          <div className="modal-actions">
            <button className="button" type="submit">
              Save resource
            </button>
            <a className="text-link" href="/admin/bookshelf">
              Back to bookshelf
            </a>
          </div>
        </form>

        <form action={deleteResource} className="event-delete-form">
          <input type="hidden" name="resourceId" value={resource.id} />
          <small>Deleting also removes the uploaded PDF from storage.</small>
          <button className="secondary-button" type="submit">
            Delete resource
          </button>
        </form>
      </section>
    </main>
  );
}
