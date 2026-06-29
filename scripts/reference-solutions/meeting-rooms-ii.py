import heapq
import sys

data = sys.stdin.read().strip().split()
if not data:
    print(0)
    sys.exit(0)

n = int(data[0])
intervals = []
index = 1
for _ in range(n):
    start = int(data[index])
    end = int(data[index + 1])
    index += 2
    if start < end:
        intervals.append((start, end))

intervals.sort()
rooms = []
answer = 0

for start, end in intervals:
    while rooms and rooms[0] <= start:
        heapq.heappop(rooms)
    heapq.heappush(rooms, end)
    answer = max(answer, len(rooms))

print(answer)
