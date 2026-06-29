import sys
from collections import defaultdict


def main():
    data = sys.stdin.read().split()
    s = data[0]
    k = int(data[1])
    counts = defaultdict(int)
    left = 0
    best = 0
    max_freq = 0
    for right, c in enumerate(s):
        counts[c] += 1
        max_freq = max(max_freq, counts[c])
        while (right - left + 1) - max_freq > k:
            counts[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    print(best)


main()
