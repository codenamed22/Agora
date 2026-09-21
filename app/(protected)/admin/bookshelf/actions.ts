"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeResourceInput,
  resourceSchema,
  type ResourceFormInput,
} from "../../../../lib/bookshelf/validators";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;

function safeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .slice(0, 80) || "resource"
  );
}

function isOursBlob(url: string | null) {
  return url !== null && url.includes("blob.vercel-storage.com");
}

function parseResourceForm(formData: FormData): ResourceFormInput | null {
  const parsed = resourceSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    recommendationReason: formData.get("recommendationReason"),
  });

  if (!parsed.success) {
    return null;
  }

  return normalizeResourceInput(parsed.data);
}

function pdfFileFrom(formData: FormData): File | null {
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

function coverFileFrom(formData: FormData): File | null {
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

function pdfValidationError(file: File | null): "pdf" | "storage" | null {
  if (!file) {
    return null;
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf || file.size > MAX_PDF_BYTES) {
    return "pdf";
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return "storage";
  }

  return null;
}

function coverValidationError(file: File | null): "cover" | "storage" | null {
  if (!file) {
    return null;
  }

  if (file.type !== "image/jpeg" || file.size > MAX_COVER_BYTES) {
    return "cover";
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return "storage";
  }

  return null;
}

async function uploadResourcePdf(resourceId: string, file: File) {
  const blob = await put(`bookshelf/${resourceId}-${Date.now()}-${safeFilename(file.name)}`, file, {
    access: "public",
  });

  return { pdfUrl: blob.url, pdfSizeBytes: file.size };
}

async function uploadResourceCover(resourceId: string, file: File) {
  const blob = await put(`bookshelf/${resourceId}-${Date.now()}-cover.jpg`, file, {
    access: "public",
    contentType: "image/jpeg",
  });

  return blob.url;
}

function revalidateResourcePaths(resourceId?: string) {
  revalidatePath("/bookshelf");
  revalidatePath("/bookshelf/...");
  revalidatePath("/admin/bookshelf");
  if (resourceId) {
    revalidatePath(`/bookshelf/resource/${resourceId}`);
  }
}

export async function createResource(formData: FormData) {
  await requireAdmin();
  const parsed = parseResourceForm(formData);
  const pdf = pdfFileFrom(formData);
  const cover = coverFileFrom(formData);

  if (!parsed) {
    redirect("/admin/bookshelf/new?error=invalid");
  }

  const pdfError = pdfValidationError(pdf);
  if (pdfError) {
    redirect(`/admin/bookshelf/new?error=${pdfError}`);
  }

  const coverError = coverValidationError(cover);
  if (coverError) {
    redirect(`/admin/bookshelf/new?error=${coverError}`);
  }

  if (!pdf) {
    redirect("/admin/bookshelf/new?error=missing");
  }

  const resource = await prisma.resource.create({
    data: parsed,
    select: { id: true },
  });

  const updates: {
    pdfUrl?: string;
    pdfSizeBytes?: number;
    imageUrl?: string;
  } = {};

  if (pdf) {
    Object.assign(updates, await uploadResourcePdf(resource.id, pdf));
  }

  if (cover) {
    updates.imageUrl = await uploadResourceCover(resource.id, cover);
  }

  if (Object.keys(updates).length > 0) {
    await prisma.resource.update({
      where: { id: resource.id },
      data: updates,
    });
  }

  revalidateResourcePaths(resource.id);
  redirect("/admin/bookshelf");
}

export async function updateResource(formData: FormData) {
  await requireAdmin();
  const resourceId = String(formData.get("resourceId") ?? "");
  const parsed = parseResourceForm(formData);

  if (!resourceId) {
    redirect("/admin/bookshelf");
  }

  if (!parsed) {
    redirect(`/admin/bookshelf/${resourceId}?error=invalid`);
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });

  if (!resource) {
    redirect("/admin/bookshelf");
  }

  const pdf = pdfFileFrom(formData);
  const cover = coverFileFrom(formData);
  const pdfError = pdfValidationError(pdf);

  if (pdfError) {
    redirect(`/admin/bookshelf/${resourceId}?error=${pdfError}`);
  }

  const coverError = coverValidationError(cover);
  if (coverError) {
    redirect(`/admin/bookshelf/${resourceId}?error=${coverError}`);
  }

  const nextPdf = pdf ? await uploadResourcePdf(resource.id, pdf) : null;
  const hasPdf = Boolean(nextPdf ?? resource.pdfUrl);

  if (!hasPdf) {
    redirect(`/admin/bookshelf/${resourceId}?error=missing`);
  }

  // A newly selected PDF regenerates the first-page cover, so it replaces the
  // current cover; otherwise the existing cover is kept.
  const nextCover = cover ? await uploadResourceCover(resource.id, cover) : null;

  const data: {
    title: string;
    author: string | null;
    type: ResourceFormInput["type"];
    categoryId: string;
    recommendationReason: string | null;
    pdfUrl: string | null;
    pdfSizeBytes: number | null;
    imageUrl: string | null;
  } = {
    ...parsed,
    pdfUrl: nextPdf ? nextPdf.pdfUrl : resource.pdfUrl,
    pdfSizeBytes: nextPdf ? nextPdf.pdfSizeBytes : resource.pdfSizeBytes,
    imageUrl: nextCover ?? resource.imageUrl,
  };

  await prisma.resource.update({
    where: { id: resource.id },
    data,
  });

  if (nextPdf && resource.pdfUrl) {
    await del(resource.pdfUrl).catch(() => undefined);
  }

  if (
    nextCover &&
    resource.imageUrl &&
    isOursBlob(resource.imageUrl) &&
    resource.imageUrl !== nextCover
  ) {
    await del(resource.imageUrl).catch(() => undefined);
  }

  revalidateResourcePaths(resource.id);
  redirect("/admin/bookshelf");
}

export async function deleteResource(formData: FormData) {
  await requireAdmin();
  const resourceId = String(formData.get("resourceId") ?? "");

  if (!resourceId) {
    return;
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });

  if (!resource) {
    redirect("/admin/bookshelf");
  }

  await prisma.resource.delete({ where: { id: resource.id } });

  if (resource.pdfUrl) {
    await del(resource.pdfUrl).catch(() => undefined);
  }

  revalidateResourcePaths();
  redirect("/admin/bookshelf");
}
