import { z } from "zod";

export const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
export const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

// Graduation years offered in batch dropdowns, newest first. Range widens automatically.
export function batchYears() {
  const now = new Date().getFullYear();
  return Array.from({ length: 17 }, (_, i) => String(now + 6 - i));
}

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .refine((url) => url.startsWith("https://"), "Use an https:// URL")
  .or(z.literal(""))
  .transform((value) => value || null);

export const profileSchema = z.object({
  displayName: z.string().trim().max(80).optional(),
  college: z.string().trim().max(120).optional(),
  batch: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Select a valid graduation year")
    .or(z.literal(""))
    .optional(),
  branch: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(1200).optional(),
  skills: z.string().trim().max(500).optional(),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  leetcodeHandle: z.string().trim().max(80).optional(),
  resumeUrl: optionalUrl,
});

export const badgeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  xp: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export type Medal = "gold" | "silver" | "bronze";

export function memberTotalXp(memberBadges: { badge: { xp: number } }[]) {
  return memberBadges.reduce((total, memberBadge) => total + memberBadge.badge.xp, 0);
}

// Global gold/silver/bronze for the top 3 members by XP (XP > 0 only), ties broken by name.
export function assignMedals(
  members: { id: string; name: string; xp: number }[],
): Map<string, Medal> {
  const medals: Medal[] = ["gold", "silver", "bronze"];
  const ranked = members
    .filter((member) => member.xp > 0)
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));

  return new Map(ranked.slice(0, 3).map((member, index) => [member.id, medals[index]]));
}

type MedalCandidate = {
  id: string;
  name: string | null;
  email: string;
  profile?: { displayName: string | null } | null;
  memberBadges: { badge: { xp: number } }[];
};

// Build the medal map straight from member records (display name + summed badge XP).
export function medalsForMembers(members: MedalCandidate[]) {
  return assignMedals(
    members.map((member) => ({
      id: member.id,
      name: memberDisplayName(member),
      xp: memberTotalXp(member.memberBadges),
    })),
  );
}

export function parseSkills(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function memberDisplayName(user: {
  name: string | null;
  email: string;
  profile?: { displayName: string | null } | null;
}) {
  return user.profile?.displayName || user.name || "ShardUp member";
}

export function memberInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function validateProfilePhoto(file: File) {
  if (file.size === 0) {
    return null;
  }

  if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
    return "Upload a JPG, PNG, WebP, or SVG image.";
  }

  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return "Keep profile photos under 2MB.";
  }

  return null;
}
