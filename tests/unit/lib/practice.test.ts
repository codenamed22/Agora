import { describe, expect, it } from "vitest";
import { rankPracticeUsers } from "../../../lib/practice";

describe("practice helpers", () => {
  it("ranks users by weighted unique accepted problem score, then name", () => {
    const ranking = rankPracticeUsers(
      [
        { userId: "a", problemId: "easy", difficulty: "EASY" },
        { userId: "a", problemId: "easy", difficulty: "EASY" },
        { userId: "a", problemId: "medium", difficulty: "MEDIUM" },
        { userId: "b", problemId: "hard", difficulty: "HARD" },
        { userId: "c", problemId: "easy", difficulty: "EASY" },
        { userId: "c", problemId: "medium", difficulty: "MEDIUM" },
      ],
      [
        { id: "a", name: "Ava", email: "ava@example.com" },
        { id: "b", name: "Zed", email: "zed@example.com" },
        { id: "c", name: "Bea", email: "bea@example.com" },
      ],
    );

    expect(ranking).toEqual([
      { userId: "b", name: "Zed", solvedCount: 1, score: 7 },
      { userId: "a", name: "Ava", solvedCount: 2, score: 4 },
      { userId: "c", name: "Bea", solvedCount: 2, score: 4 },
    ]);
  });
});
