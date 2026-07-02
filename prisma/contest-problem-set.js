// Problems for "ShardUp Contest #2". These are unpublished (contest-only) and
// escalate in difficulty: A (divisible pairs) < B (guarded heist DP) <
// C (subarray sums in range). Each is inspired by a classic LeetCode task but
// customized and made harder (negatives, big answers, tighter complexity).
//
// Reference solutions live in scripts/reference-solutions/<slug>.{py,cpp} and are
// attached by prisma/seed.js. Efficiency test outputs below are formula-derived
// and cross-checked against the references (see scripts/validate-problems.mjs).

const CONTEST_TWO_SLUG = "shardup-contest-2";

function repeatValues(count, value) {
  return `${new Array(count).fill(value).join(" ")}\n`;
}

function sequenceLine(count, mapper) {
  return `${Array.from({ length: count }, (_, index) => mapper(index)).join(" ")}\n`;
}

// --- Problem A: Divisible Pair Count -----------------------------------------
const divisiblePairCount = {
  slug: "divisible-pair-count",
  title: "Divisible Pair Count",
  statement:
    "You are given n integers and a positive integer k. Count the number of index pairs (i, j) with i < j such that nums[i] + nums[j] is divisible by k.\n\nInput format:\n- First line: n k\n- Second line: n integers\n\nPrint a single integer: the number of valid pairs. Values may be negative, and the answer can exceed a 32-bit integer.",
  constraints: "1 <= n <= 10^5\n1 <= k <= 10^9\n-10^9 <= nums[i] <= 10^9",
  tags: ["Array", "Hash Table", "Math", "Contest"],
  difficulty: "EASY",
  timeLimitMs: 2000,
  samples: [
    { input: "4 3\n1 2 3 4\n", expectedOutput: "2\n" },
    { input: "5 1\n3 -1 7 0 4\n", expectedOutput: "10\n" },
  ],
  hidden: [
    { input: "6 4\n4 -4 8 0 2 2\n", expectedOutput: "7\n" },
    { input: "1 5\n3\n", expectedOutput: "0\n" },
    { input: "8 5\n5 10 -5 3 2 7 -3 8\n", expectedOutput: "9\n" },
    {
      input: "6 1000000000\n1000000000 -1000000000 0 999999999 1 500000000\n",
      expectedOutput: "4\n",
    },
  ],
};

// --- Problem B: Guarded Vault Heist ------------------------------------------
const guardedVaultHeist = {
  slug: "guarded-vault-heist",
  title: "Guarded Vault Heist",
  statement:
    "A row of n vaults stands in a line. Vault i holds value[i], which may be negative (a trapped vault costs you). Cracking vault i trips an alarm radius, so any two vaults you crack must be at least d indices apart (their indices differ by at least d). You may also crack zero vaults, scoring 0.\n\nPrint the maximum total value you can collect.\n\nInput format:\n- First line: n d\n- Second line: n integers\n\nPrint a single integer.",
  constraints: "1 <= n <= 10^5\n1 <= d <= n\n-10^9 <= value[i] <= 10^9",
  tags: ["Array", "Dynamic Programming", "Contest"],
  difficulty: "MEDIUM",
  timeLimitMs: 2000,
  samples: [
    { input: "5 2\n3 2 5 10 7\n", expectedOutput: "15\n" },
    { input: "6 3\n5 1 1 5 1 1\n", expectedOutput: "10\n" },
  ],
  hidden: [
    { input: "5 1\n-2 4 -1 5 -3\n", expectedOutput: "9\n" },
    { input: "1 1\n-5\n", expectedOutput: "0\n" },
    { input: "4 4\n3 9 2 7\n", expectedOutput: "9\n" },
    { input: "9 3\n5 -2 -3 8 1 -10 4 6 -1\n", expectedOutput: "19\n" },
  ],
};

// --- Problem C: Subarray Sum In Range ----------------------------------------
const subarraySumInRange = {
  slug: "subarray-sum-in-range",
  title: "Subarray Sum In Range",
  statement:
    "Given n integers and two integers L and R (L <= R), count the number of contiguous non-empty subarrays whose sum S satisfies L <= S <= R.\n\nInput format:\n- First line: n L R\n- Second line: n integers\n\nPrint a single integer. Prefix sums can be large, and the answer can exceed a 32-bit integer.",
  constraints: "1 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9\n-10^14 <= L <= R <= 10^14",
  tags: ["Array", "Prefix Sum", "Binary Indexed Tree", "Contest"],
  difficulty: "HARD",
  timeLimitMs: 4000,
  samples: [
    { input: "5 1 4\n1 -1 2 3 -2\n", expectedOutput: "10\n" },
    { input: "3 0 0\n2 -2 2\n", expectedOutput: "2\n" },
  ],
  hidden: [
    { input: "4 -3 -1\n-1 -2 1 -1\n", expectedOutput: "8\n" },
    { input: "1 1 10\n5\n", expectedOutput: "1\n" },
    { input: "5 -100 100\n3 -1 4 -1 5\n", expectedOutput: "15\n" },
    { input: "7 -2 3\n2 -3 1 4 -5 2 1\n", expectedOutput: "21\n" },
  ],
};

// Efficiency / stress tests. Inputs are large; expected outputs are closed-form
// and independently verified against the reference solutions.
function buildContestTwoStressTests() {
  const bigN = 100_000;

  // A: all zeros -> every pair sums to a multiple of k -> C(n, 2) pairs.
  const zerosLine = repeatValues(bigN, 0);
  const aAllZeros = {
    input: `${bigN} 1000000000\n${zerosLine}`,
    expectedOutput: `${(bigN * (bigN - 1)) / 2}\n`,
  };
  // A: values 1..n with k=2 -> pairs with equal parity = C(evens,2)+C(odds,2).
  const evens = Math.floor(bigN / 2);
  const odds = bigN - evens;
  const aParity = {
    input: `${bigN} 2\n${sequenceLine(bigN, (i) => i + 1)}`,
    expectedOutput: `${(evens * (evens - 1)) / 2 + (odds * (odds - 1)) / 2}\n`,
  };

  // B: all ones with d=2 (House Robber) -> pick every other vault.
  const bOnes = {
    input: `${bigN} 2\n${repeatValues(bigN, 1)}`,
    expectedOutput: `${Math.floor((bigN - 1) / 2) + 1}\n`,
  };
  // B: all negative -> optimal is to crack nothing.
  const bNegatives = {
    input: `${bigN} 5\n${repeatValues(bigN, -1)}`,
    expectedOutput: "0\n",
  };
  // B: all ones with d=3 over 99999 vaults.
  const bGapThreeN = 99_999;
  const bGapThree = {
    input: `${bGapThreeN} 3\n${repeatValues(bGapThreeN, 1)}`,
    expectedOutput: `${Math.floor((bGapThreeN - 1) / 3) + 1}\n`,
  };

  // C: all zeros with [0, 0] -> every subarray qualifies -> n(n+1)/2.
  const cAllZeros = {
    input: `${bigN} 0 0\n${zerosLine}`,
    expectedOutput: `${(bigN * (bigN + 1)) / 2}\n`,
  };
  // C: all ones with [k, k] -> subarrays of length exactly k -> n-k+1.
  const cWindow = 50_000;
  const cWindows = {
    input: `${bigN} ${cWindow} ${cWindow}\n${repeatValues(bigN, 1)}`,
    expectedOutput: `${bigN - cWindow + 1}\n`,
  };

  return {
    "divisible-pair-count": [aAllZeros, aParity],
    "guarded-vault-heist": [bOnes, bNegatives, bGapThree],
    "subarray-sum-in-range": [cAllZeros, cWindows],
  };
}

const contestTwoProblems = [divisiblePairCount, guardedVaultHeist, subarraySumInRange];

module.exports = {
  CONTEST_TWO_SLUG,
  contestTwoProblems,
  buildContestTwoStressTests,
};
