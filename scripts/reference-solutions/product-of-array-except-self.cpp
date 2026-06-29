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

  vector<long long> result(n, 1);
  long long prefix = 1;
  for (int i = 0; i < n; ++i) {
    result[i] = prefix;
    prefix *= nums[i];
  }
  long long suffix = 1;
  for (int i = n - 1; i >= 0; --i) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  for (int i = 0; i < n; ++i) {
    if (i > 0) {
      cout << ' ';
    }
    cout << result[i];
  }
  cout << '\n';
  return 0;
}
