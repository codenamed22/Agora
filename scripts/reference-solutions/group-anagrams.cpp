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
  unordered_map<string, vector<string>> groups;
  for (int i = 0; i < n; ++i) {
    string word;
    cin >> word;
    string key = word;
    sort(key.begin(), key.end());
    groups[key].push_back(word);
  }

  vector<vector<string>> output;
  output.reserve(groups.size());
  for (auto& [_, group] : groups) {
    sort(group.begin(), group.end());
    output.push_back(group);
  }
  sort(output.begin(), output.end(), [](const auto& a, const auto& b) {
    return a.front() < b.front();
  });

  for (const auto& group : output) {
    for (size_t i = 0; i < group.size(); ++i) {
      if (i > 0) {
        cout << ' ';
      }
      cout << group[i];
    }
    cout << '\n';
  }
  return 0;
}
