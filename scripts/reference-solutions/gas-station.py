import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    gas = list(map(int, data[1 : 1 + n]))
    cost = list(map(int, data[1 + n : 1 + 2 * n]))
    total = 0
    tank = 0
    start = 0
    for i in range(n):
        diff = gas[i] - cost[i]
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    print(start if total >= 0 else -1)


main()
