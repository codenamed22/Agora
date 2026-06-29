import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = list(map(int, data[1 : 1 + n]))
    first = {0: -1}
    prefix = 0
    best = 0
    for i, x in enumerate(nums):
        prefix += 1 if x == 1 else -1
        if prefix in first:
            best = max(best, i - first[prefix])
        else:
            first[prefix] = i
    print(best)


main()
