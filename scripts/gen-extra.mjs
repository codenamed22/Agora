// Generates expected outputs for new hidden test inputs by running the reference
// solutions. Prints JSON: { slug: [{ input, expectedOutput }] }.
// Run: node scripts/gen-extra.mjs
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const solutionsDir = join(here, "reference-solutions");

// Hand-crafted edge-case inputs (2 per problem). Outputs computed by the reference solution.
const inputs = {
  "sum-two-numbers": ["-1000000000 -1000000000\n", "0 0\n"],
  "two-sum": ["4 -8\n-3 -5 1 2\n", "5 10\n1 90 2 8 50\n"],
  "best-time-to-buy-and-sell-stock": ["1\n5\n", "5\n1 2 3 4 5\n"],
  "insert-interval": ["3\n1 2\n3 4\n5 6\n0 7\n", "2\n1 2\n3 4\n5 6\n"],
  "three-sum": ["4\n-1 -2 -3 -4\n", "7\n-4 -2 -2 0 2 2 4\n"],
  "product-of-array-except-self": ["3\n0 4 5\n", "4\n-1 -2 -3 -4\n"],
  "combination-sum": ["2 1\n2 3\n", "1 6\n3\n"],
  "merge-intervals": ["3\n1 5\n2 6\n3 7\n", "3\n1 10\n2 3\n4 5\n"],
  "majority-element": ["1\n7\n", "4\n9 9 9 9\n"],
  "sort-colors": ["4\n2 2 2 2\n", "5\n2 1 0 2 1\n"],
  "contains-duplicate": ["1\n5\n", "3\n-1 -1 2\n"],
  "container-with-most-water": ["2\n4 6\n", "5\n1 2 3 4 5\n"],
  "gas-station": ["3\n1 1 1\n2 2 2\n", "5\n2 3 4 5 1\n3 4 5 1 2\n"],
  "longest-consecutive-sequence": ["1\n5\n", "7\n1 2 2 3 4 4 5\n"],
  "rotate-array": ["3 0\n1 2 3\n", "3 3\n1 2 3\n"],
  "contiguous-array": ["3\n1 1 1\n", "4\n0 1 0 1\n"],
  "subarray-sum-equals-k": ["4 0\n1 -1 1 -1\n", "1 5\n5\n"],
  "move-zeroes": ["3\n1 2 3\n", "3\n0 0 0\n"],
  "sliding-window-maximum": ["4 4\n4 2 5 1\n", "4 2\n4 3 2 1\n"],
  "squares-of-a-sorted-array": ["3\n-5 -3 -1\n", "1\n-2\n"],
  "group-anagrams": ["3\nabc\ndef\nghi\n", "3\nabc\nbca\ncab\n"],
  "longest-repeating-character-replacement": ["AAAA\n0\n", "ABCD\n0\n"],
  "longest-common-prefix": ["2\nabc\nabc\n", "2\n\nabc\n"],
  "largest-number": ["3\n9 8 7\n", "3\n34 3 30\n"],
  "palindrome-pairs": ["3\n\na\nbb\n", "2\nab\ncd\n"],
};

const out = {};
for (const [slug, list] of Object.entries(inputs)) {
  out[slug] = list.map((input) => {
    const run = spawnSync("python3", [join(solutionsDir, `${slug}.py`)], {
      input,
      encoding: "utf8",
    });
    if (run.status !== 0) {
      throw new Error(`${slug} failed on ${JSON.stringify(input)}: ${run.stderr}`);
    }
    return { input, expectedOutput: run.stdout };
  });
}

console.log(JSON.stringify(out, null, 2));
