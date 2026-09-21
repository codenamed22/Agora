"use server";

import { ResourceSubmissionStatus } from "@/prisma-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canReviewResource } from "../../../../lib/bookshelf/submissions";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";

class DuplicateResourceError extends Error {}
class SubmissionUnavailableError extends Error {}

async function requireDatabaseAdmin() {
  const sessionUser = await requireAdmin();
  const admin = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true, status: true },
  });

  if (!admin || !canReviewResource(admin)) {
    redirect("/dashboard");
  }

  return admin;
}

export async function approveResourceSubmission(formData: FormData) {
  const admin = await requireDatabaseAdmin();
  const submissionId = String(formData.get("submissionId") ?? "");

  if (!submissionId) {
    redirect("/admin/bookshelf?error=missing");
  }

  let categorySlug = "";

  try {
    categorySlug = await prisma.$transaction(async (tx) => {
      const submission = await tx.resourceSubmission.findUnique({
        where: { id: submissionId },
        include: { category: { select: { slug: true } } },
      });

      if (!submission || submission.status !== ResourceSubmissionStatus.PENDING) {
        throw new SubmissionUnavailableError();
      }

      const duplicate = await tx.resource.findFirst({
        where: {
          categoryId: submission.categoryId,
          title: { equals: submission.title, mode: "insensitive" },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new DuplicateResourceError();
      }

      const claimed = await tx.resourceSubmission.updateMany({
        where: { id: submission.id, status: ResourceSubmissionStatus.PENDING },
        data: {
          status: ResourceSubmissionStatus.APPROVED,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw new SubmissionUnavailableError();
      }

      await tx.resource.create({
        data: {
          title: submission.title,
          author: submission.author,
          type: submission.type,
          recommendationReason: submission.recommendationReason,
          resourceLink: submission.resourceLink,
          buyLink: submission.buyLink,
          imageUrl: submission.imageUrl,
          categoryId: submission.categoryId,
          recommendedById: submission.submittedById,
        },
      });

      return submission.category.slug;
    });
  } catch (error) {
    if (error instanceof DuplicateResourceError) {
      redirect("/admin/bookshelf?error=duplicate");
    }
    if (error instanceof SubmissionUnavailableError) {
      redirect("/admin/bookshelf?error=missing");
    }
    throw error;
  }

  revalidatePath("/bookshelf");
  revalidatePath(`/bookshelf/${categorySlug}`);
  revalidatePath("/admin/bookshelf");
  redirect("/admin/bookshelf?success=approved");
}

export async function rejectResourceSubmission(formData: FormData) {
  const admin = await requireDatabaseAdmin();
  const submissionId = String(formData.get("submissionId") ?? "");

  if (!submissionId) {
    redirect("/admin/bookshelf?error=missing");
  }

  const rejected = await prisma.resourceSubmission.updateMany({
    where: { id: submissionId, status: ResourceSubmissionStatus.PENDING },
    data: {
      status: ResourceSubmissionStatus.REJECTED,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  if (rejected.count !== 1) {
    redirect("/admin/bookshelf?error=missing");
  }

  revalidatePath("/admin/bookshelf");
  redirect("/admin/bookshelf?success=rejected");
}
