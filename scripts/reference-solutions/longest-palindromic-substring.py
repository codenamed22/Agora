import sys

s = sys.stdin.read()
if s.endswith("\n"):
    s = s[:-1]
if s.endswith("\r"):
    s = s[:-1]

n = len(s)
best_start = 0
best_len = 0


def update(start, length):
    global best_start, best_len
    if length > best_len or (length == best_len and start < best_start):
        best_start = start
        best_len = length


d1 = [0] * n
left = 0
right = -1
for i in range(n):
    radius = 1 if i > right else min(d1[left + right - i], right - i + 1)
    while i - radius >= 0 and i + radius < n and s[i - radius] == s[i + radius]:
        radius += 1
    d1[i] = radius
    update(i - radius + 1, 2 * radius - 1)
    if i + radius - 1 > right:
        left = i - radius + 1
        right = i + radius - 1

d2 = [0] * n
left = 0
right = -1
for i in range(n):
    radius = 0 if i > right else min(d2[left + right - i + 1], right - i + 1)
    while i - radius - 1 >= 0 and i + radius < n and s[i - radius - 1] == s[i + radius]:
        radius += 1
    d2[i] = radius
    update(i - radius, 2 * radius)
    if i + radius - 1 > right:
        left = i - radius
        right = i + radius - 1

print(s[best_start : best_start + best_len])
