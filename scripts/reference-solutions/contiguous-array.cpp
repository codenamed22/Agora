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

  int n;
  cin >> n;
  unordered_map<int, int> first;
  first.reserve(n * 2 + 1);
  first[0] = -1;

  int prefix = 0;
  int best = 0;
  for (int i = 0; i < n; ++i) {
    int value;
    cin >> value;
    prefix += value == 1 ? 1 : -1;
    auto it = first.find(prefix);
    if (it == first.end()) {
      first[prefix] = i;
    } else {
      best = max(best, i - it->second);
    }
  }
  cout << best << '\n';
  return 0;
}
