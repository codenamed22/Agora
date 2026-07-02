#include <iostream>
#include <unordered_map>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  long long n, k;
  cin >> n >> k;

  unordered_map<long long, long long> counts;
  counts.reserve(n * 2 + 16);
  long long ans = 0;

  for (long long i = 0; i < n; ++i) {
    long long value;
    cin >> value;
    long long remainder = ((value % k) + k) % k;
    long long complement = (k - remainder) % k;
    auto it = counts.find(complement);
    if (it != counts.end()) {
      ans += it->second;
    }
    counts[remainder] += 1;
  }

  cout << ans << '\n';
  return 0;
}
