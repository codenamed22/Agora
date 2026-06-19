import { redirect } from "next/navigation";
import {
  auth,
  isGoogleOAuthConfigured,
  isLocalDevAuthEnabled,
  localDevAuthRole,
  signIn,
} from "../../../auth";

export default async function JoinPage() {
  const session = await auth();

  if (session?.user?.status === "ACTIVE") {
    redirect("/dashboard");
  }

  if (session?.user) {
    redirect("/apply");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="section-label">Join ShardUp</p>
        <h1>Start with your account.</h1>
        <p>
          Signing in creates your ShardUp identity. Full member access is granted
          after your application is reviewed.
        </p>
        <div className="auth-actions-list">
          {isGoogleOAuthConfigured ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button className="button" type="submit">
                Continue with Google
              </button>
            </form>
          ) : !isLocalDevAuthEnabled ? (
            <div className="form-message error">
              Google sign-in is not configured yet. Add <code>AUTH_GOOGLE_ID</code> and{" "}
              <code>AUTH_GOOGLE_SECRET</code> to this environment, then redeploy.
            </div>
          ) : null}

          {isLocalDevAuthEnabled ? (
            <a className={isGoogleOAuthConfigured ? "secondary-button" : "button"} href="/dev-login">
              Continue as local {localDevAuthRole === "admin" ? "admin" : "applicant"}
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
