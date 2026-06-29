import sys


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    target = int(data[1])
    candidates = sorted(map(int, data[2 : 2 + n]))
    res = []
    current = []

    def backtrack(start, remain):
        if remain == 0:
            res.append(list(current))
            return
        for i in range(start, n):
            if candidates[i] > remain:
                break
            current.append(candidates[i])
            backtrack(i, remain - candidates[i])
            current.pop()

    backtrack(0, target)
    if not res:
        print("EMPTY")
    else:
        print("\n".join(" ".join(map(str, combo)) for combo in res))


main()
