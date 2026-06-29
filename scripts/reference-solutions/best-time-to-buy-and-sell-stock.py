import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    prices = list(map(int, data[1 : 1 + n]))
    lowest = float("inf")
    best = 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    print(best)


main()
