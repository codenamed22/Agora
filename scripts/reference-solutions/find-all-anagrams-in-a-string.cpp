#include <array>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  string s;
  string p;
  getline(cin, s);
  getline(cin, p);

  if (p.size() > s.size()) {
    cout << "EMPTY\n";
    return 0;
  }

  array<int, 26> need{};
  array<int, 26> window{};
  for (char c : p) {
    ++need[c - 'a'];
  }

  vector<int> answer;
  for (int index = 0; index < static_cast<int>(s.size()); ++index) {
    ++window[s[index] - 'a'];
    if (index >= static_cast<int>(p.size())) {
      --window[s[index - p.size()] - 'a'];
    }
    if (index >= static_cast<int>(p.size()) - 1 && window == need) {
      answer.push_back(index - static_cast<int>(p.size()) + 1);
    }
  }

  if (answer.empty()) {
    cout << "EMPTY\n";
  } else {
    for (int i = 0; i < static_cast<int>(answer.size()); ++i) {
      if (i > 0) {
        cout << ' ';
      }
      cout << answer[i];
    }
    cout << '\n';
  }

  return 0;
}
