import sys

s = sys.stdin.read()
if s.endswith("\n"):
    s = s[:-1]
if s.endswith("\r"):
    s = s[:-1]

limit_min = -(2**31)
limit_max = 2**31 - 1
index = 0
n = len(s)

while index < n and s[index] == " ":
    index += 1

sign = 1
if index < n and s[index] in "+-":
    if s[index] == "-":
        sign = -1
    index += 1

value = 0
while index < n and s[index].isdigit():
    value = value * 10 + int(s[index])
    signed = sign * value
    if signed < limit_min:
        print(limit_min)
        sys.exit(0)
    if signed > limit_max:
        print(limit_max)
        sys.exit(0)
    index += 1

print(sign * value)
