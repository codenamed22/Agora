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
  long long target;
  cin >> n >> target;

  unordered_map<long long, int> seen;
  seen.reserve(n * 2 + 1);
  for (int j = 0; j < n; ++j) {
    long long value;
    cin >> value;
    auto it = seen.find(target - value);
    if (it != seen.end()) {
      cout << it->second << ' ' << j << '\n';
      return 0;
    }
    if (!seen.count(value)) {
      seen[value] = j;
    }
  }
  return 0;
}
