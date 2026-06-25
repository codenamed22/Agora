"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../../lib/guards";
import { badgeSchema } from "../../../../lib/members";
import { prisma } from "../../../../lib/prisma";

export async function createBadge(formData: FormData) {
  await requireAdmin();

  const parsed = badgeSchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect("/admin/badges?error=invalid");
  }

  await prisma.badge.upsert({
    where: { name: parsed.data.name },
    update: {
      emoji: parsed.data.emoji,
      description: parsed.data.description || null,
    },
    create: {
      name: parsed.data.name,
      emoji: parsed.data.emoji,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/members");
  revalidatePath("/admin/badges");
  redirect("/admin/badges");
}

export async function deleteBadge(formData: FormData) {
  await requireAdmin();
  const badgeId = String(formData.get("badgeId") ?? "");

  if (badgeId) {
    await prisma.badge.delete({ where: { id: badgeId } });
  }

  revalidatePath("/members");
  revalidatePath("/admin/badges");
}

export async function assignBadge(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const badgeId = String(formData.get("badgeId") ?? "");

  if (!userId || !badgeId) {
    return;
  }

  await prisma.memberBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    update: {},
    create: { userId, badgeId, awardedById: admin.id },
  });

  revalidatePath("/members");
  revalidatePath(`/members/${userId}`);
}

export async function removeMemberBadge(formData: FormData) {
  await requireAdmin();
  const memberBadgeId = String(formData.get("memberBadgeId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (memberBadgeId) {
    await prisma.memberBadge.delete({ where: { id: memberBadgeId } });
  }

  revalidatePath("/members");
  if (userId) {
    revalidatePath(`/members/${userId}`);
  }
}
