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
  long long k;
  cin >> n >> k;
  vector<long long> nums(n);
  for (long long& value : nums) {
    cin >> value;
  }

  k %= n;
  rotate(nums.begin(), nums.end() - k, nums.end());
  for (int i = 0; i < n; ++i) {
    if (i > 0) {
      cout << ' ';
    }
    cout << nums[i];
  }
  cout << '\n';
  return 0;
}
