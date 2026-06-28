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
  vector<pair<long long, long long>> intervals;
  intervals.reserve(n + 1);
  for (int i = 0; i < n; ++i) {
    long long start, end;
    cin >> start >> end;
    intervals.push_back({start, end});
  }
  long long newStart, newEnd;
  cin >> newStart >> newEnd;
  intervals.push_back({newStart, newEnd});
  sort(intervals.begin(), intervals.end());

  vector<pair<long long, long long>> merged;
  for (auto [start, end] : intervals) {
    if (!merged.empty() && start <= merged.back().second) {
      merged.back().second = max(merged.back().second, end);
    } else {
      merged.push_back({start, end});
    }
  }

  for (auto [start, end] : merged) {
    cout << start << ' ' << end << '\n';
  }
  return 0;
}
