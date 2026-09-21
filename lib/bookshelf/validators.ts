import { z } from "zod";

export const RESOURCE_TYPE_VALUES = [
  "BOOK",
  "ARTICLE",
  "COURSE",
  "VIDEO",
  "RESEARCH_PAPER",
] as const;

const optionalText = z.string().trim();

export const resourceSchema = z.object({
  title: z.string().trim().min(2).max(160),
  author: optionalText.max(160).optional().or(z.literal("")),
  type: z.enum(RESOURCE_TYPE_VALUES),
  categoryId: z.string().trim().min(1),
  recommendationReason: optionalText.max(2000).optional().or(z.literal("")),
});

export type ResourceFormInput = {
  title: string;
  author: string | null;
  type: (typeof RESOURCE_TYPE_VALUES)[number];
  categoryId: string;
  recommendationReason: string | null;
};

export function normalizeResourceInput(input: z.infer<typeof resourceSchema>): ResourceFormInput {
  return {
    title: input.title,
    author: input.author || null,
    type: input.type,
    categoryId: input.categoryId,
    recommendationReason: input.recommendationReason || null,
  };
}
