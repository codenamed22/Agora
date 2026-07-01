import { prisma } from "../prisma";
import { RECENT_RESOURCES_LIMIT } from "./constants";
import { CategoryWithCount, ResourceWithRelations } from "./types";
import { Prisma, ResourceType } from "@prisma/client";

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

export async function getRecentResources(
  limit: number = RECENT_RESOURCES_LIMIT,
): Promise<ResourceWithRelations[]> {
  return prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      author: true,
      type: true,
      recommendationReason: true,
      resourceLink: true,
      buyLink: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
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
    },
  });
}

export async function getCategoryBySlug(slug: string): Promise<CategoryWithCount | null> {
  return prisma.category.findUnique({
    where: { slug },
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

export async function getResourcesByCategory(slug: string): Promise<ResourceWithRelations[]> {
  return prisma.resource.findMany({
    where: {
      category: { slug },
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
      type: true,
      recommendationReason: true,
      resourceLink: true,
      buyLink: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
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
    },
  });
}

export async function getResourceById(id: string): Promise<ResourceWithRelations | null> {
  return prisma.resource.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      author: true,
      type: true,
      recommendationReason: true,
      resourceLink: true,
      buyLink: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
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
    },
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
  resources: ResourceWithRelations[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const { where, orderBy } = buildResourcesQuery(params);

  let currentPage = 1;
  if (params.page) {
    const parsedPage = typeof params.page === "string" ? parseInt(params.page, 10) : params.page;
    if (!isNaN(parsedPage) && parsedPage > 0) {
      currentPage = parsedPage;
    }
  }

  const limit = params.limit ?? 6;
  const skip = (currentPage - 1) * limit;

  const [resources, total] = await prisma.$transaction([
    prisma.resource.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        author: true,
        type: true,
        recommendationReason: true,
        resourceLink: true,
        buyLink: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
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
      },
    }),
    prisma.resource.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

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
  resources: ResourceWithRelations[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const { where, orderBy } = buildResourcesQuery(params);

  let currentPage = 1;
  if (params.page) {
    const parsedPage = typeof params.page === "string" ? parseInt(params.page, 10) : params.page;
    if (!isNaN(parsedPage) && parsedPage > 0) {
      currentPage = parsedPage;
    }
  }

  const limit = params.limit ?? 6;
  const skip = (currentPage - 1) * limit;

  const finalWhere: Prisma.ResourceWhereInput = {
    ...where,
    category: { slug: categorySlug },
  };

  const [resources, total] = await prisma.$transaction([
    prisma.resource.findMany({
      where: finalWhere,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        author: true,
        type: true,
        recommendationReason: true,
        resourceLink: true,
        buyLink: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
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
      },
    }),
    prisma.resource.count({ where: finalWhere }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    resources,
    total,
    totalPages,
    currentPage,
  };
}

export async function getRelatedResources(
  resourceId: string,
  limit = 3,
): Promise<ResourceWithRelations[]> {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { categoryId: true, type: true },
  });

  if (!resource) {
    return [];
  }

  // 1. Fetch same category and same type first (excluding current)
  const sameTypeResources = await prisma.resource.findMany({
    where: {
      categoryId: resource.categoryId,
      type: resource.type,
      NOT: { id: resourceId },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      type: true,
      recommendationReason: true,
      resourceLink: true,
      buyLink: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
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
    },
  });

  if (sameTypeResources.length >= limit) {
    return sameTypeResources;
  }

  // 2. Fetch other types in same category to fill remaining slots
  const remainingLimit = limit - sameTypeResources.length;
  const otherTypeResources = await prisma.resource.findMany({
    where: {
      categoryId: resource.categoryId,
      NOT: {
        id: { in: [resourceId, ...sameTypeResources.map((r) => r.id)] },
      },
    },
    take: remainingLimit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      type: true,
      recommendationReason: true,
      resourceLink: true,
      buyLink: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
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
    },
  });

  return [...sameTypeResources, ...otherTypeResources];
}

export async function searchResources(query: string): Promise<ResourceWithRelations[]> {
  const result = await getPaginatedResources({ q: query, limit: 100 });
  return result.resources;
}
