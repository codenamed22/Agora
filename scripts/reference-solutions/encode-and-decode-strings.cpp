#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  cin >> n;
  string line;
  getline(cin, line);

  vector<string> strings;
  strings.reserve(n);
  for (int i = 0; i < n; ++i) {
    if (getline(cin, line)) {
      strings.push_back(line);
    } else {
      strings.push_back("");
    }
  }

  string encoded;
  for (const string& value : strings) {
    encoded += to_string(value.size());
    encoded += '#';
    encoded += value;
  }

  vector<string> decoded;
  size_t index = 0;
  while (index < encoded.size()) {
    size_t separator = encoded.find('#', index);
    int length = stoi(encoded.substr(index, separator - index));
    size_t start = separator + 1;
    decoded.push_back(encoded.substr(start, length));
    index = start + length;
  }

  cout << encoded << '\n';
  for (const string& value : decoded) {
    cout << value << '\n';
  }

  return 0;
}
