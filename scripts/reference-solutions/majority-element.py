import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = list(map(int, data[1 : 1 + n]))
    count = 0
    candidate = None
    for x in nums:
        if count == 0:
            candidate = x
        count += 1 if x == candidate else -1
    print(candidate)


main()
