"use server";

import { ResourceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "../auth/admin";
import { prisma } from "../prisma";

const urlSchema = z.string().trim().url("Invalid URL format").or(z.literal(""));

const resourceSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().optional(),
  type: z.nativeEnum(ResourceType),
  recommendationReason: z.string().trim().optional(),
  resourceLink: urlSchema,
  buyLink: urlSchema,
  imageUrl: z.string().trim().url("Image URL must be a valid URL"),
  categoryId: z.string().trim().min(1, "Category is required"),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and dashes"),
});

// Resource Mutations

export async function createResource(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = resourceSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author") || undefined,
    type: formData.get("type"),
    recommendationReason: formData.get("recommendationReason") || undefined,
    resourceLink: formData.get("resourceLink") || "",
    buyLink: formData.get("buyLink") || "",
    imageUrl: formData.get("imageUrl"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    redirect("/admin/bookshelf/new?error=validation-failed");
  }

  // Prevent duplicate title inside same category
  const existingResource = await prisma.resource.findFirst({
    where: {
      title: parsed.data.title,
      categoryId: parsed.data.categoryId,
    },
  });

  if (existingResource) {
    redirect("/admin/bookshelf/new?error=duplicate-resource");
  }

  await prisma.resource.create({
    data: {
      title: parsed.data.title,
      author: parsed.data.author,
      type: parsed.data.type,
      recommendationReason: parsed.data.recommendationReason,
      resourceLink: parsed.data.resourceLink || null,
      buyLink: parsed.data.buyLink || null,
      imageUrl: parsed.data.imageUrl,
      categoryId: parsed.data.categoryId,
      recommendedById: admin.id,
    },
  });

  revalidatePath("/bookshelf");
  revalidatePath("/admin/bookshelf");
  redirect("/admin/bookshelf?success=resource-created");
}

export async function updateResource(resourceId: string, formData: FormData) {
  await requireAdmin();

  const parsed = resourceSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author") || undefined,
    type: formData.get("type"),
    recommendationReason: formData.get("recommendationReason") || undefined,
    resourceLink: formData.get("resourceLink") || "",
    buyLink: formData.get("buyLink") || "",
    imageUrl: formData.get("imageUrl"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    redirect(`/admin/bookshelf/${resourceId}/edit?error=validation-failed`);
  }

  // Prevent duplicate title inside same category (excluding current resource)
  const existingResource = await prisma.resource.findFirst({
    where: {
      title: parsed.data.title,
      categoryId: parsed.data.categoryId,
      NOT: { id: resourceId },
    },
  });

  if (existingResource) {
    redirect(`/admin/bookshelf/${resourceId}/edit?error=duplicate-resource`);
  }

  await prisma.resource.update({
    where: { id: resourceId },
    data: {
      title: parsed.data.title,
      author: parsed.data.author,
      type: parsed.data.type,
      recommendationReason: parsed.data.recommendationReason,
      resourceLink: parsed.data.resourceLink || null,
      buyLink: parsed.data.buyLink || null,
      imageUrl: parsed.data.imageUrl,
      categoryId: parsed.data.categoryId,
    },
  });

  revalidatePath("/bookshelf");
  revalidatePath(`/bookshelf/resource/${resourceId}`);
  revalidatePath("/admin/bookshelf");
  redirect("/admin/bookshelf?success=resource-updated");
}

export async function deleteResource(formData: FormData) {
  await requireAdmin();

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) {
    redirect("/admin/bookshelf?error=invalid-id");
  }

  await prisma.resource.delete({
    where: { id: resourceId },
  });

  revalidatePath("/bookshelf");
  revalidatePath("/admin/bookshelf");
  redirect("/admin/bookshelf?success=resource-deleted");
}

// Category Mutations

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    redirect("/admin/bookshelf/categories?error=validation-failed");
  }

  // Check unique name and slug
  const nameExists = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  });

  if (nameExists) {
    redirect("/admin/bookshelf/categories?error=duplicate-name");
  }

  const slugExists = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (slugExists) {
    redirect("/admin/bookshelf/categories?error=duplicate-slug");
  }

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
    },
  });

  revalidatePath("/bookshelf");
  revalidatePath("/admin/bookshelf/categories");
  redirect("/admin/bookshelf/categories?success=category-created");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    redirect(`/admin/bookshelf/categories?error=validation-failed&editId=${categoryId}`);
  }

  // Check unique name excluding current
  const nameExists = await prisma.category.findFirst({
    where: {
      name: parsed.data.name,
      NOT: { id: categoryId },
    },
  });

  if (nameExists) {
    redirect(`/admin/bookshelf/categories?error=duplicate-name&editId=${categoryId}`);
  }

  // Check unique slug excluding current
  const slugExists = await prisma.category.findFirst({
    where: {
      slug: parsed.data.slug,
      NOT: { id: categoryId },
    },
  });

  if (slugExists) {
    redirect(`/admin/bookshelf/categories?error=duplicate-slug&editId=${categoryId}`);
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
    },
  });

  revalidatePath("/bookshelf");
  revalidatePath("/admin/bookshelf/categories");
  redirect("/admin/bookshelf/categories?success=category-updated");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) {
    redirect("/admin/bookshelf/categories?error=invalid-id");
  }

  // Count associated resources to prevent accidental data loss
  const resourceCount = await prisma.resource.count({
    where: { categoryId },
  });

  if (resourceCount > 0) {
    redirect("/admin/bookshelf/categories?error=category-not-empty");
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  revalidatePath("/bookshelf");
  revalidatePath("/admin/bookshelf/categories");
  redirect("/admin/bookshelf/categories?success=category-deleted");
}
