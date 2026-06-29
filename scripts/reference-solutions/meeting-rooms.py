import sys

data = sys.stdin.read().strip().split()
if not data:
    print("true")
    sys.exit(0)

n = int(data[0])
intervals = []
index = 1
for _ in range(n):
    start = int(data[index])
    end = int(data[index + 1])
    index += 2
    intervals.append((start, end))

intervals.sort()
previous_end = None
for start, end in intervals:
    if previous_end is not None and start < previous_end:
        print("false")
        break
    previous_end = max(previous_end, end) if previous_end is not None else end
else:
    print("true")
