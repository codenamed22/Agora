import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    k = int(data[1])
    nums = list(map(int, data[2 : 2 + n]))
    k %= n
    res = nums[-k:] + nums[:-k] if k else nums
    print(" ".join(map(str, res)))


main()
