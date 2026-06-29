import sys

lines = sys.stdin.read().splitlines()
s = lines[0] if len(lines) > 0 else ""
p = lines[1] if len(lines) > 1 else ""

if len(p) > len(s):
    print("EMPTY")
    sys.exit(0)

need = [0] * 26
window = [0] * 26
base = ord("a")

for char in p:
    need[ord(char) - base] += 1

answer = []
for index, char in enumerate(s):
    window[ord(char) - base] += 1
    if index >= len(p):
        window[ord(s[index - len(p)]) - base] -= 1
    if index >= len(p) - 1 and window == need:
        answer.append(index - len(p) + 1)

if answer:
    print(" ".join(map(str, answer)))
else:
    print("EMPTY")
