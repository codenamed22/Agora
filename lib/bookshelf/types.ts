import { Prisma } from "@/prisma-client";

export type CategoryWithCount = Prisma.CategoryGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    _count: {
      select: { resources: true };
    };
  };
}>;

export type ResourceWithRelations = Prisma.ResourceGetPayload<{
  select: {
    id: true;
    title: true;
    author: true;
    type: true;
    recommendationReason: true;
    imageUrl: true;
    pdfUrl: true;
    pdfSizeBytes: true;
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
    recommendedBy: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

export const resourceListSelect = {
  id: true,
  title: true,
  author: true,
  type: true,
  imageUrl: true,
  pdfUrl: true,
  category: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.ResourceSelect;

export type ResourceList = Prisma.ResourceGetPayload<{
  select: typeof resourceListSelect;
}>;
