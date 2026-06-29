#include <array>
#include <iostream>
#include <string>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  string s;
  string t;
  getline(cin, s);
  getline(cin, t);

  array<int, 26> counts{};
  for (char c : s) {
    counts[c - 'a']++;
  }
  for (char c : t) {
    counts[c - 'a']--;
  }

  for (int count : counts) {
    if (count != 0) {
      cout << "false\n";
      return 0;
    }
  }

  cout << "true\n";
  return 0;
}
