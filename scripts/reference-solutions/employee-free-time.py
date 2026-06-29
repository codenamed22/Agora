import sys

tokens = sys.stdin.read().strip().split()
if not tokens:
    print("EMPTY")
    sys.exit(0)

index = 0
employees = int(tokens[index])
index += 1
busy = []

for _ in range(employees):
    count = int(tokens[index])
    index += 1
    for _ in range(count):
        start = int(tokens[index])
        end = int(tokens[index + 1])
        index += 2
        busy.append((start, end))

if not busy:
    print("EMPTY")
    sys.exit(0)

busy.sort()
free = []
current_start, current_end = busy[0]

for start, end in busy[1:]:
    if start > current_end:
        free.append((current_end, start))
        current_start, current_end = start, end
    else:
        current_end = max(current_end, end)

if free:
    print("\n".join(f"{start} {end}" for start, end in free))
else:
    print("EMPTY")
