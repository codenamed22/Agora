// Problems for the "HireUp Online Assessment" — the first round of the HireUp
// mock-hiring event. Original problems written in the style of recent (last ~2
// years) Uber / Amazon / Google online assessments, customized so they are not
// verbatim copies of any company's proprietary question.
//
// Both are HARD and target the tier top companies actually test: A is a 2D grid
// DP carrying an extra "skip budget" state; B is a shortest-path problem solved
// with Dijkstra over an augmented (node, upgrades-used) state. Seeded unpublished
// so they only appear inside the OA contest.
//
// Reference solutions live in scripts/reference-solutions/<slug>.{py,cpp} and are
// attached by prisma/seed.mjs. Stress-test outputs below are closed-form and
// independently verified against the references (see scripts/validate-problems.mjs).

const HIREUP_OA_SLUG = "hireup-oa";

function onesGrid(rows, cols, k) {
  const row = `${new Array(cols).fill(1).join(" ")}\n`;
  return `${rows} ${cols} ${k}\n${row.repeat(rows)}`;
}

// Closed form for an all-ones R x C grid: a monotone path visits R + C - 1 cells;
// the start and end must be paid, so at most (R + C - 3) interior cells can be
// skipped. Cost = (cells) - min(k, interior).
function onesGridAnswer(rows, cols, k) {
  const cells = rows + cols - 1;
  const interior = Math.max(0, cells - 2);
  return cells - Math.min(k, interior);
}

function chainGraph(nodes, edges, k, weight) {
  const lines = [`${nodes} ${edges} ${k}`];
  for (let i = 1; i <= edges; i += 1) {
    lines.push(`${i} ${i + 1} ${weight}`);
  }
  return `${lines.join("\n")}\n`;
}

// --- Problem A: Grid Delivery With Skips --------------------------------------
// Amazon/Google-flavored grid DP. The classic "minimum path sum" becomes a 3D DP
// once you can waive the cost of up to K cells: dp[i][j][k] = best cost to reach
// (i, j) having used k waivers, transitioning from the top/left and optionally
// skipping the current (non-corner) cell.
const gridDeliverySkips = {
  slug: "grid-delivery-skips",
  title: "Grid Delivery With Skips",
  statement:
    "A delivery robot must cross an R x C grid of positive tolls. It starts at the top-left cell (0, 0), ends at the bottom-right cell (R-1, C-1), and may move only one cell right or one cell down at a time. Normally it pays the toll printed on every cell it visits.\n\nThe robot carries K skip passes. Using a pass on a cell waives that cell's toll entirely. It may use at most K passes over the whole trip, at most one per cell, but it can never skip the start cell (0, 0) or the end cell (R-1, C-1) — those tolls are always paid.\n\nPrint the minimum total toll the robot must pay to get from the start to the end.\n\nInput format:\n- First line: R C K\n- Next R lines: C integers each, the grid tolls row by row\n\nPrint a single integer. The answer can exceed a 32-bit integer.",
  constraints: "1 <= R, C <= 200\n0 <= K <= 30\n1 <= toll[i][j] <= 10^9",
  tags: ["Dynamic Programming", "Matrix", "Grid", "Amazon", "Google", "HireUp"],
  difficulty: "HARD",
  timeLimitMs: 4000,
  samples: [
    { input: "2 2 1\n1 2\n3 4\n", expectedOutput: "5\n" },
    { input: "2 2 0\n1 2\n3 4\n", expectedOutput: "7\n" },
  ],
  hidden: [
    { input: "1 1 0\n5\n", expectedOutput: "5\n" },
    { input: "3 3 0\n1 1 1\n1 1 1\n1 1 1\n", expectedOutput: "5\n" },
    { input: "3 3 2\n1 1 1\n1 1 1\n1 1 1\n", expectedOutput: "3\n" },
    { input: "2 3 1\n1 5 1\n1 5 9\n", expectedOutput: "11\n" },
  ],
};

// --- Problem B: Network Upgrade Routing --------------------------------------
// Google/Uber-flavored shortest path. From node 1 to node n in a directed
// weighted graph, you may zero out the weight of at most K edges. Dijkstra over
// (node, upgrades-used) states finds the cheapest route; report -1 if node n is
// unreachable.
const networkUpgradeRouting = {
  slug: "network-upgrade-routing",
  title: "Network Upgrade Routing",
  statement:
    "A backbone network has n routers numbered 1..n and m one-way links. Link i sends traffic from router u to router v with latency w. You must route a stream from router 1 to router n along a sequence of links, paying the sum of the latencies you use.\n\nYou hold K upgrade credits. Spending a credit on a link makes its latency 0 for this route. You may spend at most K credits in total, at most one per link.\n\nPrint the minimum total latency of a route from router 1 to router n, or -1 if no route exists.\n\nInput format:\n- First line: n m K\n- Next m lines: u v w describing a directed link u -> v with latency w\n\nPrint a single integer. The answer can exceed a 32-bit integer.",
  constraints: "1 <= n <= 10^5\n0 <= m <= 2*10^5\n0 <= K <= 10\n1 <= u, v <= n\n1 <= w <= 10^9",
  tags: ["Graph", "Shortest Path", "Dijkstra", "Uber", "Google", "HireUp"],
  difficulty: "HARD",
  timeLimitMs: 4000,
  samples: [
    { input: "4 4 1\n1 2 5\n2 4 5\n1 3 1\n3 4 1\n", expectedOutput: "1\n" },
    { input: "4 4 0\n1 2 5\n2 4 5\n1 3 1\n3 4 1\n", expectedOutput: "2\n" },
  ],
  hidden: [
    { input: "3 1 2\n1 2 4\n", expectedOutput: "-1\n" },
    { input: "1 0 0\n", expectedOutput: "0\n" },
    { input: "3 2 2\n1 2 7\n2 3 9\n", expectedOutput: "0\n" },
    {
      input: "5 5 1\n1 2 10\n2 5 10\n1 3 3\n3 4 3\n4 5 3\n",
      expectedOutput: "6\n",
    },
  ],
};

// Efficiency / stress tests. Inputs are large; expected outputs are closed-form
// and independently verified against the reference solutions.
function buildHireupStressTests() {
  // A: all-ones grids at the size limit exercise the O(R * C * K) DP.
  const aFull = {
    input: onesGrid(200, 200, 0),
    expectedOutput: `${onesGridAnswer(200, 200, 0)}\n`,
  };
  const aFullSkips = {
    input: onesGrid(200, 200, 30),
    expectedOutput: `${onesGridAnswer(200, 200, 30)}\n`,
  };
  const aMidSkips = {
    input: onesGrid(150, 150, 30),
    expectedOutput: `${onesGridAnswer(150, 150, 30)}\n`,
  };

  // B: long chains 1 -> 2 -> ... force an efficient Dijkstra over the augmented
  // state; a chain of e edges with weight w and k free edges costs (e - k) * w.
  const bigNodes = 50_000;
  const weight = 1_000_000_000;
  const bChain = {
    input: chainGraph(bigNodes, bigNodes - 1, 0, weight),
    expectedOutput: `${(bigNodes - 1) * weight}\n`,
  };
  const bChainFree = {
    input: chainGraph(bigNodes, bigNodes - 1, 10, weight),
    expectedOutput: `${(bigNodes - 1 - 10) * weight}\n`,
  };
  // Chain that stops one short of node n -> node n is unreachable -> -1.
  const bUnreachable = {
    input: chainGraph(bigNodes, bigNodes - 2, 10, weight),
    expectedOutput: "-1\n",
  };

  return {
    "grid-delivery-skips": [aFull, aFullSkips, aMidSkips],
    "network-upgrade-routing": [bChain, bChainFree, bUnreachable],
  };
}

const hireupProblems = [gridDeliverySkips, networkUpgradeRouting];

module.exports = {
  HIREUP_OA_SLUG,
  hireupProblems,
  buildHireupStressTests,
};
