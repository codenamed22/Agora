import { ApplicationStatus, Role, UserStatus } from "@prisma/client";
import { prisma } from "./prisma";

function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function syncUserAccess(userId: string, email?: string | null) {
  const adminEmails = getAdminEmails();
  const normalizedEmail = email?.trim().toLowerCase();
  const shouldBeAdmin = Boolean(normalizedEmail && adminEmails.has(normalizedEmail));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });

  if (!user) {
    return null;
  }

  if (shouldBeAdmin && (user.role !== Role.ADMIN || user.status !== UserStatus.ACTIVE)) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true, role: true, status: true },
    });
  }

  if (adminEmails.size > 0 && user.role === Role.ADMIN && !shouldBeAdmin) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: Role.MEMBER },
      select: { id: true, role: true, status: true },
    });
  }

  return { id: userId, role: user.role, status: user.status };
}

export async function ensureRegistrationRecords(userId: string, email?: string | null) {
  const access = await syncUserAccess(userId, email);

  // User no longer exists but the session is still alive → access is null. Bail out, else FK violation.
  if (!access) {
    return;
  }

  await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const application = await prisma.application.findUnique({
    where: { userId },
  });

  if (!application && access.role !== Role.ADMIN) {
    // Link the new draft to the cohort that's currently recruiting (if any).
    const activeCohort = await prisma.cohort.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    await prisma.application.create({
      data: { userId, status: ApplicationStatus.DRAFT, cohortId: activeCohort?.id ?? null },
    });
  }
}
