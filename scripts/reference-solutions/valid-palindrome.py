import sys

s = sys.stdin.read()
if s.endswith("\n"):
    s = s[:-1]
if s.endswith("\r"):
    s = s[:-1]

left = 0
right = len(s) - 1

while left < right:
    while left < right and not s[left].isalnum():
        left += 1
    while left < right and not s[right].isalnum():
        right -= 1
    if s[left].lower() != s[right].lower():
        print("false")
        break
    left += 1
    right -= 1
else:
    print("true")
