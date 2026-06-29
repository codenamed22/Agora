#include <array>
#include <iostream>
#include <string>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  string s;
  getline(cin, s, '\0');
  if (!s.empty() && s.back() == '\n') {
    s.pop_back();
  }
  if (!s.empty() && s.back() == '\r') {
    s.pop_back();
  }

  array<int, 256> counts{};
  for (unsigned char c : s) {
    counts[c]++;
  }

  int length = 0;
  bool hasOdd = false;
  for (int count : counts) {
    length += (count / 2) * 2;
    hasOdd = hasOdd || (count % 2 == 1);
  }

  cout << length + (hasOdd ? 1 : 0) << '\n';
  return 0;
}
