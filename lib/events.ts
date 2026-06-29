import { z } from "zod";

type DateStyle = "medium" | "full";

const EVENT_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET = "+05:30";

export const eventSchema = z
  .object({
    title: z.string().trim().min(2).max(140),
    description: z.string().trim().min(2).max(2000),
    location: z.string().trim().min(2).max(180),
    startsAt: z.string().trim().min(1),
    endsAt: z.string().trim().optional(),
    published: z.coerce.boolean().default(false),
  })
  .refine((event) => Boolean(parseOptionalEventDate(event.startsAt)), {
    message: "Enter a valid start time.",
    path: ["startsAt"],
  })
  .refine((event) => !event.endsAt || Boolean(parseOptionalEventDate(event.endsAt)), {
    message: "Enter a valid end time.",
    path: ["endsAt"],
  })
  .refine(
    (event) => {
      const startsAt = parseOptionalEventDate(event.startsAt);
      const endsAt = event.endsAt ? parseOptionalEventDate(event.endsAt) : null;
      return !startsAt || !endsAt || endsAt >= startsAt;
    },
    {
      message: "End time must be after the start time.",
      path: ["endsAt"],
    },
  );

function parseOptionalEventDate(value: string) {
  const date = new Date(`${value}:00${IST_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseEventDate(value: string) {
  const date = parseOptionalEventDate(value);

  if (!date) {
    throw new Error("Invalid event date");
  }

  return date;
}

export function toISTInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

function formatRange(
  startsAt: Date,
  endsAt: Date | null,
  dateStyle: DateStyle,
  singleSuffix: string,
) {
  const starts = new Intl.DateTimeFormat("en", {
    dateStyle,
    timeStyle: "short",
    timeZone: EVENT_TIME_ZONE,
  }).format(startsAt);

  if (!endsAt) {
    return singleSuffix ? `${starts}${singleSuffix}` : starts;
  }

  const ends = new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    timeZone: EVENT_TIME_ZONE,
  }).format(endsAt);

  return `${starts} - ${ends} IST`;
}

// Compact form used in the events list cards.
export function formatEventListDate(startsAt: Date, endsAt: Date | null) {
  return formatRange(startsAt, endsAt, "medium", "");
}

// Full form used on the event detail page.
export function formatEventDetailDate(startsAt: Date, endsAt: Date | null) {
  return formatRange(startsAt, endsAt, "full", " IST");
}
