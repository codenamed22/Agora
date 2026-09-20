import { ResourceType, Role, UserStatus } from "@/prisma-client";
import { describe, expect, it } from "vitest";
import {
  canReviewResource,
  canSubmitResource,
  resourceSubmissionSchema,
} from "../../../lib/bookshelf/submissions";

const validSubmission = {
  title: "Attention Is All You Need",
  author: "Ashish Vaswani et al.",
  type: ResourceType.RESEARCH_PAPER,
  categoryId: "category-id",
  recommendationReason: "A foundational paper for understanding transformer architectures.",
  resourceLink: "https://arxiv.org/pdf/1706.03762",
  buyLink: "",
  imageUrl: "",
};

describe("bookshelf submission validation", () => {
  it("accepts an open-access research paper and clears book-only fields", () => {
    const parsed = resourceSubmissionSchema.parse({
      ...validSubmission,
      buyLink: "https://example.com/ignored",
    });

    expect(parsed.buyLink).toBeNull();
    expect(parsed.imageUrl).toBeNull();
  });

  it("accepts a book with optional https links", () => {
    const parsed = resourceSubmissionSchema.parse({
      ...validSubmission,
      type: ResourceType.BOOK,
      resourceLink: "https://example.com/book",
      buyLink: "https://example.com/buy",
      imageUrl: "https://example.com/cover.jpg",
    });

    expect(parsed.buyLink).toBe("https://example.com/buy");
    expect(parsed.imageUrl).toBe("https://example.com/cover.jpg");
  });

  it("rejects unsupported resource types and non-https links", () => {
    expect(
      resourceSubmissionSchema.safeParse({
        ...validSubmission,
        type: ResourceType.ARTICLE,
      }).success,
    ).toBe(false);
    expect(
      resourceSubmissionSchema.safeParse({
        ...validSubmission,
        resourceLink: "http://example.com/paper.pdf",
      }).success,
    ).toBe(false);
  });
});

describe("bookshelf submission authorization", () => {
  it("allows only active users to submit", () => {
    expect(canSubmitResource({ status: UserStatus.ACTIVE })).toBe(true);
    expect(canSubmitResource({ status: UserStatus.PENDING })).toBe(false);
    expect(canSubmitResource(null)).toBe(false);
  });

  it("allows only active admins to review", () => {
    expect(canReviewResource({ role: Role.ADMIN, status: UserStatus.ACTIVE })).toBe(true);
    expect(canReviewResource({ role: Role.MEMBER, status: UserStatus.ACTIVE })).toBe(false);
    expect(canReviewResource({ role: Role.ADMIN, status: UserStatus.SUSPENDED })).toBe(false);
  });
});
