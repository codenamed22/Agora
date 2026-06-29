import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    idx = 1
    intervals = []
    for _ in range(n):
        intervals.append((int(data[idx]), int(data[idx + 1])))
        idx += 2
    intervals.sort()
    res = []
    for s, e in intervals:
        if res and s <= res[-1][1]:
            res[-1] = (res[-1][0], max(res[-1][1], e))
        else:
            res.append((s, e))
    print("\n".join(f"{s} {e}" for s, e in res))


main()
