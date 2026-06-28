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

  vector<long long> result(n);
  int left = 0;
  int right = n - 1;
  for (int write = n - 1; write >= 0; --write) {
    long long leftSquare = nums[left] * nums[left];
    long long rightSquare = nums[right] * nums[right];
    if (leftSquare > rightSquare) {
      result[write] = leftSquare;
      ++left;
    } else {
      result[write] = rightSquare;
      --right;
    }
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
