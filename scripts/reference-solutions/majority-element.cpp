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
  long long candidate = 0;
  int count = 0;
  for (int i = 0; i < n; ++i) {
    long long value;
    cin >> value;
    if (count == 0) {
      candidate = value;
    }
    count += value == candidate ? 1 : -1;
  }
  cout << candidate << '\n';
  return 0;
}
