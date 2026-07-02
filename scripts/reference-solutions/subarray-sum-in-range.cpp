#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  long long n, low, high;
  cin >> n >> low >> high;
  vector<long long> nums(n);
  for (long long& value : nums) {
    cin >> value;
  }

  vector<long long> prefix(n + 1, 0);
  for (long long i = 0; i < n; ++i) {
    prefix[i + 1] = prefix[i] + nums[i];
  }

  vector<long long> sortedPrefix(prefix.begin(), prefix.end());
  sort(sortedPrefix.begin(), sortedPrefix.end());
  sortedPrefix.erase(unique(sortedPrefix.begin(), sortedPrefix.end()), sortedPrefix.end());
  int size = static_cast<int>(sortedPrefix.size());
  vector<long long> tree(size + 1, 0);

  auto update = [&](int pos0) {
    for (int i = pos0 + 1; i <= size; i += i & (-i)) {
      tree[i] += 1;
    }
  };
  auto prefixCount = [&](int count) -> long long {
    long long total = 0;
    for (int i = count; i > 0; i -= i & (-i)) {
      total += tree[i];
    }
    return total;
  };
  auto positionOf = [&](long long value) {
    return static_cast<int>(lower_bound(sortedPrefix.begin(), sortedPrefix.end(), value) -
                            sortedPrefix.begin());
  };

  long long ans = 0;
  update(positionOf(prefix[0]));
  for (long long j = 1; j <= n; ++j) {
    long long lo = prefix[j] - high;
    long long hi = prefix[j] - low;
    int rightRank =
        static_cast<int>(upper_bound(sortedPrefix.begin(), sortedPrefix.end(), hi) -
                         sortedPrefix.begin());
    int leftRank = static_cast<int>(lower_bound(sortedPrefix.begin(), sortedPrefix.end(), lo) -
                                    sortedPrefix.begin());
    ans += prefixCount(rightRank) - prefixCount(leftRank);
    update(positionOf(prefix[j]));
  }

  cout << ans << '\n';
  return 0;
}
