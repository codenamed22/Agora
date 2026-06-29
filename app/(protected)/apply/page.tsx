import { ApplicationStatus, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { ensureRegistrationRecords } from "../../../lib/access";
import { batchYears } from "../../../lib/members";
import { prisma } from "../../../lib/prisma";
import { submitApplication } from "./actions";

export default async function ApplyPage({
  searchParams,
}: Readonly<{
  searchParams?: {
    error?: string;
    submitted?: string;
  };
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  await ensureRegistrationRecords(session.user.id, session.user.email);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) {
    redirect("/join");
  }

  if (user.status === UserStatus.ACTIVE) {
    redirect("/dashboard");
  }

  const application = await prisma.application.findUnique({
    where: { userId: session.user.id },
  });

  const isSubmitted = application?.status === ApplicationStatus.SUBMITTED;
  const isRejected = user.status === UserStatus.REJECTED;

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">ShardUp application</p>
        <h1>
          {isRejected
            ? "Application not approved"
            : isSubmitted
              ? "Application under consideration"
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
            Your latest application was not approved. Reach out to the ShardUp team if you think
            this needs another look.
          </p>
        ) : isSubmitted ? (
          <p>
            Your application has been submitted and is currently under review. We will update your
            access once it has been considered.
          </p>
        ) : (
          <p>
            Tell us a little about yourself. Approved members will get access to the community
            dashboard and future ShardUp features.
          </p>
        )}
        {isSubmitted ? (
          <div className="application-summary">
            <h2>Submitted application</h2>
            <p>
              <strong>Name:</strong> {user.profile?.displayName ?? session.user.name}
            </p>
            <p>
              <strong>Batch:</strong> {user.profile?.batch ?? "Not provided"}
            </p>
            <p>
              <strong>Branch:</strong> {user.profile?.branch ?? "Not provided"}
            </p>
            <p>
              <strong>Goal:</strong> {application?.goals ?? "Not provided"}
            </p>
          </div>
        ) : !isRejected ? (
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
              <select name="batch" required defaultValue={user.profile?.batch ?? ""}>
                <option value="" disabled>
                  Select graduation year
                </option>
                {batchYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Branch
              <input name="branch" required defaultValue={user.profile?.branch ?? ""} />
            </label>
            <label>
              What do you want to build or improve through ShardUp?
              <textarea name="goals" required defaultValue={application?.goals ?? ""} />
            </label>
            <label>
              Relevant experience or projects
              <textarea name="experience" defaultValue={application?.experience ?? ""} />
            </label>
            <button className="button" type="submit">
              Submit application
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
