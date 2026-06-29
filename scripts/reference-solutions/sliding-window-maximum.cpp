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

  int n, k;
  cin >> n >> k;
  vector<long long> nums(n);
  for (long long& value : nums) {
    cin >> value;
  }

  deque<int> window;
  vector<long long> result;
  for (int i = 0; i < n; ++i) {
    while (!window.empty() && nums[window.back()] <= nums[i]) {
      window.pop_back();
    }
    window.push_back(i);
    if (window.front() <= i - k) {
      window.pop_front();
    }
    if (i >= k - 1) {
      result.push_back(nums[window.front()]);
    }
  }

  for (size_t i = 0; i < result.size(); ++i) {
    if (i > 0) {
      cout << ' ';
    }
    cout << result[i];
  }
  cout << '\n';
  return 0;
}
