from collections import Counter
import sys

lines = sys.stdin.read().splitlines()
s = lines[0] if len(lines) > 0 else ""
t = lines[1] if len(lines) > 1 else ""

print("true" if Counter(s) == Counter(t) else "false")
