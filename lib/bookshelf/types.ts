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
