import sys


def main():
    lines = sys.stdin.read().split("\n")
    n = int(lines[0])
    words = [lines[1 + i].rstrip("\r") for i in range(n)]
    prefix = words[0]
    for w in words[1:]:
        while not w.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix:
                break
    print(prefix if prefix else "EMPTY")


main()
