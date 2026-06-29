#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <vector>

using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  long long target;
  cin >> n >> target;

  vector<long long> nums(n);
  for (long long& value : nums) {
    cin >> value;
  }

  sort(nums.begin(), nums.end());
  long long best = nums[0] + nums[1] + nums[2];

  for (int i = 0; i < n - 2; ++i) {
    int left = i + 1;
    int right = n - 1;
    while (left < right) {
      long long total = nums[i] + nums[left] + nums[right];
      long long totalDistance = llabs(total - target);
      long long bestDistance = llabs(best - target);
      if (totalDistance < bestDistance || (totalDistance == bestDistance && total < best)) {
        best = total;
      }

      if (total < target) {
        ++left;
      } else if (total > target) {
        --right;
      } else {
        cout << total << '\n';
        return 0;
      }
    }
  }

  cout << best << '\n';
  return 0;
}
