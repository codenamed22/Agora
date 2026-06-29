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

  string s;
  int k;
  cin >> s >> k;

  vector<int> counts(26, 0);
  int left = 0;
  int best = 0;
  int maxFreq = 0;
  for (int right = 0; right < static_cast<int>(s.size()); ++right) {
    int index = s[right] - 'A';
    maxFreq = max(maxFreq, ++counts[index]);
    while ((right - left + 1) - maxFreq > k) {
      --counts[s[left] - 'A'];
      ++left;
    }
    best = max(best, right - left + 1);
  }
  cout << best << '\n';
  return 0;
}
