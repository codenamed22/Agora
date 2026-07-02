import sys


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    k = int(data[1])
    counts = {}
    ans = 0
    for i in range(n):
        value = int(data[2 + i])
        remainder = value % k  # Python's % is non-negative for positive k.
        complement = (k - remainder) % k
        ans += counts.get(complement, 0)
        counts[remainder] = counts.get(remainder, 0) + 1
    print(ans)


main()
