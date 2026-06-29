import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = set(map(int, data[1 : 1 + n]))
    best = 0
    for x in nums:
        if x - 1 not in nums:
            y = x
            while y + 1 in nums:
                y += 1
            best = max(best, y - x + 1)
    print(best)


main()
