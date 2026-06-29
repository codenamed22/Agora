import sys

lines = sys.stdin.read().splitlines()
n = int(lines[0]) if lines else 0
strings = []
for index in range(n):
    line_index = index + 1
    strings.append(lines[line_index] if line_index < len(lines) else "")

encoded = "".join(f"{len(value)}#{value}" for value in strings)

decoded = []
index = 0
while index < len(encoded):
    separator = encoded.find("#", index)
    length = int(encoded[index:separator])
    start = separator + 1
    decoded.append(encoded[start : start + length])
    index = start + length

print(encoded)
for value in decoded:
    print(value)
