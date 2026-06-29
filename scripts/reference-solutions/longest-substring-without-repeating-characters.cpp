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

  array<int, 256> lastSeen;
  lastSeen.fill(-1);
  int left = 0;
  int best = 0;

  for (int right = 0; right < static_cast<int>(s.size()); ++right) {
    unsigned char c = static_cast<unsigned char>(s[right]);
    if (lastSeen[c] >= left) {
      left = lastSeen[c] + 1;
    }
    lastSeen[c] = right;
    best = max(best, right - left + 1);
  }

  cout << best << '\n';
  return 0;
}
