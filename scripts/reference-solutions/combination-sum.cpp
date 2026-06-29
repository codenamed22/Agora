#include <algorithm>
#include <array>
#include <climits>
#include <deque>
#include <functional>
#include <iostream>
#include <set>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n, target;
  cin >> n >> target;
  vector<int> candidates(n);
  for (int& value : candidates) {
    cin >> value;
  }
  sort(candidates.begin(), candidates.end());

  vector<vector<int>> results;
  vector<int> current;
  function<void(int, int)> dfs = [&](int start, int remaining) {
    if (remaining == 0) {
      results.push_back(current);
      return;
    }
    for (int i = start; i < n; ++i) {
      if (candidates[i] > remaining) {
        break;
      }
      current.push_back(candidates[i]);
      dfs(i, remaining - candidates[i]);
      current.pop_back();
    }
  };

  dfs(0, target);
  if (results.empty()) {
    cout << "EMPTY\n";
    return 0;
  }

  for (const auto& combo : results) {
    for (size_t i = 0; i < combo.size(); ++i) {
      if (i > 0) {
        cout << ' ';
      }
      cout << combo[i];
    }
    cout << '\n';
  }
  return 0;
}
