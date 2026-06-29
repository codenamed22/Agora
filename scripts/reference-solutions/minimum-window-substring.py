from collections import Counter, defaultdict
import sys

lines = sys.stdin.read().splitlines()
s = lines[0] if len(lines) > 0 else ""
t = lines[1] if len(lines) > 1 else ""

need = Counter(t)
window = defaultdict(int)
required = len(need)
formed = 0
left = 0
best_start = 0
best_len = None

for right, char in enumerate(s):
    window[char] += 1
    if char in need and window[char] == need[char]:
        formed += 1

    while formed == required and left <= right:
        current_len = right - left + 1
        if best_len is None or current_len < best_len:
            best_start = left
            best_len = current_len

        left_char = s[left]
        window[left_char] -= 1
        if left_char in need and window[left_char] < need[left_char]:
            formed -= 1
        left += 1

if best_len is None:
    print("EMPTY")
else:
    print(s[best_start : best_start + best_len])
