import sys


def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx])
    idx += 1
    intervals = []
    for _ in range(n):
        s = int(data[idx])
        e = int(data[idx + 1])
        idx += 2
        intervals.append((s, e))
    intervals.append((int(data[idx]), int(data[idx + 1])))
    intervals.sort()
    res = []
    for s, e in intervals:
        if res and s <= res[-1][1]:
            res[-1] = (res[-1][0], max(res[-1][1], e))
        else:
            res.append((s, e))
    print("\n".join(f"{s} {e}" for s, e in res))


main()
