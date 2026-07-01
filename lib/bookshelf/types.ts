import { Prisma } from "@prisma/client";

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
    resourceLink: true;
    buyLink: true;
    imageUrl: true;
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
