import { SupportedLanguage } from "./languages";

/**
 * Inject timers at the start and end of main() execution
 * to get milisecond precision results of the actual execution time
 *
 * @param code The code submitted by the user as a string
 * @param language The language in which the code was written
 * @returns The original code string with an execution timer logic insertion
 */
export function injectTimingLogic(code: string, language: SupportedLanguage): string {
  // The __SystemTimer() milisecond accurate timer makes a
  // chrono::high_resolution_clock::now() call everytime a
  // program starts (global initialization of the timer object)
  // and another call when the main function exits through
  // the object destructor (all global objects are destroyed
  // after main ends)
  if (language == "cpp") {
    return `

#include <iostream>
#include <chrono>

class __SystemTimer {
  private:
    std::chrono::high_resolution_clock::time_point start;

  public:
    __SystemTimer() {
        start = std::chrono::high_resolution_clock::now();
    }

    ~__SystemTimer() {
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        std::cout << "\n__EXECUTION_TIME_MS:" << (duration.count() / 1000.0) << "__\n";
    }
};

static __SystemTimer _exection_timer;

${code}

        `.trim();
  }

  // This timer implementation uses the atexit module to
  // get the time before program end and a simple
  // time.perf_counter() for the start of the program
  else if (language == "python") {
    return `

import time
import atexit

__sys_start_time = time.perf_counter()

def __print_execution_time():
    __sys_end_time = time.perf_counter()
    print(f"\n__EXECUTION_TIME_MS:{(__sys_end_time - __sys_start_time) * 1000:.4f}__")

atexit.register(__print_execution_time)

${code}

        `.trim();
  }

  // Fallback to original code in case of language
  // mismatch anomalies
  return code;
}

/**
 * Strip stdout of execution timer log and clean for
 * final display
 *
 * @param stdout Execution output extracted from stdout as a string
 * @param runtimeWithCompilation runtime in ms including compilation time
 * @returns execution runtime and the clean stdout
 */
export function cleanStdout(stdout: string, runtimeWithCompilation: number) {
  // Runtime logs are of the format "__EXECUTION_TIME_MS:<runtime>__".
  const runtimeRegex = /__EXECUTION_TIME_MS:([\d.]+)__/g;
  const matches = Array.from(stdout.matchAll(runtimeRegex));

  // Strip the marker plus the single newline the timer added around it, but do
  // NOT trim the program's own output — leading whitespace can be significant,
  // and trailing whitespace is normalized later by the judge (normalizeOutput).
  const stripRegex = /\n?__EXECUTION_TIME_MS:[\d.]+__\n?/g;
  const finalStdout = stdout.replace(stripRegex, "");

  // In case of multiple logs use the last one.
  if (matches.length > 0) {
    return {
      runtimeMs: parseFloat(matches[matches.length - 1][1]),
      finalStdout,
    };
  }

  // No marker (crash / timeout / killed): fall back to wall-clock incl. compilation.
  return {
    runtimeMs: runtimeWithCompilation,
    finalStdout,
  };
}
