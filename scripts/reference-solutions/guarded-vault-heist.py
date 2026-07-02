import sys


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    d = int(data[1])
    values = [int(x) for x in data[2 : 2 + n]]

    # best[i] = maximum total value using vaults 0..i, where any two chosen
    # vaults are at least d indices apart. Cracking zero vaults (score 0) is
    # always allowed, so best[i] is non-negative and non-decreasing.
    best = [0] * n
    for i in range(n):
        prev_best = best[i - d] if i - d >= 0 else 0
        take = values[i] + prev_best
        carry = best[i - 1] if i - 1 >= 0 else 0
        best[i] = take if take > carry else carry

    print(best[n - 1] if n > 0 else 0)


main()
