import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = data[1 : 1 + n]
    print("true" if len(set(nums)) < n else "false")


main()
