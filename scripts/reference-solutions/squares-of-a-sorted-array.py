import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = list(map(int, data[1 : 1 + n]))
    print(" ".join(map(str, sorted(x * x for x in nums))))


main()
