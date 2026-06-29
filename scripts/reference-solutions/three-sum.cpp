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
  vector<long long> nums(n);
  for (long long& value : nums) {
    cin >> value;
  }
  sort(nums.begin(), nums.end());

  vector<array<long long, 3>> result;
  for (int i = 0; i < n; ++i) {
    if (i > 0 && nums[i] == nums[i - 1]) {
      continue;
    }
    int left = i + 1;
    int right = n - 1;
    while (left < right) {
      long long total = nums[i] + nums[left] + nums[right];
      if (total < 0) {
        ++left;
      } else if (total > 0) {
        --right;
      } else {
        result.push_back({nums[i], nums[left], nums[right]});
        ++left;
        --right;
        while (left < right && nums[left] == nums[left - 1]) {
          ++left;
        }
        while (left < right && nums[right] == nums[right + 1]) {
          --right;
        }
      }
    }
  }

  if (result.empty()) {
    cout << "EMPTY\n";
    return 0;
  }
  for (auto [a, b, c] : result) {
    cout << a << ' ' << b << ' ' << c << '\n';
  }
  return 0;
}
