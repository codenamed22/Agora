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
  long long lowest = LLONG_MAX;
  long long best = 0;
  for (int i = 0; i < n; ++i) {
    long long price;
    cin >> price;
    lowest = min(lowest, price);
    best = max(best, price - lowest);
  }
  cout << best << '\n';
  return 0;
}
