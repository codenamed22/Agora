import sys
from bisect import bisect_left, bisect_right


def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    low = int(data[1])
    high = int(data[2])
    nums = [int(x) for x in data[3 : 3 + n]]

    # Prefix sums: a subarray (i, j] has sum prefix[j] - prefix[i].
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]

    # Coordinate-compress the prefix values and count, for each j, how many
    # earlier prefix[i] fall in [prefix[j] - high, prefix[j] - low] using a
    # Fenwick tree. Overall O(n log n).
    sorted_prefix = sorted(set(prefix))
    size = len(sorted_prefix)
    tree = [0] * (size + 1)

    def update(pos0):
        i = pos0 + 1
        while i <= size:
            tree[i] += 1
            i += i & (-i)

    def prefix_count(count):
        i = count
        total = 0
        while i > 0:
            total += tree[i]
            i -= i & (-i)
        return total

    ans = 0
    update(bisect_left(sorted_prefix, prefix[0]))
    for j in range(1, n + 1):
        lo = prefix[j] - high
        hi = prefix[j] - low
        right_rank = bisect_right(sorted_prefix, hi)
        left_rank = bisect_left(sorted_prefix, lo)
        ans += prefix_count(right_rank) - prefix_count(left_rank)
        update(bisect_left(sorted_prefix, prefix[j]))

    print(ans)


main()
