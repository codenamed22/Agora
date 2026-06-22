import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

function isConfigured(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  const checks = {
    authSecret: isConfigured(process.env.AUTH_SECRET),
    authUrl: isConfigured(process.env.AUTH_URL),
    authTrustHost: process.env.AUTH_TRUST_HOST === "true" || process.env.VERCEL === "1",
    databaseUrl: isConfigured(process.env.DATABASE_URL),
    googleClientId: isConfigured(process.env.AUTH_GOOGLE_ID),
    googleClientSecret: isConfigured(process.env.AUTH_GOOGLE_SECRET),
    judgeBaseUrl: process.env.JUDGE_PROVIDER === "fake" || isConfigured(process.env.JUDGE_BASE_URL),
    judgeApiKey: process.env.JUDGE_PROVIDER === "fake" || isConfigured(process.env.JUDGE_API_KEY),
  };

  let database = false;
  let databaseError: string | null = null;
  let schema = false;
  let schemaError: string | null = null;

  if (checks.databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : "Unknown database error";
    }

    if (database) {
      try {
        await Promise.all([
          prisma.user.count(),
          prisma.account.count(),
          prisma.profile.count(),
          prisma.application.count(),
          prisma.event.count(),
          prisma.eventRsvp.count(),
          prisma.problem.count(),
          prisma.testCase.count(),
          prisma.submission.count(),
        ]);
        schema = true;
      } catch (error) {
        schemaError = error instanceof Error ? error.message : "Unknown schema error";
      }
    }
  }

  const ok = Object.values(checks).every(Boolean) && database && schema;

  return NextResponse.json(
    {
      ok,
      checks,
      database,
      databaseError,
      schema,
      schemaError,
    },
    { status: ok ? 200 : 500 },
  );
}
