#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) {
    cout << "true\n";
    return 0;
  }

  vector<pair<long long, long long>> intervals(n);
  for (auto& interval : intervals) {
    cin >> interval.first >> interval.second;
  }

  sort(intervals.begin(), intervals.end());
  bool hasPrevious = false;
  long long previousEnd = 0;

  for (const auto& [start, end] : intervals) {
    if (hasPrevious && start < previousEnd) {
      cout << "false\n";
      return 0;
    }
    previousEnd = hasPrevious ? max(previousEnd, end) : end;
    hasPrevious = true;
  }

  cout << "true\n";
  return 0;
}
