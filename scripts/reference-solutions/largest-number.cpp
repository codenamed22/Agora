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
  vector<string> nums(n);
  for (string& value : nums) {
    cin >> value;
  }

  sort(nums.begin(), nums.end(), [](const string& a, const string& b) {
    return a + b > b + a;
  });

  string result;
  for (const string& value : nums) {
    result += value;
  }
  cout << (result[0] == '0' ? "0" : result) << '\n';
  return 0;
}
