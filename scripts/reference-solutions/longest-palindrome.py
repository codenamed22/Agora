from collections import Counter
import sys

s = sys.stdin.read()
if s.endswith("\n"):
    s = s[:-1]
if s.endswith("\r"):
    s = s[:-1]

counts = Counter(s)
length = 0
has_odd = False

for count in counts.values():
    length += (count // 2) * 2
    has_odd = has_odd or count % 2 == 1

print(length + (1 if has_odd else 0))
