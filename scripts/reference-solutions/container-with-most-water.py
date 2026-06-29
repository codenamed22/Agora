import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    height = list(map(int, data[1 : 1 + n]))
    lo, hi = 0, n - 1
    best = 0
    while lo < hi:
        best = max(best, (hi - lo) * min(height[lo], height[hi]))
        if height[lo] < height[hi]:
            lo += 1
        else:
            hi -= 1
    print(best)


main()
