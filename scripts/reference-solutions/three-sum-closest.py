import sys

data = list(map(int, sys.stdin.read().strip().split()))
n, target = data[0], data[1]
nums = sorted(data[2 : 2 + n])

best = nums[0] + nums[1] + nums[2]

for i in range(n - 2):
    left = i + 1
    right = n - 1
    while left < right:
        total = nums[i] + nums[left] + nums[right]
        if abs(total - target) < abs(best - target) or (
            abs(total - target) == abs(best - target) and total < best
        ):
            best = total

        if total < target:
            left += 1
        elif total > target:
            right -= 1
        else:
            print(total)
            sys.exit(0)

print(best)
