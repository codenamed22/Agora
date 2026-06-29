import sys
from collections import defaultdict


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    words = data[1 : 1 + n]
    groups = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    out = [sorted(g) for g in groups.values()]
    out.sort(key=lambda g: g[0])
    print("\n".join(" ".join(g) for g in out))


main()
