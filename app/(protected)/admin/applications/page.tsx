import { ApplicationStatus, Role, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";
import { reviewApplication } from "./actions";

export default async function ApplicationsAdminPage() {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== Role.ADMIN ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    redirect("/dashboard");
  }

  const applications = await prisma.application.findMany({
    where: { status: ApplicationStatus.SUBMITTED },
    orderBy: { updatedAt: "asc" },
    include: { user: { include: { profile: true } } },
  });

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card wide-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Application review</h1>
        {applications.length === 0 ? (
          <p>No pending applications right now.</p>
        ) : (
          <div className="application-list">
            {applications.map((application) => (
              <article className="application-row" key={application.id}>
                <div>
                  <h2>{application.user.name ?? application.user.email}</h2>
                  <p>{application.user.email}</p>
                  <p>
                    <strong>Batch:</strong> {application.user.profile?.batch ?? "Not provided"}
                  </p>
                  <p>
                    <strong>Branch:</strong> {application.user.profile?.branch ?? "Not provided"}
                  </p>
                  <p>
                    <strong>Goal:</strong> {application.goals ?? "Not provided"}
                  </p>
                  <p>
                    <strong>Experience:</strong> {application.experience || "Not provided"}
                  </p>
                </div>
                <form action={reviewApplication} className="review-actions">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <button className="secondary-button" name="decision" value="reject" type="submit">
                    Reject
                  </button>
                  <button className="button" name="decision" value="approve" type="submit">
                    Approve
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
