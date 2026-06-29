import sys
from collections import defaultdict


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    k = int(data[1])
    nums = list(map(int, data[2 : 2 + n]))
    counts = defaultdict(int)
    counts[0] = 1
    prefix = 0
    ans = 0
    for x in nums:
        prefix += x
        ans += counts[prefix - k]
        counts[prefix] += 1
    print(ans)


main()
