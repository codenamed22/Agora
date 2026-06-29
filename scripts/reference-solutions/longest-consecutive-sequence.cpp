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
  unordered_set<long long> nums;
  nums.reserve(n * 2 + 1);
  for (int i = 0; i < n; ++i) {
    long long value;
    cin >> value;
    nums.insert(value);
  }

  int best = 0;
  for (long long value : nums) {
    if (!nums.count(value - 1)) {
      long long current = value;
      while (nums.count(current + 1)) {
        ++current;
      }
      best = max(best, static_cast<int>(current - value + 1));
    }
  }
  cout << best << '\n';
  return 0;
}
