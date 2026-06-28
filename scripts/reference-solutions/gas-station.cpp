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
  vector<long long> gas(n), cost(n);
  for (long long& value : gas) {
    cin >> value;
  }
  for (long long& value : cost) {
    cin >> value;
  }

  long long total = 0;
  long long tank = 0;
  int start = 0;
  for (int i = 0; i < n; ++i) {
    long long diff = gas[i] - cost[i];
    total += diff;
    tank += diff;
    if (tank < 0) {
      start = i + 1;
      tank = 0;
    }
  }
  cout << (total >= 0 ? start : -1) << '\n';
  return 0;
}
