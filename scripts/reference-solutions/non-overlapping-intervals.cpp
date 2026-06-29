#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  cin >> n;

  vector<pair<long long, long long>> intervals(n);
  for (auto& interval : intervals) {
    cin >> interval.first >> interval.second;
  }

  sort(intervals.begin(), intervals.end(), [](const auto& left, const auto& right) {
    if (left.second != right.second) {
      return left.second < right.second;
    }
    return left.first < right.first;
  });

  int removed = 0;
  bool hasCurrent = false;
  long long currentEnd = 0;

  for (const auto& [start, end] : intervals) {
    if (!hasCurrent || start >= currentEnd) {
      currentEnd = end;
      hasCurrent = true;
    } else {
      ++removed;
    }
  }

  cout << removed << '\n';
  return 0;
}
