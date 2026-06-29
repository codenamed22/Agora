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

  int left = 0;
  int right = static_cast<int>(s.size()) - 1;

  while (left < right) {
    while (left < right && !isalnum(static_cast<unsigned char>(s[left]))) {
      ++left;
    }
    while (left < right && !isalnum(static_cast<unsigned char>(s[right]))) {
      --right;
    }
    char a = static_cast<char>(tolower(static_cast<unsigned char>(s[left])));
    char b = static_cast<char>(tolower(static_cast<unsigned char>(s[right])));
    if (a != b) {
      cout << "false\n";
      return 0;
    }
    ++left;
    --right;
  }

  cout << "true\n";
  return 0;
}
