import sys


def main():
    data = sys.stdin.buffer.read().split()
    idx = 0
    rows = int(data[idx])
    cols = int(data[idx + 1])
    budget = int(data[idx + 2])
    idx += 3

    grid = []
    for _ in range(rows):
        grid.append([int(x) for x in data[idx : idx + cols]])
        idx += cols

    INF = float("inf")

    def is_corner(i, j):
        return (i == 0 and j == 0) or (i == rows - 1 and j == cols - 1)

    # dp[j][k] = min toll paid to arrive at the current row's cell (i, j) having
    # used k skip passes. We keep only the previous row and build the current one
    # left to right, so both up (prev) and left (cur) predecessors are available.
    prev = None
    for i in range(rows):
        cur = [[INF] * (budget + 1) for _ in range(cols)]
        for j in range(cols):
            corner = is_corner(i, j)
            for k in range(budget + 1):
                # Best cost to arrive at (i, j) from the top/left with k passes
                # still budgeted the same way (pay path) or one fewer (skip path).
                pay_base = INF
                skip_base = INF
                if i == 0 and j == 0:
                    pay_base = 0
                else:
                    if i > 0:
                        if prev[j][k] < pay_base:
                            pay_base = prev[j][k]
                        if k >= 1 and prev[j][k - 1] < skip_base:
                            skip_base = prev[j][k - 1]
                    if j > 0:
                        if cur[j - 1][k] < pay_base:
                            pay_base = cur[j - 1][k]
                        if k >= 1 and cur[j - 1][k - 1] < skip_base:
                            skip_base = cur[j - 1][k - 1]

                best = INF
                if pay_base != INF:
                    best = pay_base + grid[i][j]
                if not corner and k >= 1 and skip_base != INF and skip_base < best:
                    best = skip_base
                cur[j][k] = best
        prev = cur

    print(min(prev[cols - 1]))


main()
