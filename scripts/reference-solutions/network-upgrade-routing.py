import sys
import heapq


def main():
    data = sys.stdin.buffer.read().split()
    idx = 0
    n = int(data[idx])
    m = int(data[idx + 1])
    k = int(data[idx + 2])
    idx += 3

    adj = [[] for _ in range(n + 1)]
    for _ in range(m):
        u = int(data[idx])
        v = int(data[idx + 1])
        w = int(data[idx + 2])
        idx += 3
        adj[u].append((v, w))

    INF = float("inf")
    # dist[node][used] = min latency to reach `node` having spent `used` upgrade
    # credits. Dijkstra over these (node, used) states.
    dist = [[INF] * (k + 1) for _ in range(n + 1)]
    dist[1][0] = 0
    pq = [(0, 1, 0)]
    while pq:
        d, u, used = heapq.heappop(pq)
        if d > dist[u][used]:
            continue
        for v, w in adj[u]:
            # Pay the latency.
            nd = d + w
            if nd < dist[v][used]:
                dist[v][used] = nd
                heapq.heappush(pq, (nd, v, used))
            # Spend a credit to make this link free.
            if used < k and d < dist[v][used + 1]:
                dist[v][used + 1] = d
                heapq.heappush(pq, (d, v, used + 1))

    best = min(dist[n])
    print(best if best != INF else -1)


main()
