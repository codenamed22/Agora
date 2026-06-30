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

  // Drop malformed entries and duplicate ids (dup ids collide in form names).
  const seen = new Set<string>();
  const questions: CohortQuestion[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : "";
    const label = typeof record.label === "string" ? record.label.trim() : "";
    if (!id || !label || seen.has(id)) {
      continue;
    }
    seen.add(id);
    questions.push({ id, label, required: record.required === true });
  }
  return questions;
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
