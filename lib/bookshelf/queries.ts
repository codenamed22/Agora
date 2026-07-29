import { prisma } from "../prisma";
import { DEFAULT_PAGE_SIZE } from "./constants";
import {
  CategoryWithCount,
  ResourceWithRelations,
  ResourceList,
  resourceListSelect,
} from "./types";
import { Prisma, ResourceType } from "@/prisma-client";

// Full selection for detail views
const resourceDetailSelect = {
  id: true,
  title: true,
  author: true,
  type: true,
  recommendationReason: true,
  resourceLink: true,
  buyLink: true,
  imageUrl: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  recommendedBy: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.ResourceSelect;

// Helper to cleanly parse search params page numbers consistently
function parsePage(page: string | number | undefined): number {
  if (!page) return 1;
  const parsedPage = typeof page === "string" ? parseInt(page, 10) : page;
  return !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { resources: true },
      },
    },
  });
}

export async function getRecentResources(limit: number = 6) {
  return prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: resourceListSelect,
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function getResourcesByCategory(slug: string) {
  return prisma.resource.findMany({
    where: {
      category: { slug },
    },
    orderBy: { title: "asc" },
    select: resourceListSelect,
  });
}

export async function getResourceById(id: string): Promise<ResourceWithRelations | null> {
  return prisma.resource.findUnique({
    where: { id },
    select: resourceDetailSelect,
  });
}

function buildResourcesQuery(params: { q?: string; type?: string; sort?: string }) {
  const where: Prisma.ResourceWhereInput = {};

  if (params.type && Object.values(ResourceType).includes(params.type as ResourceType)) {
    where.type = params.type as ResourceType;
  }

  if (params.q && params.q.trim() !== "") {
    const searchString = params.q.trim();
    where.OR = [
      { title: { contains: searchString, mode: "insensitive" } },
      { author: { contains: searchString, mode: "insensitive" } },
    ];
  }

  let orderBy: Prisma.ResourceOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (params.sort === "title-asc") {
    orderBy = { title: "asc" };
  } else if (params.sort === "title-desc") {
    orderBy = { title: "desc" };
  }

  return { where, orderBy };
}

export async function getPaginatedResources(params: {
  q?: string;
  type?: string;
  sort?: string;
  page?: string | number;
  limit?: number;
}): Promise<{
  resources: ResourceList[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const { where, orderBy } = buildResourcesQuery(params);
  const currentPage = parsePage(params.page);
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  const skip = (currentPage - 1) * limit;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: resourceListSelect,
    }),
    prisma.resource.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    resources,
    total,
    totalPages,
    currentPage,
  };
}

export async function getPaginatedCategoryResources(
  categorySlug: string,
  params: { q?: string; type?: string; sort?: string; page?: string | number; limit?: number },
): Promise<{
  resources: ResourceList[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const { where, orderBy } = buildResourcesQuery(params);
  const currentPage = parsePage(params.page);
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  const skip = (currentPage - 1) * limit;

  const finalWhere: Prisma.ResourceWhereInput = {
    ...where,
    category: { slug: categorySlug },
  };

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where: finalWhere,
      orderBy,
      skip,
      take: limit,
      select: resourceListSelect,
    }),
    prisma.resource.count({ where: finalWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    resources,
    total,
    totalPages,
    currentPage,
  };
}
