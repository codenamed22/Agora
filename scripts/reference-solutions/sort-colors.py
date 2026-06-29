import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = sorted(map(int, data[1 : 1 + n]))
    print(" ".join(map(str, nums)))


main()
