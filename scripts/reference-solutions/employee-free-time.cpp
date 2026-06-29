#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int employees;
  if (!(cin >> employees)) {
    cout << "EMPTY\n";
    return 0;
  }

  vector<pair<long long, long long>> busy;
  for (int employee = 0; employee < employees; ++employee) {
    int count;
    cin >> count;
    for (int i = 0; i < count; ++i) {
      long long start, end;
      cin >> start >> end;
      busy.push_back({start, end});
    }
  }

  if (busy.empty()) {
    cout << "EMPTY\n";
    return 0;
  }

  sort(busy.begin(), busy.end());
  vector<pair<long long, long long>> freeIntervals;
  long long currentEnd = busy[0].second;

  for (int i = 1; i < static_cast<int>(busy.size()); ++i) {
    const auto& [start, end] = busy[i];
    if (start > currentEnd) {
      freeIntervals.push_back({currentEnd, start});
      currentEnd = end;
    } else {
      currentEnd = max(currentEnd, end);
    }
  }

  if (freeIntervals.empty()) {
    cout << "EMPTY\n";
  } else {
    for (const auto& [start, end] : freeIntervals) {
      cout << start << ' ' << end << '\n';
    }
  }

  return 0;
}
