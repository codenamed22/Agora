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
  unordered_set<long long> seen;
  bool duplicate = false;
  for (int i = 0; i < n; ++i) {
    long long value;
    cin >> value;
    if (!seen.insert(value).second) {
      duplicate = true;
    }
  }
  cout << (duplicate ? "true" : "false") << '\n';
  return 0;
}
