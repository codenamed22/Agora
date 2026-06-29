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
  string line;
  getline(cin, line);

  vector<string> words(n);
  for (int i = 0; i < n; ++i) {
    getline(cin, words[i]);
    if (!words[i].empty() && words[i].back() == '\r') {
      words[i].pop_back();
    }
  }

  string prefix = words[0];
  for (int i = 1; i < n; ++i) {
    while (words[i].rfind(prefix, 0) != 0) {
      prefix.pop_back();
      if (prefix.empty()) {
        break;
      }
    }
  }

  cout << (prefix.empty() ? "EMPTY" : prefix) << '\n';
  return 0;
}
