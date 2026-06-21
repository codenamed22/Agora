import { ApplicationStatus, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { ensureRegistrationRecords } from "../../../lib/access";
import { parseAnswers, parseQuestions } from "../../../lib/cohorts";
import { prisma } from "../../../lib/prisma";
import { submitApplication } from "./actions";

export default async function ApplyPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string; submitted?: string } }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  await ensureRegistrationRecords(session.user.id, session.user.email);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true, application: { include: { cohort: true } } },
  });

  if (!user) {
    redirect("/join");
  }

  if (user.status === UserStatus.ACTIVE) {
    redirect("/dashboard");
  }

  const application = user.application;
  const isRejected = user.status === UserStatus.REJECTED || user.status === UserStatus.SUSPENDED;
  const isSubmitted = application?.status === ApplicationStatus.SUBMITTED;

  // While editing, follow the active cohort's questions; once submitted, show
  // the cohort the application was actually submitted to.
  const activeCohort = await prisma.cohort.findFirst({ where: { isActive: true } });
  const cohort = isSubmitted ? (application?.cohort ?? null) : activeCohort;
  // Most recent cohort's year, for the "recruitment ended" message.
  const latestCohort =
    activeCohort ?? (await prisma.cohort.findFirst({ orderBy: { year: "desc" } }));
  const questions = cohort ? parseQuestions(cohort.questions) : [];
  const answers = parseAnswers(application?.answers);

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">
          {cohort ? `Cohort ${cohort.year} application` : "ShardUp application"}
        </p>
        <h1>
          {isRejected
            ? "Application not approved"
            : isSubmitted
              ? "Application under review"
              : !cohort
                ? "Recruitment closed"
                : "Complete your application"}
        </h1>

        {searchParams?.error ? (
          <p className="form-message error">Please fill in the required fields.</p>
        ) : null}
        {searchParams?.submitted ? (
          <p className="form-message">Application submitted. We will review it soon.</p>
        ) : null}

        {isRejected ? (
          <p>
            Your application was not approved. Reach out to the ShardUp team if you think this needs
            another look.
          </p>
        ) : isSubmitted ? (
          <>
            <p>Your application has been submitted and is currently under review.</p>
            <div className="application-summary">
              <p>
                <strong>Name:</strong> {user.profile?.displayName ?? session.user.name}
              </p>
              <p>
                <strong>Batch:</strong> {user.profile?.batch ?? "Not provided"}
              </p>
              <p>
                <strong>Branch:</strong> {user.profile?.branch ?? "Not provided"}
              </p>
              {questions.map((question) => (
                <p key={question.id}>
                  <strong>{question.label}:</strong> {answers[question.id] || "Not provided"}
                </p>
              ))}
            </div>
          </>
        ) : !cohort ? (
          <p>
            {latestCohort
              ? `Recruitment for Cohort ${latestCohort.year} has ended. Please try again next year.`
              : "Applications aren't open right now. Check back soon."}
          </p>
        ) : (
          <>
            <p>
              Tell us about yourself. Approved members get access to the community dashboard and
              future ShardUp features.
            </p>
            <form action={submitApplication} className="stacked-form">
              <label>
                Display name
                <input
                  name="displayName"
                  required
                  defaultValue={user.profile?.displayName ?? session.user.name ?? ""}
                />
              </label>
              <label>
                Batch
                <input name="batch" required defaultValue={user.profile?.batch ?? ""} />
              </label>
              <label>
                Branch
                <input name="branch" required defaultValue={user.profile?.branch ?? ""} />
              </label>
              {questions.map((question) => (
                <label key={question.id}>
                  {question.label}
                  {question.required ? " *" : ""}
                  <textarea
                    name={`q_${question.id}`}
                    required={question.required}
                    defaultValue={answers[question.id] ?? ""}
                  />
                </label>
              ))}
              <button className="button" type="submit">
                Submit application
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
