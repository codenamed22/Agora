import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isLocalDevAuthEnabled, localDevProviderId, signIn, type LocalDevRole } from "../../auth";

export const dynamic = "force-dynamic";

function isLocalhost(request: Request) {
  const normalizeHost = (host: string | null) => {
    const value = host?.split(",")[0]?.trim().toLowerCase();

    if (!value) {
      return "";
    }

    if (value.startsWith("[")) {
      return value.slice(1, value.indexOf("]"));
    }

    return value.split(":")[0];
  };

  const host = normalizeHost(request.headers.get("host"));
  const forwardedHost = normalizeHost(request.headers.get("x-forwarded-host"));
  const isAllowed = (hostname: string) =>
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  return isAllowed(host) && (!forwardedHost || isAllowed(forwardedHost));
}

export async function GET(request: Request) {
  if (!isLocalDevAuthEnabled) {
    redirect("/join");
  }

  if (!isLocalhost(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const role: LocalDevRole =
    new URL(request.url).searchParams.get("role") === "admin" ? "admin" : "member";

  await signIn(localDevProviderId(role), {
    redirectTo: role === "admin" ? "/admin/cohort" : "/apply",
  });
}
