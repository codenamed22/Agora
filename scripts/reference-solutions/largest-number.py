import sys
from functools import cmp_to_key


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = data[1 : 1 + n]

    def compare(a, b):
        if a + b > b + a:
            return -1
        if a + b < b + a:
            return 1
        return 0

    nums.sort(key=cmp_to_key(compare))
    res = "".join(nums)
    print("0" if res[0] == "0" else res)


main()
