#include <cctype>
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

  const long long limitMin = -2147483648LL;
  const long long limitMax = 2147483647LL;
  int index = 0;
  while (index < static_cast<int>(s.size()) && s[index] == ' ') {
    ++index;
  }

  int sign = 1;
  if (index < static_cast<int>(s.size()) && (s[index] == '+' || s[index] == '-')) {
    sign = s[index] == '-' ? -1 : 1;
    ++index;
  }

  long long value = 0;
  while (index < static_cast<int>(s.size()) && isdigit(static_cast<unsigned char>(s[index]))) {
    value = value * 10 + (s[index] - '0');
    long long signedValue = sign * value;
    if (signedValue < limitMin) {
      cout << limitMin << '\n';
      return 0;
    }
    if (signedValue > limitMax) {
      cout << limitMax << '\n';
      return 0;
    }
    ++index;
  }

  cout << sign * value << '\n';
  return 0;
}
