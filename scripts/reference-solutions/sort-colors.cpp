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
  array<int, 3> counts = {0, 0, 0};
  for (int i = 0; i < n; ++i) {
    int value;
    cin >> value;
    ++counts[value];
  }

  bool first = true;
  for (int color = 0; color <= 2; ++color) {
    while (counts[color]-- > 0) {
      if (!first) {
        cout << ' ';
      }
      first = false;
      cout << color;
    }
  }
  cout << '\n';
  return 0;
}
