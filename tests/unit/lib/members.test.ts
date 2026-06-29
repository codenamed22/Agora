import { describe, expect, it } from "vitest";
import {
  MAX_PROFILE_PHOTO_BYTES,
  assignMedals,
  batchYears,
  memberDisplayName,
  memberInitials,
  memberTotalXp,
  parseSkills,
  profileSchema,
  validateProfilePhoto,
} from "../../../lib/members";

describe("member helpers", () => {
  it("normalizes skills", () => {
    expect(parseSkills(" React, DSA,, Backend ")).toEqual(["React", "DSA", "Backend"]);
  });

  it("uses profile display name before user name", () => {
    expect(
      memberDisplayName({
        email: "member@example.com",
        name: "Account Name",
        profile: { displayName: "Profile Name" },
      }),
    ).toBe("Profile Name");
  });

  it("builds initials", () => {
    expect(memberInitials("Navneet Anand")).toBe("NA");
  });

  it("requires https URLs", () => {
    const parsed = profileSchema.safeParse({
      githubUrl: "http://github.com/example",
      linkedinUrl: "",
      resumeUrl: "https://example.com/resume.pdf",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates uploaded profile photos", () => {
    expect(validateProfilePhoto(new File(["x"], "photo.png", { type: "image/png" }))).toBeNull();
    expect(validateProfilePhoto(new File(["x"], "photo.gif", { type: "image/gif" }))).toContain(
      "JPG",
    );
    expect(
      validateProfilePhoto(
        new File(["x".repeat(MAX_PROFILE_PHOTO_BYTES + 1)], "photo.png", { type: "image/png" }),
      ),
    ).toContain("under 2MB");
  });

  it("accepts a 4-digit batch year and rejects free-form text", () => {
    const base = { githubUrl: "", linkedinUrl: "", resumeUrl: "" };
    expect(profileSchema.safeParse({ ...base, batch: "2028" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, batch: "" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, batch: "2024-28" }).success).toBe(false);
    expect(batchYears()).toContain(String(new Date().getFullYear()));
  });

  it("sums member XP across badges", () => {
    expect(memberTotalXp([{ badge: { xp: 10 } }, { badge: { xp: 5 } }])).toBe(15);
    expect(memberTotalXp([])).toBe(0);
  });

  it("awards gold/silver/bronze to the top 3 by XP, skipping zeros", () => {
    const medals = assignMedals([
      { id: "a", name: "Ann", xp: 50 },
      { id: "b", name: "Bob", xp: 90 },
      { id: "c", name: "Cy", xp: 50 },
      { id: "d", name: "Dee", xp: 0 },
    ]);

    expect(medals.get("b")).toBe("gold");
    // Ann and Cy tie at 50; "Ann" sorts first -> silver.
    expect(medals.get("a")).toBe("silver");
    expect(medals.get("c")).toBe("bronze");
    expect(medals.has("d")).toBe(false);
  });

  it("awards fewer than 3 medals when fewer members have XP", () => {
    const medals = assignMedals([
      { id: "a", name: "Ann", xp: 10 },
      { id: "b", name: "Bob", xp: 0 },
    ]);

    expect(medals.size).toBe(1);
    expect(medals.get("a")).toBe("gold");
  });
});
