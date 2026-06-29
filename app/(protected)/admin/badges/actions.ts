"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../../lib/guards";
import { badgeSchema, validateProfilePhoto } from "../../../../lib/members";
import { TOP_PRACTICE_BADGE_NAME } from "../../../../lib/practice";
import { prisma } from "../../../../lib/prisma";

function safeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .slice(0, 80) || "badge"
  );
}

async function uploadBadgeImage(badgeId: string, file: File) {
  const imageError = validateProfilePhoto(file);

  if (imageError) {
    redirect(`/admin/badges/${badgeId}?error=image`);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    redirect(`/admin/badges/${badgeId}?error=storage`);
  }

  const blob = await put(`badge-groups/${badgeId}-${Date.now()}-${safeFilename(file.name)}`, file, {
    access: "public",
  });

  return blob.url;
}

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "/admin/badges");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/admin/badges";
}

async function isPracticeChampionBadge(badgeId: string) {
  const badge = await prisma.badge.findUnique({ where: { id: badgeId }, select: { name: true } });

  return badge?.name === TOP_PRACTICE_BADGE_NAME;
}

export async function createBadge(formData: FormData) {
  await requireAdmin();
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const image = formData.get("image");

  const parsed = badgeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    xp: formData.get("xp"),
  });

  if (!parsed.success) {
    redirect(`${returnTo}?error=invalid#create-badge`);
  }

  if (!(image instanceof File) || image.size === 0) {
    redirect(`${returnTo}?error=image#create-badge`);
  }

  const imageError = validateProfilePhoto(image);

  if (imageError) {
    redirect(`${returnTo}?error=image#create-badge`);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    redirect(`${returnTo}?error=storage#create-badge`);
  }

  const badge = await prisma.badge.upsert({
    where: { name: parsed.data.name },
    update: {
      description: parsed.data.description || null,
      xp: parsed.data.name === TOP_PRACTICE_BADGE_NAME ? 0 : parsed.data.xp,
    },
    create: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      xp: parsed.data.name === TOP_PRACTICE_BADGE_NAME ? 0 : parsed.data.xp,
    },
  });

  const imageUrl = await uploadBadgeImage(badge.id, image);

  if (badge.imageUrl) {
    await del(badge.imageUrl).catch(() => undefined);
  }

  await prisma.badge.update({ where: { id: badge.id }, data: { imageUrl } });

  revalidatePath("/members");
  revalidatePath("/admin/badges");
  redirect(`/admin/badges/${badge.id}`);
}

export async function deleteBadge(formData: FormData) {
  await requireAdmin();
  const badgeId = String(formData.get("badgeId") ?? "");

  if (badgeId) {
    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });

    if (badge?.name === TOP_PRACTICE_BADGE_NAME) {
      return;
    }

    await prisma.badge.delete({ where: { id: badgeId } });

    if (badge?.imageUrl) {
      await del(badge.imageUrl).catch(() => undefined);
    }
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

  if (await isPracticeChampionBadge(badgeId)) {
    return;
  }

  await prisma.memberBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    update: {},
    create: { userId, badgeId, awardedById: admin.id },
  });

  revalidatePath("/members");
  revalidatePath(`/members/${userId}`);
  revalidatePath(`/badges/${badgeId}`);
}

export async function updateBadge(formData: FormData) {
  await requireAdmin();
  const badgeId = String(formData.get("badgeId") ?? "");

  if (!badgeId) {
    redirect("/admin/badges");
  }

  const parsed = badgeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    xp: formData.get("xp"),
  });

  if (!parsed.success) {
    redirect(`/admin/badges/${badgeId}?error=invalid`);
  }

  const badge = await prisma.badge.findUnique({ where: { id: badgeId } });

  if (!badge) {
    redirect("/admin/badges");
  }

  let imageUrl = badge.imageUrl;
  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadBadgeImage(badge.id, image);

    if (badge.imageUrl) {
      await del(badge.imageUrl).catch(() => undefined);
    }
  }

  await prisma.badge.update({
    where: { id: badgeId },
    data: {
      name: badge.name === TOP_PRACTICE_BADGE_NAME ? TOP_PRACTICE_BADGE_NAME : parsed.data.name,
      description: parsed.data.description || null,
      xp: badge.name === TOP_PRACTICE_BADGE_NAME ? 0 : parsed.data.xp,
      imageUrl,
    },
  });

  revalidatePath("/members");
  revalidatePath(`/badges/${badgeId}`);
  revalidatePath(`/admin/badges/${badgeId}`);
  revalidatePath("/admin/badges");
  redirect("/members");
}

export async function bulkAssignBadge(formData: FormData) {
  const admin = await requireAdmin();
  const badgeId = String(formData.get("badgeId") ?? "");
  const userIds = formData.getAll("userIds").map(String).filter(Boolean);

  if (!badgeId || userIds.length === 0) {
    return;
  }

  if (await isPracticeChampionBadge(badgeId)) {
    return;
  }

  await prisma.$transaction(
    userIds.map((userId) =>
      prisma.memberBadge.upsert({
        where: { userId_badgeId: { userId, badgeId } },
        update: {},
        create: { userId, badgeId, awardedById: admin.id },
      }),
    ),
  );

  revalidatePath("/members");
  revalidatePath(`/badges/${badgeId}`);
  revalidatePath(`/admin/badges/${badgeId}`);
  userIds.forEach((userId) => revalidatePath(`/members/${userId}`));
}

export async function removeMemberBadge(formData: FormData) {
  await requireAdmin();
  const memberBadgeId = String(formData.get("memberBadgeId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const badgeId = String(formData.get("badgeId") ?? "");

  if (badgeId && (await isPracticeChampionBadge(badgeId))) {
    return;
  }

  if (memberBadgeId) {
    const memberBadge = await prisma.memberBadge.findUnique({
      where: { id: memberBadgeId },
      select: { badge: { select: { name: true } } },
    });

    if (memberBadge?.badge.name === TOP_PRACTICE_BADGE_NAME) {
      return;
    }

    await prisma.memberBadge.delete({ where: { id: memberBadgeId } });
  }

  revalidatePath("/members");
  if (userId) {
    revalidatePath(`/members/${userId}`);
  }
  if (badgeId) {
    revalidatePath(`/badges/${badgeId}`);
    revalidatePath(`/admin/badges/${badgeId}`);
  }
}
