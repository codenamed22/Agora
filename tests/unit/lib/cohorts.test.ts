import { describe, expect, it } from "vitest";

import { parseAnswers, parseQuestions } from "../../../lib/cohorts";

describe("parseQuestions", () => {
  it("returns an empty list for non-array input", () => {
    expect(parseQuestions(null)).toEqual([]);
    expect(parseQuestions("nope")).toEqual([]);
    expect(parseQuestions({})).toEqual([]);
  });

  it("keeps well-formed questions and defaults required to false", () => {
    const input = [
      { id: "a", label: "Why join?", required: true },
      { id: "b", label: "Experience", required: false },
      { id: "c", label: "No required flag" },
    ];

    expect(parseQuestions(input)).toEqual([
      { id: "a", label: "Why join?", required: true },
      { id: "b", label: "Experience", required: false },
      { id: "c", label: "No required flag", required: false },
    ]);
  });

  it("drops entries missing an id or label, or of the wrong type", () => {
    const input = [
      { id: "a", label: "Keep" },
      { id: "", label: "no id" },
      { id: "b", label: "" },
      { label: "no id field" },
      "string",
      null,
      42,
    ];

    expect(parseQuestions(input)).toEqual([{ id: "a", label: "Keep", required: false }]);
  });
});

describe("parseAnswers", () => {
  it("returns an empty object for non-object input", () => {
    expect(parseAnswers(null)).toEqual({});
    expect(parseAnswers("nope")).toEqual({});
    expect(parseAnswers(42)).toEqual({});
  });

  it("keeps string answers and drops non-string values", () => {
    expect(parseAnswers({ a: "yes", b: 5, c: "ok", d: null })).toEqual({ a: "yes", c: "ok" });
  });
});
