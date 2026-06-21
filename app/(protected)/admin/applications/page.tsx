import { ApplicationStatus, Role, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { parseAnswers, parseQuestions } from "../../../../lib/cohorts";
import { prisma } from "../../../../lib/prisma";
import { reviewApplication } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const TABS = [
  { key: "pending", label: "Pending", status: ApplicationStatus.SUBMITTED },
  { key: "approved", label: "Approved", status: ApplicationStatus.APPROVED },
  { key: "rejected", label: "Not approved", status: ApplicationStatus.REJECTED },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function ApplicationsAdminPage({
  searchParams,
}: Readonly<{ searchParams?: { status?: string } }>) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== Role.ADMIN ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    redirect("/dashboard");
  }

  const activeTab: TabKey = TABS.find((tab) => tab.key === searchParams?.status)?.key ?? "pending";
  const activeStatus = TABS.find((tab) => tab.key === activeTab)!.status;

  const [applications, counts] = await Promise.all([
    prisma.application.findMany({
      where: { status: activeStatus },
      orderBy: { updatedAt: "asc" },
      include: { user: { include: { profile: true } }, cohort: true },
    }),
    prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = new Map(counts.map((row) => [row.status, row._count._all]));

  return (
    <main className="app-shell">
      <section className="app-card wide-card">
        <p className="section-label">Admin</p>
        <h1>Application review</h1>
        <p>
          Review submitted applications and track approved and rejected ones. Approving an
          application grants the applicant member access.
        </p>

        <nav className="filter-tabs" aria-label="Filter applications by status">
          {TABS.map((tab) => (
            <a
              key={tab.key}
              href={`/admin/applications?status=${tab.key}`}
              className={`filter-tab${tab.key === activeTab ? " is-active" : ""}`}
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
              const questions = parseQuestions(application.cohort?.questions);
              const answers = parseAnswers(application.answers);
              return (
                <article className="application-row" key={application.id}>
                  <div>
                    <h2>{application.user.name ?? application.user.email}</h2>
                    <p className="muted-line">
                      {application.user.email}
                      {application.cohort ? ` · Cohort ${application.cohort.year}` : ""} · Submitted{" "}
                      {dateFormatter.format(application.createdAt)}
                    </p>
                    <p>
                      <strong>Batch:</strong> {application.user.profile?.batch ?? "Not provided"} ·{" "}
                      <strong>Branch:</strong> {application.user.profile?.branch ?? "Not provided"}
                    </p>
                    {questions.map((question) => (
                      <p key={question.id}>
                        <strong>{question.label}:</strong> {answers[question.id] || "Not provided"}
                      </p>
                    ))}
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
      </section>
    </main>
  );
}
