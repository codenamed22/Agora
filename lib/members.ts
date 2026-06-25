import { z } from "zod";

export const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
export const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  batch: z.string().trim().max(40).optional(),
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
  emoji: z.string().trim().min(1).max(16),
  description: z.string().trim().max(240).optional(),
});

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
    return "Upload a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return "Keep profile photos under 2MB.";
  }

  return null;
}
