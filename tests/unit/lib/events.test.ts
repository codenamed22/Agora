import { describe, expect, it } from "vitest";
import {
  eventSchema,
  formatEventDetailDate,
  formatEventListDate,
  parseEventDate,
  toISTInputValue,
} from "../../../lib/events";

// Newer ICU versions use narrow/no-break spaces around AM/PM; normalize for stable assertions.
function normalize(value: string) {
  return value.replace(/[\u202f\u00a0]/g, " ");
}

const starts = new Date("2026-06-22T17:30:00.000Z");
const ends = new Date("2026-06-22T18:30:00.000Z");

describe("formatEventListDate", () => {
  it("formats a start/end range in IST", () => {
    expect(normalize(formatEventListDate(starts, ends))).toBe(
      "Jun 22, 2026, 11:00 PM - 12:00 AM IST",
    );
  });

  it("formats a single start time without an IST suffix", () => {
    expect(normalize(formatEventListDate(starts, null))).toBe("Jun 22, 2026, 11:00 PM");
  });
});

describe("formatEventDetailDate", () => {
  it("formats a full start/end range in IST", () => {
    expect(normalize(formatEventDetailDate(starts, ends))).toBe(
      "Monday, June 22, 2026 at 11:00 PM - 12:00 AM IST",
    );
  });

  it("appends an IST suffix for a single start time", () => {
    expect(normalize(formatEventDetailDate(starts, null))).toBe(
      "Monday, June 22, 2026 at 11:00 PM IST",
    );
  });
});

describe("event form helpers", () => {
  it("parses form date-times as IST", () => {
    expect(parseEventDate("2026-06-22T17:30").toISOString()).toBe("2026-06-22T12:00:00.000Z");
  });

  it("formats stored dates for IST datetime-local inputs", () => {
    expect(toISTInputValue(new Date("2026-06-22T12:00:00.000Z"))).toBe("2026-06-22T17:30");
  });

  it("validates event form fields", () => {
    expect(
      eventSchema.safeParse({
        title: "Hiring Jam",
        description: "Practice together.",
        location: "Online",
        startsAt: "2026-06-22T17:30",
        endsAt: "2026-06-22T18:30",
        published: "on",
      }).success,
    ).toBe(true);

    expect(
      eventSchema.safeParse({
        title: "Hiring Jam",
        description: "Practice together.",
        location: "Online",
        startsAt: "2026-06-22T18:30",
        endsAt: "2026-06-22T17:30",
      }).success,
    ).toBe(false);
  });
});
