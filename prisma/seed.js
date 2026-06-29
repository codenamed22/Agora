const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { buildStressTests } = require("./hidden-stress-tests");
const { randomUUID } = require("node:crypto");

const prisma = new PrismaClient();

const SOLUTIONS_DIR = path.join(__dirname, "..", "scripts", "reference-solutions");
const REFERENCE_SOLUTION_EXTENSIONS = {
  python: "py",
  cpp: "cpp",
};

function readReferenceSolutions(slug) {
  return Object.entries(REFERENCE_SOLUTION_EXTENSIONS)
    .map(([language, extension]) => {
      const file = path.join(SOLUTIONS_DIR, `${slug}.${extension}`);
      return fs.existsSync(file) ? { language, code: fs.readFileSync(file, "utf8") } : null;
    })
    .filter(Boolean);
}
const TOP_PRACTICE_BADGE_NAME = "Practice Champion";

async function main() {
  // Active cohort with a couple of default questions so the apply flow works.
  await prisma.cohort.upsert({
    where: { year: 2027 },
    update: {},
    create: {
      year: 2027,
      isActive: true,
      questions: [
        {
          id: randomUUID(),
          label: "What do you want to build or improve through ShardUp?",
          required: true,
        },
        { id: randomUUID(), label: "Relevant experience or projects", required: false },
      ],
    },
  });

  // Sample events.
  const events = [
    {
      title: "Introduction to Tensor Processing Units (TPUs)",
      description:
        "Deepak Singh, SWE 3 at Google and previously SDE 2 at Uber and Microsoft plus SDE Intern at Amazon, will introduce Tensor Processing Units, why they matter for modern machine learning workloads, how they differ from GPUs, and when builders should consider using them for training or inference.",
      imageUrl: "https://fbxzb7sb0uusum4k.public.blob.vercel-storage.com/event1",
      location: "Online",
      startsAt: new Date("2026-06-22T17:30:00.000Z"),
      endsAt: new Date("2026-06-22T18:30:00.000Z"),
      published: true,
    },
  ];

  for (const event of events) {
    const existingEvent = await prisma.event.findFirst({
      where: { title: event.title },
      select: { id: true },
    });

    if (existingEvent) {
      await prisma.event.update({ where: { id: existingEvent.id }, data: event });
    } else {
      await prisma.event.create({ data: event });
    }
  }

  const problems = [
    {
      slug: "sum-two-numbers",
      title: "Sum Two Numbers",
      statement:
        "Read two integers from standard input and print their sum.\n\nThis warm-up problem verifies that your program can read input and write output in the ShardUp judge.",
      constraints: "-10^9 <= a, b <= 10^9",
      tags: ["Math", "Warm-up"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "2 3\n", expectedOutput: "5\n", isSample: true, order: 1 },
        { input: "-4 10\n", expectedOutput: "6\n", isSample: true, order: 2 },
        {
          input: "1000000000 1000000000\n",
          expectedOutput: "2000000000\n",
          isSample: false,
          order: 3,
        },
      ],
    },
    {
      slug: "two-sum",
      title: "Two Sum",
      statement:
        "Given an array of integers and a target, print the zero-based indices of two numbers whose sum equals the target.\n\nInput format:\n- First line: n target\n- Second line: n integers\n\nPrint two indices in increasing order. If multiple pairs work, print the lexicographically smallest pair.",
      constraints:
        "2 <= n <= 10^5\n-10^9 <= nums[i], target <= 10^9\nExactly one valid pair exists.",
      tags: ["Array", "Hash Table", "Google", "Amazon"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "4 9\n2 7 11 15\n", expectedOutput: "0 1\n", isSample: true, order: 1 },
        { input: "3 6\n3 2 4\n", expectedOutput: "1 2\n", isSample: true, order: 2 },
        { input: "5 0\n-3 4 3 90 2\n", expectedOutput: "0 2\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "best-time-to-buy-and-sell-stock",
      title: "Best Time to Buy and Sell Stock",
      statement:
        "Given daily stock prices, choose one day to buy and a later day to sell. Print the maximum possible profit. If no profitable trade exists, print 0.\n\nInput format:\n- First line: n\n- Second line: n prices",
      constraints: "1 <= n <= 10^5\n0 <= prices[i] <= 10^9",
      tags: ["Array", "Greedy", "Dynamic Programming", "Amazon", "Microsoft"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "6\n7 1 5 3 6 4\n", expectedOutput: "5\n", isSample: true, order: 1 },
        { input: "5\n7 6 4 3 1\n", expectedOutput: "0\n", isSample: true, order: 2 },
        { input: "4\n2 4 1 9\n", expectedOutput: "8\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "insert-interval",
      title: "Insert Interval",
      statement:
        "You are given sorted, non-overlapping intervals and one new interval. Insert the new interval and merge overlaps.\n\nInput format:\n- First line: n\n- Next n lines: start end\n- Last line: newStart newEnd\n\nPrint the merged intervals in sorted order, one interval per line as `start end`.",
      constraints: "0 <= n <= 10^4\n-10^9 <= start <= end <= 10^9",
      tags: ["Array", "Intervals", "Google", "Meta"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        {
          input: "2\n1 3\n6 9\n2 5\n",
          expectedOutput: "1 5\n6 9\n",
          isSample: true,
          order: 1,
        },
        {
          input: "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8\n",
          expectedOutput: "1 2\n3 10\n12 16\n",
          isSample: true,
          order: 2,
        },
        { input: "0\n4 8\n", expectedOutput: "4 8\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "three-sum",
      title: "3Sum",
      statement:
        "Given an integer array, print all unique triplets whose values sum to 0.\n\nInput format:\n- First line: n\n- Second line: n integers\n\nSort each triplet in nondecreasing order. Print unique triplets in lexicographic order, one triplet per line. Print `EMPTY` if no triplet exists.",
      constraints: "3 <= n <= 3000\n-10^5 <= nums[i] <= 10^5",
      tags: ["Array", "Two Pointers", "Sorting", "Meta", "Amazon"],
      difficulty: "MEDIUM",
      timeLimitMs: 3000,
      published: true,
      testCases: [
        {
          input: "6\n-1 0 1 2 -1 -4\n",
          expectedOutput: "-1 -1 2\n-1 0 1\n",
          isSample: true,
          order: 1,
        },
        { input: "3\n0 1 1\n", expectedOutput: "EMPTY\n", isSample: true, order: 2 },
        { input: "4\n0 0 0 0\n", expectedOutput: "0 0 0\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "product-of-array-except-self",
      title: "Product of Array Except Self",
      statement:
        "For each index, compute the product of every array value except the value at that index.\n\nInput format:\n- First line: n\n- Second line: n integers\n\nPrint n integers on one line.",
      constraints:
        "2 <= n <= 10^5\n-30 <= nums[i] <= 30\nThe answer for each index fits in a signed 64-bit integer.",
      tags: ["Array", "Prefix Product", "Google", "Meta"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "4\n1 2 3 4\n", expectedOutput: "24 12 8 6\n", isSample: true, order: 1 },
        { input: "5\n-1 1 0 -3 3\n", expectedOutput: "0 0 9 0 0\n", isSample: true, order: 2 },
        { input: "3\n2 3 4\n", expectedOutput: "12 8 6\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "combination-sum",
      title: "Combination Sum",
      statement:
        "Given distinct positive candidate numbers and a target, print all unique combinations where chosen numbers sum to the target. Each candidate may be used any number of times.\n\nInput format:\n- First line: n target\n- Second line: n distinct positive integers\n\nPrint each combination in nondecreasing order, one combination per line. Print combinations in lexicographic order. Print `EMPTY` if there are none.",
      constraints: "1 <= n <= 30\n1 <= candidates[i], target <= 500",
      tags: ["Array", "Backtracking", "Amazon", "Microsoft"],
      difficulty: "MEDIUM",
      timeLimitMs: 3000,
      published: true,
      testCases: [
        { input: "4 7\n2 3 6 7\n", expectedOutput: "2 2 3\n7\n", isSample: true, order: 1 },
        {
          input: "3 8\n2 3 5\n",
          expectedOutput: "2 2 2 2\n2 3 3\n3 5\n",
          isSample: true,
          order: 2,
        },
        { input: "1 3\n2\n", expectedOutput: "EMPTY\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "merge-intervals",
      title: "Merge Intervals",
      statement:
        "Given a list of intervals, merge every overlapping interval.\n\nInput format:\n- First line: n\n- Next n lines: start end\n\nPrint merged intervals sorted by start, one interval per line as `start end`.",
      constraints: "1 <= n <= 10^5\n-10^9 <= start <= end <= 10^9",
      tags: ["Array", "Intervals", "Sorting", "Google", "Amazon"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        {
          input: "4\n1 3\n2 6\n8 10\n15 18\n",
          expectedOutput: "1 6\n8 10\n15 18\n",
          isSample: true,
          order: 1,
        },
        { input: "2\n1 4\n4 5\n", expectedOutput: "1 5\n", isSample: true, order: 2 },
        { input: "3\n5 7\n1 3\n2 4\n", expectedOutput: "1 4\n5 7\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "majority-element",
      title: "Majority Element",
      statement:
        "Given an array where one value appears more than floor(n / 2) times, print that majority value.\n\nInput format:\n- First line: n\n- Second line: n integers",
      constraints:
        "1 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9\nA majority element is guaranteed to exist.",
      tags: ["Array", "Voting", "Hash Table", "Adobe", "Amazon"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "3\n3 2 3\n", expectedOutput: "3\n", isSample: true, order: 1 },
        { input: "7\n2 2 1 1 1 2 2\n", expectedOutput: "2\n", isSample: true, order: 2 },
        { input: "5\n-1 -1 -1 2 3\n", expectedOutput: "-1\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "sort-colors",
      title: "Sort Colors",
      statement:
        "Given an array containing only 0, 1, and 2, print the values in sorted order.\n\nInput format:\n- First line: n\n- Second line: n integers, each one 0, 1, or 2\n\nPrint the sorted values on one line.",
      constraints: "1 <= n <= 10^5\nnums[i] is 0, 1, or 2",
      tags: ["Array", "Two Pointers", "Sorting", "Microsoft", "Meta"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "6\n2 0 2 1 1 0\n", expectedOutput: "0 0 1 1 2 2\n", isSample: true, order: 1 },
        { input: "3\n2 0 1\n", expectedOutput: "0 1 2\n", isSample: true, order: 2 },
        { input: "5\n1 1 1 0 2\n", expectedOutput: "0 1 1 1 2\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "contains-duplicate",
      title: "Contains Duplicate",
      statement:
        "Given an integer array, print whether any value appears at least twice.\n\nInput format:\n- First line: n\n- Second line: n integers\n\nPrint `true` if a duplicate exists, otherwise print `false`.",
      constraints: "1 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9",
      tags: ["Array", "Hash Table", "Sorting", "Amazon", "Apple"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "4\n1 2 3 1\n", expectedOutput: "true\n", isSample: true, order: 1 },
        { input: "4\n1 2 3 4\n", expectedOutput: "false\n", isSample: true, order: 2 },
        { input: "10\n1 1 1 3 3 4 3 2 4 2\n", expectedOutput: "true\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "container-with-most-water",
      title: "Container With Most Water",
      statement:
        "Given vertical line heights, choose two lines that hold the most water with the x-axis. Print the maximum area.\n\nInput format:\n- First line: n\n- Second line: n nonnegative integers",
      constraints: "2 <= n <= 10^5\n0 <= height[i] <= 10^9",
      tags: ["Array", "Two Pointers", "Greedy", "Amazon", "Google"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "9\n1 8 6 2 5 4 8 3 7\n", expectedOutput: "49\n", isSample: true, order: 1 },
        { input: "2\n1 1\n", expectedOutput: "1\n", isSample: true, order: 2 },
        { input: "5\n4 3 2 1 4\n", expectedOutput: "16\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "gas-station",
      title: "Gas Station",
      statement:
        "There are n gas stations in a circle. At station i, you gain gas[i] fuel and spend cost[i] fuel to drive to the next station. Print the smallest starting index that completes the circuit, or -1 if impossible.\n\nInput format:\n- First line: n\n- Second line: n gas values\n- Third line: n cost values",
      constraints: "1 <= n <= 10^5\n0 <= gas[i], cost[i] <= 10^9",
      tags: ["Array", "Greedy", "Amazon", "Google"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "5\n1 2 3 4 5\n3 4 5 1 2\n", expectedOutput: "3\n", isSample: true, order: 1 },
        { input: "3\n2 3 4\n3 4 3\n", expectedOutput: "-1\n", isSample: true, order: 2 },
        { input: "4\n5 1 2 3\n4 4 1 2\n", expectedOutput: "2\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "longest-consecutive-sequence",
      title: "Longest Consecutive Sequence",
      statement:
        "Given an unsorted array, print the length of the longest run of consecutive integer values.\n\nInput format:\n- First line: n\n- Second line: n integers",
      constraints: "0 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9",
      tags: ["Array", "Hash Table", "Union Find", "Google", "Meta"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "6\n100 4 200 1 3 2\n", expectedOutput: "4\n", isSample: true, order: 1 },
        { input: "10\n0 3 7 2 5 8 4 6 0 1\n", expectedOutput: "9\n", isSample: true, order: 2 },
        { input: "0\n\n", expectedOutput: "0\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "rotate-array",
      title: "Rotate Array",
      statement:
        "Given an array and a nonnegative integer k, rotate the array to the right by k positions and print the result.\n\nInput format:\n- First line: n k\n- Second line: n integers",
      constraints: "1 <= n <= 10^5\n0 <= k <= 10^9\n-10^9 <= nums[i] <= 10^9",
      tags: ["Array", "Two Pointers", "Math", "Microsoft", "Amazon"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        {
          input: "7 3\n1 2 3 4 5 6 7\n",
          expectedOutput: "5 6 7 1 2 3 4\n",
          isSample: true,
          order: 1,
        },
        {
          input: "4 2\n-1 -100 3 99\n",
          expectedOutput: "3 99 -1 -100\n",
          isSample: true,
          order: 2,
        },
        { input: "5 7\n1 2 3 4 5\n", expectedOutput: "4 5 1 2 3\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "contiguous-array",
      title: "Contiguous Array",
      statement:
        "Given a binary array, print the length of the longest contiguous subarray with the same number of 0s and 1s.\n\nInput format:\n- First line: n\n- Second line: n values, each 0 or 1",
      constraints: "1 <= n <= 10^5\nnums[i] is 0 or 1",
      tags: ["Array", "Hash Table", "Prefix Sum", "Meta", "Amazon"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "2\n0 1\n", expectedOutput: "2\n", isSample: true, order: 1 },
        { input: "3\n0 1 0\n", expectedOutput: "2\n", isSample: true, order: 2 },
        { input: "8\n0 0 1 0 0 0 1 1\n", expectedOutput: "6\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "subarray-sum-equals-k",
      title: "Subarray Sum Equals K",
      statement:
        "Given an integer array and target k, print the number of contiguous subarrays whose sum equals k.\n\nInput format:\n- First line: n k\n- Second line: n integers",
      constraints: "1 <= n <= 10^5\n-10^9 <= nums[i], k <= 10^9",
      tags: ["Array", "Hash Table", "Prefix Sum", "Google", "Amazon"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "3 2\n1 1 1\n", expectedOutput: "2\n", isSample: true, order: 1 },
        { input: "3 3\n1 2 3\n", expectedOutput: "2\n", isSample: true, order: 2 },
        { input: "5 0\n1 -1 0 2 -2\n", expectedOutput: "6\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "move-zeroes",
      title: "Move Zeroes",
      statement:
        "Move every zero to the end of the array while preserving the relative order of nonzero values. Print the final array.\n\nInput format:\n- First line: n\n- Second line: n integers",
      constraints: "1 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9",
      tags: ["Array", "Two Pointers", "Microsoft", "Meta"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "5\n0 1 0 3 12\n", expectedOutput: "1 3 12 0 0\n", isSample: true, order: 1 },
        { input: "1\n0\n", expectedOutput: "0\n", isSample: true, order: 2 },
        { input: "6\n4 0 5 0 0 6\n", expectedOutput: "4 5 6 0 0 0\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "sliding-window-maximum",
      title: "Sliding Window Maximum",
      statement:
        "Given an array and window size k, print the maximum value in each contiguous window of length k.\n\nInput format:\n- First line: n k\n- Second line: n integers\n\nPrint the window maximums on one line.",
      constraints: "1 <= k <= n <= 10^5\n-10^9 <= nums[i] <= 10^9",
      tags: ["Array", "Queue", "Sliding Window", "Heap", "Amazon", "Google"],
      difficulty: "HARD",
      timeLimitMs: 3000,
      published: true,
      testCases: [
        {
          input: "8 3\n1 3 -1 -3 5 3 6 7\n",
          expectedOutput: "3 3 5 5 6 7\n",
          isSample: true,
          order: 1,
        },
        { input: "1 1\n1\n", expectedOutput: "1\n", isSample: true, order: 2 },
        { input: "5 2\n9 11 8 5 7\n", expectedOutput: "11 11 8 7\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "squares-of-a-sorted-array",
      title: "Squares of a Sorted Array",
      statement:
        "Given a nondecreasing array, square each value and print the squares in nondecreasing order.\n\nInput format:\n- First line: n\n- Second line: n sorted integers",
      constraints: "1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4",
      tags: ["Array", "Two Pointers", "Sorting", "Google", "Amazon"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "5\n-4 -1 0 3 10\n", expectedOutput: "0 1 9 16 100\n", isSample: true, order: 1 },
        { input: "5\n-7 -3 2 3 11\n", expectedOutput: "4 9 9 49 121\n", isSample: true, order: 2 },
        { input: "3\n-2 -1 0\n", expectedOutput: "0 1 4\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "group-anagrams",
      title: "Group Anagrams",
      statement:
        "Given a list of lowercase words, group words that are anagrams of each other.\n\nInput format:\n- First line: n\n- Next n lines: one word per line\n\nSort words inside each group alphabetically. Sort groups by their first word. Print one group per line with words separated by spaces.",
      constraints:
        "1 <= n <= 10^4\n1 <= word length <= 100\nWords contain lowercase English letters.",
      tags: ["Array", "Hash Table", "String", "Sorting", "Amazon", "Meta"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        {
          input: "6\neat\ntea\ntan\nate\nnat\nbat\n",
          expectedOutput: "ate eat tea\nbat\nnat tan\n",
          isSample: true,
          order: 1,
        },
        { input: "1\na\n", expectedOutput: "a\n", isSample: true, order: 2 },
        {
          input: "4\nab\nba\nabc\nbca\n",
          expectedOutput: "ab ba\nabc bca\n",
          isSample: false,
          order: 3,
        },
      ],
    },
    {
      slug: "longest-repeating-character-replacement",
      title: "Longest Repeating Character Replacement",
      statement:
        "Given an uppercase string and integer k, you may replace at most k characters. Print the length of the longest substring that can be made of one repeated character.\n\nInput format:\n- First line: s\n- Second line: k",
      constraints:
        "1 <= s.length <= 10^5\n0 <= k <= s.length\ns contains uppercase English letters.",
      tags: ["String", "Sliding Window", "Hash Table", "Meta", "Amazon"],
      difficulty: "MEDIUM",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "ABAB\n2\n", expectedOutput: "4\n", isSample: true, order: 1 },
        { input: "AABABBA\n1\n", expectedOutput: "4\n", isSample: true, order: 2 },
        { input: "ABCDE\n1\n", expectedOutput: "2\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "longest-common-prefix",
      title: "Longest Common Prefix",
      statement:
        "Given a list of lowercase strings, print their longest common prefix. Print `EMPTY` if there is no common prefix.\n\nInput format:\n- First line: n\n- Next n lines: one string per line",
      constraints: "1 <= n <= 10^4\n0 <= string length <= 200",
      tags: ["String", "Trie", "Adobe", "Amazon"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "3\nflower\nflow\nflight\n", expectedOutput: "fl\n", isSample: true, order: 1 },
        { input: "3\ndog\nracecar\ncar\n", expectedOutput: "EMPTY\n", isSample: true, order: 2 },
        {
          input: "2\ninterspecies\ninterstellar\n",
          expectedOutput: "inters\n",
          isSample: false,
          order: 3,
        },
      ],
    },
    {
      slug: "largest-number",
      title: "Largest Number",
      statement:
        "Given nonnegative integers, arrange them so they form the largest possible number. Print that number as a string.\n\nInput format:\n- First line: n\n- Second line: n nonnegative integers",
      constraints: "1 <= n <= 10^5\n0 <= nums[i] <= 10^9",
      tags: ["Array", "String", "Sorting", "Amazon", "Google"],
      difficulty: "MEDIUM",
      timeLimitMs: 3000,
      published: true,
      testCases: [
        { input: "2\n10 2\n", expectedOutput: "210\n", isSample: true, order: 1 },
        { input: "5\n3 30 34 5 9\n", expectedOutput: "9534330\n", isSample: true, order: 2 },
        { input: "3\n0 0 0\n", expectedOutput: "0\n", isSample: false, order: 3 },
      ],
    },
    {
      slug: "palindrome-pairs",
      title: "Palindrome Pairs",
      statement:
        "Given a list of unique lowercase words, print all ordered index pairs (i, j) where i != j and words[i] + words[j] is a palindrome.\n\nInput format:\n- First line: n\n- Next n lines: one word per line\n\nPrint pairs in lexicographic order by i then j, one pair per line as `i j`. Print `EMPTY` if there are no pairs.",
      constraints: "1 <= n <= 5000\n0 <= word length <= 300\nWords are unique lowercase strings.",
      tags: ["Array", "Hash Table", "String", "Trie", "Airbnb", "Google"],
      difficulty: "HARD",
      timeLimitMs: 4000,
      published: true,
      testCases: [
        {
          input: "5\nabcd\ndcba\nlls\ns\nsssll\n",
          expectedOutput: "0 1\n1 0\n2 4\n3 2\n",
          isSample: true,
          order: 1,
        },
        { input: "3\nbat\ntab\ncat\n", expectedOutput: "0 1\n1 0\n", isSample: true, order: 2 },
        { input: "3\na\nabc\ndef\n", expectedOutput: "EMPTY\n", isSample: false, order: 3 },
      ],
    },
  ];

  // Hidden edge-case and stress tests, shared with scripts/sync-problem-tests.mjs.
  const hiddenTests = require("./hidden-tests.json");
  const stressTests = buildStressTests();
  for (const problem of problems) {
    const hidden = [...(hiddenTests[problem.slug] ?? []), ...(stressTests[problem.slug] ?? [])];
    const startOrder = problem.testCases.length;
    hidden.forEach((test, i) => {
      problem.testCases.push({
        input: test.input,
        expectedOutput: test.expectedOutput,
        isSample: false,
        order: startOrder + i + 1,
      });
    });
  }

  // Attach the reference solutions (admins can view and run them).
  for (const problem of problems) {
    const referenceSolutions = readReferenceSolutions(problem.slug);
    problem.referenceSolutions = referenceSolutions;

    const primarySolution = referenceSolutions.find((solution) => solution.language === "python");
    if (primarySolution) {
      problem.solutionCode = primarySolution.code;
      problem.solutionLanguage = primarySolution.language;
    }
  }

  for (const problem of problems) {
    const { testCases, referenceSolutions, ...problemData } = problem;
    const savedProblem = await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: problemData,
      create: problemData,
      select: { id: true },
    });

    await prisma.testCase.deleteMany({ where: { problemId: savedProblem.id } });
    await prisma.testCase.createMany({
      data: testCases.map((testCase) => ({ ...testCase, problemId: savedProblem.id })),
    });

    await prisma.problemReferenceSolution.deleteMany({ where: { problemId: savedProblem.id } });
    if (referenceSolutions.length > 0) {
      await prisma.problemReferenceSolution.createMany({
        data: referenceSolutions.map((solution) => ({
          ...solution,
          problemId: savedProblem.id,
        })),
      });
    }
  }

  const practiceChampionBadge = await prisma.badge.upsert({
    where: { name: TOP_PRACTICE_BADGE_NAME },
    update: {
      description: "Automatically held by the current #1 on the practice leaderboard.",
      xp: 0,
    },
    create: {
      name: TOP_PRACTICE_BADGE_NAME,
      description: "Automatically held by the current #1 on the practice leaderboard.",
      xp: 0,
    },
    select: { id: true },
  });
  const practiceDifficultyScores = { EASY: 1, MEDIUM: 3, HARD: 7 };
  const publishedProblems = await prisma.problem.findMany({
    where: { published: true },
    select: { id: true, difficulty: true },
  });
  const difficultyByProblemId = new Map(
    publishedProblems.map((problem) => [problem.id, problem.difficulty]),
  );
  const acceptedSubmissions = await prisma.submission.findMany({
    where: {
      verdict: "ACCEPTED",
      problemId: { in: publishedProblems.map((problem) => problem.id) },
    },
    distinct: ["problemId", "userId"],
    select: { problemId: true, userId: true },
  });
  const solvedStats = acceptedSubmissions.reduce((stats, submission) => {
    const current = stats[submission.userId] || { solvedCount: 0, score: 0 };
    const difficulty = difficultyByProblemId.get(submission.problemId);

    current.solvedCount += 1;
    current.score += practiceDifficultyScores[difficulty] || practiceDifficultyScores.EASY;
    stats[submission.userId] = current;
    return stats;
  }, {});
  const users = await prisma.user.findMany({
    where: { id: { in: Object.keys(solvedStats) } },
    select: { id: true, name: true, email: true, profile: { select: { displayName: true } } },
  });
  const userById = new Map(users.map((user) => [user.id, user]));
  const practiceLeader = Object.entries(solvedStats)
    .map(([userId, stats]) => {
      const user = userById.get(userId);
      return {
        userId,
        solvedCount: stats.solvedCount,
        score: stats.score,
        name: (user && (user.profile?.displayName || user.name)) || "ShardUp member",
      };
    })
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))[0];

  await prisma.memberBadge.deleteMany({ where: { badgeId: practiceChampionBadge.id } });

  if (practiceLeader) {
    await prisma.memberBadge.create({
      data: { badgeId: practiceChampionBadge.id, userId: practiceLeader.userId },
    });
  }

  // Seed a minimal Bookshelf smoke seed
  const category = await prisma.category.upsert({
    where: { slug: "system-design" },
    update: { name: "System Design" },
    create: {
      name: "System Design",
      slug: "system-design",
    },
  });

  await prisma.resource.upsert({
    where: {
      categoryId_title: {
        categoryId: category.id,
        title: "Designing Data-Intensive Applications",
      },
    },
    update: {
      author: "Martin Kleppmann",
      type: "BOOK",
      recommendationReason:
        "The bible of system design. It teaches you the fundamental principles behind distributed systems, data storage, and processing.",
      resourceLink: "https://dataintensive.net/",
      buyLink:
        "https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/I/91tA4t2yA9L.jpg",
    },
    create: {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      type: "BOOK",
      recommendationReason:
        "The bible of system design. It teaches you the fundamental principles behind distributed systems, data storage, and processing.",
      resourceLink: "https://dataintensive.net/",
      buyLink:
        "https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/I/91tA4t2yA9L.jpg",
      categoryId: category.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
