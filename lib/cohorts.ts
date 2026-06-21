import { prisma } from "./prisma";

// A single application question, stored in Cohort.questions (a JSON array, in
// display order). Answers are keyed by question id.
export type CohortQuestion = {
  id: string;
  label: string;
  required: boolean;
};

// Cohort.questions is Prisma Json (unknown shape at the type level); normalize
// it into a typed, ordered list and drop anything malformed.
export function parseQuestions(value: unknown): CohortQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const label = typeof record.label === "string" ? record.label.trim() : "";
      if (!id || !label) {
        return null;
      }
      return { id, label, required: record.required === true } satisfies CohortQuestion;
    })
    .filter((question): question is CohortQuestion => question !== null);
}

// Application.answers is Json keyed by question id; normalize to string values.
export function parseAnswers(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const answers: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string") {
      answers[key] = raw;
    }
  }
  return answers;
}

export function getActiveCohort() {
  return prisma.cohort.findFirst({ where: { isActive: true } });
}
