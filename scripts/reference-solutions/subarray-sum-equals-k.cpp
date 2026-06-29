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
  unordered_map<long long, long long> counts;
  counts.reserve(n * 2 + 1);
  counts[0] = 1;

  long long prefix = 0;
  long long answer = 0;
  for (int i = 0; i < n; ++i) {
    long long value;
    cin >> value;
    prefix += value;
    auto it = counts.find(prefix - k);
    if (it != counts.end()) {
      answer += it->second;
    }
    ++counts[prefix];
  }
  cout << answer << '\n';
  return 0;
}
