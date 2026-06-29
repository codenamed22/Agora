#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) {
    cout << "0\n";
    return 0;
  }

  vector<pair<long long, long long>> intervals;
  intervals.reserve(n);
  for (int i = 0; i < n; ++i) {
    long long start, end;
    cin >> start >> end;
    if (start < end) {
      intervals.push_back({start, end});
    }
  }

  sort(intervals.begin(), intervals.end());
  priority_queue<long long, vector<long long>, greater<long long>> rooms;
  int answer = 0;

  for (const auto& [start, end] : intervals) {
    while (!rooms.empty() && rooms.top() <= start) {
      rooms.pop();
    }
    rooms.push(end);
    answer = max(answer, static_cast<int>(rooms.size()));
  }

  cout << answer << '\n';
  return 0;
}
