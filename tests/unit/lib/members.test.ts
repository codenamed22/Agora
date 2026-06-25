import { describe, expect, it } from "vitest";
import {
  MAX_PROFILE_PHOTO_BYTES,
  memberDisplayName,
  memberInitials,
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
});
