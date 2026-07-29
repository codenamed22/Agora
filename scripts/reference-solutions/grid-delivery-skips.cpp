#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int rows, cols, budget;
  cin >> rows >> cols >> budget;
  vector<vector<long long>> grid(rows, vector<long long>(cols));
  for (int i = 0; i < rows; ++i) {
    for (int j = 0; j < cols; ++j) {
      cin >> grid[i][j];
    }
  }

  const long long INF = (long long)4e18;
  auto isCorner = [&](int i, int j) {
    return (i == 0 && j == 0) || (i == rows - 1 && j == cols - 1);
  };

  // dp[j][k] = min toll paid to arrive at the current row's cell (i, j) having
  // used k skip passes. Keep only the previous row and build the current one left
  // to right so both up (prev) and left (cur) predecessors are available.
  vector<vector<long long>> prev(cols, vector<long long>(budget + 1, INF));
  vector<vector<long long>> cur(cols, vector<long long>(budget + 1, INF));
  for (int i = 0; i < rows; ++i) {
    for (int j = 0; j < cols; ++j) {
      bool corner = isCorner(i, j);
      for (int k = 0; k <= budget; ++k) {
        long long payBase = INF;
        long long skipBase = INF;
        if (i == 0 && j == 0) {
          payBase = 0;
        } else {
          if (i > 0) {
            payBase = min(payBase, prev[j][k]);
            if (k >= 1) skipBase = min(skipBase, prev[j][k - 1]);
          }
          if (j > 0) {
            payBase = min(payBase, cur[j - 1][k]);
            if (k >= 1) skipBase = min(skipBase, cur[j - 1][k - 1]);
          }
        }

        long long best = INF;
        if (payBase != INF) best = payBase + grid[i][j];
        if (!corner && k >= 1 && skipBase != INF) best = min(best, skipBase);
        cur[j][k] = best;
      }
    }
    swap(prev, cur);
    for (auto& column : cur) fill(column.begin(), column.end(), INF);
  }

  long long ans = INF;
  for (int k = 0; k <= budget; ++k) ans = min(ans, prev[cols - 1][k]);
  cout << ans << '\n';
  return 0;
}
