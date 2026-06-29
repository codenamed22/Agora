import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = sorted(map(int, data[1 : 1 + n]))
    res = []
    for i in range(n):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        lo, hi = i + 1, n - 1
        while lo < hi:
            total = nums[i] + nums[lo] + nums[hi]
            if total < 0:
                lo += 1
            elif total > 0:
                hi -= 1
            else:
                res.append((nums[i], nums[lo], nums[hi]))
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1
                while lo < hi and nums[hi] == nums[hi + 1]:
                    hi -= 1
    if not res:
        print("EMPTY")
    else:
        print("\n".join(f"{a} {b} {c}" for a, b, c in res))


main()
