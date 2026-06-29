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
  vector<long long> height(n);
  for (long long& value : height) {
    cin >> value;
  }

  int left = 0;
  int right = n - 1;
  long long best = 0;
  while (left < right) {
    best = max(best, min(height[left], height[right]) * (right - left));
    if (height[left] < height[right]) {
      ++left;
    } else {
      --right;
    }
  }
  cout << best << '\n';
  return 0;
}
