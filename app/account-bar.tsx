import type { Session } from "next-auth";
import { auth, signOut } from "../auth";
import SiteHeader from "./site-header";

export default async function AccountBar({
  session: providedSession,
}: Readonly<{
  session?: Session | null;
}> = {}) {
  const session = providedSession ?? (await auth());

  if (!session?.user) {
    return <SiteHeader />;
  }

  return (
    <SiteHeader>
      <a href="/dashboard">Dashboard</a>
      <a href="/masterclass">Masterclass</a>
      <a href={`/members/${session.user.id}`}>Profile</a>
      {session.user.role === "ADMIN" ? <a href="/admin/applications">Admin</a> : null}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit">Sign out</button>
      </form>
    </SiteHeader>
  );
}
