import { ApplicationStatus } from "@prisma/client";
import { parseAnswers } from "../../../../lib/cohorts";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";
import { reviewApplication, setActiveCohort } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function CohortAdminPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  await requireAdmin();

  const [cohorts, unassigned] = await Promise.all([
    prisma.cohort.findMany({
      orderBy: { year: "desc" },
      include: { _count: { select: { applications: true } } },
    }),
    // Pre-cohort applications never got a cohort — surface them here so they
    // aren't orphaned now that review lives on the cohort screens.
    prisma.application.findMany({
      where: { cohortId: null, status: { not: ApplicationStatus.DRAFT } },
      orderBy: { updatedAt: "asc" },
      include: { user: { include: { profile: true } } },
    }),
  ]);

  const hasActive = cohorts.some((cohort) => cohort.isActive);

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Cohorts</h1>
        <p>
          Open a cohort each year, edit its questions, and review that year&apos;s applications.
        </p>

        <div className="portal-section">
          <h2>Open a cohort</h2>
          {searchParams?.error === "invalid-year" ? (
            <p className="form-message error">Please enter a valid year (2000–2100).</p>
          ) : null}
          <form action={setActiveCohort} className="stacked-form">
            <label>
              Year
              <input
                name="year"
                type="number"
                required
                min={2000}
                max={2100}
                placeholder="e.g. 2027"
              />
            </label>
            <div className="form-row">
              <button className="button" type="submit">
                {hasActive ? "Open / switch active cohort" : "Open cohort"}
              </button>
            </div>
          </form>
        </div>

        <div className="portal-section">
          <h2>All cohorts</h2>
          {cohorts.length === 0 ? (
            <p className="muted-line">No cohorts yet. Open one above.</p>
          ) : (
            <div className="application-list">
              {cohorts.map((cohort) => (
                <article className="application-row" key={cohort.id}>
                  <div>
                    <h2>Cohort {cohort.year}</h2>
                    <p className="muted-line">
                      {cohort.isActive ? "Active — recruiting" : "Ended"} ·{" "}
                      {cohort._count.applications} application
                      {cohort._count.applications === 1 ? "" : "s"}
                    </p>
                  </div>
                  <a className="secondary-button" href={`/admin/cohort/${cohort.id}`}>
                    {cohort.isActive ? "Manage & review" : "View & review"}
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>

        {unassigned.length > 0 ? (
          <div className="portal-section">
            <h2>Unassigned applications ({unassigned.length})</h2>
            <p className="muted-line">
              Submitted before cohorts existed, so not tied to a year. Review them here.
            </p>
            <div className="application-list">
              {unassigned.map((application) => (
                <article className="application-row" key={application.id}>
                  <div>
                    <h2>{application.user.name ?? application.user.email}</h2>
                    <p className="muted-line">
                      {application.user.email} · Submitted{" "}
                      {dateFormatter.format(application.createdAt)}
                    </p>
                    <p>
                      <strong>Batch:</strong> {application.user.profile?.batch ?? "Not provided"} ·{" "}
                      <strong>Branch:</strong> {application.user.profile?.branch ?? "Not provided"}
                    </p>
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
                    {/* Guard against any stray answers on a null-cohort application. */}
                    {Object.keys(parseAnswers(application.answers)).length > 0 ? (
                      <p className="muted-line">Has cohort answers but no cohort on file.</p>
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
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
