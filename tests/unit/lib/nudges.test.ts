import { NudgeStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  canAccept,
  canCancel,
  canComplete,
  canDecline,
  nudgeSchema,
  NUDGE_STATUS_LABEL,
  nudgeStatusTone,
} from "../../../lib/nudges";

const baseNudge = {
  senderId: "sender",
  recipientId: "recipient",
  status: NudgeStatus.PENDING,
};

describe("nudgeSchema", () => {
  it("accepts a valid nudge payload", () => {
    expect(
      nudgeSchema.safeParse({
        recipientId: "user-1",
        title: "Solve Two Sum",
        message: "Try the hash map approach.",
        link: "https://leetcode.com/problems/two-sum/",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid links and short titles", () => {
    expect(
      nudgeSchema.safeParse({
        recipientId: "user-1",
        title: "x",
        link: "http://example.com",
      }).success,
    ).toBe(false);

    expect(
      nudgeSchema.safeParse({
        recipientId: "user-1",
        title: "Read this article",
        link: "",
      }).success,
    ).toBe(true);
  });
});

describe("nudge permissions", () => {
  it("lets recipients accept or decline pending nudges", () => {
    expect(canAccept(baseNudge, "recipient")).toBe(true);
    expect(canDecline(baseNudge, "recipient")).toBe(true);
    expect(canAccept(baseNudge, "sender")).toBe(false);
    expect(canCancel(baseNudge, "sender")).toBe(true);
  });

  it("lets either party complete accepted nudges", () => {
    const accepted = { ...baseNudge, status: NudgeStatus.ACCEPTED };

    expect(canComplete(accepted, "sender")).toBe(true);
    expect(canComplete(accepted, "recipient")).toBe(true);
    expect(canComplete(accepted, "other")).toBe(false);
    expect(canCancel(accepted, "sender")).toBe(false);
  });
});

describe("nudge presentation helpers", () => {
  it("maps statuses to labels and tones", () => {
    expect(NUDGE_STATUS_LABEL[NudgeStatus.PENDING]).toBe("Pending");
    expect(nudgeStatusTone(NudgeStatus.ACCEPTED)).toBe("accepted");
    expect(nudgeStatusTone(NudgeStatus.DECLINED)).toBe("closed");
  });
});
