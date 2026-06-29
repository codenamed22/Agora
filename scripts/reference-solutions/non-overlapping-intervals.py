import sys

data = sys.stdin.read().strip().split()
n = int(data[0])
intervals = []
index = 1
for _ in range(n):
    start = int(data[index])
    end = int(data[index + 1])
    index += 2
    intervals.append((start, end))

intervals.sort(key=lambda interval: (interval[1], interval[0]))
removed = 0
current_end = None

for start, end in intervals:
    if current_end is None or start >= current_end:
        current_end = end
    else:
        removed += 1

print(removed)
