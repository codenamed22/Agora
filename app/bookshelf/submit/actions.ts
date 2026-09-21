"use server";

import { ResourceSubmissionStatus } from "@/prisma-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveUser } from "../../../lib/guards";
import { prisma } from "../../../lib/prisma";
import { canSubmitResource, resourceSubmissionSchema } from "../../../lib/bookshelf/submissions";

export async function submitResource(formData: FormData) {
  const sessionUser = await requireActiveUser();
  const member = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, status: true },
  });

  if (!member || !canSubmitResource(member)) {
    redirect("/apply");
  }

  const parsed = resourceSubmissionSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    recommendationReason: formData.get("recommendationReason"),
    resourceLink: formData.get("resourceLink"),
    buyLink: String(formData.get("buyLink") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
  });

  if (!parsed.success) {
    redirect("/bookshelf/submit?error=invalid");
  }

  const [category, publishedDuplicate, pendingDuplicate] = await Promise.all([
    prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true },
    }),
    prisma.resource.findFirst({
      where: {
        categoryId: parsed.data.categoryId,
        title: { equals: parsed.data.title, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.resourceSubmission.findFirst({
      where: {
        categoryId: parsed.data.categoryId,
        title: { equals: parsed.data.title, mode: "insensitive" },
        status: ResourceSubmissionStatus.PENDING,
      },
      select: { id: true },
    }),
  ]);

  if (!category) {
    redirect("/bookshelf/submit?error=category");
  }

  if (publishedDuplicate || pendingDuplicate) {
    redirect("/bookshelf/submit?error=duplicate");
  }

  await prisma.resourceSubmission.create({
    data: {
      ...parsed.data,
      submittedById: member.id,
    },
  });

  revalidatePath("/admin/bookshelf");
  redirect("/bookshelf/submit?success=1");
}
