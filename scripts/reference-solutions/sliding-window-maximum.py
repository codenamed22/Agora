import sys
from collections import deque


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    k = int(data[1])
    nums = list(map(int, data[2 : 2 + n]))
    dq = deque()
    res = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(nums[dq[0]])
    print(" ".join(map(str, res)))


main()
