#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n, m, k;
  cin >> n >> m >> k;
  vector<vector<pair<int, long long>>> adj(n + 1);
  for (int i = 0; i < m; ++i) {
    int u, v;
    long long w;
    cin >> u >> v >> w;
    adj[u].push_back({v, w});
  }

  const long long INF = (long long)4e18;
  // dist[node][used] = min latency to reach `node` having spent `used` upgrade
  // credits. Dijkstra over these (node, used) states.
  vector<vector<long long>> dist(n + 1, vector<long long>(k + 1, INF));
  dist[1][0] = 0;

  using State = tuple<long long, int, int>;  // (latency, node, used)
  priority_queue<State, vector<State>, greater<State>> pq;
  pq.push({0, 1, 0});
  while (!pq.empty()) {
    auto [d, u, used] = pq.top();
    pq.pop();
    if (d > dist[u][used]) {
      continue;
    }
    for (auto& [v, w] : adj[u]) {
      long long nd = d + w;
      if (nd < dist[v][used]) {
        dist[v][used] = nd;
        pq.push({nd, v, used});
      }
      if (used < k && d < dist[v][used + 1]) {
        dist[v][used + 1] = d;
        pq.push({d, v, used + 1});
      }
    }
  }

  long long best = INF;
  for (int used = 0; used <= k; ++used) {
    best = min(best, dist[n][used]);
  }
  cout << (best != INF ? best : -1) << '\n';
  return 0;
}
