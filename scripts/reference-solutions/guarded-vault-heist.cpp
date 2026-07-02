#include <iostream>
#include <vector>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  long long n, d;
  cin >> n >> d;
  vector<long long> values(n);
  for (long long& value : values) {
    cin >> value;
  }

  // best[i] = maximum total value using vaults 0..i, where any two chosen
  // vaults are at least d indices apart. Cracking zero vaults scores 0.
  vector<long long> best(n, 0);
  for (long long i = 0; i < n; ++i) {
    long long prevBest = (i - d >= 0) ? best[i - d] : 0;
    long long take = values[i] + prevBest;
    long long carry = (i - 1 >= 0) ? best[i - 1] : 0;
    best[i] = take > carry ? take : carry;
  }

  cout << (n > 0 ? best[n - 1] : 0) << '\n';
  return 0;
}
