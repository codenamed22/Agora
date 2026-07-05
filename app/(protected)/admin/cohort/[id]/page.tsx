import { ApplicationStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { dateFormatter, parseAnswers, parseQuestions } from "../../../../../lib/cohorts";
import { requireAdmin } from "../../../../../lib/guards";
import { prisma } from "../../../../../lib/prisma";
import { editQuestion, endCohort, reviewApplication } from "../actions";

const TABS = [
  { key: "pending", label: "Pending", status: ApplicationStatus.SUBMITTED },
  { key: "approved", label: "Approved", status: ApplicationStatus.APPROVED },
  { key: "rejected", label: "Not approved", status: ApplicationStatus.REJECTED },
] as const;

export default async function CohortDetailPage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams?: { status?: string } }>) {
  await requireAdmin();

  const cohort = await prisma.cohort.findUnique({ where: { id: params.id } });

  if (!cohort) {
    redirect("/admin/cohort");
  }

  const activeTab = TABS.find((tab) => tab.key === searchParams?.status) ?? TABS[0];

  // Applications live on the cohort screen, filtered by status for this cohort's year.
  const [applications, counts] = await Promise.all([
    prisma.application.findMany({
      where: { cohortId: cohort.id, status: activeTab.status },
      orderBy: { updatedAt: "asc" },
      include: { user: { include: { profile: true } } },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { cohortId: cohort.id },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((row) => [row.status, row._count._all]));
  const questions = parseQuestions(cohort.questions);

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">
          <a className="text-link" href="/admin/cohort">
            ← Cohorts
          </a>
        </p>
        <h1>
          Cohort {cohort.year} {cohort.isActive ? "(Active)" : "(Ended)"}
        </h1>

        {cohort.isActive ? (
          <form action={endCohort} className="form-row">
            <input type="hidden" name="cohortId" value={cohort.id} />
            <button className="secondary-button" type="submit">
              End cohort (close recruitment)
            </button>
          </form>
        ) : (
          <p className="muted-line">
            Recruitment for this cohort has ended. Open a new year from the Cohorts page to start
            recruiting again.
          </p>
        )}

        <div className="portal-section">
          <h2>Application questions</h2>
          {questions.length === 0 ? (
            <p className="muted-line">
              {cohort.isActive ? "No questions yet. Add the first one below." : "No questions set."}
            </p>
          ) : cohort.isActive ? (
            <div className="question-list">
              {questions.map((question, index) => (
                <form action={editQuestion} className="question-row" key={question.id}>
                  <input type="hidden" name="cohortId" value={cohort.id} />
                  <input type="hidden" name="questionId" value={question.id} />
                  <input name="label" defaultValue={question.label} aria-label="Question" />
                  <label className="inline-check">
                    <input type="checkbox" name="required" defaultChecked={question.required} />
                    Required
                  </label>
                  <div className="question-actions">
                    <button
                      className="icon-button"
                      name="action"
                      value="up"
                      type="submit"
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="icon-button"
                      name="action"
                      value="down"
                      type="submit"
                      disabled={index === questions.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button className="icon-button" name="action" value="update" type="submit">
                      Save
                    </button>
                    <button
                      className="icon-button danger"
                      name="action"
                      value="remove"
                      type="submit"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ) : (
            // Ended cohort: questions are read-only so historical answers stay labelled.
            <div className="question-list">
              {questions.map((question) => (
                <p key={question.id}>
                  <strong>{question.label}</strong>
                  {question.required ? " (required)" : ""}
                </p>
              ))}
            </div>
          )}

          {cohort.isActive ? (
            <form action={editQuestion} className="question-row add-question">
              <input type="hidden" name="cohortId" value={cohort.id} />
              <input type="hidden" name="action" value="add" />
              <input name="label" placeholder="Add a new question" aria-label="New question" />
              <label className="inline-check">
                <input type="checkbox" name="required" />
                Required
              </label>
              <div className="question-actions">
                <button className="button" type="submit">
                  Add
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="portal-section">
          <h2>Applications</h2>
          <nav className="filter-tabs" aria-label="Filter applications by status">
            {TABS.map((tab) => (
              <a
                key={tab.key}
                href={`/admin/cohort/${cohort.id}?status=${tab.key}`}
                className={`filter-tab${tab.key === activeTab.key ? " is-active" : ""}`}
              >
                {tab.label} ({countByStatus.get(tab.status) ?? 0})
              </a>
            ))}
          </nav>

          {applications.length === 0 ? (
            <p className="muted-line">No applications in this view.</p>
          ) : (
            <div className="application-list">
              {applications.map((application) => {
                const answers = parseAnswers(application.answers);
                return (
                  <article className="application-row" key={application.id}>
                    <div>
                      <h2>{application.user.name ?? application.user.email}</h2>
                      <p className="muted-line">
                        {application.user.email} · Submitted{" "}
                        {dateFormatter.format(application.createdAt)}
                      </p>
                      <p>
                        <strong>Batch:</strong> {application.user.profile?.batch ?? "Not provided"}{" "}
                        · <strong>Branch:</strong>{" "}
                        {application.user.profile?.branch ?? "Not provided"}
                      </p>
                      {questions.map((question) => (
                        <p key={question.id}>
                          <strong>{question.label}:</strong>{" "}
                          {answers[question.id] || "Not provided"}
                        </p>
                      ))}
                      {/* Cohort has no questions — fall back to the legacy free-text fields. */}
                      {questions.length === 0 ? (
                        <>
                          <p>
                            <strong>Goals:</strong> {application.goals || "Not provided"}
                          </p>
                          <p>
                            <strong>Experience:</strong> {application.experience || "Not provided"}
                          </p>
                          {application.whyJoin ? (
                            <p>
                              <strong>Why join:</strong> {application.whyJoin}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                    {application.status === ApplicationStatus.SUBMITTED ? (
                      <form action={reviewApplication} className="review-actions">
                        <input type="hidden" name="applicationId" value={application.id} />
                        <button
                          className="secondary-button"
                          name="decision"
                          value="reject"
                          type="submit"
                        >
                          Reject
                        </button>
                        <button className="button" name="decision" value="approve" type="submit">
                          Approve
                        </button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
