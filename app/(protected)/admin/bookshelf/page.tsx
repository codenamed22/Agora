import { ResourceSubmissionStatus } from "@/prisma-client";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";
import { approveResourceSubmission, rejectResourceSubmission } from "./actions";

const errorMessages: Record<string, string> = {
  duplicate: "That resource is already published.",
  missing: "That submission is no longer waiting for review.",
};

export default async function AdminBookshelfPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  await requireAdmin();
  const submissions = await prisma.resourceSubmission.findMany({
    where: { status: ResourceSubmissionStatus.PENDING },
    orderBy: { createdAt: "asc" },
    include: {
      category: { select: { name: true } },
      submittedBy: { select: { name: true, email: true } },
    },
  });

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Bookshelf submissions</h1>
        <p>Review member recommendations before they appear on the public bookshelf.</p>

        {searchParams?.success ? (
          <div className="form-message" role="status">
            Submission {searchParams.success}.
          </div>
        ) : null}
        {searchParams?.error ? (
          <div className="form-message error" role="alert">
            {errorMessages[searchParams.error] ?? errorMessages.missing}
          </div>
        ) : null}

        <div className="resource-submission-admin-list">
          {submissions.length ? (
            submissions.map((submission) => (
              <article className="resource-submission-admin-row" key={submission.id}>
                <div className="resource-submission-admin-heading">
                  <div>
                    <span className="resource-type-badge">{submission.type.replace("_", " ")}</span>
                    <h2>{submission.title}</h2>
                    <p>
                      by {submission.author} · {submission.category.name}
                    </p>
                  </div>
                  <small>
                    Submitted by {submission.submittedBy.name ?? submission.submittedBy.email}
                  </small>
                </div>

                <blockquote>{submission.recommendationReason}</blockquote>

                <div className="auth-actions-list">
                  <a
                    className="secondary-button"
                    href={submission.resourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Check resource
                  </a>
                  {submission.buyLink ? (
                    <a
                      className="text-link"
                      href={submission.buyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Check buy link
                    </a>
                  ) : null}
                </div>

                <div className="resource-submission-admin-actions">
                  <form action={approveResourceSubmission}>
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <button className="button" type="submit">
                      Approve and publish
                    </button>
                  </form>
                  <form action={rejectResourceSubmission}>
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <button className="secondary-button" type="submit">
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <div className="form-message">No submissions are waiting for review.</div>
          )}
        </div>
      </section>
    </main>
  );
}
