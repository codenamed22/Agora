import { ApplicationStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { parseAnswers, parseQuestions } from "../../../../../lib/cohorts";
import { requireAdmin } from "../../../../../lib/guards";
import { prisma } from "../../../../../lib/prisma";
import { editQuestion, endCohort } from "../actions";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

export default async function CohortDetailPage({ params }: Readonly<{ params: { id: string } }>) {
  await requireAdmin();

  const cohort = await prisma.cohort.findUnique({
    where: { id: params.id },
    include: {
      applications: {
        where: { status: { not: ApplicationStatus.DRAFT } },
        orderBy: { updatedAt: "asc" },
        include: { user: { include: { profile: true } } },
      },
    },
  });

  if (!cohort) {
    redirect("/admin/cohort");
  }

  const questions = parseQuestions(cohort.questions);
  const responses = cohort.applications;

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
          <h2>Responses ({responses.length})</h2>
          {responses.length === 0 ? (
            <p className="muted-line">No responses yet.</p>
          ) : (
            <div className="application-list">
              {responses.map((application) => {
                const answers = parseAnswers(application.answers);
                return (
                  <article className="application-row" key={application.id}>
                    <div>
                      <h2>{application.user.name ?? application.user.email}</h2>
                      <p className="muted-line">
                        {application.user.email} · {STATUS_LABELS[application.status]} ·{" "}
                        <strong>Batch:</strong> {application.user.profile?.batch ?? "—"} ·{" "}
                        <strong>Branch:</strong> {application.user.profile?.branch ?? "—"}
                      </p>
                      {questions.map((question) => (
                        <p key={question.id}>
                          <strong>{question.label}:</strong>{" "}
                          {answers[question.id] || "Not provided"}
                        </p>
                      ))}
                    </div>
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
