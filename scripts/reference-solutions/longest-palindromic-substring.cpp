#include <iostream>
#include <string>
#include <vector>

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

  int n = static_cast<int>(s.size());
  int bestStart = 0;
  int bestLength = 0;

  auto update = [&](int start, int length) {
    if (length > bestLength || (length == bestLength && start < bestStart)) {
      bestStart = start;
      bestLength = length;
    }
  };

  vector<int> d1(n);
  int left = 0;
  int right = -1;
  for (int i = 0; i < n; ++i) {
    int radius = i > right ? 1 : min(d1[left + right - i], right - i + 1);
    while (i - radius >= 0 && i + radius < n && s[i - radius] == s[i + radius]) {
      ++radius;
    }
    d1[i] = radius;
    update(i - radius + 1, 2 * radius - 1);
    if (i + radius - 1 > right) {
      left = i - radius + 1;
      right = i + radius - 1;
    }
  }

  vector<int> d2(n);
  left = 0;
  right = -1;
  for (int i = 0; i < n; ++i) {
    int radius = i > right ? 0 : min(d2[left + right - i + 1], right - i + 1);
    while (i - radius - 1 >= 0 && i + radius < n && s[i - radius - 1] == s[i + radius]) {
      ++radius;
    }
    d2[i] = radius;
    update(i - radius, 2 * radius);
    if (i + radius - 1 > right) {
      left = i - radius;
      right = i + radius - 1;
    }
  }

  cout << s.substr(bestStart, bestLength) << '\n';
  return 0;
}
