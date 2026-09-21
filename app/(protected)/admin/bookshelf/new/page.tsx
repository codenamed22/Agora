import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/guards";
import { prisma } from "../../../../../lib/prisma";
import { createResource } from "../actions";
import ResourceFormFields from "../resource-form-fields";

const errors: Record<string, string> = {
  invalid: "Check the resource fields.",
  missing: "Attach a PDF to the resource.",
  pdf: "Upload a PDF file up to 50MB.",
  cover: "The cover preview could not be saved.",
  storage: "PDF storage is not configured yet. Add BLOB_READ_WRITE_TOKEN.",
};

export default async function AdminNewResourcePage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    notFound();
  }

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>New resource</h1>
        <p>Add a book, article, course, video, or research paper to the bookshelf.</p>
        {searchParams?.error ? (
          <div className="form-message error">{errors[searchParams.error] ?? errors.invalid}</div>
        ) : null}

        <form action={createResource} className="stacked-form compact-form">
          <ResourceFormFields categories={categories} />

          <div className="modal-actions">
            <button className="button" type="submit">
              Create resource
            </button>
            <a className="text-link" href="/admin/bookshelf">
              Back to bookshelf
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
