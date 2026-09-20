import { requireActiveUser } from "../../../lib/guards";
import { prisma } from "../../../lib/prisma";
import ResourceSubmissionForm from "./resource-submission-form";

const errorMessages: Record<string, string> = {
  invalid: "Check every field and use https:// links.",
  category: "That category is no longer available.",
  duplicate: "That resource is already published or waiting for review.",
};

export default async function SubmitBookshelfResourcePage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  await requireActiveUser();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">Bookshelf recommendation</p>
        <h1>Share a resource.</h1>
        <p>
          Recommend a book or open-access research paper. An admin reviews every submission before
          it appears on the bookshelf.
        </p>

        {searchParams?.success ? (
          <div className="form-message" role="status">
            Submitted for review. It will appear on the bookshelf after an admin approves it.
          </div>
        ) : null}
        {searchParams?.error ? (
          <div className="form-message error" role="alert">
            {errorMessages[searchParams.error] ?? errorMessages.invalid}
          </div>
        ) : null}

        {categories.length ? (
          <ResourceSubmissionForm categories={categories} />
        ) : (
          <div className="form-message error">No bookshelf categories are available yet.</div>
        )}

        <a className="text-link" href="/bookshelf">
          Back to Bookshelf
        </a>
      </section>
    </main>
  );
}
