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

  array<int, 256> need{};
  array<int, 256> window{};
  int required = 0;
  for (unsigned char c : t) {
    if (need[c] == 0) {
      ++required;
    }
    ++need[c];
  }

  int formed = 0;
  int left = 0;
  int bestStart = 0;
  int bestLength = static_cast<int>(s.size()) + 1;

  for (int right = 0; right < static_cast<int>(s.size()); ++right) {
    unsigned char c = static_cast<unsigned char>(s[right]);
    ++window[c];
    if (need[c] > 0 && window[c] == need[c]) {
      ++formed;
    }

    while (formed == required && left <= right) {
      int currentLength = right - left + 1;
      if (currentLength < bestLength) {
        bestLength = currentLength;
        bestStart = left;
      }

      unsigned char leftChar = static_cast<unsigned char>(s[left]);
      --window[leftChar];
      if (need[leftChar] > 0 && window[leftChar] < need[leftChar]) {
        --formed;
      }
      ++left;
    }
  }

  if (bestLength == static_cast<int>(s.size()) + 1) {
    cout << "EMPTY\n";
  } else {
    cout << s.substr(bestStart, bestLength) << '\n';
  }

  return 0;
}
