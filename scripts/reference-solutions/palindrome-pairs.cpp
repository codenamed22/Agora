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

static bool isPalindrome(const string& value) {
  int left = 0;
  int right = static_cast<int>(value.size()) - 1;
  while (left < right) {
    if (value[left++] != value[right--]) {
      return false;
    }
  }
  return true;
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  cin >> n;
  string line;
  getline(cin, line);

  vector<string> words(n);
  unordered_map<string, int> pos;
  pos.reserve(n * 2 + 1);
  for (int i = 0; i < n; ++i) {
    getline(cin, words[i]);
    if (!words[i].empty() && words[i].back() == '\r') {
      words[i].pop_back();
    }
    pos[words[i]] = i;
  }

  set<pair<int, int>> result;
  for (int i = 0; i < n; ++i) {
    const string& word = words[i];
    for (size_t cut = 0; cut <= word.size(); ++cut) {
      string prefix = word.substr(0, cut);
      string suffix = word.substr(cut);

      if (isPalindrome(prefix)) {
        string reversed = suffix;
        reverse(reversed.begin(), reversed.end());
        auto it = pos.find(reversed);
        if (it != pos.end() && it->second != i) {
          result.insert({it->second, i});
        }
      }

      if (isPalindrome(suffix)) {
        string reversed = prefix;
        reverse(reversed.begin(), reversed.end());
        auto it = pos.find(reversed);
        if (it != pos.end() && it->second != i) {
          result.insert({i, it->second});
        }
      }
    }
  }

  if (result.empty()) {
    cout << "EMPTY\n";
    return 0;
  }
  for (auto [left, right] : result) {
    cout << left << ' ' << right << '\n';
  }
  return 0;
}
