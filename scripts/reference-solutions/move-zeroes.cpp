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
  vector<long long> result;
  result.reserve(n);
  int zeroes = 0;
  for (int i = 0; i < n; ++i) {
    long long value;
    cin >> value;
    if (value == 0) {
      ++zeroes;
    } else {
      result.push_back(value);
    }
  }
  while (zeroes-- > 0) {
    result.push_back(0);
  }

  for (int i = 0; i < n; ++i) {
    if (i > 0) {
      cout << ' ';
    }
    cout << result[i];
  }
  cout << '\n';
  return 0;
}
