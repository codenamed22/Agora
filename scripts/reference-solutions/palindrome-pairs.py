import sys


def main():
    lines = sys.stdin.read().split("\n")
    n = int(lines[0])
    words = [lines[1 + i].rstrip("\r") for i in range(n)]
    pos = {w: i for i, w in enumerate(words)}

    def is_pal(s):
        return s == s[::-1]

    res = set()
    for i, w in enumerate(words):
        length = len(w)
        for k in range(length + 1):
            prefix = w[:k]
            suffix = w[k:]
            # prefix palindrome -> words[j] + w is a palindrome, j = reverse(suffix)
            if is_pal(prefix):
                r = suffix[::-1]
                if r in pos and pos[r] != i:
                    res.add((pos[r], i))
            # suffix palindrome -> w + words[j] is a palindrome, j = reverse(prefix)
            if is_pal(suffix):
                r = prefix[::-1]
                if r in pos and pos[r] != i:
                    res.add((i, pos[r]))
    if not res:
        print("EMPTY")
    else:
        print("\n".join(f"{a} {b}" for a, b in sorted(res)))


main()
