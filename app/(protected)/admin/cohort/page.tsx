import { Role, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";
import { setActiveCohort } from "./actions";

export default async function CohortAdminPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== Role.ADMIN ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    redirect("/dashboard");
  }

  const cohorts = await prisma.cohort.findMany({
    orderBy: { year: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  const hasActive = cohorts.some((cohort) => cohort.isActive);

  return (
    <main className="app-shell">
      <section className="app-card wide-card">
        <p className="section-label">Admin</p>
        <h1>Cohorts</h1>
        <p>Open a cohort each year, edit its questions, and review past cohorts.</p>

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
                      {cohort._count.applications} response
                      {cohort._count.applications === 1 ? "" : "s"}
                    </p>
                  </div>
                  <a className="secondary-button" href={`/admin/cohort/${cohort.id}`}>
                    {cohort.isActive ? "Manage" : "View"}
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
