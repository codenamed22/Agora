import { describe, expect, it } from "vitest";
import { cleanStdout, injectTimingLogic } from "../../../lib/judge/timer";

const MARKER = "__EXECUTION_TIME_MS:12.5__";

describe("cleanStdout", () => {
  it("extracts the runtime and strips the marker", () => {
    // program printed "5" (no newline); the timer appends "\n<marker>\n".
    const { runtimeMs, finalStdout } = cleanStdout(`5\n${MARKER}\n`, 999);
    expect(runtimeMs).toBe(12.5);
    expect(finalStdout).toBe("5");
  });

  it("preserves the program's own trailing newline", () => {
    // program printed "out\n"; timer adds its own leading "\n" before the marker.
    const { finalStdout } = cleanStdout(`out\n\n${MARKER}\n`, 999);
    expect(finalStdout).toBe("out\n");
  });

  it("preserves leading whitespace", () => {
    const { finalStdout } = cleanStdout(`   abc\n${MARKER}\n`, 999);
    expect(finalStdout).toBe("   abc");
  });

  it("handles a marker with no surrounding newlines", () => {
    const { finalStdout } = cleanStdout(`5${MARKER}`, 999);
    expect(finalStdout).toBe("5");
  });

  it("uses the last marker when several are present", () => {
    const { runtimeMs, finalStdout } = cleanStdout(
      `x__EXECUTION_TIME_MS:1.0____EXECUTION_TIME_MS:2.0__`,
      999,
    );
    expect(runtimeMs).toBe(2.0);
    expect(finalStdout).toBe("x");
  });

  it("falls back to wall-clock runtime when no marker is present", () => {
    const { runtimeMs, finalStdout } = cleanStdout("plain output\n", 42);
    expect(runtimeMs).toBe(42);
    expect(finalStdout).toBe("plain output\n");
  });
});

describe("injectTimingLogic", () => {
  it("wraps python code with an atexit timer and keeps the user code", () => {
    const out = injectTimingLogic("print('hi')", "python");
    expect(out).toContain("atexit.register");
    expect(out).toContain("__EXECUTION_TIME_MS");
    expect(out).toContain("print('hi')");
  });

  it("wraps cpp code with a chrono timer and keeps the user code", () => {
    const out = injectTimingLogic("int main(){return 0;}", "cpp");
    expect(out).toContain("high_resolution_clock");
    expect(out).toContain("__EXECUTION_TIME_MS");
    expect(out).toContain("int main(){return 0;}");
  });
});
