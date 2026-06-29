import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    target = int(data[1])
    nums = list(map(int, data[2 : 2 + n]))
    seen = {}
    for j, x in enumerate(nums):
        complement = target - x
        if complement in seen:
            print(seen[complement], j)
            return
        if x not in seen:
            seen[x] = j


main()
