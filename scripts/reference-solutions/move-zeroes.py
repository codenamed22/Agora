import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = list(map(int, data[1 : 1 + n]))
    nonzero = [x for x in nums if x != 0]
    nonzero += [0] * (n - len(nonzero))
    print(" ".join(map(str, nonzero)))


main()
