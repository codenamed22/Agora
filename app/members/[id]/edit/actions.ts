"use server";

import { del, put } from "@vercel/blob";
import { Role, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { parseSkills, profileSchema, validateProfilePhoto } from "../../../../lib/members";
import { prisma } from "../../../../lib/prisma";

function editPath(userId: string, error?: string) {
  return error ? `/members/${userId}/edit?error=${error}` : `/members/${userId}/edit`;
}

function safeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .slice(0, 80) || "photo"
  );
}

export async function updateMemberProfile(userId: string, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  const canEdit =
    session.user.id === userId ||
    (session.user.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE);

  if (!canEdit) {
    redirect(`/members/${userId}`);
  }

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    college: formData.get("college"),
    batch: formData.get("batch"),
    branch: formData.get("branch"),
    bio: formData.get("bio"),
    skills: formData.get("skills"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    leetcodeHandle: formData.get("leetcodeHandle"),
    resumeUrl: formData.get("resumeUrl"),
  });

  if (!parsed.success) {
    redirect(editPath(userId, "invalid"));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    redirect("/members");
  }

  const photo = formData.get("photo");
  let photoUrl = user.profile?.photoUrl ?? null;

  if (photo instanceof File && photo.size > 0) {
    const photoError = validateProfilePhoto(photo);

    if (photoError) {
      redirect(editPath(userId, "photo"));
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      redirect(editPath(userId, "storage"));
    }

    const blob = await put(
      `member-photos/${userId}-${Date.now()}-${safeFilename(photo.name)}`,
      photo,
      {
        access: "public",
      },
    );

    if (photoUrl) {
      await del(photoUrl).catch(() => undefined);
    }

    photoUrl = blob.url;
  }

  await prisma.profile.upsert({
    where: { userId },
    update: {
      displayName: parsed.data.displayName || null,
      college: parsed.data.college || null,
      batch: parsed.data.batch || null,
      branch: parsed.data.branch || null,
      bio: parsed.data.bio || null,
      skills: parseSkills(parsed.data.skills),
      githubUrl: parsed.data.githubUrl,
      linkedinUrl: parsed.data.linkedinUrl,
      leetcodeHandle: parsed.data.leetcodeHandle || null,
      resumeUrl: parsed.data.resumeUrl,
      photoUrl,
    },
    create: {
      userId,
      displayName: parsed.data.displayName || null,
      college: parsed.data.college || null,
      batch: parsed.data.batch || null,
      branch: parsed.data.branch || null,
      bio: parsed.data.bio || null,
      skills: parseSkills(parsed.data.skills),
      githubUrl: parsed.data.githubUrl,
      linkedinUrl: parsed.data.linkedinUrl,
      leetcodeHandle: parsed.data.leetcodeHandle || null,
      resumeUrl: parsed.data.resumeUrl,
      photoUrl,
    },
  });

  revalidatePath("/members");
  revalidatePath(`/members/${userId}`);
  redirect(`/members/${userId}`);
}
